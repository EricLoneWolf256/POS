import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import { asyncHandler } from '../utils/helpers.js';
import { auditLog } from '../middleware/audit.js';
import { sendEmail, welcomeEmail } from '../services/email.js';
import {
  handleValidation,
  validateEmail,
  validatePassword,
  validateRequiredString,
  validateOptionalString,
} from '../middleware/validation.js';

const router = express.Router();

router.post('/register', [
  validateRequiredString('businessName', 2, 255),
  validateRequiredString('firstName', 1, 100),
  validateRequiredString('lastName', 1, 100),
  validateEmail('email'),
  validatePassword('password', 6),
  validateOptionalString('businessPhone', 50),
  validateOptionalString('businessCity', 100),
], handleValidation, asyncHandler(async (req, res) => {
  const { businessName, businessPhone, businessEmail, businessCity, firstName, lastName, email, password, plan } = req.body;

  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) {
    return res.status(400).json({ error: 'An account with this email already exists' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const planName = plan || 'starter';
    const [planRows] = await conn.query('SELECT id FROM plans WHERE name = ?', [planName]);
    const planId = planRows[0]?.id || 1;

    const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const [bizResult] = await conn.query(`
      INSERT INTO businesses (name, slug, email, phone, city, plan_id, trial_ends_at)
      VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 14 DAY))
    `, [businessName, slug, businessEmail || email, businessPhone || null, businessCity || 'Kampala', planId]);
    const businessId = bizResult.insertId;

    const [branchResult] = await conn.query(
      'INSERT INTO branches (business_id, name, is_main) VALUES (?, ?, TRUE)',
      [businessId, `${businessName} - Main`]
    );
    const branchId = branchResult.insertId;

    const hash = await bcrypt.hash(password, 12);
    const [userResult] = await conn.query(
      'INSERT INTO users (business_id, branch_id, email, password_hash, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [businessId, branchId, email, hash, firstName, lastName, 'owner']
    );
    const userId = userResult.insertId;

    await conn.commit();

    auditLog(businessId, userId, 'register', 'business', businessId, { email, ip: req.ip });

    const [planData] = await pool.query('SELECT * FROM plans WHERE id = ?', [planId]);
    const planFeatures = typeof planData[0]?.features === 'string' ? JSON.parse(planData[0].features) : planData[0]?.features || {};

    const token = jwt.sign(
      {
        id: userId, email, role: 'owner', businessId, branchId,
        plan: planName, planFeatures,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    sendEmail({
      to: email,
      ...welcomeEmail(businessName, firstName),
    }).catch(() => {});

    res.status(201).json({
      token,
      user: {
        id: userId, email, firstName, lastName, role: 'owner',
        businessId, businessName, branchId, branchName: `${businessName} - Main`,
        currency: 'UGX', plan: planName, planFeatures,
      },
    });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

export default router;
