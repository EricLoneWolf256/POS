import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';

export function setupSecurity(app) {
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));

  app.use(morgan('combined'));

  app.use('/api/auth/login', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Too many login attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
  }));

  app.use('/api/auth/forgot-password', rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: { error: 'Too many password reset requests' },
  }));

  app.use('/api', rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 200,
    message: { error: 'Too many requests, please slow down' },
    standardHeaders: true,
    legacyHeaders: false,
  }));
}
