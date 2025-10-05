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

export default router;
