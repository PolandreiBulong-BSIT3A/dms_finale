import express from 'express';
import db from '../connections/connection.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Rate limiting can be added here if needed in the future

// Test endpoint to verify router is working
router.get('/test', (req, res) => {
  res.json({ message: 'Document Preferences API is working!' });
});

// Debug endpoint to check authentication
router.get('/debug', (req, res) => {
  res.json({ 
    message: 'Debug info',
    user: req.user,
    session: req.session,
    hasUser: !!req.user,
    hasSession: !!req.session
  });
});

// Helper function to get database connection
const getConnection = () => {
  return db.promise();
};

// Ensure unique index on preferences (user_id, doc_id)
const ensurePreferencesIndex = async () => {
  try {
    const [idx] = await db.promise().execute(
      `SELECT 1 FROM information_schema.statistics
       WHERE table_schema = DATABASE()
         AND table_name = 'user_document_preferences'
         AND index_name = 'uniq_user_doc_pref'`
    );
    if (idx.length === 0) {
      await db.promise().execute('CREATE UNIQUE INDEX uniq_user_doc_pref ON user_document_preferences (user_id, doc_id)');
    }
  } catch (e) {
    console.warn('ensurePreferencesIndex warning:', e?.message || e);
  }
};

ensurePreferencesIndex();

// Helper function to get current user ID from authenticated request
const getCurrentUserId = (req) => {
  // Use the authenticated user from requireAuth middleware
  if (req.currentUser && req.currentUser.user_id) {
    return req.currentUser.user_id;
  }
  
  if (req.currentUser && req.currentUser.id) {
    return req.currentUser.id;
  }
  
  // Fallback to session-based authentication
  if (req.user && req.user.user_id) {
    return req.user.user_id;
  }
  
  if (req.session && req.session.user_id) {
    return req.session.user_id;
  }
  
  if (req.session && req.session.passport && req.session.passport.user) {
    return req.session.passport.user;
  }
  
  // This should not happen if requireAuth middleware is working properly
  console.error('No authenticated user found in DocumentPreferencesAPI');
  throw new Error('User not authenticated');
};

// GET /api/documents/preferences - Get user's document preferences
router.get('/documents/preferences', requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const connection = getConnection();

    const [rows] = await connection.execute(
      'SELECT doc_id, is_favorite, is_pinned FROM user_document_preferences WHERE user_id = ?',
      [userId]
    );

    res.json({
      success: true,
      preferences: rows
    });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user preferences',
      error: error.message
    });
  }
});

// POST /api/documents/:docId/favorite - Toggle favorite status
router.post('/documents/:docId/favorite', requireAuth, async (req, res) => {
  console.log('Favorite toggle request received:', req.params.docId);
  console.log('Request body:', req.body);
  console.log('Request headers:', req.headers);
  
  try {
    const userId = getCurrentUserId(req);
    const docId = req.params.docId;
    const connection = getConnection();

    // Check if document exists
    const [docRows] = await connection.execute(
      'SELECT doc_id FROM dms_documents WHERE doc_id = ? AND deleted = 0',
      [docId]
    );

    if (docRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if preference already exists
    const [existingRows] = await connection.execute(
      'SELECT * FROM user_document_preferences WHERE user_id = ? AND doc_id = ?',
      [userId, docId]
    );

    if (existingRows.length > 0) {
      // Update existing preference
      const newFavoriteStatus = !existingRows[0].is_favorite;
      await connection.execute(
        'UPDATE user_document_preferences SET is_favorite = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND doc_id = ?',
        [newFavoriteStatus, userId, docId]
      );
    } else {
      // Create new preference
      await connection.execute(
        'INSERT INTO user_document_preferences (user_id, doc_id, is_favorite, is_pinned) VALUES (?, ?, 1, 0)',
        [userId, docId]
      );
    }

    res.json({
      success: true,
      message: 'Favorite status updated successfully'
    });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle favorite status',
      error: error.message
    });
  }
});

// POST /api/documents/:docId/pin - Toggle pin status
router.post('/documents/:docId/pin', requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const docId = req.params.docId;
    const connection = getConnection();

    // Check if document exists
    const [docRows] = await connection.execute(
      'SELECT doc_id FROM dms_documents WHERE doc_id = ? AND deleted = 0',
      [docId]
    );

    if (docRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if preference already exists
    const [existingRows] = await connection.execute(
      'SELECT * FROM user_document_preferences WHERE user_id = ? AND doc_id = ?',
      [userId, docId]
    );

    if (existingRows.length > 0) {
      // Update existing preference
      const newPinStatus = !existingRows[0].is_pinned;
      await connection.execute(
        'UPDATE user_document_preferences SET is_pinned = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND doc_id = ?',
        [newPinStatus, userId, docId]
      );
    } else {
      // Create new preference
      await connection.execute(
        'INSERT INTO user_document_preferences (user_id, doc_id, is_favorite, is_pinned) VALUES (?, ?, 0, 1)',
        [userId, docId]
      );
    }

    res.json({
      success: true,
      message: 'Pin status updated successfully'
    });
  } catch (error) {
    console.error('Error toggling pin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle pin status',
      error: error.message
    });
  }
});

// GET /api/documents/favorites - Get user's favorite documents
router.get('/documents/favorites', requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    console.log('Favorites API - User ID:', userId);
    console.log('Favorites API - Current User:', req.currentUser);
    const connection = getConnection();

    const [rows] = await connection.execute(`
      SELECT 
        d.doc_id,
        d.title,
        d.reference,
        d.from_field,
        d.to_field,
        d.date_received,
        d.google_drive_link,
        d.description,
        d.doc_type,
        d.created_at,
        d.updated_at,
        d.created_by_name,
        d.visible_to_all,
        d.allowed_user_ids,
        d.allowed_roles,
        d.visibility,
        d.target_users,
        d.target_roles,
        d.target_role_dept,
        udp.is_favorite,
        udp.is_pinned
      FROM dms_documents d
      INNER JOIN user_document_preferences udp ON d.doc_id = udp.doc_id
      WHERE udp.user_id = ? AND udp.is_favorite = 1 AND d.deleted = 0
      ORDER BY udp.is_pinned DESC, d.created_at DESC
    `, [userId]);

    console.log('Favorites API - Found favorites:', rows.length);
    console.log('Favorites API - Favorites data:', rows);

    res.json({
      success: true,
      favorites: rows
    });
  } catch (error) {
    console.error('Error fetching favorite documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch favorite documents',
      error: error.message
    });
  }
});

// DELETE /api/documents/:docId/favorite - Remove from favorites
router.delete('/documents/:docId/favorite', requireAuth, async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const docId = req.params.docId;
    const connection = getConnection();

    // Update the preference to remove favorite status
    const [result] = await connection.execute(
      'UPDATE user_document_preferences SET is_favorite = 0, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND doc_id = ?',
      [userId, docId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found in favorites'
      });
    }

    res.json({
      success: true,
      message: 'Document removed from favorites successfully'
    });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove from favorites',
      error: error.message
    });
  }
});

export default router;
