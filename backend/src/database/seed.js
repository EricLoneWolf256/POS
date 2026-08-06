import bcrypt from 'bcryptjs';
import pool from '../config/database.js';

async function seed() {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // Always ensure plans exist — these are system-level records, not demo data
    await conn.query(`
      INSERT IGNORE INTO plans (id, name, price_ugx, max_products, max_users, max_locations, features) VALUES
      (1, 'starter',    1200000, 500,  3,    1,    '{"pos":true,"stock":true,"purchases":true,"expenses":true,"reports":true,"offline":true,"whatsapp":true}'),
      (2, 'premium',    1800000, NULL, NULL, 1,    '{"pos":true,"stock":true,"quotations":true,"barcodes":true,"sms":true,"multi_currency":true,"accounting":true,"staff_reports":true}'),
      (3, 'enterprise', 2500000, NULL, NULL, NULL, '{"manufacturing":true,"field_sales":true,"multi_branch":true,"priority_support":true}')
    `);

    // Skip business/user creation if already set up
    const [existing] = await conn.query('SELECT id FROM businesses LIMIT 1');
    if (existing.length > 0) {
      console.log('✓ Business already exists, skipping');
      await conn.commit();
      return;
    }

    // Create a clean business — owner should update these details in Settings
    const [bizResult] = await conn.query(`
      INSERT INTO businesses (name, slug, email, phone, address, city, plan_id, currency)
      VALUES ('My Business', 'my-business', 'admin@mybusiness.com', '', '', 'Kampala', 3, 'UGX')
    `);
    const businessId = bizResult.insertId;

    // Create the main branch
    const [branchResult] = await conn.query(`
      INSERT INTO branches (business_id, name, code, address, is_main)
      VALUES (?, 'Main Branch', 'MAIN-01', '', TRUE)
    `, [businessId]);
    const mainBranchId = branchResult.insertId;

    // Create the owner account
    const passwordHash = await bcrypt.hash('admin123', 10);
    await conn.query(`
      INSERT INTO users (business_id, branch_id, email, password_hash, first_name, last_name, role)
      VALUES (?, ?, 'admin@mybusiness.com', ?, 'Admin', 'User', 'owner')
    `, [businessId, mainBranchId, passwordHash]);

    await conn.commit();
    console.log('✓ Initial setup complete — no demo data added');
    console.log('  Login: admin@mybusiness.com / admin123');
    console.log('  Please update your business details and password in Settings after first login.');
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
