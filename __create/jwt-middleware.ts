/**
 * JWT Authentication Middleware for Hono
 * Protects API routes using JWT tokens
 */

import type { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';
import { getVaultSecrets } from './vault-secrets';

interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * JWT Authentication Middleware
 * Validates JWT token from Authorization header
 */
export async function jwtAuthMiddleware(c: Context, next: Next) {
  try {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json(
        { error: 'Unauthorized: Missing or invalid Authorization header' },
        401
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return c.json({ error: 'Unauthorized: Token is required' }, 401);
    }

    // Get JWT secret from Vault
    const secrets = getVaultSecrets();
    const jwtSecret = secrets.jwt.secret;

    if (!jwtSecret) {
      console.error('[JWT] JWT secret not found in Vault');
      return c.json({ error: 'Internal server error: JWT configuration missing' }, 500);
    }

    // Verify token
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    } catch (error) {
      return c.json(
        { error: 'Unauthorized: Invalid or expired token' },
        401
      );
    }

    // Attach user info to context
    c.set('user', {
      userId: decoded.userId,
      email: decoded.email,
    });

    return next();
  } catch (error) {
    console.error('[JWT Middleware] Error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
}

/**
 * Optional JWT middleware - doesn't fail if token is missing
 * Useful for routes that work with or without authentication
 */
export async function optionalJwtAuthMiddleware(c: Context, next: Next) {
  try {
    const authHeader = c.req.header('Authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const secrets = getVaultSecrets();
      const jwtSecret = secrets.jwt.secret;

      if (jwtSecret) {
        try {
          const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
          c.set('user', {
            userId: decoded.userId,
            email: decoded.email,
          });
        } catch {
          // Invalid token, but continue without auth
        }
      }
    }

    return next();
  } catch (error) {
    // Continue without auth on error
    return next();
  }
}

/**
 * Get current user from context (set by jwtAuthMiddleware)
 */
export function getCurrentUser(c: Context): { userId: string; email: string } | null {
  return c.get('user') || null;
}
