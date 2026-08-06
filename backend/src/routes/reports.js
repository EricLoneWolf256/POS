import express from 'express';
import pool from '../config/database.js';
import { authenticate, requirePlan } from '../middleware/auth.js';
import { asyncHandler } from '../utils/helpers.js';

const router = express.Router();

router.get('/profit-loss', authenticate, requirePlan('accounting'), asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const end = endDate || new Date().toISOString().split('T')[0];

  const [revenue] = await pool.query(`
    SELECT COALESCE(SUM(total_amount), 0) as total FROM sales
    WHERE business_id = ? AND status = 'completed' AND DATE(created_at) BETWEEN ? AND ?
  `, [req.user.businessId, start, end]);

  const [cogs] = await pool.query(`
    SELECT COALESCE(SUM(si.quantity * p.cost_price), 0) as total
    FROM sale_items si
    JOIN sales s ON si.sale_id = s.id
    JOIN products p ON si.product_id = p.id
    WHERE s.business_id = ? AND s.status = 'completed' AND DATE(s.created_at) BETWEEN ? AND ?
  `, [req.user.businessId, start, end]);

  const [expenses] = await pool.query(`
    SELECT COALESCE(SUM(amount), 0) as total FROM expenses
    WHERE business_id = ? AND expense_date BETWEEN ? AND ?
  `, [req.user.businessId, start, end]);

  const totalRevenue = parseFloat(revenue[0].total);
  const totalCogs = parseFloat(cogs[0].total);
  const totalExpenses = parseFloat(expenses[0].total);
  const grossProfit = totalRevenue - totalCogs;
  const netProfit = grossProfit - totalExpenses;

  res.json({
    period: { start, end },
    revenue: totalRevenue,
    costOfGoodsSold: totalCogs,
    grossProfit,
    expenses: totalExpenses,
    netProfit,
  });
}));

router.get('/sales-by-period', authenticate, asyncHandler(async (req, res) => {
  const { period = 'daily', days = 30 } = req.query;

  let groupBy = 'DATE(created_at)';
  if (period === 'weekly') groupBy = 'YEARWEEK(created_at)';
  if (period === 'monthly') groupBy = "DATE_FORMAT(created_at, '%Y-%m')";

  const [data] = await pool.query(`
    SELECT ${groupBy} as period, COUNT(*) as sales_count,
           SUM(total_amount) as revenue, SUM(tax_amount) as tax,
           AVG(total_amount) as avg_sale
    FROM sales WHERE business_id = ? AND status = 'completed'
    AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    GROUP BY ${groupBy} ORDER BY period
  `, [req.user.businessId, parseInt(days)]);

  res.json(data);
}));

router.get('/inventory-valuation', authenticate, asyncHandler(async (req, res) => {
  const [data] = await pool.query(`
    SELECT p.name, p.sku, SUM(s.quantity) as total_qty,
           p.cost_price, p.selling_price,
           SUM(s.quantity * p.cost_price) as cost_value,
           SUM(s.quantity * p.selling_price) as retail_value
    FROM stock s JOIN products p ON s.product_id = p.id
    WHERE p.business_id = ? GROUP BY p.id ORDER BY retail_value DESC
  `, [req.user.businessId]);

  const totals = data.reduce((acc, item) => ({
    costValue: acc.costValue + parseFloat(item.cost_value || 0),
    retailValue: acc.retailValue + parseFloat(item.retail_value || 0),
  }), { costValue: 0, retailValue: 0 });

  res.json({ items: data, totals });
}));

router.get('/staff-performance', authenticate, requirePlan('staff_reports'), asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const params = [];
  let joinConditions = '';

  if (startDate) { joinConditions += ' AND DATE(s.created_at) >= ?'; params.push(startDate); }
  if (endDate) { joinConditions += ' AND DATE(s.created_at) <= ?'; params.push(endDate); }

  const query = `
    SELECT u.id, u.first_name, u.last_name, u.role,
           COUNT(s.id) as total_sales, COALESCE(SUM(s.total_amount), 0) as total_revenue,
           COALESCE(AVG(s.total_amount), 0) as avg_sale_value
    FROM users u
    LEFT JOIN sales s ON s.cashier_id = u.id AND s.status = 'completed'${joinConditions}
    WHERE u.business_id = ? AND u.is_active = TRUE
    GROUP BY u.id
    ORDER BY total_revenue DESC
  `;
  params.push(req.user.businessId);

  const [staff] = await pool.query(query, params);
  res.json(staff);
}));

export default router;
