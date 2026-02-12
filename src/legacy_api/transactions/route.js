// GET /api/transactions - Get all transactions for current user
export async function GET(c) {
  try {
    const user = c.get('user');

    const pool = c.get('pool') ?? globalThis.dbPool;
    if (!pool) {
      return c.json({ error: 'Database not available' }, 500);
    }

    const result = await pool.query(
      'SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC, updated_at DESC',
      [user.userId]
    );

    return c.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return c.json({ error: 'Failed to fetch transactions' }, 500);
  }
}

// POST /api/transactions - Create new transaction
export async function POST(c) {
  try {
    const user = c.get('user');

    const body = await c.req.json();
    const {
      date,
      type = 'income',
      amount,
      cost,
      wallet = 'cash',
      category,
      note,
      party,
      creditor,
      linkedOrderId,
      needsPayment = false,
      status = 'completed',
      originalAmount,
      remainingAmount,
      originalQuantity,
      remainingQuantity,
      orderItems,
      isReconciliation = false,
    } = body;

    if (!date || amount == null) {
      return c.json({ error: 'Date and amount are required' }, 400);
    }

    const pool = c.get('pool') ?? globalThis.dbPool;
    if (!pool) {
      return c.json({ error: 'Database not available' }, 500);
    }

    const result = await pool.query(
      `INSERT INTO transactions (user_id, date, type, amount, cost, wallet, category, note, party, creditor,
        linked_order_id, needs_payment, status, original_amount, remaining_amount,
        original_quantity, remaining_quantity, order_items, is_reconciliation)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
       RETURNING *`,
      [
        user.userId,
        date,
        type,
        Number(amount),
        cost != null ? Number(cost) : null,
        wallet,
        category || null,
        note || null,
        party || null,
        creditor || null,
        linkedOrderId || null,
        !!needsPayment,
        status || 'completed',
        originalAmount != null ? Number(originalAmount) : null,
        remainingAmount != null ? Number(remainingAmount) : null,
        originalQuantity != null ? Number(originalQuantity) : null,
        remainingQuantity != null ? Number(remainingQuantity) : null,
        orderItems ? JSON.stringify(orderItems) : null,
        !!isReconciliation,
      ]
    );

    const broadcast = c.get('broadcastToUser') ?? globalThis.broadcastToUser;
    if (broadcast) broadcast(user.userId, { type: 'transaction_added', data: result.rows[0] });

    return c.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return c.json({ error: 'Failed to create transaction' }, 500);
  }
}
