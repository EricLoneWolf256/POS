import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/helpers.js';
import { Parser } from 'json2csv';
import ExcelJS from 'exceljs';

const router = express.Router();

function setExcelHeaders(res, filename) {
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
}

router.get('/sales', authenticate, asyncHandler(async (req, res) => {
  const { format, from, to } = req.query;
  let query = `
    SELECT s.sale_number, s.created_at, s.total_amount, s.payment_method, s.status,
           u.first_name, u.last_name, c.name as customer_name
    FROM sales s
    LEFT JOIN users u ON s.cashier_id = u.id
    LEFT JOIN customers c ON s.customer_id = c.id
    WHERE s.business_id = ?
  `;
  const params = [req.user.businessId];
  if (from) { query += ' AND s.created_at >= ?'; params.push(from); }
  if (to) { query += ' AND s.created_at <= ?'; params.push(to); }
  query += ' ORDER BY s.created_at DESC';

  const [sales] = await pool.query(query, params);
  const data = sales.map(s => ({
    'Sale #': s.sale_number,
    'Date': new Date(s.created_at).toLocaleString(),
    'Cashier': `${s.first_name} ${s.last_name}`,
    'Customer': s.customer_name || 'Walk-in',
    'Total': Number(s.total_amount),
    'Payment': s.payment_method,
    'Status': s.status,
  }));

  if (format === 'csv') {
    const parser = new Parser({ fields: Object.keys(data[0] || {}) });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sales_export.csv');
    return res.send(parser.parse(data));
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Sales');
  if (data.length > 0) {
    ws.columns = Object.keys(data[0]).map(k => ({ header: k, key: k, width: 20 }));
    ws.addRows(data);
    ws.getRow(1).font = { bold: true };
  }
  setExcelHeaders(res, 'sales_export.xlsx');
  await wb.xlsx.write(res);
  res.end();
}));

router.get('/inventory', authenticate, asyncHandler(async (req, res) => {
  const { format } = req.query;
  const [items] = await pool.query(`
    SELECT p.name, p.sku, p.barcode, c.name as category, p.cost_price, p.selling_price,
           COALESCE(s.quantity, 0) as stock, p.low_stock_threshold
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN stock s ON s.product_id = p.id AND s.branch_id = ?
    WHERE p.business_id = ? AND p.is_active = TRUE
    ORDER BY p.name
  `, [req.user.branchId, req.user.businessId]);

  const data = items.map(i => ({
    'Product': i.name,
    'SKU': i.sku || '',
    'Barcode': i.barcode || '',
    'Category': i.category || '',
    'Cost': Number(i.cost_price),
    'Price': Number(i.selling_price),
    'Stock': Number(i.stock),
    'Low Stock At': i.low_stock_threshold,
  }));

  if (format === 'csv') {
    const parser = new Parser({ fields: Object.keys(data[0] || {}) });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=inventory_export.csv');
    return res.send(parser.parse(data));
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Inventory');
  if (data.length > 0) {
    ws.columns = Object.keys(data[0]).map(k => ({ header: k, key: k, width: 20 }));
    ws.addRows(data);
    ws.getRow(1).font = { bold: true };
  }
  setExcelHeaders(res, 'inventory_export.xlsx');
  await wb.xlsx.write(res);
  res.end();
}));

router.get('/customers', authenticate, asyncHandler(async (req, res) => {
  const { format } = req.query;
  const [customers] = await pool.query(`
    SELECT c.name, c.email, c.phone, c.address, c.credit_limit, c.credit_balance,
           c.loyalty_points, c.created_at
    FROM customers c
    WHERE c.business_id = ? AND c.is_active = TRUE
    ORDER BY c.name
  `, [req.user.businessId]);

  const data = customers.map(c => ({
    'Name': c.name,
    'Email': c.email || '',
    'Phone': c.phone || '',
    'Address': c.address || '',
    'Credit Limit': Number(c.credit_limit),
    'Credit Balance': Number(c.credit_balance),
    'Loyalty Points': c.loyalty_points,
    'Joined': new Date(c.created_at).toLocaleDateString(),
  }));

  if (format === 'csv') {
    const parser = new Parser({ fields: Object.keys(data[0] || {}) });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=customers_export.csv');
    return res.send(parser.parse(data));
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Customers');
  if (data.length > 0) {
    ws.columns = Object.keys(data[0]).map(k => ({ header: k, key: k, width: 20 }));
    ws.addRows(data);
    ws.getRow(1).font = { bold: true };
  }
  setExcelHeaders(res, 'customers_export.xlsx');
  await wb.xlsx.write(res);
  res.end();
}));

router.get('/purchases', authenticate, asyncHandler(async (req, res) => {
  const { format, from, to } = req.query;
  let query = `
    SELECT pu.purchase_number, pu.created_at, pu.total_amount, pu.status,
           s.name as supplier_name
    FROM purchases pu
    LEFT JOIN suppliers s ON pu.supplier_id = s.id
    WHERE pu.business_id = ?
  `;
  const params = [req.user.businessId];
  if (from) { query += ' AND pu.created_at >= ?'; params.push(from); }
  if (to) { query += ' AND pu.created_at <= ?'; params.push(to); }
  query += ' ORDER BY pu.created_at DESC';

  const [purchases] = await pool.query(query, params);
  const data = purchases.map(p => ({
    'PO #': p.purchase_number,
    'Date': new Date(p.created_at).toLocaleString(),
    'Supplier': p.supplier_name || 'N/A',
    'Total': Number(p.total_amount),
    'Status': p.status,
  }));

  if (format === 'csv') {
    const parser = new Parser({ fields: Object.keys(data[0] || {}) });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=purchases_export.csv');
    return res.send(parser.parse(data));
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Purchases');
  if (data.length > 0) {
    ws.columns = Object.keys(data[0]).map(k => ({ header: k, key: k, width: 20 }));
    ws.addRows(data);
    ws.getRow(1).font = { bold: true };
  }
  setExcelHeaders(res, 'purchases_export.xlsx');
  await wb.xlsx.write(res);
  res.end();
}));

router.get('/profit-loss', authenticate, asyncHandler(async (req, res) => {
  const { format, from, to } = req.query;

  const salesParams = [req.user.businessId];
  if (from) salesParams.push(from);
  if (to) salesParams.push(to);

  const [sales] = await pool.query(`
    SELECT SUM(s.total_amount) as total_revenue, SUM(si.quantity * p.cost_price) as total_cogs
    FROM sales s
    JOIN sale_items si ON si.sale_id = s.id
    JOIN products p ON si.product_id = p.id
    WHERE s.business_id = ? AND s.status = 'completed'
    ${from ? 'AND s.created_at >= ?' : ''} ${to ? 'AND s.created_at <= ?' : ''}
  `, salesParams);

  const expenseParams = [req.user.businessId];
  if (from) expenseParams.push(from);
  if (to) expenseParams.push(to);

  const [expenses] = await pool.query(`
    SELECT category, SUM(amount) as total FROM expenses
    WHERE business_id = ?
    ${from ? 'AND expense_date >= ?' : ''} ${to ? 'AND expense_date <= ?' : ''}
    GROUP BY category
  `, expenseParams);

  const revenue = Number(sales[0]?.total_revenue || 0);
  const cogs = Number(sales[0]?.total_cogs || 0);
  const grossProfit = revenue - cogs;
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.total), 0);
  const netProfit = grossProfit - totalExpenses;

  const data = [
    { Category: 'Revenue', Amount: revenue },
    { Category: 'Cost of Goods Sold', Amount: -cogs },
    { Category: 'Gross Profit', Amount: grossProfit },
    { Category: '' },
    { Category: 'Operating Expenses' },
    ...expenses.map(e => ({ Category: `  ${e.category}`, Amount: Number(e.total) })),
    { Category: 'Total Expenses', Amount: totalExpenses },
    { Category: '' },
    { Category: 'Net Profit', Amount: netProfit },
  ];

  if (format === 'csv') {
    const parser = new Parser({ fields: ['Category', 'Amount'] });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=profit_loss.csv');
    return res.send(parser.parse(data));
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Profit & Loss');
  ws.columns = [{ header: 'Category', key: 'Category', width: 35 }, { header: 'Amount', key: 'Amount', width: 20 }];
  data.forEach(row => ws.addRow(row));
  ws.getRow(1).font = { bold: true };
  setExcelHeaders(res, 'profit_loss.xlsx');
  await wb.xlsx.write(res);
  res.end();
}));

export default router;
