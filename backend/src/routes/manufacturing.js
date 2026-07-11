import express from 'express';
import pool from '../config/database.js';
import { authenticate, requirePlan } from '../middleware/auth.js';
import { asyncHandler } from '../utils/helpers.js';

const router = express.Router();

router.get('/materials', authenticate, requirePlan('manufacturing'), asyncHandler(async (req, res) => {
  const [materials] = await pool.query(`
    SELECT rm.*, COALESCE(rms.quantity, 0) as stock_quantity, b.name as branch_name
    FROM raw_materials rm
    LEFT JOIN raw_material_stock rms ON rms.material_id = rm.id
    LEFT JOIN branches b ON rms.branch_id = b.id
    WHERE rm.business_id = ? AND rm.is_active = TRUE
  `, [req.user.businessId]);
  res.json(materials);
}));

router.post('/materials', authenticate, requirePlan('manufacturing'), asyncHandler(async (req, res) => {
  const { name, sku, unit, costPerUnit, lowStockThreshold } = req.body;
  const [result] = await pool.query(`
    INSERT INTO raw_materials (business_id, name, sku, unit, cost_per_unit, low_stock_threshold)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [req.user.businessId, name, sku, unit || 'kg', costPerUnit || 0, lowStockThreshold || 10]);
  res.status(201).json({ id: result.insertId, name });
}));

router.get('/bom', authenticate, requirePlan('manufacturing'), asyncHandler(async (req, res) => {
  const [boms] = await pool.query(`
    SELECT bom.*, p.name as product_name,
           (SELECT JSON_ARRAYAGG(JSON_OBJECT('material_id', bi.material_id, 'material_name', rm.name, 'quantity', bi.quantity))
            FROM bom_items bi JOIN raw_materials rm ON bi.material_id = rm.id WHERE bi.bom_id = bom.id) as items
    FROM bill_of_materials bom
    JOIN products p ON bom.product_id = p.id
    WHERE bom.business_id = ? AND bom.is_active = TRUE
  `, [req.user.businessId]);
  res.json(boms);
}));

router.post('/bom', authenticate, requirePlan('manufacturing'), asyncHandler(async (req, res) => {
  const { productId, name, outputQuantity, items } = req.body;
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();
    const [result] = await conn.query(`
      INSERT INTO bill_of_materials (business_id, product_id, name, output_quantity)
      VALUES (?, ?, ?, ?)
    `, [req.user.businessId, productId, name, outputQuantity || 1]);

    for (const item of items) {
      await conn.query('INSERT INTO bom_items (bom_id, material_id, quantity) VALUES (?, ?, ?)',
        [result.insertId, item.materialId, item.quantity]);
    }

    await conn.commit();
    res.status(201).json({ id: result.insertId, name });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

router.get('/orders', authenticate, requirePlan('manufacturing'), asyncHandler(async (req, res) => {
  const [orders] = await pool.query(`
    SELECT po.*, bom.name as bom_name, p.name as product_name, b.name as branch_name
    FROM production_orders po
    JOIN bill_of_materials bom ON po.bom_id = bom.id
    JOIN products p ON bom.product_id = p.id
    JOIN branches b ON po.branch_id = b.id
    WHERE po.business_id = ? ORDER BY po.created_at DESC
  `, [req.user.businessId]);
  res.json(orders);
}));

router.post('/orders', authenticate, requirePlan('manufacturing'), asyncHandler(async (req, res) => {
  const { bomId, quantity, branchId } = req.body;
  const prodBranchId = branchId || req.user.branchId;
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [bomItems] = await conn.query(`
      SELECT bi.*, rm.name, rm.cost_per_unit FROM bom_items bi
      JOIN raw_materials rm ON bi.material_id = rm.id WHERE bi.bom_id = ?
    `, [bomId]);

    const [bom] = await conn.query('SELECT * FROM bill_of_materials WHERE id = ?', [bomId]);
    if (!bom.length) throw { status: 404, message: 'BOM not found' };

    let totalCost = 0;
    const orderNumber = `PRD${Date.now().toString().slice(-8)}`;

    for (const item of bomItems) {
      const requiredQty = item.quantity * quantity;
      const [matStock] = await conn.query(
        'SELECT quantity FROM raw_material_stock WHERE branch_id = ? AND material_id = ?',
        [prodBranchId, item.material_id]
      );

      if (!matStock.length || matStock[0].quantity < requiredQty) {
        throw { status: 400, message: `Insufficient ${item.name} for production` };
      }

      await conn.query(
        'UPDATE raw_material_stock SET quantity = quantity - ? WHERE branch_id = ? AND material_id = ?',
        [requiredQty, prodBranchId, item.material_id]
      );

      totalCost += requiredQty * item.cost_per_unit;
    }

    const outputQty = bom[0].output_quantity * quantity;
    const [prodStock] = await conn.query(
      'SELECT id FROM stock WHERE branch_id = ? AND product_id = ?',
      [prodBranchId, bom[0].product_id]
    );

    if (prodStock.length) {
      await conn.query('UPDATE stock SET quantity = quantity + ? WHERE id = ?', [outputQty, prodStock[0].id]);
    } else {
      await conn.query('INSERT INTO stock (branch_id, product_id, quantity) VALUES (?, ?, ?)',
        [prodBranchId, bom[0].product_id, outputQty]);
    }

    await conn.query(`
      INSERT INTO production_orders (business_id, branch_id, order_number, bom_id, quantity, total_cost, status, created_by, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, 'completed', ?, NOW())
    `, [req.user.businessId, prodBranchId, orderNumber, bomId, quantity, totalCost, req.user.id]);

    await conn.commit();
    res.status(201).json({ orderNumber, totalCost, outputQuantity: outputQty });
  } catch (err) {
    await conn.rollback();
    if (err.status) return res.status(err.status).json({ error: err.message });
    throw err;
  } finally {
    conn.release();
  }
}));

export default router;
