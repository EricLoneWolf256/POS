/**
 * Migration: Add super_admin role + create the platform owner account
 *
 * Run once on any existing database:
 *   node src/database/migrate.js
 *
 * The super-admin credentials are read from env vars:
 *   SUPER_ADMIN_EMAIL    (default: superadmin@venderra.ug)
 *   SUPER_ADMIN_PASSWORD (default: changeme123 — CHANGE THIS IMMEDIATELY)
 */

import bcrypt from 'bcryptjs';
import pool from '../config/database.js';
import dotenv from 'dotenv';
dotenv.config();

async function migrate() {
  const conn = await pool.getConnection();
  console.log('Running Venderra migrations...');

  try {
    await conn.beginTransaction();

    // 1. Extend the users.role ENUM to include super_admin
    await conn.query(`
      ALTER TABLE users
      MODIFY COLUMN role ENUM('super_admin','owner','admin','manager','cashier','field_sales','viewer')
      DEFAULT 'cashier'
    `);
    console.log('✓ users.role ENUM updated with super_admin');

    // 2. Ensure businesses table has both trial and subscription columns
    const [bizCols] = await conn.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'businesses'
    `);
    const colNames = bizCols.map(c => c.COLUMN_NAME);

    if (!colNames.includes('trial_ends_at')) {
      await conn.query(`ALTER TABLE businesses ADD COLUMN trial_ends_at TIMESTAMP NULL AFTER plan_id`);
      console.log('✓ businesses.trial_ends_at added');
    }
    if (!colNames.includes('subscription_expires_at')) {
      await conn.query(`ALTER TABLE businesses ADD COLUMN subscription_expires_at TIMESTAMP NULL AFTER trial_ends_at`);
      console.log('✓ businesses.subscription_expires_at added');
    }

    // 3. Create or update the super-admin system business (id=0 trick won't work with FK,
    //    so we use a dedicated "Venderra Platform" business that is_active=TRUE always)
    const [existingSA] = await conn.query(
      `SELECT id FROM users WHERE role = 'super_admin' LIMIT 1`
    );

    if (existingSA.length > 0) {
      console.log('✓ Super-admin user already exists — skipping creation');
    } else {
      // Create a platform business to house the super-admin user
      let platformBizId;
      const [existingPlatform] = await conn.query(
        `SELECT id FROM businesses WHERE slug = 'venderra-platform' LIMIT 1`
      );

      if (existingPlatform.length > 0) {
        platformBizId = existingPlatform[0].id;
      } else {
        const [planRows] = await conn.query(`SELECT id FROM plans ORDER BY id DESC LIMIT 1`);
        const topPlanId = planRows[0]?.id || 3;

        const [bizResult] = await conn.query(`
          INSERT INTO businesses (name, slug, email, plan_id, is_active, subscription_expires_at)
          VALUES ('Venderra Platform', 'venderra-platform', 'platform@venderra.ug', ?, TRUE, DATE_ADD(NOW(), INTERVAL 100 YEAR))
        `, [topPlanId]);
        platformBizId = bizResult.insertId;

        await conn.query(`
          INSERT INTO branches (business_id, name, is_main) VALUES (?, 'Platform HQ', TRUE)
        `, [platformBizId]);
      }

      const [branchRows] = await conn.query(
        `SELECT id FROM branches WHERE business_id = ? LIMIT 1`, [platformBizId]
      );
      const platformBranchId = branchRows[0].id;

      const saEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@venderra.ug';
      const saPassword = process.env.SUPER_ADMIN_PASSWORD || 'changeme123';
      const hash = await bcrypt.hash(saPassword, 12);

      await conn.query(`
        INSERT INTO users (business_id, branch_id, email, password_hash, first_name, last_name, role)
        VALUES (?, ?, ?, ?, 'Super', 'Admin', 'super_admin')
      `, [platformBizId, platformBranchId, saEmail, hash]);

      console.log(`✓ Super-admin created: ${saEmail} / ${saPassword}`);
      if (saPassword === 'changeme123') {
        console.warn('⚠  WARNING: Using default password. Set SUPER_ADMIN_PASSWORD in .env and re-run migration!');
      }
    }

    await conn.commit();
    console.log('\n✅  All migrations completed successfully.');
  } catch (err) {
    await conn.rollback();
    console.error('Migration failed:', err.message);
    throw err;
  } finally {
    conn.release();
    process.exit(0);
  }
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
