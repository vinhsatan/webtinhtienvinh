// GET /api/categories - Get categories for current user (grouped by type)
export async function GET(c) {
  try {
    const user = c.get('user');

    const pool = c.get('pool') ?? globalThis.dbPool;
    if (!pool) {
      return c.json({ error: 'Database not available' }, 500);
    }

    const result = await pool.query(
      'SELECT * FROM categories WHERE user_id = $1 ORDER BY type, name',
      [user.userId]
    );

    const income = [];
    const expense = [];
    const nhap = [];

    for (const row of result.rows) {
      const item = {
        id: row.id,
        name: row.name,
        type: row.type,
      };
      if (row.type === 'income') income.push(item);
      else if (row.type === 'expense') expense.push(item);
      else if (row.type === 'nhap') nhap.push(item);
    }

    return c.json({
      success: true,
      data: { income, expense, nhap },
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return c.json({ error: 'Failed to fetch categories' }, 500);
  }
}

// POST /api/categories - Add new category for current user
export async function POST(c) {
  try {
    const user = c.get('user');

    const pool = c.get('pool') ?? globalThis.dbPool;
    if (!pool) {
      return c.json({ error: 'Database not available' }, 500);
    }

    const body = await c.req.json();
    const { name, type } = body;

    if (!name || !type) {
      return c.json({ error: 'Missing required fields: name, type' }, 400);
    }

    const validTypes = ['income', 'expense', 'nhap'];
    if (!validTypes.includes(type)) {
      return c.json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` }, 400);
    }

    const result = await pool.query(
      'INSERT INTO categories (user_id, name, type) VALUES ($1, $2, $3) RETURNING id, name, type',
      [user.userId, name, type]
    );

    const row = result.rows[0];
    return c.json({
      success: true,
      data: {
        id: row.id,
        name: row.name,
        type: row.type,
      },
    }, 201);
  } catch (error) {
    console.error('Error adding category:', error);
    return c.json({ error: 'Failed to add category' }, 500);
  }
}
