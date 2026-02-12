// GET /api/wallets - Get wallet balances for current user
export async function GET(c) {
  try {
    const user = c.get('user');

    const pool = c.get('pool') ?? globalThis.dbPool;
    if (!pool) {
      return c.json({ error: 'Database not available' }, 500);
    }

    const result = await pool.query(
      'SELECT balance FROM wallets WHERE user_id = $1 LIMIT 1',
      [user.userId]
    );

    if (result.rows.length === 0) {
      // Create default wallet if not exists
      await pool.query(
        'INSERT INTO wallets (user_id, name, balance) VALUES ($1, $2, 0)',
        [user.userId, 'Ví chính']
      );
      return c.json({ success: true, data: { balance: 0 } });
    }

    const row = result.rows[0];
    return c.json({
      success: true,
      data: {
        balance: parseFloat(row.balance) || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching wallets:', error);
    return c.json({ error: 'Failed to fetch wallets' }, 500);
  }
}
