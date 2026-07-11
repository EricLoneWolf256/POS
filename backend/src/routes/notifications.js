import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/helpers.js';

const router = express.Router();

router.get('/', authenticate, asyncHandler(async (req, res) => {
  const [notifications] = await pool.query(`
    SELECT * FROM notifications
    WHERE business_id = ? AND recipient IN (?, (SELECT email FROM users WHERE id = ?))
    ORDER BY created_at DESC LIMIT 50
  `, [req.user.businessId, req.user.email, req.user.id]);
  res.json(notifications);
}));

router.get('/unread-count', authenticate, asyncHandler(async (req, res) => {
  const [result] = await pool.query(`
    SELECT COUNT(*) as count FROM notifications
    WHERE business_id = ? AND status = 'pending'
  `, [req.user.businessId]);
  res.json({ count: result[0].count });
}));

router.put('/:id/read', authenticate, asyncHandler(async (req, res) => {
  await pool.query('UPDATE notifications SET status = ? WHERE id = ? AND business_id = ?',
    ['sent', req.params.id, req.user.businessId]);
  res.json({ success: true });
}));

router.put('/read-all', authenticate, asyncHandler(async (req, res) => {
  await pool.query('UPDATE notifications SET status = ? WHERE business_id = ? AND status = ?',
    ['sent', req.user.businessId, 'pending']);
  res.json({ success: true });
}));

router.get('/stock-alerts', authenticate, asyncHandler(async (req, res) => {
  const [alerts] = await pool.query(`
    SELECT sa.*, p.name as product_name, b.name as branch_name
    FROM stock_alerts sa
    LEFT JOIN products p ON sa.product_id = p.id
    LEFT JOIN branches b ON sa.branch_id = b.id
    WHERE sa.business_id = ? AND sa.is_resolved = FALSE
    ORDER BY sa.created_at DESC LIMIT 20
  `, [req.user.businessId]);
  res.json(alerts);
}));

export default router;
