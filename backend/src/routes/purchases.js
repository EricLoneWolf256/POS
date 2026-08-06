import express from 'express';
import pool from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler, generatePurchaseNumber } from '../utils/helpers.js';
import { auditLog } from '../middleware/audit.js';
import {
  handleValidation,
  validateRequiredString,
  validateOptionalString,
  validateOptionalPositiveNumber,
  validateIdParam,
  validatePositiveNumber,
} from '../middleware/validation.js';
import { body } from 'express-validator';

const router = express.Router();

router.get('/suppliers', authenticate, asyncHandler(async (req, res) => {
  const [suppliers] = await pool.query(
    'SELECT * FROM suppliers WHERE business_id = ? AND is_active = TRUE ORDER BY name',
    [req.user.businessId]
  );
  res.json(suppliers);
}));

router.post('/suppliers', authenticate, authorize('owner', 'admin', 'manager'), [
  validateRequiredString('name', 1, 255),
  validateOptionalString('contactPerson', 255),
  body('email').optional({ values: 'null' }).trim().isEmail().withMessage('Must be a valid email').normalizeEmail(),
  validateOptionalString('phone', 50),
  validateOptionalString('address', 500),
  handleValidation,
], asyncHandler(async (req, res) => {
  const { name, contactPerson, email, phone, address } = req.body;
  const [result] = await pool.query(`
    INSERT INTO suppliers (business_id, name, contact_person, email, phone, address)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [req.user.businessId, name, contactPerson || null, email || null, phone || null, address || null]);

  auditLog(req.user.businessId, req.user.id, 'create', 'supplier', result.insertId, { name, ip: req.ip });

  res.status(201).json({ id: result.insertId, name });
}));

router.get('/purchases', authenticate, asyncHandler(async (req, res) => {
  const [purchases] = await pool.query(`
    SELECT p.*, s.name as supplier_name, b.name as branch_name
    FROM purchases p
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    JOIN branches b ON p.branch_id = b.id
    WHERE p.business_id = ? ORDER BY p.created_at DESC LIMIT 100
  `, [req.user.businessId]);
  res.json(purchases);
}));

router.post('/purchases', authenticate, authorize('owner', 'admin', 'manager'), [
  body('items').isArray({ min: 1 }).withMessage('Purchase must have at least one item'),
  body('items.*.productId').isInt({ min: 1 }).withMessage('Each item must have a valid productId'),
  body('items.*.quantity').isFloat({ min: 0.01 }).withMessage('Each item quantity must be positive'),
  body('items.*.unitCost').isFloat({ min: 0 }).withMessage('Each item unitCost must be non-negative'),
  body('supplierId').optional({ values: 'null' }).isInt({ min: 1 }),
  validateOptionalPositiveNumber('amountPaid'),
  validateOptionalString('notes', 500),
  body('branchId').optional({ values: 'null' }).isInt({ min: 1 }),
  handleValidation,
], asyncHandler(async (req, res) => {
  const { items, supplierId, amountPaid, notes, branchId } = req.body;
  const purchaseBranchId = branchId || req.user.branchId;
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    let subtotal = 0;
    for (const item of items) {
      subtotal += item.unitCost * item.quantity;
    }

    const purchaseNumber = generatePurchaseNumber();
    const [result] = await conn.query(`
      INSERT INTO purchases (business_id, branch_id, purchase_number, supplier_id, subtotal, total_amount, amount_paid, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [req.user.businessId, purchaseBranchId, purchaseNumber, supplierId || null, subtotal, subtotal, amountPaid || subtotal, notes || null, req.user.id]);

    const purchaseId = result.insertId;

    for (const item of items) {
      await conn.query(`
        INSERT INTO purchase_items (purchase_id, product_id, variation_id, quantity, unit_cost, total)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [purchaseId, item.productId, item.variationId || null, item.quantity, item.unitCost, item.unitCost * item.quantity]);

      const [existing] = await conn.query(
        'SELECT id FROM stock WHERE branch_id = ? AND product_id = ? AND (variation_id = ? OR (variation_id IS NULL AND ? IS NULL))',
        [purchaseBranchId, item.productId, item.variationId, item.variationId]
      );

      if (existing.length) {
        await conn.query('UPDATE stock SET quantity = quantity + ? WHERE id = ?', [item.quantity, existing[0].id]);
      } else {
        await conn.query('INSERT INTO stock (branch_id, product_id, variation_id, quantity) VALUES (?, ?, ?, ?)',
          [purchaseBranchId, item.productId, item.variationId || null, item.quantity]);
      }

      await conn.query(`
        INSERT INTO stock_movements (business_id, branch_id, product_id, variation_id, movement_type, quantity, reference_type, reference_id, created_by)
        VALUES (?, ?, ?, ?, 'purchase', ?, 'purchase', ?, ?)
      `, [req.user.businessId, purchaseBranchId, item.productId, item.variationId || null, item.quantity, purchaseId, req.user.id]);

      await conn.query('UPDATE products SET cost_price = ? WHERE id = ?', [item.unitCost, item.productId]);
    }

    await conn.commit();

    auditLog(req.user.businessId, req.user.id, 'create', 'purchase', purchaseId, { purchaseNumber, subtotal, ip: req.ip });

    res.status(201).json({ id: purchaseId, purchaseNumber, totalAmount: subtotal });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

router.get('/expenses', authenticate, asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  let query = `
    SELECT e.*, b.name as branch_name, u.first_name, u.last_name
    FROM expenses e
    LEFT JOIN branches b ON e.branch_id = b.id
    LEFT JOIN users u ON e.created_by = u.id
    WHERE e.business_id = ?
  `;
  const params = [req.user.businessId];
  if (startDate) { query += ' AND e.expense_date >= ?'; params.push(startDate); }
  if (endDate) { query += ' AND e.expense_date <= ?'; params.push(endDate); }
  query += ' ORDER BY e.expense_date DESC';

  const [expenses] = await pool.query(query, params);
  res.json(expenses);
}));

router.post('/expenses', authenticate, authorize('owner', 'admin', 'manager'), [
  validateRequiredString('category', 1, 100),
  validateOptionalString('description', 500),
  validatePositiveNumber('amount'),
  validateOptionalString('paymentMethod', 50),
  validateOptionalString('expenseDate', 10),
  body('branchId').optional({ values: 'null' }).isInt({ min: 1 }),
  handleValidation,
], asyncHandler(async (req, res) => {
  const { category, description, amount, paymentMethod, expenseDate, branchId } = req.body;
  const [result] = await pool.query(`
    INSERT INTO expenses (business_id, branch_id, category, description, amount, payment_method, expense_date, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [req.user.businessId, branchId || req.user.branchId, category, description || null, amount, paymentMethod || null, expenseDate || new Date().toISOString().split('T')[0], req.user.id]);

  auditLog(req.user.businessId, req.user.id, 'create', 'expense', result.insertId, { category, amount, ip: req.ip });

  res.status(201).json({ id: result.insertId, category, amount });
}));

export default router;
