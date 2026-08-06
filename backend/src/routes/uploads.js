import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/helpers.js';
import { auditLog } from '../middleware/audit.js';
import pool from '../config/database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../../uploads');

const ALLOWED_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WebP, GIF) are allowed'));
    }
  },
});

const router = express.Router();

router.post('/product-image', authenticate, upload.single('image'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const url = `/uploads/${req.file.filename}`;
  const { productId } = req.body;
  if (productId) {
    await pool.query('UPDATE products SET image_url = ? WHERE id = ? AND business_id = ?',
      [url, productId, req.user.businessId]);
  }

  auditLog(req.user.businessId, req.user.id, 'upload', 'product_image', productId || null, { filename: req.file.filename, ip: req.ip });

  res.json({ url, filename: req.file.filename });
}));

router.post('/business-logo', authenticate, upload.single('logo'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const url = `/uploads/${req.file.filename}`;
  await pool.query('UPDATE businesses SET logo_url = ? WHERE id = ?', [url, req.user.businessId]);

  auditLog(req.user.businessId, req.user.id, 'upload', 'business_logo', req.user.businessId, { filename: req.file.filename, ip: req.ip });

  res.json({ url, filename: req.file.filename });
}));

export default router;
