import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import pool from '../config/database.js';
import { asyncHandler } from '../utils/helpers.js';
import { auditLog } from '../middleware/audit.js';
import { sendEmail, passwordResetEmail } from '../services/email.js';
import {
  handleValidation,
  validateEmail,
  validatePassword,
  validateRequiredString,
} from '../middleware/validation.js';
import { body } from 'express-validator';

const router = express.Router();

router.post('/forgot-password', [
  validateEmail('email'),
  handleValidation,
], asyncHandler(async (req, res) => {
  const { email } = req.body;

  const [users] = await pool.query('SELECT id, email, business_id FROM users WHERE email = ? AND is_active = TRUE', [email]);
  const user = users[0];

  if (!user) {
    return res.json({ message: 'If an account exists, a reset link has been sent.' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await pool.query('DELETE FROM password_resets WHERE user_id = ?', [user.id]);
  await pool.query(
    'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
    [user.id, token, expiresAt]
  );

  auditLog(user.business_id, user.id, 'password_reset_request', 'user', user.id, { ip: req.ip });

  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
  const emailContent = passwordResetEmail(resetUrl);
  await sendEmail({ to: user.email, subject: emailContent.subject, html: emailContent.html });

  res.json({ message: 'If an account exists, a reset link has been sent.' });
}));

router.post('/reset-password', [
  validateRequiredString('token', 10, 255),
  validatePassword('password', 8),
  handleValidation,
], asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  const [resets] = await pool.query(
    'SELECT * FROM password_resets WHERE token = ? AND expires_at > NOW()',
    [token]
  );

  if (resets.length === 0) {
    return res.status(400).json({ error: 'Invalid or expired reset token' });
  }

  const reset = resets[0];
  const hash = await bcrypt.hash(password, 12);
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, reset.user_id]);
  await pool.query('DELETE FROM password_resets WHERE id = ?', [reset.id]);

  auditLog(null, reset.user_id, 'password_reset', 'user', reset.user_id, { ip: req.ip });

  res.json({ message: 'Password reset successful. You can now log in.' });
}));

export default router;
