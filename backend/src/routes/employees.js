import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../utils/helpers.js';
import { auditLog } from '../middleware/audit.js';
import {
  handleValidation,
  validateEmail,
  validatePassword,
  validateRequiredString,
  validateOptionalString,
  validateEnum,
  validateBoolean,
  validateIdParam,
} from '../middleware/validation.js';
import { body } from 'express-validator';

const VALID_ROLES = ['owner', 'admin', 'manager', 'cashier', 'field_sales', 'viewer'];

const router = express.Router();

router.get('/', authenticate, authorize('owner', 'admin', 'manager'), asyncHandler(async (req, res) => {
  const [employees] = await pool.query(`
    SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.role, u.is_active,
           u.last_login, u.created_at, b.name as branch_name, b.id as branch_id,
           (SELECT COUNT(*) FROM sales s WHERE s.cashier_id = u.id AND s.status = 'completed'
            AND DATE(s.created_at) = CURDATE()) as today_sales_count,
           (SELECT COALESCE(SUM(s.total_amount), 0) FROM sales s WHERE s.cashier_id = u.id
            AND s.status = 'completed' AND DATE(s.created_at) = CURDATE()) as today_revenue,
           (SELECT COALESCE(SUM(s.total_amount), 0) FROM sales s WHERE s.cashier_id = u.id
            AND s.status = 'completed' AND s.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)) as week_revenue,
           (SELECT ea.clock_in FROM employee_attendance ea
            WHERE ea.user_id = u.id AND ea.clock_out IS NULL ORDER BY ea.clock_in DESC LIMIT 1) as currently_clocked_in,
           (SELECT ea.id FROM employee_attendance ea
            WHERE ea.user_id = u.id AND ea.clock_out IS NULL ORDER BY ea.clock_in DESC LIMIT 1) as active_attendance_id
    FROM users u
    LEFT JOIN branches b ON u.branch_id = b.id
    WHERE u.business_id = ?
    ORDER BY u.is_active DESC, u.first_name
  `, [req.user.businessId]);
  res.json(employees);
}));

router.get('/:id', authenticate, authorize('owner', 'admin', 'manager'), [...validateIdParam('id'), handleValidation], asyncHandler(async (req, res) => {
  const [employees] = await pool.query(`
    SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.role, u.is_active,
           u.last_login, u.created_at, b.name as branch_name, b.id as branch_id
    FROM users u
    LEFT JOIN branches b ON u.branch_id = b.id
    WHERE u.id = ? AND u.business_id = ?
  `, [req.params.id, req.user.businessId]);

  if (employees.length === 0) return res.status(404).json({ error: 'Employee not found' });
  res.json(employees[0]);
}));

router.post('/', authenticate, authorize('owner', 'admin'), [
  validateEmail('email'),
  validatePassword('password', 8),
  validateRequiredString('firstName', 1, 100),
  validateRequiredString('lastName', 1, 100),
  validateOptionalString('phone', 50),
  validateEnum('role', VALID_ROLES),
  body('branchId').optional({ values: 'null' }).isInt({ min: 1 }).withMessage('branchId must be a positive integer'),
  handleValidation,
], asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, phone, role, branchId } = req.body;

  if (role === 'owner') {
    return res.status(403).json({ error: 'Cannot create owner accounts' });
  }

  const [planCheck] = await pool.query(`
    SELECT COUNT(*) as count, p.max_users FROM users u
    JOIN businesses b ON u.business_id = b.id
    JOIN plans p ON b.plan_id = p.id
    WHERE u.business_id = ?
  `, [req.user.businessId]);

  if (planCheck[0].max_users && planCheck[0].count >= planCheck[0].max_users) {
    return res.status(403).json({ error: `User limit reached (${planCheck[0].max_users} max on your plan)` });
  }

  const [existing] = await pool.query(
    'SELECT id FROM users WHERE email = ? AND business_id = ?',
    [email, req.user.businessId]
  );
  if (existing.length > 0) {
    return res.status(409).json({ error: 'An employee with this email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [result] = await pool.query(`
    INSERT INTO users (business_id, branch_id, email, password_hash, first_name, last_name, phone, role)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [req.user.businessId, branchId || null, email, passwordHash, firstName, lastName, phone || null, role || 'cashier']);

  auditLog(req.user.businessId, req.user.id, 'create', 'employee', result.insertId, { email, role, ip: req.ip });

  const [employee] = await pool.query(`
    SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.role, u.is_active, u.created_at,
           b.name as branch_name
    FROM users u LEFT JOIN branches b ON u.branch_id = b.id
    WHERE u.id = ?
  `, [result.insertId]);

  res.status(201).json(employee[0]);
}));

