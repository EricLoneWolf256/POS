-- Venderra POS Database Schema
CREATE DATABASE IF NOT EXISTS venderra_pos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE venderra_pos;

-- Subscription Plans
CREATE TABLE IF NOT EXISTS plans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name ENUM('starter', 'premium', 'enterprise') NOT NULL,
  price_ugx DECIMAL(12,2) NOT NULL,
  max_products INT DEFAULT NULL,
  max_users INT DEFAULT NULL,
  max_locations INT DEFAULT 1,
  features JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Businesses
CREATE TABLE IF NOT EXISTS businesses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100) DEFAULT 'Kampala',
  country VARCHAR(100) DEFAULT 'Uganda',
  currency VARCHAR(10) DEFAULT 'UGX',
  plan_id INT,
  logo_url VARCHAR(500),
  tax_rate DECIMAL(5,2) DEFAULT 18.00,
  trial_ends_at TIMESTAMP NULL,
  subscription_expires_at TIMESTAMP NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES plans(id)
);

-- Branches / Locations
CREATE TABLE IF NOT EXISTS branches (
  id INT PRIMARY KEY AUTO_INCREMENT,
  business_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  address TEXT,
  phone VARCHAR(50),
  is_main BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  INDEX idx_branches_business (business_id)
);
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  business_id INT NOT NULL,
  branch_id INT,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(50),
  role ENUM('super_admin', 'owner', 'admin', 'manager', 'cashier', 'field_sales', 'viewer') DEFAULT 'cashier',
  permissions JSON,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_email_business (email, business_id),
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  INDEX idx_users_email (email),
  INDEX idx_users_business_active (business_id, is_active),
  INDEX idx_users_branch (branch_id),
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  business_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_categories_business (business_id)
);
CREATE TABLE IF NOT EXISTS products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  business_id INT NOT NULL,
  category_id INT,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  barcode VARCHAR(100),
  description TEXT,
  cost_price DECIMAL(12,2) DEFAULT 0,
  selling_price DECIMAL(12,2) NOT NULL,
  unit VARCHAR(50) DEFAULT 'pcs',
  tax_rate DECIMAL(5,2),
  low_stock_threshold INT DEFAULT 10,
  track_stock BOOLEAN DEFAULT TRUE,
  has_variations BOOLEAN DEFAULT FALSE,
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_barcode (barcode),
  INDEX idx_sku (sku),
  INDEX idx_products_business_active (business_id, is_active),
  INDEX idx_products_category (category_id)
);

-- Product Variations (sizes, colors, packaging)
CREATE TABLE IF NOT EXISTS product_variations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  barcode VARCHAR(100),
  cost_price DECIMAL(12,2),
  selling_price DECIMAL(12,2) NOT NULL,
  attributes JSON,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_variations_product (product_id)
);
CREATE TABLE IF NOT EXISTS stock (
  id INT PRIMARY KEY AUTO_INCREMENT,
  branch_id INT NOT NULL,
  product_id INT NOT NULL,
  variation_id INT,
  quantity DECIMAL(12,3) DEFAULT 0,
  reserved_quantity DECIMAL(12,3) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_stock (branch_id, product_id, variation_id),
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (variation_id) REFERENCES product_variations(id) ON DELETE CASCADE,
  INDEX idx_stock_branch (branch_id)
);

-- Stock Movement History / Audit Trail
CREATE TABLE IF NOT EXISTS stock_movements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  business_id INT NOT NULL,
  branch_id INT NOT NULL,
  product_id INT NOT NULL,
  variation_id INT,
  movement_type ENUM('sale', 'purchase', 'adjustment', 'transfer_in', 'transfer_out', 'production_in', 'production_out', 'return', 'field_issue', 'field_return') NOT NULL,
  quantity DECIMAL(12,3) NOT NULL,
  reference_type VARCHAR(50),
  reference_id INT,
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_sm_business_branch (business_id, branch_id),
  INDEX idx_sm_product (product_id),
  INDEX idx_sm_date (created_at),
  INDEX idx_sm_created_by (created_by),
  INDEX idx_sm_business_product_date (business_id, product_id, created_at)
);

-- Stock Transfers between branches
CREATE TABLE IF NOT EXISTS stock_transfers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  business_id INT NOT NULL,
  from_branch_id INT NOT NULL,
  to_branch_id INT NOT NULL,
  status ENUM('pending', 'in_transit', 'completed', 'cancelled') DEFAULT 'pending',
  notes TEXT,
  created_by INT,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (from_branch_id) REFERENCES branches(id),
  FOREIGN KEY (to_branch_id) REFERENCES branches(id),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_transfers_business (business_id)
);

