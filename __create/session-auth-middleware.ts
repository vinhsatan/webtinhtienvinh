import type { Context } from 'hono';
import jwtLib from 'jsonwebtoken';
import { getVaultSecrets } from './vault-secrets';

/**
 * Middleware to extract user from multiple auth sources:
 * 1. Auth.js session token (JWT stored in cookie)
 * 2. JWT token from Authorization header (Bearer token from frontend localStorage)
 * Falls back through both options to find valid auth
 */
export async function sessionAuthMiddleware(c: Context, next: () => Promise<void>) {
  const secrets = getVaultSecrets();
  const jwtSecret = secrets.jwt.secret;
  
  if (!jwtSecret) {
    return c.json({ error: 'Internal server error: JWT configuration missing' }, 500);
  }

  try {
    // Priority 1: Try Authorization Bearer token (frontend localStorage auth)
    const authHeader = c.req.header('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const decoded = jwtLib.verify(token, jwtSecret) as {
          userId?: string;
          email?: string;
        };
        
        if (decoded.userId) {
          (c as unknown as { set: (key: string, value: unknown) => void }).set('user', {
            userId: decoded.userId,
            email: decoded.email || 'unknown',
          });
          console.debug('[SessionAuth] Authenticated via Bearer token');
          return next();
        }
      } catch (bearerErr) {
        console.debug('[SessionAuth] Invalid Bearer token:', (bearerErr as Error).message);
      }
    }

    // Priority 2: Try Auth.js session cookies
    const sessionTokenCookie = getCookie(c, 'authjs.session-token') || 
                              getCookie(c, '__Secure-authjs.session-token');
    
    if (sessionTokenCookie) {
      try {
        const decoded = jwtLib.verify(sessionTokenCookie, jwtSecret) as {
          sub?: string;
          email?: string;
          iat?: number;
          exp?: number;
        };
        
        if (decoded.sub) {
          (c as unknown as { set: (key: string, value: unknown) => void }).set('user', {
            userId: decoded.sub,
            email: decoded.email || 'unknown',
          });
          console.debug('[SessionAuth] Authenticated via session cookie');
          return next();
        }
      } catch (sessionErr) {
        console.debug('[SessionAuth] Invalid session token:', (sessionErr as Error).message);
      }
    }

    // No auth method worked
    console.debug('[SessionAuth] No valid auth found in headers or cookies');
    return c.json({ error: 'Unauthorized' }, 401);
  } catch (error) {
    console.error('[SessionAuth] Error verifying token:', error);
    return c.json({ error: 'Unauthorized' }, 401);
  }
}

/**
 * Helper to get cookie value by name
 */
function getCookie(c: Context, name: string): string | undefined {
  const cookieHeader = c.req.header('Cookie');
  if (!cookieHeader) return undefined;
  
  const cookies = cookieHeader.split(';');
  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === name) {
      return decodeURIComponent(value);
    }
  }
  return undefined;
}
