/**
 * Admin User Management Routes
 * Only accessible by admin users (vinhsatan@gmail.com)
 */

import type { Context } from 'hono';
import type { Pool } from 'pg';
import bcrypt from 'bcrypt';

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  emailVerified: boolean | null;
  image: string | null;
  createdAt: string;
  password?: string;
}

/**
 * Check if user is admin
 */
function isAdmin(email: string | undefined): boolean {
  return email === 'vinhsatan@gmail.com';
}

/**
 * Get all users (Admin only)
 * GET /api/admin/users
 * Requires JWT with admin email
 */
export async function getAllUsersHandler(
  c: Context,
  pool: Pool
): Promise<Response> {
  try {
    // Check if user is authenticated (middleware should have set this)
    const user = c.get('user');

    if (!user || !user.userId || !user.email) {
      console.error('[Admin] No user in context:', { user });
      return c.json(
        { error: 'Unauthorized - No user authenticated' },
        401
      );
    }

    // Check if user is admin
    if (!isAdmin(user.email)) {
      return c.json(
        { error: 'Forbidden - Only admins can access user list' },
        403
      );
    }

    // Get all users with their account info
    const result = await pool.query(
      `SELECT 
        u.id,
        u.name,
        u.email,
        u."emailVerified",
        u.image,
        u.created_at,
        a.password
      FROM auth_users u
      LEFT JOIN auth_accounts a ON u.id = a."userId" AND a.provider = 'credentials'
      ORDER BY u.created_at DESC`
    );

    const users: AdminUser[] = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      emailVerified: row.emailVerified,
      image: row.image,
      createdAt: row.created_at,
      password: row.password ? '***' : undefined, // Hide actual password, show indicator
    }));

    return c.json({
      success: true,
      users,
      total: users.length,
    });
  } catch (error) {
    console.error('[Admin] Error fetching users:', error);
    return c.json(
      { error: 'Failed to fetch users' },
      500
    );
  }
}

/**
 * Delete user (Admin only)
 * DELETE /api/admin/users/:userId
 * Requires JWT with admin email
 */
export async function deleteUserHandler(
  c: Context,
  pool: Pool
): Promise<Response> {
  try {
    const user = c.get('user');
    const targetUserId = c.req.param('userId');

    // Check if user is authenticated
    if (!user || !user.email) {
      return c.json(
        { error: 'Unauthorized - No user authenticated' },
        401
      );
    }

    // Check if user is admin
    if (!isAdmin(user.email)) {
      return c.json(
        { error: 'Forbidden - Only admins can delete users' },
        403
      );
    }

    if (!targetUserId) {
      return c.json(
        { error: 'User ID is required' },
        400
      );
    }

    // Get user to delete
    const userResult = await pool.query(
      'SELECT email FROM auth_users WHERE id = $1',
      [targetUserId]
    );

    if ((userResult.rowCount ?? 0) === 0) {
      return c.json(
        { error: 'User not found' },
        404
      );
    }

    const targetUserEmail = userResult.rows[0].email;

    // Delete user's accounts
    await pool.query(
      'DELETE FROM auth_accounts WHERE "userId" = $1',
      [targetUserId]
    );

    // Delete user sessions
    await pool.query(
      'DELETE FROM auth_sessions WHERE "userId" = $1',
      [targetUserId]
    );

    // Delete user
    await pool.query(
      'DELETE FROM auth_users WHERE id = $1',
      [targetUserId]
    );

    console.log(`[Admin] User deleted by ${user.email}: ${targetUserEmail}`);

    return c.json({
      success: true,
      message: `User ${targetUserEmail} has been deleted`,
    });
  } catch (error) {
    console.error('[Admin] Error deleting user:', error);
    return c.json(
      { error: 'Failed to delete user' },
      500
    );
  }
}

/**
 * Update user (Admin only)
 * PUT /api/admin/users/:userId
 * Requires JWT with admin email
 */
export async function updateUserHandler(
  c: Context,
  pool: Pool
): Promise<Response> {
  try {
    const user = c.get('user');
    const targetUserId = c.req.param('userId');
    const body = await c.req.json();

    // Check if user is authenticated
    if (!user || !user.email) {
      return c.json(
        { error: 'Unauthorized - No user authenticated' },
        401
      );
    }

    // Check if user is admin
    if (!isAdmin(user.email)) {
      return c.json(
        { error: 'Forbidden - Only admins can update users' },
        403
      );
    }
    
    const { name, email: newEmail } = body;

    if (!targetUserId) {
      return c.json(
        { error: 'User ID is required' },
        400
      );
    }

    // Get user
    const userResult = await pool.query(
      'SELECT * FROM auth_users WHERE id = $1',
      [targetUserId]
    );

    if (userResult.rowCount === 0) {
      return c.json(
        { error: 'User not found' },
        404
      );
    }

    // Check if new email is already taken
    if (newEmail && newEmail !== userResult.rows[0].email) {
      const existingEmail = await pool.query(
        'SELECT id FROM auth_users WHERE email = $1 AND id != $2',
        [newEmail, targetUserId]
      );

      if ((existingEmail.rowCount ?? 0) > 0) {
        return c.json(
          { error: 'Email already taken' },
          409
        );
      }
    }

    // Update user
    const updateResult = await pool.query(
      `UPDATE auth_users 
       SET name = COALESCE($1, name), 
           email = COALESCE($2, email)
       WHERE id = $3
       RETURNING id, name, email, "emailVerified", image, created_at`,
      [name || null, newEmail || null, targetUserId]
    );

    const updatedUser = updateResult.rows[0];

    console.log(`[Admin] User updated by ${user.email}: ${updatedUser.email}`);

    return c.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('[Admin] Error updating user:', error);
    return c.json(
      { error: 'Failed to update user' },
      500
    );
  }
}

