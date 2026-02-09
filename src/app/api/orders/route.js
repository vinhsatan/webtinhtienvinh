// GET /api/orders - Get all orders for current user
export async function GET(c) {
  try {
    const user = c.get('user');
    if (!user || !user.userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const pool = c.get('pool') ?? globalThis.dbPool;
    if (!pool) {
      return c.json({ error: 'Database not available' }, 500);
    }

    const result = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC, updated_at DESC',
      [user.userId]
    );

    return c.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return c.json({ error: 'Failed to fetch orders' }, 500);
  }
}
