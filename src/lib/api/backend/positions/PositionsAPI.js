import express from 'express';
import db from '../connections/connection.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/positions - Get all positions (with optional filters)
router.get('/positions', requireAuth, async (req, res) => {
  try {
    const { role_type, is_active } = req.query;
    
    let sql = 'SELECT * FROM positions WHERE 1=1';
    const values = [];
    
    // Filter by role type
    if (role_type) {
      sql += ' AND (role_type = ? OR role_type = "ALL")';
      values.push(role_type);
    }
    
    // Filter by active status
    if (is_active !== undefined) {
      sql += ' AND is_active = ?';
      values.push(is_active === 'true' || is_active === '1' ? 1 : 0);
    }
    
    sql += ' ORDER BY role_type, name';
    
    const [rows] = await db.promise().query(sql, values);
    
    res.json({
      success: true,
      positions: rows,
      count: rows.length
    });
  } catch (error) {
    console.error('Error fetching positions:', error);
    res.status(500).json({ success: false, message: 'Database error.' });
  }
});

// GET /api/positions/:id - Get single position
router.get('/positions/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.promise().query(
      'SELECT * FROM positions WHERE position_id = ?',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Position not found.' });
    }
    
    res.json({
      success: true,
      position: rows[0]
    });
  } catch (error) {
    console.error('Error fetching position:', error);
    res.status(500).json({ success: false, message: 'Database error.' });
  }
});

// POST /api/positions - Create new position (Admin only)
router.post('/positions', requireAdmin, async (req, res) => {
  try {
    const { name, description, role_type, is_active } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Position name is required.' });
    }
    
    // Check if position name already exists
    const [existing] = await db.promise().query(
      'SELECT position_id FROM positions WHERE name = ?',
      [name.trim()]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Position name already exists.' });
    }
    
    const sql = `
      INSERT INTO positions (name, description, role_type, is_active)
      VALUES (?, ?, ?, ?)
    `;
    
    const [result] = await db.promise().query(sql, [
      name.trim(),
      description || null,
      role_type || 'ALL',
      is_active !== undefined ? (is_active ? 1 : 0) : 1
    ]);
    
    res.json({
      success: true,
      message: 'Position created successfully.',
      position_id: result.insertId
    });
  } catch (error) {
    console.error('Error creating position:', error);
    res.status(500).json({ success: false, message: 'Database error.' });
  }
});

// PUT /api/positions/:id - Update position (Admin only)
router.put('/positions/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, role_type, is_active } = req.body;
    
    // Check if position exists
    const [existing] = await db.promise().query(
      'SELECT position_id FROM positions WHERE position_id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Position not found.' });
    }
    
    const fields = [];
    const values = [];
    
    if (name !== undefined && name.trim()) {
      // Check if new name conflicts with another position
      const [conflict] = await db.promise().query(
        'SELECT position_id FROM positions WHERE name = ? AND position_id != ?',
        [name.trim(), id]
      );
      
      if (conflict.length > 0) {
        return res.status(400).json({ success: false, message: 'Position name already exists.' });
      }
      
      fields.push('name = ?');
      values.push(name.trim());
    }
    
    if (description !== undefined) {
      fields.push('description = ?');
      values.push(description || null);
    }
    
    if (role_type !== undefined) {
      fields.push('role_type = ?');
      values.push(role_type);
    }
    
    if (is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(is_active ? 1 : 0);
    }
    
    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update.' });
    }
    
    const sql = `UPDATE positions SET ${fields.join(', ')} WHERE position_id = ?`;
    values.push(id);
    
    await db.promise().query(sql, values);
    
    res.json({
      success: true,
      message: 'Position updated successfully.'
    });
  } catch (error) {
    console.error('Error updating position:', error);
    res.status(500).json({ success: false, message: 'Database error.' });
  }
});

// DELETE /api/positions/:id - Delete position (Admin only)
router.delete('/positions/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if position exists
    const [existing] = await db.promise().query(
      'SELECT position_id, name FROM positions WHERE position_id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Position not found.' });
    }
    
    // Check if position is being used by any users
    const [users] = await db.promise().query(
      'SELECT COUNT(*) as count FROM dms_user WHERE position = ?',
      [existing[0].name]
    );
    
    if (users[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete position. ${users[0].count} user(s) are assigned to this position.` 
      });
    }
    
    await db.promise().query('DELETE FROM positions WHERE position_id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Position deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting position:', error);
    res.status(500).json({ success: false, message: 'Database error.' });
  }
});

export default router;
