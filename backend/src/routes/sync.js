import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/helpers.js';

const router = express.Router();

router.get('/pending', authenticate, asyncHandler(async (req, res) => {
  const [items] = await pool.query(
    'SELECT * FROM sync_queue WHERE business_id = ? AND status = ? ORDER BY created_at',
    [req.user.businessId, 'pending']
  );
  res.json(items);
}));

router.post('/push', authenticate, asyncHandler(async (req, res) => {
  const { items } = req.body;
  const results = [];

  for (const item of items) {
    try {
      if (item.entityType === 'sale') {
        const existing = await pool.query(
          'SELECT id FROM sales WHERE offline_id = ? AND business_id = ?',
          [item.entityId, req.user.businessId]
        );
        if (existing[0].length === 0) {
          await pool.query(
            'INSERT INTO sync_queue (business_id, branch_id, entity_type, entity_id, action, payload) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.businessId, req.user.branchId, item.entityType, item.entityId, item.action, JSON.stringify(item.payload)]
          );
        }
      }
      results.push({ entityId: item.entityId, status: 'queued' });
    } catch (err) {
      results.push({ entityId: item.entityId, status: 'failed', error: err.message });
    }
  }

  res.json({ results });
}));

router.post('/process', authenticate, asyncHandler(async (req, res) => {
  const [pending] = await pool.query(
    'SELECT * FROM sync_queue WHERE business_id = ? AND status = ? LIMIT 50',
    [req.user.businessId, 'pending']
  );

  let synced = 0;
  for (const item of pending) {
    await pool.query('UPDATE sync_queue SET status = ?, synced_at = NOW() WHERE id = ?', ['synced', item.id]);
    synced++;
  }

  res.json({ synced, total: pending.length });
}));

router.get('/status', authenticate, asyncHandler(async (req, res) => {
  const [counts] = await pool.query(`
    SELECT status, COUNT(*) as count FROM sync_queue
    WHERE business_id = ? GROUP BY status
  `, [req.user.businessId]);

  res.json({
    online: true,
    lastSync: new Date().toISOString(),
    queue: Object.fromEntries(counts.map(c => [c.status, c.count])),
  });
}));

export default router;
