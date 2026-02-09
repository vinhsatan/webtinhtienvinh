import bcrypt from 'bcrypt';
import argon2 from 'argon2';

// POST /api/auth/change-password - Đổi mật khẩu
export async function POST(c) {
  try {
    const user = c.get('user');
    if (!user || !user.userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return c.json({ 
        error: 'Vui lòng nhập đầy đủ thông tin',
        details: { missingFields: ['currentPassword', 'newPassword', 'confirmPassword'] }
      }, 400);
    }

    if (newPassword !== confirmPassword) {
      return c.json({ 
        error: 'Mật khẩu xác nhận không khớp',
        details: { field: 'confirmPassword' }
      }, 400);
    }

    if (newPassword.length < 8) {
      return c.json({ 
        error: 'Mật khẩu mới phải ít nhất 8 ký tự',
        details: { minLength: 8 }
      }, 400);
    }

    // Get user from database
    const pool = c.get('pool') ?? globalThis.dbPool;
    if (!pool) {
      return c.json({ error: 'Database not available' }, 500);
    }

    const result = await pool.query(
      'SELECT password_hash FROM auth_users WHERE id = $1',
      [user.userId]
    );

    if (result.rows.length === 0) {
      return c.json({ error: 'Không tìm thấy tài khoản' }, 404);
    }

    const userRow = result.rows[0];
    const passwordHash = userRow.password_hash;

    // Verify current password (support both bcrypt and argon2)
    let isValidPassword = false;
    
    try {
      // Try argon2 first
      isValidPassword = await argon2.verify(passwordHash, currentPassword);
    } catch (e) {
      // Fall back to bcrypt
      try {
        isValidPassword = await bcrypt.compare(currentPassword, passwordHash);
      } catch (e2) {
        console.error('Password verification error:', e2);
        return c.json({ error: 'Lỗi xác thực mật khẩu' }, 500);
      }
    }

    if (!isValidPassword) {
      return c.json({ 
        error: 'Mật khẩu hiện tại không đúng',
        details: { field: 'currentPassword' }
      }, 401);
    }

    // Hash new password with argon2
    const newPasswordHash = await argon2.hash(newPassword, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1
    });

    // Update password in database
    await pool.query(
      'UPDATE auth_users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, user.userId]
    );

    return c.json({
      success: true,
      message: 'Đổi mật khẩu thành công'
    }, 200);

  } catch (error) {
    console.error('Error changing password:', error);
    return c.json({ 
      error: 'Lỗi máy chủ khi đổi mật khẩu',
      details: { message: error.message }
    }, 500);
  }
}
