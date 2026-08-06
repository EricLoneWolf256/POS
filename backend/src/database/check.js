import pool from '../config/database.js';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  try {
    const [businesses] = await pool.query('SELECT id, name, slug FROM businesses');
    console.log('\n--- BUSINESSES ---');
    console.table(businesses);

    const [branches] = await pool.query('SELECT id, business_id, name, code FROM branches');
    console.log('\n--- BRANCHES ---');
    console.table(branches);

    const [users] = await pool.query('SELECT id, business_id, email, role FROM users');
    console.log('\n--- USERS ---');
    console.table(users);

    const [products] = await pool.query('SELECT id, business_id, name, sku FROM products LIMIT 20');
    console.log('\n--- PRODUCTS (first 20) ---');
    console.table(products);

  } catch (err) {
    console.error('Check failed:', err.message);
  } finally {
    process.exit(0);
  }
}

check();
