import bcrypt from 'bcryptjs';
import pool from '../config/database.js';
import dotenv from 'dotenv';
dotenv.config();

async function resetAdmin() {
  const conn = await pool.getConnection();
  try {
    // Check what businesses exist
    const [businesses] = await conn.query('SELECT id, name, slug FROM businesses');
    console.log('\nBusinesses found:');
    console.table(businesses);

    if (businesses.length === 0) {
      // No business at all — create one from scratch
      const [planRows] = await conn.query('SELECT id FROM plans ORDER BY id DESC LIMIT 1');
      const planId = planRows[0]?.id || 3;

      const [bizResult] = await conn.query(`
        INSERT INTO businesses (name, slug, email, plan_id, currency, city)
        VALUES ('My Business', 'my-business', 'admin@mybusiness.com', ?, 'UGX', 'Kampala')
      `, [planId]);

      const [branchResult] = await conn.query(`
        INSERT INTO branches (business_id, name, code, is_main)
        VALUES (?, 'Main Branch', 'MAIN-01', TRUE)
      `, [bizResult.insertId]);

      const hash = await bcrypt.hash('admin123', 10);
      await conn.query(`
        INSERT INTO users (business_id, branch_id, email, password_hash, first_name, last_name, role)
        VALUES (?, ?, 'admin@mybusiness.com', ?, 'Admin', 'User', 'owner')
      `, [bizResult.insertId, branchResult.insertId, hash]);

      console.log('\n✓ Fresh business and admin created.');
    } else {
      // Business exists — just reset or create the owner user
      const bizId = businesses[0].id;

      const [branchRows] = await conn.query(
        'SELECT id FROM branches WHERE business_id = ? AND is_main = TRUE LIMIT 1', [bizId]
      );
      let branchId = branchRows[0]?.id;

      if (!branchId) {
        const [br] = await conn.query(
          'SELECT id FROM branches WHERE business_id = ? LIMIT 1', [bizId]
        );
        branchId = br[0]?.id;
      }

      if (!branchId) {
        const [newBranch] = await conn.query(
          'INSERT INTO branches (business_id, name, code, is_main) VALUES (?, ?, ?, TRUE)',
          [bizId, 'Main Branch', 'MAIN-01']
        );
        branchId = newBranch.insertId;
      }

      const hash = await bcrypt.hash('admin123', 10);

      // Check if owner already exists
      const [existing] = await conn.query(
        'SELECT id FROM users WHERE business_id = ? AND role = "owner" LIMIT 1', [bizId]
      );

      if (existing.length > 0) {
        await conn.query(
          'UPDATE users SET password_hash = ?, email = ?, is_active = TRUE WHERE id = ?',
          [hash, 'admin@mybusiness.com', existing[0].id]
        );
        console.log('\n✓ Owner password reset successfully.');
      } else {
        await conn.query(`
          INSERT INTO users (business_id, branch_id, email, password_hash, first_name, last_name, role)
          VALUES (?, ?, 'admin@mybusiness.com', ?, 'Admin', 'User', 'owner')
        `, [bizId, branchId, hash]);
        console.log('\n✓ Owner account created.');
      }
    }

    console.log('\n  Email:    admin@mybusiness.com');
    console.log('  Password: admin123');
    console.log('\n  Change your password in Settings after login.\n');
  } catch (err) {
    console.error('Failed:', err.message);
  } finally {
    conn.release();
    process.exit(0);
  }
}

resetAdmin();
