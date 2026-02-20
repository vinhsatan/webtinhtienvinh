import argon2 from 'argon2';
import jwt from 'jsonwebtoken';

const PRIVATE_KEY = process.env.IAM_PRIVATE_KEY || 'dev-key-change-me';
const AUTH_MODE = (process.env.VITE_AUTH_MODE || '').toLowerCase();
const TOKEN_EXPIRY = '24h';

/**
 * POST /api/auth/register
 * Creates a new user account.
 * Disabled in single_user mode (only one user allowed).
 */
export async function POST(c) {
  try {
    // Registration is not allowed in single_user mode
    if (
      AUTH_MODE === 'single_user' ||
      AUTH_MODE === 'single-user' ||
      AUTH_MODE === 'singleuser'
    ) {
      return c.json({ success: false, error: 'Đăng ký bị tắt trong chế độ single_user' }, 403);
    }

    const body = await c.req.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return c.json({ success: false, error: 'Email và mật khẩu là bắt buộc' }, 400);
    }

    if (password.length < 8) {
      return c.json({ success: false, error: 'Mật khẩu phải có ít nhất 8 ký tự' }, 400);
    }

    const pool = c.get('pool') ?? globalThis.dbPool;
    if (!pool) {
      return c.json({ success: false, error: 'Database không khả dụng' }, 500);
    }

    // Check email uniqueness
    const existing = await pool.query('SELECT id FROM auth_users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return c.json({ success: false, error: 'Email này đã được sử dụng' }, 409);
    }

    // Hash password with argon2id
    const password_hash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });

    const result = await pool.query(
      `INSERT INTO auth_users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email`,
      [name || '', email, password_hash],
    );

    const userRow = result.rows[0];
    const token = jwt.sign(
      { sub: userRow.id, email: userRow.email, name: userRow.name || '' },
      PRIVATE_KEY,
      { expiresIn: TOKEN_EXPIRY },
    );

    return c.json({
      success: true,
      token,
      user: { id: userRow.id, email: userRow.email, name: userRow.name || '' },
    }, 201);
  } catch (error) {
    console.error('[register] error:', error);
    return c.json({ success: false, error: 'Lỗi máy chủ' }, 500);
  }
}
