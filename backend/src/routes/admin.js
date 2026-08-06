/**
 * /api/admin — Super-admin routes
 * All routes require role = 'super_admin'.
 * These let the platform owner manage all tenants.
 */
import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../utils/helpers.js';
import { body } from 'express-validator';
import { handleValidation } from '../middleware/validation.js';

const router = express.Router();

// Every admin route requires authentication + super_admin role
router.use(authenticate, authorize('super_admin'));

// ─── GET /api/admin/stats ──────────────────────────────────────────────────
// Platform overview: total businesses, revenue, active trials, etc.
router.get('/stats', asyncHandler(async (req, res) => {
  const [[totals]] = await pool.query(`
    SELECT
      COUNT(*)                                            AS total_businesses,
      SUM(is_active = 1)                                 AS active_businesses,
      SUM(is_active = 0)                                 AS suspended_businesses,
      SUM(trial_ends_at > NOW() AND subscription_expires_at IS NULL) AS on_trial,
      SUM(subscription_expires_at > NOW())               AS paid_subscribers,
      SUM(trial_ends_at < NOW() AND (subscription_expires_at IS NULL OR subscription_expires_at < NOW())) AS expired
    FROM businesses
    WHERE slug != 'venderra-platform'
  `);

  const [[userCount]] = await pool.query(`
    SELECT COUNT(*) AS total_users FROM users
    WHERE role != 'super_admin'
  `);

  const [[revenueTotal]] = await pool.query(`
    SELECT COALESCE(SUM(amount), 0) AS total_revenue
    FROM payments WHERE status = 'completed'
  `);

  const [recentSignups] = await pool.query(`
    SELECT b.id, b.name, b.email, b.city, b.is_active,
           b.trial_ends_at, b.subscription_expires_at, b.created_at,
           p.name AS plan_name,
           COUNT(u.id) AS user_count
    FROM businesses b
    LEFT JOIN plans p ON b.plan_id = p.id
    LEFT JOIN users u ON u.business_id = b.id AND u.role != 'super_admin'
    WHERE b.slug != 'venderra-platform'
    GROUP BY b.id
    ORDER BY b.created_at DESC
    LIMIT 5
  `);

  res.json({
    stats: {
      ...totals,
      total_users: userCount.total_users,
      total_revenue: revenueTotal.total_revenue,
    },
    recentSignups,
  });
}));

