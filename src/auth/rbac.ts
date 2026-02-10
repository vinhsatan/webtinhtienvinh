import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const PRIVATE_KEY = process.env.IAM_PRIVATE_KEY || 'dev-key-change-me';

export async function requireKillSwitchAuth(req: Request, res: Response, next: NextFunction) {
  // 1) X-Operator header override for automation (dev/stage)
  const operator = (req.headers['x-operator'] as string) || '';
  if (operator) {
    const allowed = (process.env.ADMIN_OPERATORS || '').split(',').map((s) => s.trim()).filter(Boolean);
    if (allowed.includes(operator)) return next();
  }

  // 2) Bearer JWT check (production): require role 'admin' or 'ops'
  const auth = String(req.headers.authorization || '');
  const parts = auth.split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    const token = parts[1];
    try {
      const payload = jwt.verify(token, PRIVATE_KEY) as any;
      const roles = payload?.roles || payload?.scope || [];
      if (Array.isArray(roles) && (roles.includes('admin') || roles.includes('ops') || roles.includes('operator'))) {
        return next();
      }
    } catch (e) {
      // fallthrough to unauthorized
    }
  }

  res.status(403).json({ ok: false, error: 'unauthorized' });
}

export default { requireKillSwitchAuth };
