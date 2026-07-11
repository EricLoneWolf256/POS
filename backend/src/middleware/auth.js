import jwt from 'jsonwebtoken';

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