router.put('/:id', authenticate, authorize('owner', 'admin'), [
  ...validateIdParam('id'),
  validateRequiredString('firstName', 1, 100),
  validateRequiredString('lastName', 1, 100),
  validateOptionalString('phone', 50),
  validateEnum('role', VALID_ROLES),
  validateBoolean('isActive'),
  body('branchId').optional({ values: 'null' }).isInt({ min: 1 }).withMessage('branchId must be a positive integer'),
  handleValidation,
], asyncHandler(async (req, res) => {
  const { firstName, lastName, phone, role, branchId, isActive } = req.body;
  const targetId = req.params.id;

  if (parseInt(targetId) === req.user.id && isActive === false) {
    return res.status(400).json({ error: 'You cannot deactivate your own account' });
  }

  const [existing] = await pool.query(
    'SELECT id, role FROM users WHERE id = ? AND business_id = ?',
    [targetId, req.user.businessId]
  );
  if (existing.length === 0) return res.status(404).json({ error: 'Employee not found' });

  if (existing[0].role === 'owner' && role !== 'owner') {
    return res.status(400).json({ error: 'Cannot change the owner role' });
  }

  await pool.query(`
    UPDATE users SET first_name=?, last_name=?, phone=?, role=?, branch_id=?, is_active=?
    WHERE id=? AND business_id=?
  `, [firstName, lastName, phone, role, branchId || null, isActive !== false, targetId, req.user.businessId]);

  auditLog(req.user.businessId, req.user.id, 'update', 'employee', targetId, { role, ip: req.ip });

  const [employee] = await pool.query(`
    SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.role, u.is_active,
           b.name as branch_name
    FROM users u LEFT JOIN branches b ON u.branch_id = b.id
    WHERE u.id = ?
  `, [targetId]);

  res.json(employee[0]);
}));

router.post('/:id/reset-password', authenticate, authorize('owner', 'admin'), [
  ...validateIdParam('id'),
  validatePassword('newPassword', 8),
  handleValidation,
], asyncHandler(async (req, res) => {
  const { newPassword } = req.body;
  const targetId = req.params.id;

  const [existing] = await pool.query(
    'SELECT id FROM users WHERE id = ? AND business_id = ?',
    [targetId, req.user.businessId]
  );
  if (existing.length === 0) return res.status(404).json({ error: 'Employee not found' });

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, targetId]);

  auditLog(req.user.businessId, req.user.id, 'password_reset_admin', 'employee', targetId, { ip: req.ip });

  res.json({ success: true, message: 'Password reset successfully' });
}));

router.post('/clock-in', authenticate, asyncHandler(async (req, res) => {
  const [active] = await pool.query(
    'SELECT id FROM employee_attendance WHERE user_id = ? AND clock_out IS NULL',
    [req.user.id]
  );
  if (active.length > 0) {
    return res.status(400).json({ error: 'Already clocked in. Clock out first.' });
  }

  const [result] = await pool.query(`
    INSERT INTO employee_attendance (business_id, user_id, branch_id, clock_in)
    VALUES (?, ?, ?, NOW())
  `, [req.user.businessId, req.user.id, req.user.branchId]);

  auditLog(req.user.businessId, req.user.id, 'clock_in', 'attendance', result.insertId, { ip: req.ip });

  res.status(201).json({ id: result.insertId, message: 'Clocked in successfully' });
}));

router.post('/clock-out', authenticate, asyncHandler(async (req, res) => {
  const [active] = await pool.query(
    'SELECT id, clock_in FROM employee_attendance WHERE user_id = ? AND clock_out IS NULL ORDER BY clock_in DESC LIMIT 1',
    [req.user.id]
  );
  if (active.length === 0) {
    return res.status(400).json({ error: 'Not currently clocked in' });
  }

  await pool.query(
    'UPDATE employee_attendance SET clock_out = NOW() WHERE id = ?',
    [active[0].id]
  );

  auditLog(req.user.businessId, req.user.id, 'clock_out', 'attendance', active[0].id, { ip: req.ip });

  const hours = ((Date.now() - new Date(active[0].clock_in).getTime()) / 3600000).toFixed(2);
  res.json({ message: 'Clocked out successfully', hoursWorked: hours });
}));

router.get('/attendance/today', authenticate, asyncHandler(async (req, res) => {
  const [records] = await pool.query(`
    SELECT ea.*, u.first_name, u.last_name,
           TIMESTAMPDIFF(MINUTE, ea.clock_in, IFNULL(ea.clock_out, NOW())) / 60.0 as hours_worked
    FROM employee_attendance ea
    JOIN users u ON ea.user_id = u.id
    WHERE ea.business_id = ? AND DATE(ea.clock_in) = CURDATE()
    ORDER BY ea.clock_in DESC
  `, [req.user.businessId]);
  res.json(records);
}));

