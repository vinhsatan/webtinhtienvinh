// GET /api/customers - Get all customers for current user
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
      'SELECT * FROM customers WHERE user_id = $1 ORDER BY updated_at DESC',
      [user.userId]
    );

    return c.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return c.json({ error: 'Failed to fetch customers' }, 500);
  }
}
