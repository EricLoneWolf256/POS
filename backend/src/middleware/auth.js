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

/**
 * Checks that the business has an active trial or valid subscription.
 * Call this AFTER authenticate() on any route that needs billing enforcement.
 * Super-admins bypass this check entirely.
 */
export function requireActiveSubscription(req, res, next) {
  // Super-admins are exempt
  if (req.user?.role === 'super_admin') return next();

  pool.query(
    'SELECT trial_ends_at, subscription_expires_at, is_active FROM businesses WHERE id = ?',
    [req.user.businessId]
  ).then(([rows]) => {
    if (!rows.length || !rows[0].is_active) {
      return res.status(403).json({
        error: 'Account suspended',
        code: 'ACCOUNT_SUSPENDED',
      });
    }

    const { trial_ends_at, subscription_expires_at } = rows[0];
    const now = new Date();

    // Active paid subscription
    if (subscription_expires_at && new Date(subscription_expires_at) > now) {
      return next();
    }

    // Active trial
    if (trial_ends_at && new Date(trial_ends_at) > now) {
      return next();
    }

    // Both expired
    return res.status(403).json({
      error: 'Your trial or subscription has expired. Please contact support to continue.',
      code: 'SUBSCRIPTION_EXPIRED',
      trialEnded: trial_ends_at ? new Date(trial_ends_at) < now : true,
    });
  }).catch(next);
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
    if (req.user?.role === 'super_admin') return next();
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
