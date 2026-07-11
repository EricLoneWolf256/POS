import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';
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

router.post('/branches', authenticate, authorize('owner', 'admin'), asyncHandler(async (req, res) => {
  const { name, code, address, phone } = req.body;
  if (!name) return res.status(400).json({ error: 'Branch name is required' });

  const [existing] = await pool.query(
    'SELECT id FROM branches WHERE business_id = ? AND (name = ? OR code = ?)',
    [req.user.businessId, name, code]
  );
  if (existing.length > 0) {
    return res.status(409).json({ error: 'Branch name or code already exists' });
  }

  const [result] = await pool.query(`
    INSERT INTO branches (business_id, name, code, address, phone)
    VALUES (?, ?, ?, ?, ?)
  `, [req.user.businessId, name, code, address, phone]);

  const [branch] = await pool.query('SELECT * FROM branches WHERE id = ?', [result.insertId]);
  res.status(201).json(branch[0]);
}));

router.put('/branches/:id', authenticate, authorize('owner', 'admin'), asyncHandler(async (req, res) => {
  const { name, code, address, phone } = req.body;
  const branchId = req.params.id;

  const [existing] = await pool.query(
    'SELECT id FROM branches WHERE id = ? AND business_id = ?',
    [branchId, req.user.businessId]
  );
  if (existing.length === 0) {
    return res.status(404).json({ error: 'Branch not found' });
  }

  await pool.query(`
    UPDATE branches SET name = ?, code = ?, address = ?, phone = ?
    WHERE id = ? AND business_id = ?
  `, [name, code, address, phone, branchId, req.user.businessId]);

  const [branch] = await pool.query('SELECT * FROM branches WHERE id = ?', [branchId]);
  res.json(branch[0]);
}));

router.delete('/branches/:id', authenticate, authorize('owner'), asyncHandler(async (req, res) => {
  const branchId = req.params.id;

  const [branch] = await pool.query(
    'SELECT id, is_main FROM branches WHERE id = ? AND business_id = ?',
    [branchId, req.user.businessId]
  );
  if (branch.length === 0) {
    return res.status(404).json({ error: 'Branch not found' });
  }

  if (branch[0].is_main) {
    return res.status(400).json({ error: 'Cannot delete the main branch' });
  }

  const [usersInBranch] = await pool.query(
    'SELECT COUNT(*) as count FROM users WHERE branch_id = ? AND business_id = ?',
    [branchId, req.user.businessId]
  );
  if (usersInBranch[0].count > 0) {
    return res.status(400).json({ error: 'Cannot delete branch with assigned users. Reassign them first.' });
  }

  await pool.query('UPDATE branches SET is_active = FALSE WHERE id = ?', [branchId]);
  res.json({ success: true });
}));

router.post('/switch-branch', authenticate, asyncHandler(async (req, res) => {
  const { branchId } = req.body;
  if (!branchId) return res.status(400).json({ error: 'branchId is required' });

  const [branch] = await pool.query(
    'SELECT id, name FROM branches WHERE id = ? AND business_id = ? AND is_active = TRUE',
    [branchId, req.user.businessId]
  );
  if (branch.length === 0) {
    return res.status(404).json({ error: 'Branch not found' });
  }

  await pool.query('UPDATE users SET branch_id = ? WHERE id = ?', [branchId, req.user.id]);

  const token = jwt.sign(
    {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      businessId: req.user.businessId,
      branchId: parseInt(branchId),
      plan: req.user.plan,
      planFeatures: req.user.planFeatures,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.json({ token, branchId: parseInt(branchId), branchName: branch[0].name });
}));

export default router;