CREATE TABLE IF NOT EXISTS stock_transfer_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  transfer_id INT NOT NULL,
  product_id INT NOT NULL,
  variation_id INT,
  quantity DECIMAL(12,3) NOT NULL,
  FOREIGN KEY (transfer_id) REFERENCES stock_transfers(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_transfer_items_transfer (transfer_id)
);
CREATE TABLE IF NOT EXISTS suppliers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  business_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  balance DECIMAL(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  INDEX idx_suppliers_business (business_id)
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  business_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  credit_limit DECIMAL(12,2) DEFAULT 0,
  credit_balance DECIMAL(12,2) DEFAULT 0,
  loyalty_points INT DEFAULT 0,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  INDEX idx_cust_business (business_id),
  INDEX idx_cust_phone (phone)
);
CREATE TABLE IF NOT EXISTS sales (
  id INT PRIMARY KEY AUTO_INCREMENT,
  business_id INT NOT NULL,
  branch_id INT NOT NULL,
  sale_number VARCHAR(50) NOT NULL,
  customer_id INT,
  cashier_id INT NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  amount_paid DECIMAL(12,2) NOT NULL,
  change_amount DECIMAL(12,2) DEFAULT 0,
  payment_method ENUM('cash', 'mobile_money', 'card', 'bank_transfer', 'credit', 'mixed') DEFAULT 'cash',
  payment_details JSON,
  status ENUM('completed', 'pending', 'cancelled', 'refunded') DEFAULT 'completed',
  is_credit BOOLEAN DEFAULT FALSE,
  notes TEXT,
  synced_at TIMESTAMP NULL,
  offline_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (cashier_id) REFERENCES users(id),
  INDEX idx_sale_number (sale_number),
  INDEX idx_created_at (created_at),
  INDEX idx_business_date (business_id, created_at),
  INDEX idx_branch_date (branch_id, created_at),
  INDEX idx_sales_business_status (business_id, status),
  INDEX idx_sales_cashier (cashier_id),
  INDEX idx_sales_customer (customer_id),
  INDEX idx_sales_offline_id (offline_id),
  INDEX idx_sales_cashier_status_date (cashier_id, status, created_at)
);

CREATE TABLE IF NOT EXISTS sale_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sale_id INT NOT NULL,
  product_id INT NOT NULL,
  variation_id INT,
  product_name VARCHAR(255) NOT NULL,
  quantity DECIMAL(12,3) NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  discount DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_sale_items_sale (sale_id),
  INDEX idx_sale_items_product (product_id)
);
CREATE TABLE IF NOT EXISTS purchases (
  id INT PRIMARY KEY AUTO_INCREMENT,
  business_id INT NOT NULL,
  branch_id INT NOT NULL,
  purchase_number VARCHAR(50) NOT NULL,
  supplier_id INT,
  subtotal DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  amount_paid DECIMAL(12,2) DEFAULT 0,
  status ENUM('pending', 'received', 'cancelled') DEFAULT 'received',
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS purchase_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  purchase_id INT NOT NULL,
  product_id INT NOT NULL,
  variation_id INT,
  quantity DECIMAL(12,3) NOT NULL,
  unit_cost DECIMAL(12,2) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_purchase_items_purchase (purchase_id)
);
CREATE TABLE IF NOT EXISTS expenses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  business_id INT NOT NULL,
  branch_id INT,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  amount DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR(50),
  reference VARCHAR(100),
  created_by INT,
  expense_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_exp_business_date (business_id, expense_date),
  INDEX idx_expenses_business_category (business_id, category)
);

-- Quotations & Invoices (Premium+)
CREATE TABLE IF NOT EXISTS quotations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  business_id INT NOT NULL,
  branch_id INT NOT NULL,
  quote_number VARCHAR(50) NOT NULL,
  customer_id INT,
  subtotal DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  status ENUM('draft', 'sent', 'accepted', 'rejected', 'expired', 'converted') DEFAULT 'draft',
  valid_until DATE,
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_quotations_business (business_id, created_at)
);

CREATE TABLE IF NOT EXISTS quotation_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  quotation_id INT NOT NULL,
  product_id INT,
  description VARCHAR(255) NOT NULL,
  quantity DECIMAL(12,3) NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
  INDEX idx_quotation_items_quotation (quotation_id)
);

