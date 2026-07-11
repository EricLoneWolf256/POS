import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../utils/helpers.js';

const router = express.Router();

router.get('/', authenticate, authorize('owner', 'admin'), asyncHandler(async (req, res) => {
  const [users] = await pool.query(`
    SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.role, u.is_active,
           u.last_login, u.created_at, b.name as branch_name
    FROM users u LEFT JOIN branches b ON u.branch_id = b.id
    WHERE u.business_id = ? ORDER BY u.first_name
  `, [req.user.businessId]);
  res.json(users);
}));

router.post('/', authenticate, authorize('owner', 'admin'), asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, phone, role, branchId } = req.body;

  const [planCheck] = await pool.query(`
    SELECT COUNT(*) as count, p.max_users FROM users u
    JOIN businesses b ON u.business_id = b.id
    JOIN plans p ON b.plan_id = p.id
    WHERE u.business_id = ?
  `, [req.user.businessId]);

  if (planCheck[0].max_users && planCheck[0].count >= planCheck[0].max_users) {
    return res.status(403).json({ error: `User limit reached (${planCheck[0].max_users} max on your plan)` });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(`
    INSERT INTO users (business_id, branch_id, email, password_hash, first_name, last_name, phone, role)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [req.user.businessId, branchId, email, passwordHash, firstName, lastName, phone, role || 'cashier']);

  res.status(201).json({ id: result.insertId, email, firstName, lastName, role });
}));

router.put('/:id', authenticate, authorize('owner', 'admin'), asyncHandler(async (req, res) => {
  const { firstName, lastName, phone, role, branchId, isActive } = req.body;
  await pool.query(`
    UPDATE users SET first_name=?, last_name=?, phone=?, role=?, branch_id=?, is_active=?
    WHERE id=? AND business_id=?
  `, [firstName, lastName, phone, role, branchId, isActive !== false, req.params.id, req.user.businessId]);
  res.json({ success: true });
}));

export default router;