router.get('/attendance/history', authenticate, authorize('owner', 'admin', 'manager'), asyncHandler(async (req, res) => {
  const { userId, startDate, endDate, limit = 100 } = req.query;
  let query = `
    SELECT ea.*, u.first_name, u.last_name,
           TIMESTAMPDIFF(MINUTE, ea.clock_in, IFNULL(ea.clock_out, NOW())) / 60.0 as hours_worked
    FROM employee_attendance ea
    JOIN users u ON ea.user_id = u.id
    WHERE ea.business_id = ?
  `;
  const params = [req.user.businessId];

  if (userId) { query += ' AND ea.user_id = ?'; params.push(userId); }
  if (startDate) { query += ' AND DATE(ea.clock_in) >= ?'; params.push(startDate); }
  if (endDate) { query += ' AND DATE(ea.clock_in) <= ?'; params.push(endDate); }

  query += ' ORDER BY ea.clock_in DESC LIMIT ?';
  params.push(parseInt(limit) || 100);

  const [records] = await pool.query(query, params);
  res.json(records);
}));

router.get('/:id/performance', authenticate, authorize('owner', 'admin', 'manager'), [...validateIdParam('id'), handleValidation], asyncHandler(async (req, res) => {
  const { period = 'today' } = req.query;
  const targetId = req.params.id;

  let dateFilter = 'DATE(s.created_at) = CURDATE()';
  if (period === 'week') dateFilter = 's.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
  if (period === 'month') dateFilter = 's.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';

  const [salesStats] = await pool.query(`
    SELECT COUNT(*) as total_sales, COALESCE(SUM(total_amount), 0) as total_revenue,
           COALESCE(AVG(total_amount), 0) as avg_sale,
           COALESCE(SUM(tax_amount), 0) as total_tax,
           COALESCE(SUM(discount_amount), 0) as total_discounts
    FROM sales s
    WHERE s.cashier_id = ? AND s.business_id = ? AND s.status = 'completed' AND ${dateFilter}
  `, [targetId, req.user.businessId]);

  const [topProducts] = await pool.query(`
    SELECT si.product_name, SUM(si.quantity) as qty_sold, SUM(si.total) as revenue
    FROM sale_items si
    JOIN sales s ON si.sale_id = s.id
    WHERE s.cashier_id = ? AND s.business_id = ? AND s.status = 'completed' AND ${dateFilter}
    GROUP BY si.product_id, si.product_name
    ORDER BY revenue DESC LIMIT 5
  `, [targetId, req.user.businessId]);

  const [paymentMethods] = await pool.query(`
    SELECT payment_method, COUNT(*) as count, SUM(total_amount) as total
    FROM sales s
    WHERE s.cashier_id = ? AND s.business_id = ? AND s.status = 'completed' AND ${dateFilter}
    GROUP BY payment_method
  `, [targetId, req.user.businessId]);

  const [attendance] = await pool.query(`
    SELECT DATE(clock_in) as date,
           SUM(TIMESTAMPDIFF(MINUTE, clock_in, IFNULL(clock_out, NOW()))) / 60.0 as hours
    FROM employee_attendance
    WHERE user_id = ? AND business_id = ? AND ${dateFilter.replace('s.created_at', 'clock_in')}
    GROUP BY DATE(clock_in)
    ORDER BY date DESC LIMIT 30
  `, [targetId, req.user.businessId]);

  res.json({
    salesStats: salesStats[0],
    topProducts,
    paymentMethods,
    attendance,
  });
}));

router.get('/:id/activity', authenticate, authorize('owner', 'admin', 'manager'), [...validateIdParam('id'), handleValidation], asyncHandler(async (req, res) => {
  const { limit = 50 } = req.query;
  const targetId = req.params.id;

  const [sales] = await pool.query(`
    SELECT 'sale' as type, s.id, s.sale_number as reference, s.total_amount as amount,
           s.payment_method, s.created_at
    FROM sales s WHERE s.cashier_id = ? AND s.business_id = ?
    ORDER BY s.created_at DESC LIMIT ?
  `, [targetId, req.user.businessId, parseInt(limit) || 50]);

  const [movements] = await pool.query(`
    SELECT 'stock' as type, sm.id, sm.movement_type as reference, sm.quantity as amount,
           sm.notes, sm.created_at
    FROM stock_movements sm WHERE sm.created_by = ? AND sm.business_id = ?
    ORDER BY sm.created_at DESC LIMIT ?
  `, [targetId, req.user.businessId, parseInt(limit) || 50]);

  const combined = [...sales, ...movements]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, parseInt(limit) || 50);

  res.json(combined);
}));

export default router;
