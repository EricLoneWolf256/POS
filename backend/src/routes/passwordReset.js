import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import pool from '../config/database.js';
import { asyncHandler } from '../utils/helpers.js';
import { sendEmail, passwordResetEmail } from '../services/email.js';

const router = express.Router();

router.post('/forgot-password', asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const [users] = await pool.query('SELECT id, email FROM users WHERE email = ? AND is_active = TRUE', [email]);
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

  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
  const emailContent = passwordResetEmail(resetUrl);
  await sendEmail({ to: user.email, subject: emailContent.subject, html: emailContent.html });

  res.json({ message: 'If an account exists, a reset link has been sent.' });
}));

router.post('/reset-password', asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token and password are required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const [resets] = await pool.query(
    'SELECT * FROM password_resets WHERE token = ? AND expires_at > NOW()',
    [token]
  );

  if (resets.length === 0) {
    return res.status(400).json({ error: 'Invalid or expired reset token' });
  }

  const reset = resets[0];
  const hash = await bcrypt.hash(password, 10);
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, reset.user_id]);
  await pool.query('DELETE FROM password_resets WHERE id = ?', [reset.id]);

  res.json({ message: 'Password reset successful. You can now log in.' });
}));

export default router;
