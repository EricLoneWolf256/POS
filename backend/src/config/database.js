import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'venderra_pos',
  waitForConnections: true,
  connectionLimit: 50,
  queueLimit: 100,
  connectTimeout: 10000,
  timezone: '+03:00',
});

export default pool;
