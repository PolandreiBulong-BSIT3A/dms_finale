import express from 'express';
import db from '../connections/connection.js';

const router = express.Router();

// Normalize params safely
const norm = (v) => (v == null ? '' : String(v).trim());

// GET /others
// Optional query: category, name
router.get('/others', async (req, res) => {
  try {
    const category = norm(req.query.category);
    const name = norm(req.query.name);

    let sql = `
      SELECT o.other_id, o.other_name, o.category, o.link,
             o.created_by_user_id, o.updated_by_user_id,
             cu.user_email AS created_by_email, uu.user_email AS updated_by_email,
             o.created_at, o.updated_at
      FROM others o
      LEFT JOIN dms_user cu ON cu.user_id = o.created_by_user_id
      LEFT JOIN dms_user uu ON uu.user_id = o.updated_by_user_id
    `;
    const params = [];
    const where = [];

    if (category) { where.push('category = ?'); params.push(category); }
    if (name) { where.push('other_name = ?'); params.push(name); }
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' ORDER BY other_id ASC';

    const [rows] = await db.promise().execute(sql, params);
    return res.json({ success: true, items: rows });
  } catch (error) {
    console.error('Error fetching others:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch resources' });
  }
});

// GET /others/:category
router.get('/others/:category', async (req, res) => {
  try {
    const category = norm(req.params.category);
    const [rows] = await db.promise().execute(
      `SELECT other_id, other_name, category, link FROM others WHERE category = ? ORDER BY other_id ASC`,
      [category]
    );
    return res.json({ success: true, items: rows });
  } catch (error) {
    console.error('Error fetching others by category:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch resources' });
  }
});

// GET /others/:category/:name
router.get('/others/:category/:name', async (req, res) => {
  try {
    const category = norm(req.params.category);
    const name = norm(req.params.name);
    const [rows] = await db.promise().execute(
      `SELECT other_id, other_name, category, link FROM others WHERE category = ? AND other_name = ? LIMIT 1`,
      [category, name]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }
    return res.json({ success: true, item: rows[0] });
  } catch (error) {
    console.error('Error fetching other by key:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch resource' });
  }
});

// POST /others - Create new resource
router.post('/others', async (req, res) => {
  try {
    const { other_name, category, link } = req.body;
    
    if (!other_name || !category) {
      return res.status(400).json({ success: false, message: 'Name and category are required' });
    }

    // Check if already exists
    const [existing] = await db.promise().execute(
      'SELECT other_id FROM others WHERE category = ? AND other_name = ?',
      [category, other_name]
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Resource with this name already exists in this category' });
    }

    const [result] = await db.promise().execute(
      'INSERT INTO others (other_name, category, link) VALUES (?, ?, ?)',
      [other_name, category, link || null]
    );

    const [newItem] = await db.promise().execute(
      'SELECT other_id, other_name, category, link, created_at FROM others WHERE other_id = ?',
      [result.insertId]
    );

    return res.json({ success: true, message: 'Resource created successfully', item: newItem[0] });
  } catch (error) {
    console.error('Error creating resource:', error);
    return res.status(500).json({ success: false, message: 'Failed to create resource' });
  }
});

// PUT /others/:id - Update resource
router.put('/others/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { other_name, category, link } = req.body;

    if (!other_name || !category) {
      return res.status(400).json({ success: false, message: 'Name and category are required' });
    }

    // Check if exists
    const [existing] = await db.promise().execute(
      'SELECT other_id FROM others WHERE other_id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    // Check for duplicate name in same category (excluding current item)
    const [duplicate] = await db.promise().execute(
      'SELECT other_id FROM others WHERE category = ? AND other_name = ? AND other_id != ?',
      [category, other_name, id]
    );

    if (duplicate.length > 0) {
      return res.status(400).json({ success: false, message: 'Resource with this name already exists in this category' });
    }

    await db.promise().execute(
      'UPDATE others SET other_name = ?, category = ?, link = ? WHERE other_id = ?',
      [other_name, category, link || null, id]
    );

    const [updated] = await db.promise().execute(
      'SELECT other_id, other_name, category, link, updated_at FROM others WHERE other_id = ?',
      [id]
    );

    return res.json({ success: true, message: 'Resource updated successfully', item: updated[0] });
  } catch (error) {
    console.error('Error updating resource:', error);
    return res.status(500).json({ success: false, message: 'Failed to update resource' });
  }
});

// DELETE /others/:id - Delete resource
router.delete('/others/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if exists
    const [existing] = await db.promise().execute(
      'SELECT other_id FROM others WHERE other_id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    await db.promise().execute('DELETE FROM others WHERE other_id = ?', [id]);

    return res.json({ success: true, message: 'Resource deleted successfully' });
  } catch (error) {
    console.error('Error deleting resource:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete resource' });
  }
});

export default router;
