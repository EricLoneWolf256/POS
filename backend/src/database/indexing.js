import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: true,
});

const indexes = [
  // ─── CRITICAL: Login & Auth ───
  // Auth login queries: WHERE u.email = ? (without business_id)
  // Also speeds up password reset lookups by email
  { table: 'users', name: 'idx_users_email', columns: '(email)', label: 'users: email lookup for login' },

  // ─── HIGH: Multi-tenant data isolation ───
  // Almost every query filters by business_id — this is the #1 bottleneck
  { table: 'users', name: 'idx_users_business_active', columns: '(business_id, is_active)', label: 'users: list by business' },
  { table: 'users', name: 'idx_users_branch', columns: '(branch_id)', label: 'users: filter by branch' },
  { table: 'products', name: 'idx_products_business_active', columns: '(business_id, is_active)', label: 'products: list by business' },
  { table: 'products', name: 'idx_products_category', columns: '(category_id)', label: 'products: filter by category' },
  { table: 'categories', name: 'idx_categories_business', columns: '(business_id)', label: 'categories: list by business' },
  { table: 'branches', name: 'idx_branches_business', columns: '(business_id)', label: 'branches: list by business' },
  { table: 'suppliers', name: 'idx_suppliers_business', columns: '(business_id)', label: 'suppliers: list by business' },
  { table: 'quotations', name: 'idx_quotations_business', columns: '(business_id, created_at)', label: 'quotations: list by business' },
  { table: 'raw_materials', name: 'idx_materials_business', columns: '(business_id)', label: 'raw_materials: list by business' },
  { table: 'bill_of_materials', name: 'idx_bom_business', columns: '(business_id)', label: 'BOMs: list by business' },
  { table: 'production_orders', name: 'idx_prod_orders_business', columns: '(business_id)', label: 'production_orders: list by business' },
  { table: 'field_sales_trips', name: 'idx_trips_business', columns: '(business_id)', label: 'field_sales_trips: list by business' },
  { table: 'stock_alerts', name: 'idx_alerts_business_resolved', columns: '(business_id, is_resolved)', label: 'stock_alerts: filter by resolution status' },
  { table: 'notifications', name: 'idx_notifications_business_status', columns: '(business_id, status)', label: 'notifications: filter by status' },

  // ─── HIGH: Sales queries ───
  // Dashboard, reports, employee performance all filter by status
  { table: 'sales', name: 'idx_sales_business_status', columns: '(business_id, status)', label: 'sales: filter by business + status' },
  // Employee performance: WHERE s.cashier_id = ? AND s.business_id = ?
  { table: 'sales', name: 'idx_sales_cashier', columns: '(cashier_id)', label: 'sales: employee performance queries' },
  // Customer purchase history: WHERE s.customer_id = ?
  { table: 'sales', name: 'idx_sales_customer', columns: '(customer_id)', label: 'sales: customer purchase history' },
  // Offline sync duplicate check: WHERE offline_id = ?
  { table: 'sales', name: 'idx_sales_offline_id', columns: '(offline_id)', label: 'sales: offline sync dedup' },

  // ─── HIGH: Child table lookups (no FK indexes) ───
  // sale_items: WHERE sale_id = ? (called on EVERY sale detail view, receipt, report)
  { table: 'sale_items', name: 'idx_sale_items_sale', columns: '(sale_id)', label: 'sale_items: items per sale' },
  // sale_items: JOINed in reports by product_id
  { table: 'sale_items', name: 'idx_sale_items_product', columns: '(product_id)', label: 'sale_items: product-based reports' },
  // purchase_items: WHERE purchase_id = ?
  { table: 'purchase_items', name: 'idx_purchase_items_purchase', columns: '(purchase_id)', label: 'purchase_items: items per purchase' },
  // quotation_items: WHERE quotation_id = ?
  { table: 'quotation_items', name: 'idx_quotation_items_quotation', columns: '(quotation_id)', label: 'quotation_items: items per quotation' },
  // product_variations: WHERE product_id = ? AND is_active = TRUE
  { table: 'product_variations', name: 'idx_variations_product', columns: '(product_id)', label: 'product_variations: variations per product' },
  // bom_items: WHERE bom_id = ?
  { table: 'bom_items', name: 'idx_bom_items_bom', columns: '(bom_id)', label: 'bom_items: items per BOM' },
  // stock_transfer_items: WHERE transfer_id = ?
  { table: 'stock_transfer_items', name: 'idx_transfer_items_transfer', columns: '(transfer_id)', label: 'stock_transfer_items: items per transfer' },
  // field_stock_issues: WHERE trip_id = ?
  { table: 'field_stock_issues', name: 'idx_field_issues_trip', columns: '(trip_id)', label: 'field_stock_issues: items per trip' },
  // field_expenses: WHERE trip_id = ?
  { table: 'field_expenses', name: 'idx_field_expenses_trip', columns: '(trip_id)', label: 'field_expenses: expenses per trip' },

  // ─── HIGH: Stock & Movements ───
  // Employee activity: WHERE sm.created_by = ? AND sm.business_id = ?
  { table: 'stock_movements', name: 'idx_sm_created_by', columns: '(created_by)', label: 'stock_movements: employee activity feed' },
  // Composite for the most common stock_movements query pattern
  { table: 'stock_movements', name: 'idx_sm_business_product_date', columns: '(business_id, product_id, created_at)', label: 'stock_movements: product history with date' },

  // ─── MEDIUM: Reports & Analytics ───
  // Staff performance JOIN: LEFT JOIN sales s ON s.cashier_id = u.id AND s.status = 'completed'
  { table: 'sales', name: 'idx_sales_cashier_status_date', columns: '(cashier_id, status, created_at)', label: 'sales: cashier performance with date range' },
  // P&L export: JOIN sale_items si ON si.sale_id = s.id — covered by idx_sale_items_sale
  // Expenses by category for P&L: WHERE business_id = ? GROUP BY category
  { table: 'expenses', name: 'idx_expenses_business_category', columns: '(business_id, category)', label: 'expenses: P&L category grouping' },

  // ─── MEDIUM: Employee Attendance ───
  // Today's attendance: WHERE business_id = ? AND DATE(clock_in) = CURDATE()
  { table: 'employee_attendance', name: 'idx_attendance_business_clockin', columns: '(business_id, clock_in)', label: 'attendance: daily lookup' },
  // Active clock check: WHERE user_id = ? AND clock_out IS NULL
  { table: 'employee_attendance', name: 'idx_attendance_active', columns: '(user_id, clock_out)', label: 'attendance: active clock-in check' },

  // ─── MEDIUM: Payments ───
  // Payment history: WHERE business_id = ? ORDER BY created_at DESC
  { table: 'payments', name: 'idx_payments_business_created', columns: '(business_id, created_at)', label: 'payments: history lookup' },

  // ─── LOW: Sync queue ───
  // Pending sync: WHERE business_id = ? AND status = ? ORDER BY created_at
  { table: 'sync_queue', name: 'idx_sync_business_status', columns: '(business_id, status)', label: 'sync_queue: pending items lookup' },

  // ─── LOW: Stock transfers ───
  { table: 'stock_transfers', name: 'idx_transfers_business', columns: '(business_id)', label: 'stock_transfers: list by business' },
];

let created = 0;
let skipped = 0;

for (const idx of indexes) {
  try {
    await conn.query(`CREATE INDEX ${idx.name} ON ${idx.table} ${idx.columns}`);
    console.log(`  + ${idx.label}`);
    created++;
  } catch (e) {
    if (e.message.includes('Duplicate key name') || e.message.includes('already exists')) {
      skipped++;
    } else {
      console.error(`  ! ${idx.label}: ${e.message}`);
    }
  }
}

await conn.end();
console.log(`\nIndexing complete: ${created} created, ${skipped} already existed, ${indexes.length} total.`);
