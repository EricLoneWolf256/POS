import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler, generateSaleNumber } from '../utils/helpers.js';

const router = express.Router();

router.get('/pending', authenticate, asyncHandler(async (req, res) => {
  const [items] = await pool.query(
    'SELECT * FROM sync_queue WHERE business_id = ? AND status = ? ORDER BY created_at',
    [req.user.businessId, 'pending']
  );
  res.json(items);
}));

router.post('/push', authenticate, asyncHandler(async (req, res) => {
  const { items } = req.body;
  const results = [];

  for (const item of items) {
    try {
      if (item.entityType === 'sale') {
        const existing = await pool.query(
          'SELECT id FROM sales WHERE offline_id = ? AND business_id = ?',
          [item.entityId, req.user.businessId]
        );
        if (existing[0].length === 0) {
          await pool.query(
            'INSERT INTO sync_queue (business_id, branch_id, entity_type, entity_id, action, payload) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.businessId, req.user.branchId, item.entityType, item.entityId, item.action, JSON.stringify(item.payload)]
          );
        }
      }
      results.push({ entityId: item.entityId, status: 'queued' });
    } catch (err) {
      results.push({ entityId: item.entityId, status: 'failed', error: err.message });
    }
  }

  res.json({ results });
}));

router.post('/process', authenticate, asyncHandler(async (req, res) => {
  const [pending] = await pool.query(
    'SELECT * FROM sync_queue WHERE business_id = ? AND status = ? LIMIT 50',
    [req.user.businessId, 'pending']
  );

  let syncedCount = 0;
  let failedCount = 0;

  for (const item of pending) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      if (item.entity_type === 'sale') {
        const sale = typeof item.payload === 'string' ? JSON.parse(item.payload) : item.payload;
        const {
          items,
          customerId,
          paymentMethod,
          amountPaid,
          discountAmount = 0,
          notes,
          isCredit,
          paymentDetails,
        } = sale;

        const saleDate = sale.createdAt || sale.created_at || item.created_at;
        const saleBranchId = item.branch_id || req.user.branchId;

        const [existing] = await conn.query(
          'SELECT id FROM sales WHERE offline_id = ? AND business_id = ?',
          [item.entity_id, item.business_id]
        );

        if (existing.length === 0) {
          let subtotal = 0;
          let taxAmount = 0;

          for (const saleItem of items) {
            const lineTotal = (saleItem.unitPrice * saleItem.quantity) - (saleItem.discount || 0);
            subtotal += lineTotal;
            taxAmount += saleItem.taxAmount || 0;
          }

          const totalAmount = subtotal + taxAmount - discountAmount;
          const changeAmount = Math.max(0, (amountPaid || totalAmount) - totalAmount);
          const saleNumber = generateSaleNumber();

          const [saleResult] = await conn.query(`
            INSERT INTO sales (business_id, branch_id, sale_number, customer_id, cashier_id, subtotal, tax_amount,
              discount_amount, total_amount, amount_paid, change_amount, payment_method, payment_details,
              is_credit, notes, offline_id, synced_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
          `, [
            item.business_id, saleBranchId, saleNumber, customerId || null, req.user.id,
            subtotal, taxAmount, discountAmount, totalAmount, amountPaid || totalAmount,
            changeAmount, paymentMethod || 'cash', JSON.stringify(paymentDetails || {}),
            isCredit || false, notes || null, item.entity_id, saleDate
          ]);

          const saleId = saleResult.insertId;

          for (const saleItem of items) {
            const lineTotal = (saleItem.unitPrice * saleItem.quantity) - (saleItem.discount || 0);
            await conn.query(`
              INSERT INTO sale_items (sale_id, product_id, variation_id, product_name, quantity, unit_price, discount, tax_amount, total)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              saleId, saleItem.productId, saleItem.variationId || null, saleItem.productName,
              saleItem.quantity, saleItem.unitPrice, saleItem.discount || 0, saleItem.taxAmount || 0, lineTotal
            ]);

            if (saleItem.trackStock !== false) {
              const [stock] = await conn.query(
                'SELECT id FROM stock WHERE branch_id = ? AND product_id = ? AND (variation_id = ? OR (variation_id IS NULL AND ? IS NULL))',
                [saleBranchId, saleItem.productId, saleItem.variationId, saleItem.variationId]
              );

              if (stock.length > 0) {
                await conn.query(
                  'UPDATE stock SET quantity = quantity - ? WHERE id = ?',
                  [saleItem.quantity, stock[0].id]
                );
              } else {
                await conn.query(
                  'INSERT INTO stock (branch_id, product_id, variation_id, quantity) VALUES (?, ?, ?, ?)',
                  [saleBranchId, saleItem.productId, saleItem.variationId || null, -saleItem.quantity]
                );
              }

              await conn.query(`
                INSERT INTO stock_movements (business_id, branch_id, product_id, variation_id, movement_type, quantity, reference_type, reference_id, created_by, created_at)
                VALUES (?, ?, ?, ?, 'sale', ?, 'sale', ?, ?, ?)
              `, [item.business_id, saleBranchId, saleItem.productId, saleItem.variationId || null, -saleItem.quantity, saleId, req.user.id, saleDate]);
            }
          }

          if (isCredit && customerId) {
            await conn.query(
              'UPDATE customers SET credit_balance = credit_balance + ? WHERE id = ? AND business_id = ?',
              [totalAmount, customerId, item.business_id]
            );
          }
        }

        await conn.query(
          'UPDATE sync_queue SET status = ?, error_message = NULL, synced_at = NOW() WHERE id = ?',
          ['synced', item.id]
        );
        syncedCount++;
      } else {
        await conn.query(
          'UPDATE sync_queue SET status = ?, error_message = ?, synced_at = NOW() WHERE id = ?',
          ['synced', 'Skipped: Unsupported entity type', item.id]
        );
        syncedCount++;
      }

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      failedCount++;
      console.error(`Sync failed for queue item ${item.id}:`, err);
      try {
        await pool.query(
          'UPDATE sync_queue SET status = ?, error_message = ? WHERE id = ?',
          ['failed', err.message || 'Unknown error', item.id]
        );
      } catch (writeErr) {
        console.error(`Failed to update sync_queue error status for item ${item.id}:`, writeErr);
      }
    } finally {
      conn.release();
    }
  }

  res.json({ synced: syncedCount, failed: failedCount, total: pending.length });
}));

router.get('/status', authenticate, asyncHandler(async (req, res) => {
  const [counts] = await pool.query(`
    SELECT status, COUNT(*) as count FROM sync_queue
    WHERE business_id = ? GROUP BY status
  `, [req.user.businessId]);

  res.json({
    online: true,
    lastSync: new Date().toISOString(),
    queue: Object.fromEntries(counts.map(c => [c.status, c.count])),
  });
}));

export default router;
