import express from 'express';
import pool from '../config/database.js';
import { authenticate, requirePlan } from '../middleware/auth.js';
import { asyncHandler } from '../utils/helpers.js';
import { generateInvoice } from '../services/pdf.js';

const router = express.Router();

router.get('/', authenticate, requirePlan('quotations'), asyncHandler(async (req, res) => {
  const [quotes] = await pool.query(`
    SELECT q.*, c.name as customer_name, u.first_name, u.last_name
    FROM quotations q
    LEFT JOIN customers c ON q.customer_id = c.id
    LEFT JOIN users u ON q.created_by = u.id
    WHERE q.business_id = ? ORDER BY q.created_at DESC
  `, [req.user.businessId]);
  res.json(quotes);
}));

router.post('/', authenticate, requirePlan('quotations'), asyncHandler(async (req, res) => {
  const { customerId, items, discountAmount = 0, validUntil, notes } = req.body;

  let subtotal = 0;
  for (const item of items) subtotal += item.unitPrice * item.quantity;

  const taxAmount = subtotal * 0.18;
  const totalAmount = subtotal + taxAmount - discountAmount;
  const quoteNumber = `QT${Date.now().toString().slice(-8)}`;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(`
      INSERT INTO quotations (business_id, branch_id, quote_number, customer_id, subtotal, tax_amount, discount_amount, total_amount, valid_until, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [req.user.businessId, req.user.branchId, quoteNumber, customerId, subtotal, taxAmount, discountAmount, totalAmount, validUntil, notes, req.user.id]);

    for (const item of items) {
      await conn.query(`
        INSERT INTO quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [result.insertId, item.productId, item.description, item.quantity, item.unitPrice, item.unitPrice * item.quantity]);
    }

    await conn.commit();
    res.status(201).json({ id: result.insertId, quoteNumber, totalAmount });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

router.get('/:id/pdf', authenticate, requirePlan('quotations'), asyncHandler(async (req, res) => {
  const [quotes] = await pool.query(`
    SELECT q.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone, c.address as customer_address
    FROM quotations q
    LEFT JOIN customers c ON q.customer_id = c.id
    WHERE q.id = ? AND q.business_id = ?
  `, [req.params.id, req.user.businessId]);

  if (quotes.length === 0) return res.status(404).json({ error: 'Quotation not found' });

  const [items] = await pool.query('SELECT * FROM quotation_items WHERE quotation_id = ?', [req.params.id]);
  const [business] = await pool.query('SELECT name, address, phone, email FROM businesses WHERE id = ?', [req.user.businessId]);

  const customer = quotes[0].customer_name ? {
    name: quotes[0].customer_name,
    email: quotes[0].customer_email,
    phone: quotes[0].customer_phone,
    address: quotes[0].customer_address,
  } : null;

  const pdf = await generateInvoice(quotes[0], items, business[0] || {}, customer);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; invoice-${quotes[0].quote_number}.pdf`);
  res.send(pdf);
}));

export default router;
