import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { setupSecurity } from './middleware/security.js';
import { errorHandler } from './utils/helpers.js';
import authRoutes from './routes/auth.js';
import registerRoutes from './routes/register.js';
import passwordResetRoutes from './routes/passwordReset.js';
import productRoutes from './routes/products.js';
import salesRoutes from './routes/sales.js';
import stockRoutes from './routes/stock.js';
import customerRoutes from './routes/customers.js';
import purchaseRoutes from './routes/purchases.js';
import dashboardRoutes from './routes/dashboard.js';
import reportRoutes from './routes/reports.js';
import userRoutes from './routes/users.js';
import quotationRoutes from './routes/quotations.js';
import manufacturingRoutes from './routes/manufacturing.js';
import fieldSalesRoutes from './routes/fieldSales.js';
import syncRoutes from './routes/sync.js';
import paymentRoutes from './routes/payments.js';
import exportRoutes from './routes/exports.js';
import notificationRoutes from './routes/notifications.js';
import uploadRoutes from './routes/uploads.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 5000;

setupSecurity(app);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Venderra POS API', version: '2.0.0' });
});

app.get('/api/plans', (_req, res) => {
  res.json([
    { name: 'starter', price: 1200000, currency: 'UGX', features: ['POS', 'Stock', 'Purchases', 'Expenses', 'Offline', 'WhatsApp summaries'], limits: { products: 500, users: 3, locations: 1 } },
    { name: 'premium', price: 1800000, currency: 'UGX', features: ['Everything in Starter', 'Quotations', 'Barcodes', 'SMS Center', 'Multi-currency', 'Accounting', 'Staff reports'], limits: { products: null, users: null, locations: 1 } },
    { name: 'enterprise', price: 2500000, currency: 'UGX', features: ['Everything in Premium', 'Manufacturing', 'Field Sales', 'Multi-branch', 'Priority support'], limits: { products: null, users: null, locations: null } },
  ]);
});

app.use('/api/auth', authRoutes);
app.use('/api/auth', registerRoutes);
app.use('/api/auth', passwordResetRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/manufacturing', manufacturingRoutes);
app.use('/api/field-sales', fieldSalesRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/exports', exportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/uploads', uploadRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Venderra POS API running on http://localhost:${PORT}`);
});
