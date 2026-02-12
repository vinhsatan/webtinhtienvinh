// PUT /api/transactions/:id - Update transaction (dùng cho thanh toán Ứng hàng, cập nhật remainingAmount, needsPayment...)
export async function PUT(c) {
  try {
    const user = c.get('user');

    const id = c.req.param('id');
    const body = await c.req.json();

    const pool = c.get('pool') ?? globalThis.dbPool;
    if (!pool) {
      return c.json({ error: 'Database not available' }, 500);
    }

    const checkResult = await pool.query(
      'SELECT id FROM transactions WHERE id = $1 AND user_id = $2',
      [id, user.userId]
    );

    if (checkResult.rows.length === 0) {
      return c.json({ error: 'Transaction not found' }, 404);
    }

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (body.date !== undefined) {
      updates.push(`date = $${paramIndex++}`);
      values.push(body.date);
    }
    if (body.type !== undefined) {
      updates.push(`type = $${paramIndex++}`);
      values.push(body.type);
    }
    if (body.amount !== undefined) {
      updates.push(`amount = $${paramIndex++}`);
      values.push(Number(body.amount));
    }
    if (body.wallet !== undefined) {
      updates.push(`wallet = $${paramIndex++}`);
      values.push(body.wallet);
    }
    if (body.category !== undefined) {
      updates.push(`category = $${paramIndex++}`);
      values.push(body.category);
    }
    if (body.note !== undefined) {
      updates.push(`note = $${paramIndex++}`);
      values.push(body.note);
    }
    if (body.needsPayment !== undefined) {
      updates.push(`needs_payment = $${paramIndex++}`);
      values.push(!!body.needsPayment);
    }
    if (body.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(body.status);
    }
    if (body.remainingAmount !== undefined) {
      updates.push(`remaining_amount = $${paramIndex++}`);
      values.push(body.remainingAmount != null ? Number(body.remainingAmount) : null);
    }
    if (body.remainingQuantity !== undefined) {
      updates.push(`remaining_quantity = $${paramIndex++}`);
      values.push(body.remainingQuantity != null ? Number(body.remainingQuantity) : null);
    }

    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }

    values.push(id, user.userId);
    const result = await pool.query(
      `UPDATE transactions SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
       RETURNING *`,
      values
    );

    const broadcast = c.get('broadcastToUser') ?? globalThis.broadcastToUser;
    if (broadcast) broadcast(user.userId, { type: 'transaction_updated', data: result.rows[0] });

    return c.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating transaction:', error);
    return c.json({ error: 'Failed to update transaction' }, 500);
  }
}

// DELETE /api/transactions/:id - Delete transaction
export async function DELETE(c) {
  try {
    const user = c.get('user');

    const id = c.req.param('id');

    const pool = c.get('pool') ?? globalThis.dbPool;
    if (!pool) {
      return c.json({ error: 'Database not available' }, 500);
    }

    const result = await pool.query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, user.userId]
    );

    if (result.rows.length === 0) {
      return c.json({ error: 'Transaction not found' }, 404);
    }

    const broadcast = c.get('broadcastToUser') ?? globalThis.broadcastToUser;
    if (broadcast) broadcast(user.userId, { type: 'transaction_deleted', data: { id: parseInt(id) } });

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return c.json({ error: 'Failed to delete transaction' }, 500);
  }
}
