import bcrypt from 'bcrypt';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { timingSafeEqual, createHash } from 'crypto';

const PRIVATE_KEY = process.env.IAM_PRIVATE_KEY || 'dev-key-change-me';
const AUTH_MODE = (process.env.VITE_AUTH_MODE || '').toLowerCase();

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
 * POST /api/auth/verify-password
 * Verifies the current user's password.
 * - In single_user mode: validates against AUTH_EMAIL / AUTH_PASSWORD env vars (no DB needed).
 * - In multi-user mode: validates against the password_hash stored in the DB.
 *
 * Used by SettingsModule before allowing a data reset.
 */
export async function POST(c) {
  try {
    const authHeader = c.req.header('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return c.json({ success: false, error: 'Chưa đăng nhập' }, 401);
    }

    const token = authHeader.slice(7);
    let decoded;
    try {
      decoded = jwt.verify(token, PRIVATE_KEY);
    } catch (_) {
      // Allow the special single-user dev token
      if (token !== 'local-single-user-token') {
        return c.json({ success: false, error: 'Token không hợp lệ' }, 401);
      }
      decoded = { email: process.env.AUTH_EMAIL || '' };
    }

    const body = await c.req.json();
    const { password } = body;

    if (!password) {
      return c.json({ success: false, error: 'Vui lòng nhập mật khẩu' }, 400);
    }

    // --- Single-user mode: timing-safe compare against env vars (no DB required) ---
    if (
      AUTH_MODE === 'single_user' ||
      AUTH_MODE === 'single-user' ||
      AUTH_MODE === 'singleuser'
    ) {
      const envPassword = process.env.AUTH_PASSWORD || '';
      if (!envPassword) {
        return c.json({ success: false, error: 'Cấu hình chưa đủ (AUTH_PASSWORD chưa đặt)' }, 500);
      }
      if (safeCompare(password, envPassword)) {
        return c.json({ success: true });
      }
      return c.json({ success: false, error: 'Mật khẩu không đúng' }, 401);
    }

    // --- Multi-user mode: verify against DB ---
    const pool = c.get('pool') ?? globalThis.dbPool;
    if (!pool) {
      return c.json({ success: false, error: 'Database không khả dụng' }, 500);
    }

    const email = decoded.email || decoded.sub || '';
    const result = await pool.query(
      'SELECT password_hash FROM auth_users WHERE email = $1',
      [email],
    );

    if (result.rows.length === 0) {
      return c.json({ success: false, error: 'Không tìm thấy tài khoản' }, 404);
    }

    const { password_hash } = result.rows[0];
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
        console.error('[verify-password] hash error:', e2);
        return c.json({ success: false, error: 'Lỗi xác thực mật khẩu' }, 500);
      }
    }

    if (!isValid) {
      return c.json({ success: false, error: 'Mật khẩu không đúng' }, 401);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('[verify-password] error:', error);
    return c.json({ success: false, error: 'Lỗi máy chủ' }, 500);
  }
}