// ─── GET /api/admin/businesses ─────────────────────────────────────────────
// List all businesses with pagination + search
router.get('/businesses', asyncHandler(async (req, res) => {
  const { search = '', page = 1, limit = 30, status } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = `b.slug != 'venderra-platform'`;
  const params = [];

  if (search) {
    where += ` AND (b.name LIKE ? OR b.email LIKE ? OR b.city LIKE ?)`;
    const term = `%${search}%`;
    params.push(term, term, term);
  }
  if (status === 'active')    where += ` AND b.is_active = 1`;
  if (status === 'suspended') where += ` AND b.is_active = 0`;
  if (status === 'trial')     where += ` AND b.trial_ends_at > NOW() AND (b.subscription_expires_at IS NULL OR b.subscription_expires_at < NOW())`;
  if (status === 'expired')   where += ` AND b.trial_ends_at < NOW() AND (b.subscription_expires_at IS NULL OR b.subscription_expires_at < NOW())`;
  if (status === 'paid')      where += ` AND b.subscription_expires_at > NOW()`;

  const [businesses] = await pool.query(`
    SELECT b.id, b.name, b.slug, b.email, b.phone, b.city, b.country,
           b.is_active, b.trial_ends_at, b.subscription_expires_at, b.created_at,
           p.name AS plan_name, p.price_ugx,
           COUNT(DISTINCT u.id) AS user_count,
           COUNT(DISTINCT br.id) AS branch_count,
           (SELECT COUNT(*) FROM sales s WHERE s.business_id = b.id) AS total_sales
    FROM businesses b
    LEFT JOIN plans p ON b.plan_id = p.id
    LEFT JOIN users u ON u.business_id = b.id AND u.role != 'super_admin'
    LEFT JOIN branches br ON br.business_id = b.id AND br.is_active = 1
    WHERE ${where}
    GROUP BY b.id
    ORDER BY b.created_at DESC
    LIMIT ? OFFSET ?
  `, [...params, parseInt(limit), offset]);

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM businesses b WHERE ${where}`,
    params
  );

  res.json({ businesses, total, page: parseInt(page), limit: parseInt(limit) });
}));

// ─── GET /api/admin/businesses/:id ────────────────────────────────────────
router.get('/businesses/:id', asyncHandler(async (req, res) => {
  const [biz] = await pool.query(`
    SELECT b.*, p.name AS plan_name, p.price_ugx
    FROM businesses b
    LEFT JOIN plans p ON b.plan_id = p.id
    WHERE b.id = ?
  `, [req.params.id]);
  if (!biz.length) return res.status(404).json({ error: 'Business not found' });

  const [users] = await pool.query(
    `SELECT id, first_name, last_name, email, role, is_active, last_login
     FROM users WHERE business_id = ? AND role != 'super_admin' ORDER BY role, first_name`,
    [req.params.id]
  );

  const [branches] = await pool.query(
    `SELECT * FROM branches WHERE business_id = ? ORDER BY is_main DESC, name`,
    [req.params.id]
  );

  const [payments] = await pool.query(`
    SELECT py.*, p.name AS plan_name FROM payments py
    JOIN plans p ON py.plan_id = p.id
    WHERE py.business_id = ? ORDER BY py.created_at DESC LIMIT 10
  `, [req.params.id]);

  res.json({ business: biz[0], users, branches, payments });
}));

// ─── PATCH /api/admin/businesses/:id ──────────────────────────────────────
// Suspend / reactivate / extend trial or subscription
router.patch('/businesses/:id', [
  body('is_active').optional().isBoolean(),
  body('trial_ends_at').optional({ values: 'null' }).isISO8601(),
  body('subscription_expires_at').optional({ values: 'null' }).isISO8601(),
  body('plan_id').optional().isInt({ min: 1 }),
  handleValidation,
], asyncHandler(async (req, res) => {
  const { is_active, trial_ends_at, subscription_expires_at, plan_id } = req.body;

  const fields = [];
  const values = [];

  if (is_active !== undefined) { fields.push('is_active = ?'); values.push(is_active); }
  if (trial_ends_at !== undefined) { fields.push('trial_ends_at = ?'); values.push(trial_ends_at || null); }
  if (subscription_expires_at !== undefined) { fields.push('subscription_expires_at = ?'); values.push(subscription_expires_at || null); }
  if (plan_id !== undefined) { fields.push('plan_id = ?'); values.push(plan_id); }

  if (!fields.length) return res.status(400).json({ error: 'No fields to update' });

  values.push(req.params.id);
  await pool.query(`UPDATE businesses SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`, values);

  const [[updated]] = await pool.query(
    `SELECT b.*, p.name AS plan_name FROM businesses b LEFT JOIN plans p ON b.plan_id = p.id WHERE b.id = ?`,
    [req.params.id]
  );
  res.json(updated);
}));

// ─── POST /api/admin/businesses/:id/extend ────────────────────────────────
// Extend subscription by N days
router.post('/businesses/:id/extend', [
  body('days').isInt({ min: 1, max: 3650 }).withMessage('days must be 1–3650'),
  handleValidation,
], asyncHandler(async (req, res) => {
  const { days } = req.body;

  const [[biz]] = await pool.query(
    `SELECT subscription_expires_at FROM businesses WHERE id = ?`, [req.params.id]
  );
  if (!biz) return res.status(404).json({ error: 'Business not found' });

  // Extend from today if expired, or from current expiry if still active
  const base = biz.subscription_expires_at && new Date(biz.subscription_expires_at) > new Date()
    ? new Date(biz.subscription_expires_at)
    : new Date();

  const newExpiry = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);

  await pool.query(
    `UPDATE businesses SET subscription_expires_at = ?, updated_at = NOW() WHERE id = ?`,
    [newExpiry, req.params.id]
  );

  res.json({ message: `Subscription extended by ${days} days`, expires_at: newExpiry });
}));

// ─── DELETE /api/admin/businesses/:id ─────────────────────────────────────
// Hard-suspend (sets is_active = false). We never hard-delete to preserve data.
router.delete('/businesses/:id', asyncHandler(async (req, res) => {
  await pool.query(
    `UPDATE businesses SET is_active = FALSE, updated_at = NOW() WHERE id = ? AND slug != 'venderra-platform'`,
    [req.params.id]
  );
  res.json({ message: 'Business suspended' });
}));

// ─── GET /api/admin/plans ─────────────────────────────────────────────────
router.get('/plans', asyncHandler(async (req, res) => {
  const [plans] = await pool.query(`SELECT * FROM plans ORDER BY price_ugx ASC`);
  res.json(plans);
}));

// ─── PUT /api/admin/plans/:id ─────────────────────────────────────────────
router.put('/plans/:id', [
  body('price_ugx').optional().isFloat({ min: 0 }),
  body('max_products').optional({ values: 'null' }).isInt({ min: 1 }),
  body('max_users').optional({ values: 'null' }).isInt({ min: 1 }),
  body('max_locations').optional({ values: 'null' }).isInt({ min: 1 }),
  handleValidation,
], asyncHandler(async (req, res) => {
  const { price_ugx, max_products, max_users, max_locations, features } = req.body;
  const fields = [];
  const values = [];
  if (price_ugx !== undefined)     { fields.push('price_ugx = ?');     values.push(price_ugx); }
  if (max_products !== undefined)  { fields.push('max_products = ?');   values.push(max_products || null); }
  if (max_users !== undefined)     { fields.push('max_users = ?');      values.push(max_users || null); }
  if (max_locations !== undefined) { fields.push('max_locations = ?'); values.push(max_locations || null); }
  if (features !== undefined)      { fields.push('features = ?');       values.push(JSON.stringify(features)); }
  if (!fields.length) return res.status(400).json({ error: 'No fields to update' });
  values.push(req.params.id);
  await pool.query(`UPDATE plans SET ${fields.join(', ')} WHERE id = ?`, values);
  const [[plan]] = await pool.query(`SELECT * FROM plans WHERE id = ?`, [req.params.id]);
  res.json(plan);
}));

// ─── GET /api/admin/payments ───────────────────────────────────────────────
router.get('/payments', asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const [payments] = await pool.query(`
    SELECT py.*, p.name AS plan_name, b.name AS business_name
    FROM payments py
    JOIN plans p ON py.plan_id = p.id
    JOIN businesses b ON py.business_id = b.id
    ORDER BY py.created_at DESC
    LIMIT ? OFFSET ?
  `, [parseInt(limit), offset]);

  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM payments`);
  res.json({ payments, total });
}));

export default router;
