// DELETE /api/categories/:id - Delete category (only if not used in transactions)
export async function DELETE(c) {
  try {
    const user = c.get('user');
    if (!user || !user.userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const pool = c.get('pool') ?? globalThis.dbPool;
    if (!pool) {
      return c.json({ error: 'Database not available' }, 500);
    }

    const categoryId = c.req.param('id');
    if (!categoryId) {
      return c.json({ error: 'Missing category ID' }, 400);
    }

    // Check if category is used in any transactions
    const usageCheck = await pool.query(
      'SELECT COUNT(*) as count FROM transactions WHERE user_id = $1 AND category = $2',
      [user.userId, categoryId]
    );

    const usageCount = parseInt(usageCheck.rows[0]?.count || 0);
    if (usageCount > 0) {
      return c.json({
        error: `Cannot delete category - it is used in ${usageCount} transaction(s)`,
        usageCount,
      }, 409);
    }

    // Delete the category
    const result = await pool.query(
      'DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING id',
      [categoryId, user.userId]
    );

    if (result.rows.length === 0) {
      return c.json({ error: 'Category not found or already deleted' }, 404);
    }

    return c.json({
      success: true,
      message: 'Category deleted successfully',
      data: { id: result.rows[0].id },
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return c.json({ error: 'Failed to delete category' }, 500);
  }
}
