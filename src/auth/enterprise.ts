import { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';

const PRIVATE_KEY = process.env.IAM_PRIVATE_KEY || 'dev-key-change-me';

function requireEnterpriseAuth(req: Request, res: Response, next: NextFunction) {
  // Allow health and metrics without auth
  if (req.path === '/health' || req.path === '/metrics') return next();

  const auth = String(req.headers.authorization || '');
  const parts = auth.split(' ');

  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    const token = parts[1];
    try {
      jwt.verify(token, PRIVATE_KEY);
      return next();
    } catch (e) {
      // invalid token
    }
  }

  // Fallback: single-user credentials via Basic auth (enterprise deployments should prefer JWT)
  const singleUserEmail = process.env.AUTH_EMAIL || '';
  const singleUserPass = process.env.AUTH_PASSWORD || '';
  const basic = String(req.headers.authorization || '');
  if (basic.startsWith('Basic ')) {
    try {
      const decoded = Buffer.from(basic.split(' ')[1], 'base64').toString('utf8');
      const [user, pass] = decoded.split(':');
      if (user === singleUserEmail && pass === singleUserPass && user) return next();
    } catch (_) {}
  }

  res.status(401).json({ ok: false, error: 'unauthorized' });
}

export function applyEnterpriseSecurity(app: Express) {
  if (String(process.env.ENTERPRISE_SECURITY).toLowerCase() !== 'true') return;

  // Trust proxy so req.secure and x-forwarded-* work behind reverse proxies
  try { app.set('trust proxy', true); } catch (e) {}

  // Helmet for secure headers
  app.use(helmet());

  // HSTS: enforce for production hosts
  app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true, preload: true }));

  // Strict CORS - only allow app domain
  const origin = process.env.APP_DOMAIN ? `https://${process.env.APP_DOMAIN}` : (process.env.VITE_API_URL || '');
  app.use(cors({ origin, methods: ['GET','POST','PUT','DELETE','OPTIONS'], credentials: true }));

  // Rate limiting - conservative defaults for enterprise
  const limiter = rateLimit({ windowMs: 60 * 1000, max: Number(process.env.ENTERPRISE_RATE_LIMIT_MAX) || 120 });
  app.use(limiter);

  // Enforce HTTPS (behind proxy)
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.secure || req.headers['x-forwarded-proto'] === 'https' || req.hostname === 'localhost') return next();
    // Redirect to https if possible
    const host = req.headers.host || '';
    return res.redirect(301, `https://${host}${req.originalUrl}`);
  });

  // Apply authentication guard for all non-health endpoints
  app.use(requireEnterpriseAuth);
}

export default { applyEnterpriseSecurity };
