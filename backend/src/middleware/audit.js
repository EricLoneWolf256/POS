import pool from '../config/database.js';

export function auditLog(businessId, userId, action, entityType, entityId, details = {}) {
  pool.query(`
    INSERT INTO audit_logs (business_id, user_id, action, entity_type, entity_id, details, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [businessId, userId, action, entityType, entityId, JSON.stringify(details), details.ip || null]).catch(err => {
    console.error('[AUDIT] Failed to log:', err.message);
  });
}
