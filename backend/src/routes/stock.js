import express from 'express';
import pool from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../utils/helpers.js';

const router = express.Router();

router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { branchId, lowStock, productId } = req.query;
  const branch = branchId || req.user.branchId;

  let query = `
    SELECT s.*, p.name as product_name, p.sku, p.barcode, p.low_stock_threshold,
           p.selling_price, c.name as category_name, b.name as branch_name,
           pv.name as variation_name
    FROM stock s
    JOIN products p ON s.product_id = p.id
    JOIN branches b ON s.branch_id = b.id
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN product_variations pv ON s.variation_id = pv.id
    WHERE p.business_id = ?
  `;
  const params = [req.user.businessId];

  if (branch) { query += ' AND s.branch_id = ?'; params.push(branch); }
  if (productId) { query += ' AND s.product_id = ?'; params.push(productId); }
  if (lowStock === 'true') { query += ' AND s.quantity <= p.low_stock_threshold'; }

  query += ' ORDER BY p.name';
  const [stock] = await pool.query(query, params);
  res.json(stock);
}));

router.get('/alerts', authenticate, asyncHandler(async (req, res) => {
  const [alerts] = await pool.query(`
    SELECT p.name as product_name, p.sku, s.quantity, p.low_stock_threshold,
           b.name as branch_name, s.branch_id,
           CASE WHEN s.quantity = 0 THEN 'out_of_stock' ELSE 'low_stock' END as alert_type
    FROM stock s
    JOIN products p ON s.product_id = p.id
    JOIN branches b ON s.branch_id = b.id
    WHERE p.business_id = ? AND s.quantity <= p.low_stock_threshold
    ORDER BY s.quantity ASC
  `, [req.user.businessId]);
  res.json(alerts);
}));

router.post('/adjust', authenticate, authorize('owner', 'admin', 'manager'), asyncHandler(async (req, res) => {
  const { productId, variationId, branchId, quantity, notes } = req.body;
  const branch = branchId || req.user.branchId;
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [existing] = await conn.query(
      'SELECT id, quantity FROM stock WHERE branch_id = ? AND product_id = ? AND (variation_id = ? OR (variation_id IS NULL AND ? IS NULL))',
      [branch, productId, variationId, variationId]
    );

    const oldQty = existing.length ? existing[0].quantity : 0;
    const diff = quantity - oldQty;

    if (existing.length) {
      await conn.query('UPDATE stock SET quantity = ? WHERE id = ?', [quantity, existing[0].id]);
    } else {
      await conn.query('INSERT INTO stock (branch_id, product_id, variation_id, quantity) VALUES (?, ?, ?, ?)',
        [branch, productId, variationId, quantity]);
    }

    await conn.query(`
      INSERT INTO stock_movements (business_id, branch_id, product_id, variation_id, movement_type, quantity, notes, created_by)
      VALUES (?, ?, ?, ?, 'adjustment', ?, ?, ?)
    `, [req.user.businessId, branch, productId, variationId, diff, notes, req.user.id]);

    await conn.commit();
    res.json({ success: true, newQuantity: quantity });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

router.get('/movements', authenticate, asyncHandler(async (req, res) => {
  const { productId, branchId, type, limit = 100 } = req.query;

  let query = `
    SELECT sm.*, p.name as product_name, b.name as branch_name,
           u.first_name, u.last_name
    FROM stock_movements sm
    JOIN products p ON sm.product_id = p.id
    JOIN branches b ON sm.branch_id = b.id
    LEFT JOIN users u ON sm.created_by = u.id
    WHERE sm.business_id = ?
  `;
  const params = [req.user.businessId];

  if (productId) { query += ' AND sm.product_id = ?'; params.push(productId); }
  if (branchId) { query += ' AND sm.branch_id = ?'; params.push(branchId); }
  if (type) { query += ' AND sm.movement_type = ?'; params.push(type); }

  query += ' ORDER BY sm.created_at DESC LIMIT ?';
  params.push(parseInt(limit));

  const [movements] = await pool.query(query, params);
  res.json(movements);
}));

router.post('/transfer', authenticate, authorize('owner', 'admin', 'manager'), asyncHandler(async (req, res) => {
  const { fromBranchId, toBranchId, items, notes } = req.body;
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [transferResult] = await conn.query(`
      INSERT INTO stock_transfers (business_id, from_branch_id, to_branch_id, status, notes, created_by)
      VALUES (?, ?, ?, 'completed', ?, ?)
    `, [req.user.businessId, fromBranchId, toBranchId, notes, req.user.id]);

    const transferId = transferResult.insertId;

    for (const item of items) {
      const [fromStock] = await conn.query(
        'SELECT quantity FROM stock WHERE branch_id = ? AND product_id = ? AND (variation_id = ? OR (variation_id IS NULL AND ? IS NULL))',
        [fromBranchId, item.productId, item.variationId, item.variationId]
      );

      if (!fromStock.length || fromStock[0].quantity < item.quantity) {
        throw { status: 400, message: 'Insufficient stock for transfer' };
      }

      await conn.query(
        'UPDATE stock SET quantity = quantity - ? WHERE branch_id = ? AND product_id = ?',
        [item.quantity, fromBranchId, item.productId]
      );

      const [toStock] = await conn.query(
        'SELECT id FROM stock WHERE branch_id = ? AND product_id = ?',
        [toBranchId, item.productId]
      );

      if (toStock.length) {
        await conn.query('UPDATE stock SET quantity = quantity + ? WHERE id = ?', [item.quantity, toStock[0].id]);
      } else {
        await conn.query('INSERT INTO stock (branch_id, product_id, variation_id, quantity) VALUES (?, ?, ?, ?)',
          [toBranchId, item.productId, item.variationId, item.quantity]);
      }

      await conn.query('INSERT INTO stock_transfer_items (transfer_id, product_id, variation_id, quantity) VALUES (?, ?, ?, ?)',
        [transferId, item.productId, item.variationId, item.quantity]);

      await conn.query(`
        INSERT INTO stock_movements (business_id, branch_id, product_id, variation_id, movement_type, quantity, reference_type, reference_id, created_by)
        VALUES (?, ?, ?, ?, 'transfer_out', ?, 'transfer', ?, ?)
      `, [req.user.businessId, fromBranchId, item.productId, item.variationId, -item.quantity, transferId, req.user.id]);

      await conn.query(`
        INSERT INTO stock_movements (business_id, branch_id, product_id, variation_id, movement_type, quantity, reference_type, reference_id, created_by)
        VALUES (?, ?, ?, ?, 'transfer_in', ?, 'transfer', ?, ?)
      `, [req.user.businessId, toBranchId, item.productId, item.variationId, item.quantity, transferId, req.user.id]);
    }

    await conn.query('UPDATE stock_transfers SET completed_at = NOW() WHERE id = ?', [transferId]);
    await conn.commit();
    res.status(201).json({ id: transferId, status: 'completed' });
  } catch (err) {
    await conn.rollback();
    if (err.status) return res.status(err.status).json({ error: err.message });
    throw err;
  } finally {
    conn.release();
  }
}));

export default router;
