import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: true,
});

try {
  await conn.query(`
    ALTER TABLE businesses
    ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP NULL
  `);
  console.log('OK: businesses columns added');
} catch (e) {
  console.log('SKIP: businesses columns already exist or error:', e.message);
}

try {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS password_resets (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      token VARCHAR(255) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_token (token)
    )
  `);
  console.log('OK: password_resets table');
} catch (e) {
  console.log('SKIP:', e.message);
}

try {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id INT PRIMARY KEY AUTO_INCREMENT,
      business_id INT NOT NULL,
      plan_id INT NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'UGX',
      tx_ref VARCHAR(255) UNIQUE,
      flw_id VARCHAR(255),
      status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      FOREIGN KEY (plan_id) REFERENCES plans(id)
    )
  `);
  console.log('OK: payments table');
} catch (e) {
  console.log('SKIP:', e.message);
}

try {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INT PRIMARY KEY AUTO_INCREMENT,
      business_id INT NOT NULL,
      user_id INT,
      action VARCHAR(50) NOT NULL,
      entity_type VARCHAR(50) NOT NULL,
      entity_id INT,
      details JSON,
      ip_address VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_entity (entity_type, entity_id),
      INDEX idx_created (created_at)
    )
  `);
  console.log('OK: audit_logs table');
} catch (e) {
  console.log('SKIP:', e.message);
}

await conn.end();
console.log('Migration complete!');
