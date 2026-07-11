import express from 'express';
import pool from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../utils/helpers.js';

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

router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const [customers] = await pool.query(
    'SELECT * FROM customers WHERE id = ? AND business_id = ?',
    [req.params.id, req.user.businessId]
  );
  if (customers.length === 0) return res.status(404).json({ error: 'Customer not found' });

  const [purchases] = await pool.query(`
    SELECT s.id, s.sale_number, s.total_amount, s.created_at, s.payment_method
    FROM sales s WHERE s.customer_id = ? AND s.status = 'completed'
    ORDER BY s.created_at DESC LIMIT 20
  `, [req.params.id]);

  const [stats] = await pool.query(`
    SELECT COUNT(*) as total_orders, COALESCE(SUM(total_amount), 0) as total_spent,
           COALESCE(AVG(total_amount), 0) as avg_order
    FROM sales WHERE customer_id = ? AND status = 'completed'
  `, [req.params.id]);

  res.json({ ...customers[0], purchases, stats: stats[0] });
}));

router.post('/', authenticate, asyncHandler(async (req, res) => {
  const { name, email, phone, address, creditLimit, notes } = req.body;
  const [result] = await pool.query(`
    INSERT INTO customers (business_id, name, email, phone, address, credit_limit, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [req.user.businessId, name, email, phone, address, creditLimit || 0, notes]);

  const [customer] = await pool.query('SELECT * FROM customers WHERE id = ?', [result.insertId]);
  res.status(201).json(customer[0]);
}));

router.put('/:id', authenticate, asyncHandler(async (req, res) => {
  const { name, email, phone, address, creditLimit, notes, isActive } = req.body;
  await pool.query(`
    UPDATE customers SET name=?, email=?, phone=?, address=?, credit_limit=?, notes=?, is_active=?
    WHERE id=? AND business_id=?
  `, [name, email, phone, address, creditLimit, notes, isActive !== false, req.params.id, req.user.businessId]);

  const [customer] = await pool.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
  res.json(customer[0]);
}));

export default router;