/**
 * Verify user is protected (won't be deleted during reset)
 * GET /api/admin/is-protected
 * Checks if current user email is in protected list (admin accounts)
 */
export async function isProtectedHandler(
  c: Context,
  pool: Pool
): Promise<Response> {
  try {
    const user = c.get('user');

    if (!user || !user.email) {
      return c.json(
        { error: 'Unauthorized' },
        401
      );
    }

    // Protected emails that won't be deleted during reset
    const protectedEmails = ['vinhsatan@gmail.com'];
    const isProtected = protectedEmails.includes(user.email);

    return c.json({
      success: true,
      email: user.email,
      isProtected,
      message: isProtected 
        ? '✅ Tài khoản này được bảo vệ - sẽ không bị xoá khi reset dữ liệu'
        : '⚠️ Tài khoản này không được bảo vệ - có thể bị ảnh hưởng khi reset'
    });
  } catch (error) {
    console.error('[Admin] Error checking protection status:', error);
    return c.json(
      { error: 'Failed to check protection status' },
      500
    );
  }
}

/**
 * Change user password (Admin only)
 * PUT /api/admin/users/:userId/password
 * Requires JWT with admin email
 */
export async function changePasswordHandler(
  c: Context,
  pool: Pool
): Promise<Response> {
  try {
    const user = c.get('user');
    const targetUserId = c.req.param('userId');
    const body = await c.req.json();

    // Check if user is authenticated and admin
    if (!user || !user.email) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!isAdmin(user.email)) {
      return c.json({ error: 'Forbidden - Only admins can change passwords' }, 403);
    }

    const { newPassword } = body;

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return c.json(
        { error: 'Password must be at least 6 characters' },
        400
      );
    }

    // Check if user exists
    const userResult = await pool.query(
      'SELECT email FROM auth_users WHERE id = $1',
      [targetUserId]
    );

    if ((userResult.rowCount ?? 0) === 0) {
      return c.json({ error: 'User not found' }, 404);
    }

    const targetUserEmail = userResult.rows[0].email;

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in auth_accounts
    const updateResult = await pool.query(
      `UPDATE auth_accounts 
       SET password = $1 
       WHERE "userId" = $2 AND provider = 'credentials'
       RETURNING "userId"`,
      [hashedPassword, targetUserId]
    );

    if ((updateResult.rowCount ?? 0) === 0) {
      // No credentials account exists, create one
      await pool.query(
        `INSERT INTO auth_accounts ("userId", provider, password)
         VALUES ($1, 'credentials', $2)`,
        [targetUserId, hashedPassword]
      );
    }

    console.log(`[Admin] Password changed by ${user.email} for user: ${targetUserEmail}`);

    return c.json({
      success: true,
      message: `Password updated for ${targetUserEmail}`,
    });
  } catch (error) {
    console.error('[Admin] Error changing password:', error);
    return c.json({ error: 'Failed to change password' }, 500);
  }
}

/**
 * Reset user's app data to 0 (Admin only)
 * POST /api/admin/users/:userId/reset-data
 * Deletes all user's app data (products, transactions, orders, etc.)
 * Keeps auth data intact (user can still login)
 */
export async function resetUserDataHandler(
  c: Context,
  pool: Pool
): Promise<Response> {
  try {
    const user = c.get('user');
    const targetUserId = c.req.param('userId');

    // Check if user is authenticated and admin
    if (!user || !user.email) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!isAdmin(user.email)) {
      return c.json({ error: 'Forbidden - Only admins can reset user data' }, 403);
    }

    // Check if user exists
    const userResult = await pool.query(
      'SELECT email FROM auth_users WHERE id = $1',
      [targetUserId]
    );

    if ((userResult.rowCount ?? 0) === 0) {
      return c.json({ error: 'User not found' }, 404);
    }

    const targetUserEmail = userResult.rows[0].email;

    // Delete all app data for this user
    await pool.query('DELETE FROM products WHERE user_id = $1', [targetUserId]);
    await pool.query('DELETE FROM transactions WHERE user_id = $1', [targetUserId]);
    await pool.query('DELETE FROM orders WHERE user_id = $1', [targetUserId]);
    await pool.query('DELETE FROM customers WHERE user_id = $1', [targetUserId]);
    await pool.query('DELETE FROM debts WHERE user_id = $1', [targetUserId]);
    await pool.query('DELETE FROM product_templates WHERE user_id = $1', [targetUserId]);
    
    // Reset wallets to 0
    await pool.query(
      `UPDATE wallets 
       SET cash = 0, bank = 0 
       WHERE user_id = $1`,
      [targetUserId]
    );

    console.log(`[Admin] User data reset by ${user.email} for user: ${targetUserEmail}`);

    return c.json({
      success: true,
      message: `All app data deleted for ${targetUserEmail}. Account is still active.`,
    });
  } catch (error) {
    console.error('[Admin] Error resetting user data:', error);
    return c.json({ error: 'Failed to reset user data' }, 500);
  }
}
