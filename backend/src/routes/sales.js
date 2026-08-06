import express from 'express';
import pool from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler, generateSaleNumber } from '../utils/helpers.js';
import { generateReceipt } from '../services/pdf.js';
import { auditLog } from '../middleware/audit.js';
import {
  handleValidation,
  validateEnum,
  validateOptionalPositiveNumber,
  validateOptionalString,
  validateISODate,
  validateIdParam,
} from '../middleware/validation.js';
import { body, query } from 'express-validator';

const PAYMENT_METHODS = ['cash', 'mobile_money', 'card', 'bank_transfer', 'credit', 'mixed'];
const SALE_STATUSES = ['completed', 'pending', 'cancelled', 'refunded'];

const router = express.Router();

router.get('/', authenticate, [
  query('startDate').optional({ values: 'null' }).isISO8601().withMessage('startDate must be a valid date'),
  query('endDate').optional({ values: 'null' }).isISO8601().withMessage('endDate must be a valid date'),
  query('branchId').optional({ values: 'null' }).isInt({ min: 1 }).withMessage('branchId must be a positive integer'),
  query('cashierId').optional({ values: 'null' }).isInt({ min: 1 }).withMessage('cashierId must be a positive integer'),
  query('status').optional({ values: 'null' }).isIn(SALE_STATUSES).withMessage(`status must be one of: ${SALE_STATUSES.join(', ')}`),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 200 }).withMessage('limit must be between 1 and 200'),
  handleValidation,
], asyncHandler(async (req, res) => {
  const { startDate, endDate, branchId, cashierId, status, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT s.*, u.first_name as cashier_first, u.last_name as cashier_last,
           c.name as customer_name, b.name as branch_name
    FROM sales s
    JOIN users u ON s.cashier_id = u.id
    JOIN branches b ON s.branch_id = b.id
    LEFT JOIN customers c ON s.customer_id = c.id
    WHERE s.business_id = ?
  `;
  const params = [req.user.businessId];

  if (startDate) { query += ' AND DATE(s.created_at) >= ?'; params.push(startDate); }
  if (endDate) { query += ' AND DATE(s.created_at) <= ?'; params.push(endDate); }
  if (branchId) { query += ' AND s.branch_id = ?'; params.push(branchId); }
  if (cashierId) { query += ' AND s.cashier_id = ?'; params.push(cashierId); }
  if (status) { query += ' AND s.status = ?'; params.push(status); }

  query += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit) || 50, parseInt(offset) || 0);

  const [sales] = await pool.query(query, params);

  let countQuery = 'SELECT COUNT(*) as total FROM sales WHERE business_id = ?';
  const countParams = [req.user.businessId];
  if (startDate) { countQuery += ' AND DATE(created_at) >= ?'; countParams.push(startDate); }
  if (endDate) { countQuery += ' AND DATE(created_at) <= ?'; countParams.push(endDate); }

  const [count] = await pool.query(countQuery, countParams);

  res.json({ sales, total: count[0].total, page: parseInt(page), limit: parseInt(limit) });
}));

router.get('/reports/summary', authenticate, asyncHandler(async (req, res) => {
  const { period = 'today', branchId } = req.query;
  const branch = branchId || req.user.branchId;

  let dateFilter = 'DATE(s.created_at) = CURDATE()';
  if (period === 'week') dateFilter = 's.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
  if (period === 'month') dateFilter = 's.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';

  const [summary] = await pool.query(`
    SELECT COUNT(*) as total_sales, COALESCE(SUM(total_amount), 0) as total_revenue,
           COALESCE(AVG(total_amount), 0) as avg_sale,
           COALESCE(SUM(tax_amount), 0) as total_tax
    FROM sales s WHERE s.business_id = ? AND s.status = 'completed' AND ${dateFilter}
    ${branch ? 'AND s.branch_id = ?' : ''}
  `, branch ? [req.user.businessId, branch] : [req.user.businessId]);

  const [topProducts] = await pool.query(`
    SELECT si.product_name, SUM(si.quantity) as qty_sold, SUM(si.total) as revenue
    FROM sale_items si JOIN sales s ON si.sale_id = s.id
    WHERE s.business_id = ? AND s.status = 'completed' AND ${dateFilter}
    ${branch ? 'AND s.branch_id = ?' : ''}
    GROUP BY si.product_id, si.product_name ORDER BY revenue DESC LIMIT 10
  `, branch ? [req.user.businessId, branch] : [req.user.businessId]);

  const [cashierPerf] = await pool.query(`
    SELECT u.first_name, u.last_name, COUNT(*) as sales_count, SUM(s.total_amount) as revenue
    FROM sales s JOIN users u ON s.cashier_id = u.id
    WHERE s.business_id = ? AND s.status = 'completed' AND ${dateFilter}
    ${branch ? 'AND s.branch_id = ?' : ''}
    GROUP BY u.id ORDER BY revenue DESC
  `, branch ? [req.user.businessId, branch] : [req.user.businessId]);

  res.json({ summary: summary[0], topProducts, cashierPerformance: cashierPerf });
}));

router.get('/:id', authenticate, [...validateIdParam('id'), handleValidation], asyncHandler(async (req, res) => {
  const [sales] = await pool.query(`
    SELECT s.*, u.first_name as cashier_first, u.last_name as cashier_last,
           c.name as customer_name, c.phone as customer_phone, b.name as branch_name
    FROM sales s
    JOIN users u ON s.cashier_id = u.id
    JOIN branches b ON s.branch_id = b.id
    LEFT JOIN customers c ON s.customer_id = c.id
    WHERE s.id = ? AND s.business_id = ?
  `, [req.params.id, req.user.businessId]);

  if (sales.length === 0) return res.status(404).json({ error: 'Sale not found' });

  const [items] = await pool.query('SELECT * FROM sale_items WHERE sale_id = ?', [req.params.id]);
  res.json({ ...sales[0], items });
}));

router.post('/', authenticate, [
  body('items').isArray({ min: 1 }).withMessage('Sale must have at least one item'),
  body('items.*.productId').isInt({ min: 1 }).withMessage('Each item must have a valid productId'),
  body('items.*.productName').isString().trim().notEmpty().withMessage('Each item must have a productName'),
  body('items.*.quantity').isFloat({ min: 0.01 }).withMessage('Each item quantity must be positive'),
  body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Each item unitPrice must be non-negative'),
  body('items.*.discount').optional().isFloat({ min: 0 }).withMessage('Discount must be non-negative'),
  body('items.*.taxAmount').optional().isFloat({ min: 0 }).withMessage('Tax amount must be non-negative'),
  validateEnum('paymentMethod', PAYMENT_METHODS),
  validateOptionalPositiveNumber('amountPaid'),
  validateOptionalPositiveNumber('discountAmount'),
  validateOptionalString('notes', 500),
  body('isCredit').optional().isBoolean(),
  body('customerId').optional({ values: 'null' }).isInt({ min: 1 }),
  body('branchId').optional({ values: 'null' }).isInt({ min: 1 }),
  body('offlineId').optional({ values: 'null' }).isString().trim().isLength({ max: 100 }),
  handleValidation,
], asyncHandler(async (req, res) => {
  const {
    items, customerId, paymentMethod, amountPaid, discountAmount = 0,
    notes, isCredit, branchId, offlineId, paymentDetails
  } = req.body;

  const saleBranchId = branchId || req.user.branchId;
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    let subtotal = 0;
    let taxAmount = 0;

    for (const item of items) {
      const lineTotal = (item.unitPrice * item.quantity) - (item.discount || 0);
      subtotal += lineTotal;
      taxAmount += item.taxAmount || 0;

      if (item.trackStock !== false) {
        const [stock] = await conn.query(
          'SELECT quantity FROM stock WHERE branch_id = ? AND product_id = ? AND (variation_id = ? OR (variation_id IS NULL AND ? IS NULL))',
          [saleBranchId, item.productId, item.variationId, item.variationId]
        );

        if (stock.length === 0 || stock[0].quantity < item.quantity) {
          throw { status: 400, message: `Insufficient stock for ${item.productName}` };
        }

        await conn.query(
          'UPDATE stock SET quantity = quantity - ? WHERE branch_id = ? AND product_id = ? AND (variation_id = ? OR (variation_id IS NULL AND ? IS NULL))',
          [item.quantity, saleBranchId, item.productId, item.variationId, item.variationId]
        );

        await conn.query(`
          INSERT INTO stock_movements (business_id, branch_id, product_id, variation_id, movement_type, quantity, reference_type, created_by)
          VALUES (?, ?, ?, ?, 'sale', ?, 'sale', ?)
        `, [req.user.businessId, saleBranchId, item.productId, item.variationId, -item.quantity, req.user.id]);
      }
    }

    const totalAmount = subtotal + taxAmount - discountAmount;
    const actualAmountPaid = (amountPaid !== undefined && amountPaid !== null) ? amountPaid : totalAmount;
    const changeAmount = Math.max(0, actualAmountPaid - totalAmount);
    const saleNumber = generateSaleNumber();

    const [saleResult] = await conn.query(`
      INSERT INTO sales (business_id, branch_id, sale_number, customer_id, cashier_id, subtotal, tax_amount,
        discount_amount, total_amount, amount_paid, change_amount, payment_method, payment_details,
        is_credit, notes, offline_id, synced_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      req.user.businessId, saleBranchId, saleNumber, customerId || null, req.user.id,
      subtotal, taxAmount, discountAmount, totalAmount, actualAmountPaid,
      changeAmount, paymentMethod || 'cash', JSON.stringify(paymentDetails || {}),
      isCredit || false, notes || null, offlineId || null
    ]);

    const saleId = saleResult.insertId;

    for (const item of items) {
      const lineTotal = (item.unitPrice * item.quantity) - (item.discount || 0);
      await conn.query(`
        INSERT INTO sale_items (sale_id, product_id, variation_id, product_name, quantity, unit_price, discount, tax_amount, total)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [saleId, item.productId, item.variationId || null, item.productName, item.quantity, item.unitPrice, item.discount || 0, item.taxAmount || 0, lineTotal]);
    }

    if (isCredit && customerId) {
      await conn.query(
        'UPDATE customers SET credit_balance = credit_balance + ? WHERE id = ? AND business_id = ?',
        [totalAmount, customerId, req.user.businessId]
      );
    }

    await conn.commit();

    auditLog(req.user.businessId, req.user.id, 'create', 'sale', saleId, { saleNumber, totalAmount, paymentMethod, ip: req.ip });

    const [sale] = await pool.query('SELECT * FROM sales WHERE id = ?', [saleId]);
    const [saleItems] = await pool.query('SELECT * FROM sale_items WHERE sale_id = ?', [saleId]);

    res.status(201).json({ ...sale[0], items: saleItems });
  } catch (err) {
    await conn.rollback();
    if (err.status) return res.status(err.status).json({ error: err.message });
    throw err;
  } finally {
    conn.release();
  }
}));

router.get('/:id/receipt', authenticate, [...validateIdParam('id'), handleValidation], asyncHandler(async (req, res) => {
  const [sales] = await pool.query(`
    SELECT s.*, u.first_name as cashier_first, u.last_name as cashier_last,
           c.name as customer_name, b.name as branch_name
    FROM sales s
    JOIN users u ON s.cashier_id = u.id
    JOIN branches b ON s.branch_id = b.id
    LEFT JOIN customers c ON s.customer_id = c.id
    WHERE s.id = ? AND s.business_id = ?
  `, [req.params.id, req.user.businessId]);

  if (sales.length === 0) return res.status(404).json({ error: 'Sale not found' });

  const [items] = await pool.query('SELECT * FROM sale_items WHERE sale_id = ?', [req.params.id]);
  const [business] = await pool.query('SELECT name, address, phone, logo_url FROM businesses WHERE id = ?', [req.user.businessId]);

  const sale = { ...sales[0], cashier_name: `${sales[0].cashier_first} ${sales[0].cashier_last}`, customer_name: sales[0].customer_name };
  const pdf = await generateReceipt(sale, items, business[0] || {});

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; receipt-${sale.sale_number}.pdf`);
  res.send(pdf);
}));

export default router;
