import express from 'express';
import pool from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../utils/helpers.js';

const router = express.Router();

router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { search, category, branchId, lowStock } = req.query;
  const branch = branchId || req.user.branchId;

  let query = `
    SELECT p.*, c.name as category_name,
           COALESCE(s.quantity, 0) as stock_quantity,
           pv.id as variation_id, pv.name as variation_name, pv.selling_price as variation_price
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN stock s ON s.product_id = p.id AND s.branch_id = ? AND s.variation_id IS NULL
    LEFT JOIN product_variations pv ON pv.product_id = p.id AND pv.is_active = TRUE
    WHERE p.business_id = ? AND p.is_active = TRUE
  `;
  const params = [branch, req.user.businessId];

  if (search) {
    query += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term);
  }
  if (category) {
    query += ' AND p.category_id = ?';
    params.push(category);
  }
  if (lowStock === 'true') {
    query += ' AND s.quantity <= p.low_stock_threshold';
  }

  query += ' ORDER BY p.name';
  const [products] = await pool.query(query, params);
  res.json(products);
}));

router.get('/categories/list', authenticate, asyncHandler(async (req, res) => {
  const [categories] = await pool.query(
    'SELECT * FROM categories WHERE business_id = ? ORDER BY name',
    [req.user.businessId]
  );
  res.json(categories);
}));

router.get('/barcode/:code', authenticate, asyncHandler(async (req, res) => {
  const branch = req.query.branchId || req.user.branchId;
  const [products] = await pool.query(`
    SELECT p.*, c.name as category_name,
           COALESCE(s.quantity, 0) as stock_quantity
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN stock s ON s.product_id = p.id AND s.branch_id = ? AND s.variation_id IS NULL
    WHERE p.barcode = ? AND p.business_id = ? AND p.is_active = TRUE
    LIMIT 1
  `, [branch, req.params.code, req.user.businessId]);

  if (products.length === 0) {
    return res.status(404).json({ error: 'No product found with this barcode' });
  }
  res.json(products[0]);
}));

router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const [products] = await pool.query(
    'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ? AND p.business_id = ?',
    [req.params.id, req.user.businessId]
  );
  if (products.length === 0) return res.status(404).json({ error: 'Product not found' });

  const [variations] = await pool.query(
    'SELECT * FROM product_variations WHERE product_id = ? AND is_active = TRUE',
    [req.params.id]
  );

  const [stock] = await pool.query(`
    SELECT s.*, b.name as branch_name FROM stock s
    JOIN branches b ON s.branch_id = b.id
    WHERE s.product_id = ?
  `, [req.params.id]);

  res.json({ ...products[0], variations, stock });
}));

router.post('/', authenticate, authorize('owner', 'admin', 'manager'), asyncHandler(async (req, res) => {
  const { name, sku, barcode, categoryId, costPrice, sellingPrice, unit, lowStockThreshold, description, trackStock, variations, initialStock } = req.body;

  const [planCheck] = await pool.query(`
    SELECT COUNT(*) as count, p.max_products FROM products pr
    JOIN businesses b ON pr.business_id = b.id
    JOIN plans p ON b.plan_id = p.id
    WHERE pr.business_id = ?
  `, [req.user.businessId]);

  if (planCheck[0].max_products && planCheck[0].count >= planCheck[0].max_products) {
    return res.status(403).json({ error: `Product limit reached (${planCheck[0].max_products} max on your plan)` });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(`
      INSERT INTO products (business_id, category_id, name, sku, barcode, cost_price, selling_price, unit, low_stock_threshold, description, track_stock, has_variations)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [req.user.businessId, categoryId, name, sku, barcode, costPrice || 0, sellingPrice, unit || 'pcs', lowStockThreshold || 10, description, trackStock !== false, !!variations?.length]);

    const productId = result.insertId;

    if (variations?.length) {
      for (const v of variations) {
        await conn.query(`
          INSERT INTO product_variations (product_id, name, sku, barcode, cost_price, selling_price, attributes)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [productId, v.name, v.sku, v.barcode, v.costPrice, v.sellingPrice, JSON.stringify(v.attributes || {})]);
      }
    }

    if (initialStock && req.user.branchId) {
      await conn.query(
        'INSERT INTO stock (branch_id, product_id, quantity) VALUES (?, ?, ?)',
        [req.user.branchId, productId, initialStock]
      );
    }

    await conn.commit();
    const [product] = await pool.query('SELECT * FROM products WHERE id = ?', [productId]);
    res.status(201).json(product[0]);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

router.put('/:id', authenticate, authorize('owner', 'admin', 'manager'), asyncHandler(async (req, res) => {
  const { name, sku, barcode, categoryId, costPrice, sellingPrice, unit, lowStockThreshold, description, isActive } = req.body;

  await pool.query(`
    UPDATE products SET name=?, sku=?, barcode=?, category_id=?, cost_price=?, selling_price=?,
    unit=?, low_stock_threshold=?, description=?, is_active=?
    WHERE id=? AND business_id=?
  `, [name, sku, barcode, categoryId, costPrice, sellingPrice, unit, lowStockThreshold, description, isActive !== false, req.params.id, req.user.businessId]);

  const [product] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
  res.json(product[0]);
}));

router.post('/categories', authenticate, authorize('owner', 'admin', 'manager'), asyncHandler(async (req, res) => {
  const { name, description, parentId } = req.body;
  const [result] = await pool.query(
    'INSERT INTO categories (business_id, name, description, parent_id) VALUES (?, ?, ?, ?)',
    [req.user.businessId, name, description, parentId]
  );
  res.status(201).json({ id: result.insertId, name, description });
}));

router.post('/barcode/generate', authenticate, asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const barcode = `890${Date.now().toString().slice(-10)}`;
  await pool.query('UPDATE products SET barcode = ? WHERE id = ? AND business_id = ?', [barcode, productId, req.user.businessId]);
  res.json({ barcode });
}));

export default router;
