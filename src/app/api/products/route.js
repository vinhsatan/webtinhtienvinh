// POST /api/products - Create new product
export async function POST(c) {
  try {
    const user = c.get('user');

    const body = await c.req.json();
    const {
      name,
      cost = 0,
      price,
      wholesalePrice,
      tiktokPrice,
      shopeePrice,
      quantity = 0,
    } = body;

    if (!name || !price) {
      return Response.json({ error: 'Name and price are required' }, { status: 400 });
    }

    const pool = c.get('pool') ?? globalThis.dbPool;
    if (!pool) {
      return c.json({ error: 'Database not available' }, 500);
    }

    const result = await pool.query(
      `INSERT INTO products (user_id, name, cost, price, wholesale_price, tiktok_price, shopee_price, quantity)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [user.userId, name, cost, price, wholesalePrice || null, tiktokPrice || null, shopeePrice || null, quantity]
    );

    // Broadcast update to WebSocket clients
    const broadcast = c.get('broadcastToUser') ?? globalThis.broadcastToUser;
    if (broadcast) broadcast(user.userId, { type: 'product_added', data: result.rows[0] });

    return c.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating product:', error);
    return c.json({ error: 'Failed to create product' }, 500);
  }
}

// PUT /api/products/:id - Update product
export async function PUT(c) {
  try {
    const user = c.get('user');

    const { id } = c.req.param('id');
    const body = await c.req.json();

    const pool = c.get('pool') ?? globalThis.dbPool;
    if (!pool) {
      return c.json({ error: 'Database not available' }, 500);
    }

    // Check ownership
    const checkResult = await pool.query(
      'SELECT id FROM products WHERE id = $1 AND user_id = $2',
      [id, user.userId]
    );

    if (checkResult.rows.length === 0) {
      return c.json({ error: 'Product not found' }, 404);
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (body.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(body.name);
    }
    if (body.cost !== undefined) {
      updates.push(`cost = $${paramIndex++}`);
      values.push(body.cost);
    }
    if (body.price !== undefined) {
      updates.push(`price = $${paramIndex++}`);
      values.push(body.price);
    }
    if (body.wholesalePrice !== undefined) {
      updates.push(`wholesale_price = $${paramIndex++}`);
      values.push(body.wholesalePrice);
    }
    if (body.tiktokPrice !== undefined) {
      updates.push(`tiktok_price = $${paramIndex++}`);
      values.push(body.tiktokPrice);
    }
    if (body.shopeePrice !== undefined) {
      updates.push(`shopee_price = $${paramIndex++}`);
      values.push(body.shopeePrice);
    }
    if (body.quantity !== undefined) {
      updates.push(`quantity = $${paramIndex++}`);
      values.push(body.quantity);
    }

    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }

    values.push(id, user.userId);
    const result = await pool.query(
      `UPDATE products SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
       RETURNING *`,
      values
    );

    // Broadcast update
    const broadcast = c.get('broadcastToUser') ?? globalThis.broadcastToUser;
    if (broadcast) broadcast(user.userId, { type: 'product_updated', data: result.rows[0] });

    return c.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating product:', error);
    return c.json({ error: 'Failed to update product' }, 500);
  }
}

// DELETE /api/products/:id - Delete product
export async function DELETE(c) {
  try {
    const user = c.get('user');

    const { id } = c.req.param('id');

    const pool = c.get('pool') ?? globalThis.dbPool;
    if (!pool) {
      return c.json({ error: 'Database not available' }, 500);
    }

    const result = await pool.query(
      'DELETE FROM products WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, user.userId]
    );

    if (result.rows.length === 0) {
      return c.json({ error: 'Product not found' }, 404);
    }

    // Broadcast update
    const broadcast = c.get('broadcastToUser') ?? globalThis.broadcastToUser;
    if (broadcast) broadcast(user.userId, { type: 'product_deleted', data: { id: parseInt(id) } });

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return c.json({ error: 'Failed to delete product' }, 500);
  }
}

// Helper function to broadcast to WebSocket clients (will be implemented)
function broadcastToUser(userId, message) {
  if (globalThis.wsClients) {
    const clients = globalThis.wsClients.get(userId) || [];
    clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify(message));
      }
    });
  }
}
