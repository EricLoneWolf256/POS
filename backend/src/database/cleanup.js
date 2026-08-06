/**
 * Cleanup Script — removes demo/dummy seed data only.
 * Plans table is preserved (system records).
 * Run: node src/database/cleanup.js
 */

import pool from '../config/database.js';
import dotenv from 'dotenv';
dotenv.config();

async function cleanup() {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // Find the demo business by its known slug
    const [biz] = await conn.query(
      `SELECT id FROM businesses WHERE slug = 'venderra-demo' LIMIT 1`
    );

    if (biz.length === 0) {
      console.log('ℹ  No demo business found — nothing to clean up.');
      await conn.commit();
      return;
    }

    const bizId = biz[0].id;
    console.log(`Found demo business id=${bizId}. Removing all associated data...`);

    // Disable FK checks so we can delete in any order
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');

    // 1. Sales-related
    await conn.query(`DELETE si FROM sale_items si JOIN sales s ON si.sale_id = s.id WHERE s.business_id = ?`, [bizId]);
    await conn.query(`DELETE FROM sales WHERE business_id = ?`, [bizId]);

    // 2. Purchases-related
    await conn.query(`DELETE pi FROM purchase_items pi JOIN purchases p ON pi.purchase_id = p.id WHERE p.business_id = ?`, [bizId]);
    await conn.query(`DELETE FROM purchases WHERE business_id = ?`, [bizId]);

    // 3. Quotations
    await conn.query(`DELETE qi FROM quotation_items qi JOIN quotations q ON qi.quotation_id = q.id WHERE q.business_id = ?`, [bizId]);
    await conn.query(`DELETE FROM quotations WHERE business_id = ?`, [bizId]);

    // 4. Stock & movements
    await conn.query(`DELETE sm FROM stock_movements sm WHERE sm.business_id = ?`, [bizId]);
    await conn.query(`DELETE s FROM stock s JOIN products p ON s.product_id = p.id WHERE p.business_id = ?`, [bizId]);

    // 5. Stock transfers
    await conn.query(`
      DELETE sti FROM stock_transfer_items sti
      JOIN stock_transfers st ON sti.transfer_id = st.id
      WHERE st.business_id = ?
    `, [bizId]);
    await conn.query(`DELETE FROM stock_transfers WHERE business_id = ?`, [bizId]);

    // 6. Products & categories
    await conn.query(`DELETE FROM products WHERE business_id = ?`, [bizId]);
    await conn.query(`DELETE FROM categories WHERE business_id = ?`, [bizId]);

    // 7. Suppliers & customers
    await conn.query(`DELETE FROM suppliers WHERE business_id = ?`, [bizId]);
    await conn.query(`DELETE FROM customers WHERE business_id = ?`, [bizId]);

    // 8. Expenses
    await conn.query(`DELETE FROM expenses WHERE business_id = ?`, [bizId]);

    // 9. Manufacturing
    await conn.query(`DELETE FROM production_orders WHERE business_id = ?`, [bizId]);
    await conn.query(`DELETE FROM bill_of_materials WHERE business_id = ?`, [bizId]);
    await conn.query(`DELETE rms FROM raw_material_stock rms JOIN raw_materials rm ON rms.material_id = rm.id WHERE rm.business_id = ?`, [bizId]);
    await conn.query(`DELETE FROM raw_materials WHERE business_id = ?`, [bizId]);

    // 10. Field sales
    await conn.query(`
      DELETE fe FROM field_expenses fe
      JOIN field_sales_trips ft ON fe.trip_id = ft.id
      WHERE ft.business_id = ?
    `, [bizId]);
    await conn.query(`
      DELETE fsi FROM field_stock_issues fsi
      JOIN field_sales_trips ft ON fsi.trip_id = ft.id
      WHERE ft.business_id = ?
    `, [bizId]);
    await conn.query(`DELETE FROM field_sales_trips WHERE business_id = ?`, [bizId]);

    // 11. Notifications, alerts, sync queue, audit logs
    await conn.query(`DELETE FROM notifications WHERE business_id = ?`, [bizId]);
    await conn.query(`DELETE FROM stock_alerts WHERE business_id = ?`, [bizId]);
    await conn.query(`DELETE FROM sync_queue WHERE business_id = ?`, [bizId]);
    await conn.query(`DELETE FROM audit_logs WHERE business_id = ?`, [bizId]);

    // 12. Password resets for users of this business
    await conn.query(`
      DELETE pr FROM password_resets pr
      JOIN users u ON pr.user_id = u.id
      WHERE u.business_id = ?
    `, [bizId]);

    // 13. Users (demo staff)
    await conn.query(`DELETE FROM users WHERE business_id = ?`, [bizId]);

    // 14. Branches
    await conn.query(`DELETE FROM branches WHERE business_id = ?`, [bizId]);

    // 15. The business itself
    await conn.query(`DELETE FROM businesses WHERE id = ?`, [bizId]);

    // Re-enable FK checks
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    await conn.commit();
    console.log('✓ All demo data removed successfully.');
    console.log('  The database is now clean. Run db:seed to create your real business account.');
  } catch (err) {
    await conn.rollback();
    await conn.query('SET FOREIGN_KEY_CHECKS = 1').catch(() => {});
    console.error('Cleanup failed:', err.message);
    throw err;
  } finally {
    conn.release();
    process.exit(0);
  }
}

cleanup().catch((err) => {
  console.error(err);
  process.exit(1);
});
