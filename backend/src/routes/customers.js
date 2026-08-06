import express from 'express';
import pool from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../utils/helpers.js';
import { auditLog } from '../middleware/audit.js';
import {
  handleValidation,
  validateRequiredString,
  validateOptionalString,
  validateOptionalEmail,
  validateOptionalPositiveNumber,
  validateBoolean,
  validateIdParam,
} from '../middleware/validation.js';
import { body } from 'express-validator';

const router = express.Router();

router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { search } = req.query;
  let query = 'SELECT * FROM customers WHERE business_id = ? AND is_active = TRUE';
  const params = [req.user.businessId];

  if (search) {
    query += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  query += ' ORDER BY name';
  const [customers] = await pool.query(query, params);
  res.json(customers);
}));

router.get('/:id', authenticate, [...validateIdParam('id'), handleValidation], asyncHandler(async (req, res) => {
  const [customers] = await pool.query(
    'SELECT * FROM customers WHERE id = ? AND business_id = ?',
    [req.params.id, req.user.businessId]
  );
  if (customers.length === 0) return res.status(404).json({ error: 'Customer not found' });

  const [purchases] = await pool.query(`
    SELECT s.id, s.sale_number, s.total_amount, s.created_at, s.payment_method
    FROM sales s WHERE s.customer_id = ? AND s.business_id = ? AND s.status = 'completed'
    ORDER BY s.created_at DESC LIMIT 20
  `, [req.params.id, req.user.businessId]);

  const [stats] = await pool.query(`
    SELECT COUNT(*) as total_orders, COALESCE(SUM(total_amount), 0) as total_spent,
           COALESCE(AVG(total_amount), 0) as avg_order
    FROM sales WHERE customer_id = ? AND business_id = ? AND status = 'completed'
  `, [req.params.id, req.user.businessId]);

  res.json({ ...customers[0], purchases, stats: stats[0] });
}));

router.post('/', authenticate, [
  validateRequiredString('name', 1, 255),
  validateOptionalEmail('email'),
  validateOptionalString('phone', 50),
  validateOptionalString('address', 500),
  validateOptionalPositiveNumber('creditLimit'),
  validateOptionalString('notes', 1000),
  handleValidation,
], asyncHandler(async (req, res) => {
  const { name, email, phone, address, creditLimit, notes } = req.body;
  const [result] = await pool.query(`
    INSERT INTO customers (business_id, name, email, phone, address, credit_limit, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [req.user.businessId, name, email || null, phone || null, address || null, creditLimit || 0, notes || null]);

  auditLog(req.user.businessId, req.user.id, 'create', 'customer', result.insertId, { name, ip: req.ip });

  const [customer] = await pool.query('SELECT * FROM customers WHERE id = ?', [result.insertId]);
  res.status(201).json(customer[0]);
}));

router.put('/:id', authenticate, [
  ...validateIdParam('id'),
  validateRequiredString('name', 1, 255),
  validateOptionalEmail('email'),
  validateOptionalString('phone', 50),
  validateOptionalString('address', 500),
  validateOptionalPositiveNumber('creditLimit'),
  validateOptionalString('notes', 1000),
  validateBoolean('isActive'),
  handleValidation,
], asyncHandler(async (req, res) => {
  const { name, email, phone, address, creditLimit, notes, isActive } = req.body;
  await pool.query(`
    UPDATE customers SET name=?, email=?, phone=?, address=?, credit_limit=?, notes=?, is_active=?
    WHERE id=? AND business_id=?
  `, [name, email || null, phone || null, address || null, creditLimit || 0, notes || null, isActive !== false, req.params.id, req.user.businessId]);

  auditLog(req.user.businessId, req.user.id, 'update', 'customer', req.params.id, { name, ip: req.ip });

  const [customer] = await pool.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
  res.json(customer[0]);
}));

export default router;
