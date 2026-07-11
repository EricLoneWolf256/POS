import bcrypt from 'bcryptjs';
import pool from '../config/database.js';

async function seed() {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    await conn.query(`
      INSERT IGNORE INTO plans (id, name, price_ugx, max_products, max_users, max_locations, features) VALUES
      (1, 'starter', 1200000, 500, 3, 1, '{"pos":true,"stock":true,"purchases":true,"expenses":true,"reports":true,"offline":true,"whatsapp":true}'),
      (2, 'premium', 1800000, NULL, NULL, 1, '{"pos":true,"stock":true,"quotations":true,"barcodes":true,"sms":true,"multi_currency":true,"accounting":true,"staff_reports":true}'),
      (3, 'enterprise', 2500000, NULL, NULL, NULL, '{"manufacturing":true,"field_sales":true,"multi_branch":true,"priority_support":true}')
    `);

    const [existing] = await conn.query('SELECT id FROM businesses LIMIT 1');
    if (existing.length > 0) {
      console.log('✓ Seed data already exists, skipping');
      await conn.commit();
      return;
    }

    const [bizResult] = await conn.query(`
      INSERT INTO businesses (name, slug, email, phone, address, city, plan_id, currency)
      VALUES ('Venderra Demo Store', 'venderra-demo', 'demo@venderra.ug', '+256700000000', 'Plot 15, Kampala Road', 'Kampala', 3, 'UGX')
    `);
    const businessId = bizResult.insertId;

    const [branchResult] = await conn.query(`
      INSERT INTO branches (business_id, name, code, address, is_main) VALUES
      (?, 'Main Store - Kampala', 'KLA-01', 'Plot 15, Kampala Road', TRUE),
      (?, 'Entebbe Branch', 'ENT-01', 'Airport Road, Entebbe', FALSE),
      (?, 'Jinja Branch', 'JIN-01', 'Main Street, Jinja', FALSE)
    `, [businessId, businessId, businessId]);
    const mainBranchId = branchResult.insertId;

    const passwordHash = await bcrypt.hash('admin123', 10);
    await conn.query(`
      INSERT INTO users (business_id, branch_id, email, password_hash, first_name, last_name, phone, role) VALUES
      (?, ?, 'admin@venderra.ug', ?, 'Admin', 'User', '+256700000001', 'owner'),
      (?, ?, 'manager@venderra.ug', ?, 'Sarah', 'Nakato', '+256700000002', 'manager'),
      (?, ?, 'cashier@venderra.ug', ?, 'John', 'Okello', '+256700000003', 'cashier')
    `, [businessId, mainBranchId, passwordHash, businessId, mainBranchId, passwordHash, businessId, mainBranchId, passwordHash]);

    const categories = [
      ['Groceries', 'Food and grocery items'],
      ['Beverages', 'Drinks and beverages'],
      ['Electronics', 'Electronic devices and accessories'],
      ['Pharmacy', 'Medical and health products'],
      ['Fashion', 'Clothing and accessories'],
    ];

    for (const [name, desc] of categories) {
      await conn.query(
        'INSERT INTO categories (business_id, name, description) VALUES (?, ?, ?)',
        [businessId, name, desc]
      );
    }

    const [cats] = await conn.query('SELECT id, name FROM categories WHERE business_id = ?', [businessId]);
    const catMap = Object.fromEntries(cats.map(c => [c.name, c.id]));

    const products = [
      ['Rice 5kg', 'RICE-5KG', '8901234567890', catMap['Groceries'], 15000, 22000, 20],
      ['Sugar 2kg', 'SUGAR-2KG', '8901234567891', catMap['Groceries'], 5000, 7500, 30],
      ['Cooking Oil 1L', 'OIL-1L', '8901234567892', catMap['Groceries'], 8000, 12000, 25],
      ['Coca Cola 500ml', 'COKE-500', '8901234567893', catMap['Beverages'], 1500, 2500, 50],
      ['Mineral Water 1.5L', 'WATER-1.5', '8901234567894', catMap['Beverages'], 800, 1500, 40],
      ['Panadol Extra', 'PAN-EXT', '8901234567895', catMap['Pharmacy'], 2000, 3500, 15],
      ['USB Cable Type-C', 'USB-C', '8901234567896', catMap['Electronics'], 5000, 12000, 10],
      ['T-Shirt Cotton', 'TSHIRT-M', null, catMap['Fashion'], 15000, 35000, 5],
    ];

    const [branches] = await conn.query('SELECT id FROM branches WHERE business_id = ?', [businessId]);

    for (const [name, sku, barcode, catId, cost, price, stock] of products) {
      const [prodResult] = await conn.query(`
        INSERT INTO products (business_id, category_id, name, sku, barcode, cost_price, selling_price, low_stock_threshold)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [businessId, catId, name, sku, barcode, cost, price, 10]);

      for (const branch of branches) {
        await conn.query(`
          INSERT INTO stock (branch_id, product_id, quantity) VALUES (?, ?, ?)
        `, [branch.id, prodResult.insertId, stock + Math.floor(Math.random() * 20)]);
      }
    }

    await conn.query(`
      INSERT INTO suppliers (business_id, name, contact_person, phone) VALUES
      (?, 'Uganda Foods Ltd', 'Peter Ssemakula', '+256700100001'),
      (?, 'Kampala Electronics', 'Mary Namuli', '+256700100002')
    `, [businessId, businessId]);

    await conn.query(`
      INSERT INTO customers (business_id, name, phone, email, credit_limit) VALUES
      (?, 'Grace Wanjala', '+256700200001', 'grace@email.com', 500000),
      (?, 'David Mukasa', '+256700200002', 'david@email.com', 300000),
      (?, 'Walk-in Customer', NULL, NULL, 0)
    `, [businessId, businessId, businessId]);

    await conn.commit();
    console.log('✓ Seed data created successfully');
    console.log('  Login: admin@venderra.ug / admin123');
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
    process.exit(0);
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
