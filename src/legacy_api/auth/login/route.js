import bcrypt from 'bcrypt';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { timingSafeEqual, createHash } from 'crypto';

const PRIVATE_KEY = process.env.IAM_PRIVATE_KEY || 'dev-key-change-me';
const AUTH_MODE = (process.env.VITE_AUTH_MODE || '').toLowerCase();
const TOKEN_EXPIRY = '24h';

/** Constant-time string comparison to prevent timing attacks. */
function safeCompare(a, b) {
  try {
    const ha = createHash('sha256').update(a).digest();
    const hb = createHash('sha256').update(b).digest();
    return timingSafeEqual(ha, hb);
  } catch (_) {
    return false;
  }
}

/**
 * POST /api/auth/login
 * - In single_user mode: validates against AUTH_EMAIL / AUTH_PASSWORD env vars (no DB needed).
 * - In multi-user mode: validates email + password_hash from the DB.
 */
export async function POST(c) {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return c.json({ success: false, error: 'Email và mật khẩu là bắt buộc' }, 400);
    }

    // --- Single-user mode ---
    if (
      AUTH_MODE === 'single_user' ||
      AUTH_MODE === 'single-user' ||
      AUTH_MODE === 'singleuser'
    ) {
      const envEmail = process.env.AUTH_EMAIL || '';
      const envPasswordHash = process.env.AUTH_PASSWORD_HASH || '';
      const envPasswordPlain = process.env.AUTH_PASSWORD || ''; // legacy fallback

      if (!envEmail) {
        return c.json({ success: false, error: 'Cấu hình chưa đủ (AUTH_EMAIL chưa đặt)' }, 500);
      }

      // Email check (timing-safe)
      if (!safeCompare(email, envEmail)) {
        return c.json({ success: false, error: 'Email hoặc mật khẩu không đúng' }, 401);
      }

      // Password check: prefer argon2 hash, fall back to timing-safe plaintext (dev only)
      let passwordOk = false;
      if (envPasswordHash) {
        try {
          passwordOk = await argon2.verify(envPasswordHash, password);
        } catch (_) {
          passwordOk = false;
        }
      } else if (envPasswordPlain) {
        passwordOk = safeCompare(password, envPasswordPlain);
      }

      if (!passwordOk) {
        return c.json({ success: false, error: 'Email hoặc mật khẩu không đúng' }, 401);
      }

      const token = jwt.sign({ sub: envEmail, email: envEmail, name: 'Owner' }, PRIVATE_KEY, {
        expiresIn: TOKEN_EXPIRY,
      });

      return c.json({
        success: true,
        token,
        user: { email: envEmail, name: 'Owner' },
      });
    }

    // --- Multi-user mode: validate against DB ---
    const pool = c.get('pool') ?? globalThis.dbPool;
    if (!pool) {
      return c.json({ success: false, error: 'Database không khả dụng' }, 500);
    }

    const result = await pool.query(
      'SELECT id, name, email, password_hash FROM auth_users WHERE email = $1',
      [email],
    );

    if (result.rows.length === 0) {
      return c.json({ success: false, error: 'Email hoặc mật khẩu không đúng' }, 401);
    }

    const userRow = result.rows[0];
    const { password_hash } = userRow;

    if (!password_hash) {
      return c.json({ success: false, error: 'Tài khoản này chưa đặt mật khẩu' }, 400);
    }

    let isValid = false;
    try {
      isValid = await argon2.verify(password_hash, password);
    } catch (_) {
      try {
        isValid = await bcrypt.compare(password, password_hash);
      } catch (e2) {
        console.error('[login] hash error:', e2);
        return c.json({ success: false, error: 'Lỗi xác thực mật khẩu' }, 500);
      }
    }

    if (!isValid) {
      return c.json({ success: false, error: 'Email hoặc mật khẩu không đúng' }, 401);
    }

    const token = jwt.sign(
      { sub: userRow.id, email: userRow.email, name: userRow.name || '' },
      PRIVATE_KEY,
      { expiresIn: TOKEN_EXPIRY },
    );

    return c.json({
      success: true,
      token,
      user: { id: userRow.id, email: userRow.email, name: userRow.name || '' },
    });
  } catch (error) {
    console.error('[login] error:', error);
    return c.json({ success: false, error: 'Lỗi máy chủ' }, 500);
  }
}
