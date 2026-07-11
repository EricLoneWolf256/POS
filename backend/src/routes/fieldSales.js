import express from 'express';
import pool from '../config/database.js';
import { authenticate, requirePlan } from '../middleware/auth.js';
import { asyncHandler } from '../utils/helpers.js';

const router = express.Router();

router.get('/trips', authenticate, requirePlan('field_sales'), asyncHandler(async (req, res) => {
  const [trips] = await pool.query(`
    SELECT t.*, u.first_name, u.last_name, b.name as branch_name
    FROM field_sales_trips t
    JOIN users u ON t.salesperson_id = u.id
    JOIN branches b ON t.branch_id = b.id
    WHERE t.business_id = ? ORDER BY t.trip_date DESC
  `, [req.user.businessId]);
  res.json(trips);
}));

router.post('/trips', authenticate, requirePlan('field_sales'), asyncHandler(async (req, res) => {
  const { salespersonId, tripDate, stockItems, notes } = req.body;
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [result] = await conn.query(`
      INSERT INTO field_sales_trips (business_id, salesperson_id, branch_id, trip_date, notes)
      VALUES (?, ?, ?, ?, ?)
    `, [req.user.businessId, salespersonId, req.user.branchId, tripDate || new Date().toISOString().split('T')[0], notes]);

    const tripId = result.insertId;

    if (stockItems?.length) {
      for (const item of stockItems) {
        await conn.query(`
          INSERT INTO field_stock_issues (trip_id, product_id, variation_id, quantity_issued)
          VALUES (?, ?, ?, ?)
        `, [tripId, item.productId, item.variationId, item.quantity]);

        await conn.query(
          'UPDATE stock SET quantity = quantity - ? WHERE branch_id = ? AND product_id = ?',
          [item.quantity, req.user.branchId, item.productId]
        );
      }
    }

    await conn.commit();
    res.status(201).json({ id: tripId });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

router.post('/trips/:id/complete', authenticate, requirePlan('field_sales'), asyncHandler(async (req, res) => {
  const { returns, expenses, totalSales } = req.body;
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    if (returns?.length) {
      for (const item of returns) {
        await conn.query(
          'UPDATE field_stock_issues SET quantity_returned = ? WHERE trip_id = ? AND product_id = ?',
          [item.quantityReturned, req.params.id, item.productId]
        );

        await conn.query(
          'UPDATE stock SET quantity = quantity + ? WHERE branch_id = ? AND product_id = ?',
          [item.quantityReturned, req.user.branchId, item.productId]
        );
      }
    }

    if (expenses?.length) {
      let totalExpenses = 0;
      for (const exp of expenses) {
        await conn.query(
          'INSERT INTO field_expenses (trip_id, description, amount, category) VALUES (?, ?, ?, ?)',
          [req.params.id, exp.description, exp.amount, exp.category]
        );
        totalExpenses += exp.amount;
      }
      await conn.query('UPDATE field_sales_trips SET total_expenses = ? WHERE id = ?', [totalExpenses, req.params.id]);
    }

    await conn.query(
      'UPDATE field_sales_trips SET status = ?, total_sales = ? WHERE id = ?',
      ['completed', totalSales || 0, req.params.id]
    );

    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

router.get('/performance', authenticate, requirePlan('field_sales'), asyncHandler(async (req, res) => {
  const [perf] = await pool.query(`
    SELECT u.first_name, u.last_name, COUNT(t.id) as trips,
           SUM(t.total_sales) as total_sales, SUM(t.total_expenses) as total_expenses,
           SUM(t.total_sales) - SUM(t.total_expenses) as net
    FROM field_sales_trips t
    JOIN users u ON t.salesperson_id = u.id
    WHERE t.business_id = ? AND t.status = 'completed'
    GROUP BY u.id ORDER BY total_sales DESC
  `, [req.user.businessId]);
  res.json(perf);
}));

export default router;
