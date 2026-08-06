import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../utils/helpers.js';
import { auditLog } from '../middleware/audit.js';
import {
  handleValidation,
  validateEmail,
  validatePassword,
  validateRequiredString,
  validateOptionalString,
  validateEnum,
  validateBoolean,
  validateIdParam,
} from '../middleware/validation.js';
import { body } from 'express-validator';

const VALID_ROLES = ['owner', 'admin', 'manager', 'cashier', 'field_sales', 'viewer'];

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

router.post('/', authenticate, authorize('owner', 'admin'), [
  validateEmail('email'),
  validatePassword('password', 8),
  validateRequiredString('firstName', 1, 100),
  validateRequiredString('lastName', 1, 100),
  validateOptionalString('phone', 50),
  validateEnum('role', VALID_ROLES),
  body('branchId').optional({ values: 'null' }).isInt({ min: 1 }).withMessage('branchId must be a positive integer'),
  handleValidation,
], asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, phone, role, branchId } = req.body;

  if (role === 'owner') {
    return res.status(403).json({ error: 'Cannot create owner accounts via this endpoint' });
  }

  const [planCheck] = await pool.query(`
    SELECT COUNT(*) as count, p.max_users FROM users u
    JOIN businesses b ON u.business_id = b.id
    JOIN plans p ON b.plan_id = p.id
    WHERE u.business_id = ?
  `, [req.user.businessId]);

  if (planCheck[0].max_users && planCheck[0].count >= planCheck[0].max_users) {
    return res.status(403).json({ error: `User limit reached (${planCheck[0].max_users} max on your plan)` });
  }

  const [existingEmail] = await pool.query(
    'SELECT id FROM users WHERE email = ? AND business_id = ?',
    [email, req.user.businessId]
  );
  if (existingEmail.length > 0) {
    return res.status(409).json({ error: 'A user with this email already exists in your business' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [result] = await pool.query(`
    INSERT INTO users (business_id, branch_id, email, password_hash, first_name, last_name, phone, role)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [req.user.businessId, branchId || null, email, passwordHash, firstName, lastName, phone || null, role || 'cashier']);

  auditLog(req.user.businessId, req.user.id, 'create', 'user', result.insertId, { email, role, ip: req.ip });

  res.status(201).json({ id: result.insertId, email, firstName, lastName, role });
}));

router.put('/:id', authenticate, authorize('owner', 'admin'), [
  ...validateIdParam('id'),
  validateRequiredString('firstName', 1, 100),
  validateRequiredString('lastName', 1, 100),
  validateOptionalString('phone', 50),
  validateEnum('role', VALID_ROLES),
  validateBoolean('isActive'),
  body('branchId').optional({ values: 'null' }).isInt({ min: 1 }).withMessage('branchId must be a positive integer'),
  handleValidation,
], asyncHandler(async (req, res) => {
  const { firstName, lastName, phone, role, branchId, isActive } = req.body;

  if (role === 'owner') {
    return res.status(403).json({ error: 'Cannot change role to owner via this endpoint' });
  }

  const [existing] = await pool.query(
    'SELECT id, role FROM users WHERE id = ? AND business_id = ?',
    [req.params.id, req.user.businessId]
  );
  if (existing.length === 0) return res.status(404).json({ error: 'User not found' });
  if (existing[0].role === 'owner') {
    return res.status(400).json({ error: 'Cannot modify the owner account' });
  }

  await pool.query(`
    UPDATE users SET first_name=?, last_name=?, phone=?, role=?, branch_id=?, is_active=?
    WHERE id=? AND business_id=?
  `, [firstName, lastName, phone, role, branchId || null, isActive !== false, req.params.id, req.user.businessId]);

  auditLog(req.user.businessId, req.user.id, 'update', 'user', req.params.id, { role, ip: req.ip });

  res.json({ success: true });
}));

export default router;
