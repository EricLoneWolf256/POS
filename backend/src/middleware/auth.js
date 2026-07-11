import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

export function requirePlan(...features) {
  return (req, res, next) => {
    const planFeatures = req.user.planFeatures || {};
    const hasFeature = features.some(f => planFeatures[f]);
    if (!hasFeature && req.user.plan !== 'enterprise') {
      return res.status(403).json({
        error: 'This feature requires a higher subscription plan',
        requiredFeatures: features,
      });
    }
    next();
  };
}

export async function validateBranchOwnership(branchId, businessId) {
  if (!branchId) return true;
  const [rows] = await pool.query(
    'SELECT id FROM branches WHERE id = ? AND business_id = ? AND is_active = TRUE',
    [branchId, businessId]
  );
  return rows.length > 0;
}

export function requireBranchOwnership(...branchParamKeys) {
  return async (req, res, next) => {
    for (const key of branchParamKeys) {
      const branchId = req.body[key] || req.query[key];
      if (branchId) {
        const valid = await validateBranchOwnership(branchId, req.user.businessId);
        if (!valid) {
          return res.status(403).json({ error: `Branch ${branchId} does not belong to your business` });
        }
      }
    }
    next();
  };
}
