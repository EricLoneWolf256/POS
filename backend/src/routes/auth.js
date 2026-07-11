import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/helpers.js';

const router = express.Router();

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const [users] = await pool.query(`
    SELECT u.*, b.name as business_name, b.currency, b.plan_id,
           p.name as plan_name, p.features as plan_features, p.max_products, p.max_users,
           br.name as branch_name
    FROM users u
    JOIN businesses b ON u.business_id = b.id
    LEFT JOIN plans p ON b.plan_id = p.id
    LEFT JOIN branches br ON u.branch_id = br.id
    WHERE u.email = ? AND u.is_active = TRUE AND b.is_active = TRUE
  `, [email]);

  if (users.length === 0) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const user = users[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

  const planFeatures = typeof user.plan_features === 'string'
    ? JSON.parse(user.plan_features)
    : user.plan_features || {};

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      businessId: user.business_id,
      branchId: user.branch_id,
      plan: user.plan_name,
      planFeatures,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      businessId: user.business_id,
      businessName: user.business_name,
      branchId: user.branch_id,
      branchName: user.branch_name,
      currency: user.currency,
      plan: user.plan_name,
      planFeatures,
    },
  });
}));

router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const [users] = await pool.query(`
    SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.business_id, u.branch_id,
           b.name as business_name, b.currency, p.name as plan_name, p.features as plan_features,
           br.name as branch_name
    FROM users u
    JOIN businesses b ON u.business_id = b.id
    LEFT JOIN plans p ON b.plan_id = p.id
    LEFT JOIN branches br ON u.branch_id = br.id
    WHERE u.id = ?
  `, [req.user.id]);

  if (users.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  const user = users[0];
  res.json({
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    role: user.role,
    businessId: user.business_id,
    businessName: user.business_name,
    branchId: user.branch_id,
    branchName: user.branch_name,
    currency: user.currency,
    plan: user.plan_name,
    planFeatures: typeof user.plan_features === 'string'
      ? JSON.parse(user.plan_features)
      : user.plan_features,
  });
}));

router.get('/branches', authenticate, asyncHandler(async (req, res) => {
  const [branches] = await pool.query(
    'SELECT * FROM branches WHERE business_id = ? AND is_active = TRUE ORDER BY is_main DESC, name',
    [req.user.businessId]
  );
  res.json(branches);
}));

export default router;
