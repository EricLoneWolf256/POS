import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/helpers.js';

const router = express.Router();

router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { branchId } = req.query;
  const branch = branchId || req.user.branchId;
  const businessId = req.user.businessId;

  const [todaySales] = await pool.query(`
    SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue
    FROM sales WHERE business_id = ? AND status = 'completed' AND DATE(created_at) = CURDATE()
    ${branch ? 'AND branch_id = ?' : ''}
  `, branch ? [businessId, branch] : [businessId]);

  const [monthSales] = await pool.query(`
    SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue
    FROM sales WHERE business_id = ? AND status = 'completed'
    AND created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
    ${branch ? 'AND branch_id = ?' : ''}
  `, branch ? [businessId, branch] : [businessId]);

  const [productCount] = await pool.query(
    'SELECT COUNT(*) as count FROM products WHERE business_id = ? AND is_active = TRUE',
    [businessId]
  );

  const [customerCount] = await pool.query(
    'SELECT COUNT(*) as count FROM customers WHERE business_id = ? AND is_active = TRUE',
    [businessId]
  );

  const [lowStock] = await pool.query(`
    SELECT COUNT(*) as count FROM stock s
    JOIN products p ON s.product_id = p.id
    WHERE p.business_id = ? AND s.quantity <= p.low_stock_threshold
    ${branch ? 'AND s.branch_id = ?' : ''}
  `, branch ? [businessId, branch] : [businessId]);

  const [recentSales] = await pool.query(`
    SELECT s.sale_number, s.total_amount, s.payment_method, s.created_at,
           u.first_name as cashier_first, u.last_name as cashier_last
    FROM sales s JOIN users u ON s.cashier_id = u.id
    WHERE s.business_id = ? AND s.status = 'completed'
    ORDER BY s.created_at DESC LIMIT 10
  `, [businessId]);

  const [salesChart] = await pool.query(`
    SELECT DATE(created_at) as date, COUNT(*) as sales_count, SUM(total_amount) as revenue
    FROM sales WHERE business_id = ? AND status = 'completed'
    AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    GROUP BY DATE(created_at) ORDER BY date
  `, [businessId]);

  const [branchPerformance] = await pool.query(`
    SELECT b.name, COUNT(s.id) as sales_count, COALESCE(SUM(s.total_amount), 0) as revenue
    FROM branches b
    LEFT JOIN sales s ON s.branch_id = b.id AND s.status = 'completed' AND DATE(s.created_at) = CURDATE()
    WHERE b.business_id = ? AND b.is_active = TRUE
    GROUP BY b.id ORDER BY revenue DESC
  `, [businessId]);

  res.json({
    today: todaySales[0],
    month: monthSales[0],
    products: productCount[0].count,
    customers: customerCount[0].count,
    lowStockAlerts: lowStock[0].count,
    recentSales,
    salesChart,
    branchPerformance,
  });
}));

export default router;