-- Manufacturing Module (Enterprise)
CREATE TABLE IF NOT EXISTS raw_materials (
  id INT PRIMARY KEY AUTO_INCREMENT,
  business_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  unit VARCHAR(50) DEFAULT 'kg',
  cost_per_unit DECIMAL(12,2) DEFAULT 0,
  low_stock_threshold INT DEFAULT 10,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  INDEX idx_materials_business (business_id)
);

CREATE TABLE IF NOT EXISTS raw_material_stock (
  id INT PRIMARY KEY AUTO_INCREMENT,
  branch_id INT NOT NULL,
  material_id INT NOT NULL,
  quantity DECIMAL(12,3) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_material_stock (branch_id, material_id),
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
  FOREIGN KEY (material_id) REFERENCES raw_materials(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bill_of_materials (
  id INT PRIMARY KEY AUTO_INCREMENT,
  business_id INT NOT NULL,
  product_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  output_quantity DECIMAL(12,3) DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_bom_business (business_id)
);

CREATE TABLE IF NOT EXISTS bom_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  bom_id INT NOT NULL,
  material_id INT NOT NULL,
  quantity DECIMAL(12,3) NOT NULL,
  FOREIGN KEY (bom_id) REFERENCES bill_of_materials(id) ON DELETE CASCADE,
  FOREIGN KEY (material_id) REFERENCES raw_materials(id) ON DELETE CASCADE,
  INDEX idx_bom_items_bom (bom_id)
);

CREATE TABLE IF NOT EXISTS production_orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  business_id INT NOT NULL,
  branch_id INT NOT NULL,
  order_number VARCHAR(50) NOT NULL,
  bom_id INT NOT NULL,
  quantity DECIMAL(12,3) NOT NULL,
  total_cost DECIMAL(12,2) DEFAULT 0,
  status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
  created_by INT,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (bom_id) REFERENCES bill_of_materials(id),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_prod_orders_business (business_id)
);
CREATE TABLE IF NOT EXISTS field_sales_trips (
  id INT PRIMARY KEY AUTO_INCREMENT,
  business_id INT NOT NULL,
  salesperson_id INT NOT NULL,
  branch_id INT NOT NULL,
  trip_date DATE NOT NULL,
  status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
  total_sales DECIMAL(12,2) DEFAULT 0,
  total_expenses DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (salesperson_id) REFERENCES users(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  INDEX idx_trips_business (business_id)
);

CREATE TABLE IF NOT EXISTS field_stock_issues (
  id INT PRIMARY KEY AUTO_INCREMENT,
  trip_id INT NOT NULL,
  product_id INT NOT NULL,
  variation_id INT,
  quantity_issued DECIMAL(12,3) NOT NULL,
  quantity_returned DECIMAL(12,3) DEFAULT 0,
  quantity_sold DECIMAL(12,3) DEFAULT 0,
  FOREIGN KEY (trip_id) REFERENCES field_sales_trips(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_field_issues_trip (trip_id)
);

CREATE TABLE IF NOT EXISTS field_expenses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  trip_id INT NOT NULL,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trip_id) REFERENCES field_sales_trips(id) ON DELETE CASCADE,
  INDEX idx_field_expenses_trip (trip_id)
);
CREATE TABLE IF NOT EXISTS sync_queue (
  id INT PRIMARY KEY AUTO_INCREMENT,
  business_id INT NOT NULL,
  branch_id INT,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  action ENUM('create', 'update', 'delete') NOT NULL,
  payload JSON NOT NULL,
  status ENUM('pending', 'synced', 'failed') DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP NULL,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  INDEX idx_sync_business_status (business_id, status)
);
CREATE TABLE IF NOT EXISTS stock_alerts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  business_id INT NOT NULL,
  branch_id INT NOT NULL,
  product_id INT,
  material_id INT,
  alert_type ENUM('low_stock', 'out_of_stock') NOT NULL,
  current_quantity DECIMAL(12,3),
  threshold DECIMAL(12,3),
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
  INDEX idx_alerts_business_resolved (business_id, is_resolved)
);
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  business_id INT NOT NULL,
  type ENUM('sms', 'email', 'whatsapp') NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(255),
  message TEXT NOT NULL,
  status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  INDEX idx_notifications_business_status (business_id, status)
);
CREATE TABLE IF NOT EXISTS password_resets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token)
);

-- Payment Records
CREATE TABLE IF NOT EXISTS payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  business_id INT NOT NULL,
  plan_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'UGX',
  tx_ref VARCHAR(255) UNIQUE,
  flw_id VARCHAR(255),
  status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES plans(id),
  INDEX idx_payments_business_created (business_id, created_at)
);
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  business_id INT NOT NULL,
  user_id INT,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INT,
  details JSON,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_created (created_at)
);
