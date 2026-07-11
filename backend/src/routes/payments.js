import express from 'express';
import crypto from 'crypto';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/helpers.js';

const router = express.Router();

const FLW_SECRET = process.env.FLUTTERWAVE_SECRET_KEY;
const FLW_PUBLIC = process.env.FLUTTERWAVE_PUBLIC_KEY;
const FLW_BASE = process.env.FLUTTERWAVE_URL || 'https://api.flutterwave.com/v3';

router.get('/config', (req, res) => {
  res.json({ publicKey: FLW_PUBLIC || null, configured: !!FLW_SECRET });
});

router.post('/initialize', authenticate, asyncHandler(async (req, res) => {
  const { planId, redirectUrl } = req.body;

  const [plans] = await pool.query('SELECT * FROM plans WHERE id = ?', [planId]);
  if (plans.length === 0) return res.status(404).json({ error: 'Plan not found' });
  const plan = plans[0];

  const [business] = await pool.query('SELECT * FROM businesses WHERE id = ?', [req.user.businessId]);
  if (business.length === 0) return res.status(404).json({ error: 'Business not found' });
  const biz = business[0];

  const txRef = `VEN-${req.user.businessId}-${Date.now()}`;

  await pool.query(`
    INSERT INTO payments (business_id, plan_id, amount, currency, tx_ref, status)
    VALUES (?, ?, ?, 'UGX', ?, 'pending')
  `, [req.user.businessId, planId, plan.price_ugx, txRef]);

  if (!FLW_SECRET) {
    return res.json({
      message: 'Payment gateway not configured — simulating success',
      simulated: true,
      txRef,
      amount: plan.price_ugx,
      plan: plan.name,
    });
  }

  try {
    const response = await fetch(`${FLW_BASE}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FLW_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: plan.price_ugx,
        currency: 'UGX',
        redirect_url: redirectUrl || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?payment=success`,
        customer: {
          email: biz.email || req.user.email,
          name: biz.name,
        },
        meta: {
          business_id: req.user.businessId,
          plan_id: planId,
        },
      }),
    });

    const data = await response.json();
    if (data.status === 'success') {
      res.json({ paymentLink: data.data.link, txRef });
    } else {
      res.status(400).json({ error: data.message || 'Payment initialization failed' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Payment service unavailable' });
  }
}));

router.post('/webhook', asyncHandler(async (req, res) => {
  const secretHash = process.env.FLUTTERWAVE_WEBHOOK_HASH;
  if (secretHash) {
    const signature = req.headers['verif-hash'];
    const hash = crypto.createHash('sha256').update(JSON.stringify(req.body)).digest('hex');
    if (hash !== signature) {
      return res.status(400).json({ error: 'Invalid signature' });
    }
  }

  const { event, data } = req.body;
  if (event === 'charge.completed' && data?.status === 'successful') {
    const txRef = data.tx_ref;
    const [payments] = await pool.query('SELECT * FROM payments WHERE tx_ref = ? AND status = ?', [txRef, 'pending']);
    if (payments.length > 0) {
      const payment = payments[0];
      await pool.query('UPDATE payments SET status = ?, flw_id = ?, updated_at = NOW() WHERE id = ?', ['completed', data.id, payment.id]);

      const newDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      await pool.query('UPDATE businesses SET plan_id = ?, subscription_expires_at = ?, updated_at = NOW() WHERE id = ?',
        [payment.plan_id, newDate, payment.business_id]);
    }
  }

  res.json({ received: true });
}));

router.get('/history', authenticate, asyncHandler(async (req, res) => {
  const [payments] = await pool.query(`
    SELECT py.*, p.name as plan_name FROM payments py
    JOIN plans p ON py.plan_id = p.id
    WHERE py.business_id = ?
    ORDER BY py.created_at DESC LIMIT 20
  `, [req.user.businessId]);
  res.json(payments);
}));

export default router;
