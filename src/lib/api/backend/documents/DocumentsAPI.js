/* eslint-disable no-unused-vars */
import express from 'express';
import db from '../connections/connection.js';
import { requireAuth } from '../middleware/authMiddleware.js';

// Ensure join table for multi-folder support exists
const ensureDocumentFoldersTable = async () => {
  try {
    await db.promise().query(`
      CREATE TABLE IF NOT EXISTS document_folders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        doc_id INT NOT NULL,
        folder_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY idx_doc (doc_id),
        KEY idx_folder (folder_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  } catch (e) {
    console.warn('ensureDocumentFoldersTable failed:', e?.message || e);
  }
};
ensureDocumentFoldersTable();

const router = express.Router();

const normalizeRole = (role) => (role || '').toString().trim().toLowerCase();
const isDeanRole = (role) => normalizeRole(role) === 'dean';

const buildVisibleToAllClause = (column = 'd.visible_to_all') => `
  (
    CASE
      WHEN COALESCE(${column}, 0) = 1 THEN 1
      WHEN LOWER(TRIM(COALESCE(${column}, ''))) IN ('1', 'true', 'yes', 'all', 'public', 'everyone') THEN 1
      WHEN ${column} = true THEN 1
      ELSE 0
    END = 1
  )
`;

const buildDepartmentMatchClause = (departmentColumnAlias = 'dd') => `
  (
    ${departmentColumnAlias}.department_id = ?
  )
`;

// Helper to consistently derive a display name for the current user
const deriveUserName = (u) => (
  u?.Username ||
  u?.username ||
  ((u?.firstname && u?.lastname) ? `${u.firstname} ${u.lastname}` : null) ||
  u?.name ||
  u?.email ||
  null
);

// Map requireAuth's req.currentUser to req.user for downstream consistency
router.use((req, _res, next) => {
  if (!req.user && req.currentUser) {
    req.user = req.currentUser;
  }
  next();
});

// Enrich req.user with DB fields and normalize role casing (matches AnnouncementsAPI behavior)
router.use(async (req, _res, next) => {
  try {
    const uid = req.user?.id || req.currentUser?.id;
    if (!uid) return next();
    // If we already have rich fields, skip
    if (req.user?.Username && req.user?.profile_pic) return next();
    const [rows] = await db.promise().query(
      'SELECT user_id, Username, firstname, lastname, role, department_id, profile_pic FROM dms_user WHERE user_id = ? LIMIT 1',
      [uid]
    );
    if (rows && rows[0]) {
      const u = rows[0];
      const normalizedRole = String(req.user?.role || u.role || '').toUpperCase();
      const normalizeDepartmentId = (value) => {
        if (value === undefined || value === null || value === '') return null;
        const asNumber = Number(value);
        return Number.isNaN(asNumber) ? String(value).trim() : asNumber;
      };
      let departmentId = normalizeDepartmentId(
        u.department_id ?? req.user?.department_id ?? req.user?.department ?? req.currentUser?.department_id
      );
      if (typeof departmentId === 'string' && departmentId) {
        const depStr = departmentId.trim();
        // If numeric-like string, coerce to number
        const maybeNum = Number(depStr);
        if (!Number.isNaN(maybeNum)) {
          departmentId = maybeNum;
        } else {
          // Try match by name OR code (case-insensitive)
          let [deptRows] = await db.promise().query(
            'SELECT department_id FROM departments WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) OR LOWER(TRIM(code)) = LOWER(TRIM(?)) LIMIT 1',
            [depStr, depStr]
          );
          if (!deptRows || deptRows.length === 0) {
            // Fuzzy match: tolerate additional words (e.g., "College of Teacher Education") and spacing
            [deptRows] = await db.promise().query(
              'SELECT department_id FROM departments WHERE LOWER(name) LIKE LOWER(CONCAT("%", TRIM(?), "%")) OR LOWER(code) LIKE LOWER(CONCAT("%", TRIM(?), "%")) LIMIT 1',
              [depStr, depStr]
            );
          }
          if (deptRows && deptRows[0]?.department_id != null) {
            departmentId = Number(deptRows[0].department_id);
          } else {
            departmentId = null;
          }
        }
      } else if (typeof departmentId === 'number' && departmentId) {
        // Verify that the numeric departmentId exists; if not, attempt fallback by name/code from token/session
        try {
          const [existsRows] = await db.promise().query('SELECT 1 FROM departments WHERE department_id = ? LIMIT 1', [departmentId]);
          if (!Array.isArray(existsRows) || existsRows.length === 0) {
            const depStr = (req.currentUser?.department || req.user?.department || '').toString().trim();
            if (depStr) {
              let [deptRows] = await db.promise().query(
                'SELECT department_id FROM departments WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) OR LOWER(TRIM(code)) = LOWER(TRIM(?)) LIMIT 1',
                [depStr, depStr]
              );
              if (!deptRows || deptRows.length === 0) {
                [deptRows] = await db.promise().query(
                  'SELECT department_id FROM departments WHERE LOWER(name) LIKE LOWER(CONCAT("%", TRIM(?), "%")) OR LOWER(code) LIKE LOWER(CONCAT("%", TRIM(?), "%")) LIMIT 1',
                  [depStr, depStr]
                );
              }
              if (deptRows && deptRows[0]?.department_id != null) {
                departmentId = Number(deptRows[0].department_id);
              } else {
                departmentId = null;
              }
            }
          }
        } catch (_) {
          // ignore fallback errors
        }
      }

      req.user = {
        ...req.user,
        id: u.user_id,
        Username: u.Username,
        firstname: u.firstname,
        lastname: u.lastname,
        role: normalizedRole,
        department_id: departmentId,
        profile_pic: u.profile_pic,
      };

      req.currentUser = {
        ...req.currentUser,
        id: req.user.id,
        user_id: req.user.id,
        username: req.user.Username ?? req.currentUser?.username,
        role: normalizedRole,
        department_id: departmentId,
        department: departmentId ?? req.currentUser?.department,
      };
    }
  } catch (authError) {
    console.error('Auth middleware error:', authError);
    // noop
  }
  next();
});

// Local helper to create a notification (scoped)
// audience: { visibleToAll?: boolean, departments?: number[], roles?: string[], users?: (number|string)[] }
const createNotification = async (title, message, type, relatedDocId = null, audience = {}) => {
  try {
    const visibleToAll = audience?.visibleToAll ? 1 : 0;
    const [res] = await db.promise().query(
      'INSERT INTO notifications (title, message, type, visible_to_all, related_doc_id) VALUES (?, ?, ?, ?, ?)',
      [title, message, type, visibleToAll, relatedDocId]
    );
    const notificationId = res.insertId;

    if (visibleToAll === 1) return notificationId;

    // Insert scoped audiences
    const depts = Array.isArray(audience?.departments) ? audience.departments.filter(Boolean) : [];
    const roles = Array.isArray(audience?.roles) ? audience.roles.map(r => String(r).toUpperCase()).filter(Boolean) : [];
    const users = Array.isArray(audience?.users) ? audience.users.map(u => Number(u)).filter(Boolean) : [];

    if (depts.length > 0) {
      const values = depts.flatMap(d => [notificationId, d]);
      const placeholders = depts.map(() => '(?, ?)').join(', ');
      await db.promise().query(`INSERT INTO notification_departments (notification_id, department_id) VALUES ${placeholders}` , values);
    }
    if (roles.length > 0) {
      const values = roles.flatMap(r => [notificationId, r]);
      const placeholders = roles.map(() => '(?, ?)').join(', ');
      await db.promise().query(`INSERT INTO notification_roles (notification_id, role) VALUES ${placeholders}`, values);
    }
    if (users.length > 0) {
      const values = users.flatMap(u => [notificationId, u]);
      const placeholders = users.map(() => '(?, ?)').join(', ');
      await db.promise().query(`INSERT INTO notification_users (notification_id, user_id) VALUES ${placeholders}`, values);
    }

    return notificationId;
  } catch (e) {
    console.error('Error creating notification:', e);
    return null;
  }
};

// Get latest documents (for dashboard)
router.get('/documents/latest', requireAuth, async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const current = req.currentUser || {};
    const dean = isDeanRole(current.role);
    const roleLower = (current.role || '').toString().trim().toLowerCase();
    const isAdmin = roleLower === 'admin' || roleLower === 'administrator';
    const isAdminLike = isAdmin || roleLower === 'dean' || roleLower === 'faculty';
    
    // Normalize department_id to number for reliable matching
    const departmentId = current.department_id != null ? Number(current.department_id) : null;

    const filters = [];
    const values = [];

    // Exclude soft-deleted
    filters.push('COALESCE(d.deleted, 0) = 0');

    // Visibility
    if (isAdminLike) {
      // no additional filter
    } else if (dean && departmentId) {
      // Dean: public OR department OR explicitly allowed (user/role) OR created by them OR created by same-dept user
      filters.push(`((${buildVisibleToAllClause()}) OR (EXISTS (SELECT 1 FROM document_departments dd2 WHERE dd2.doc_id = d.doc_id AND dd2.department_id = ?)) OR (FIND_IN_SET(?, COALESCE(d.allowed_user_ids, "")) > 0) OR (FIND_IN_SET(?, COALESCE(LOWER(REPLACE(d.allowed_roles, " ", "")), "")) > 0) OR (EXISTS (SELECT 1 FROM dms_user cu WHERE cu.user_id = d.created_by_user_id AND cu.department_id = ?)) OR (d.created_by_user_id = ?))`);
      values.push(departmentId);
      values.push(String(current.user_id || current.id || ''));
      values.push(roleLower);
      values.push(departmentId);
      values.push(current.user_id || current.id);
    } else {
      if (departmentId) {
        // Non-admin non-dean with dept (e.g., faculty): public OR dept OR explicitly allowed (user/role) OR created by them OR created by same-dept user
        // Use EXISTS subquery for reliable department matching (works even if LEFT JOIN doesn't match)
        filters.push(`((${buildVisibleToAllClause()}) OR (EXISTS (SELECT 1 FROM document_departments dd2 WHERE dd2.doc_id = d.doc_id AND dd2.department_id = ?)) OR (FIND_IN_SET(?, COALESCE(d.allowed_user_ids, "")) > 0) OR (FIND_IN_SET(?, COALESCE(LOWER(REPLACE(d.allowed_roles, " ", "")), "")) > 0) OR (EXISTS (SELECT 1 FROM dms_user cu WHERE cu.user_id = d.created_by_user_id AND cu.department_id = ?)) OR (d.created_by_user_id = ?))`);
        values.push(departmentId);
        values.push(String(current.user_id || current.id || ''));
        values.push(roleLower);
        values.push(departmentId);
        values.push(current.user_id || current.id);
      } else {
        // No dept: public OR explicitly allowed (user/role) OR created by them
        console.log(`[DocumentsAPI /documents] User (role: ${roleLower}) without department_id - only public/explicit access`);
        filters.push(`((${buildVisibleToAllClause()}) OR (FIND_IN_SET(?, COALESCE(d.allowed_user_ids, "")) > 0) OR (FIND_IN_SET(?, COALESCE(LOWER(REPLACE(d.allowed_roles, " ", "")), "")) > 0) OR (d.created_by_user_id = ?))`);
        values.push(String(current.user_id || current.id || ''));
        values.push(roleLower);
        values.push(current.user_id || current.id);
      }
    }

    // For ALL users, exclude documents that have action requirements OR are replies to action-required documents
    filters.push(`d.doc_id NOT IN (
      SELECT DISTINCT da.doc_id 
      FROM document_actions da 
      WHERE da.doc_id IS NOT NULL
    ) AND d.is_reply_to_doc_id IS NULL`);
    
    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    
    const sql = `
      SELECT DISTINCT
        d.doc_id AS id,
        d.title,
        d.reference,
        d.status,
        d.created_at,
        d.created_by_name,
        d.allowed_user_ids,
        d.allowed_roles,
        dt.name AS doc_type,
        u.profile_pic AS created_by_profile_pic,
        u.user_email AS created_by_email,
        GROUP_CONCAT(DISTINCT f2.name ORDER BY f2.name SEPARATOR ', ') AS folder_names,
        GROUP_CONCAT(DISTINCT df.folder_id ORDER BY f2.name SEPARATOR ', ') AS folder_ids
      FROM dms_documents d
      LEFT JOIN document_types dt ON d.doc_type = dt.type_id
      LEFT JOIN folders f ON d.folder_id = f.folder_id
      LEFT JOIN document_departments dd ON d.doc_id = dd.doc_id
      LEFT JOIN document_folders df ON d.doc_id = df.doc_id
      LEFT JOIN folders f2 ON df.folder_id = f2.folder_id
      LEFT JOIN dms_user u ON u.user_id = d.created_by_user_id OR u.Username = d.created_by_name OR CONCAT(u.firstname, ' ', u.lastname) = d.created_by_name OR u.user_email = d.created_by_name
      ${whereClause}
      GROUP BY d.doc_id
      ORDER BY d.created_at DESC 
      LIMIT ?
    `;
    
    values.push(parseInt(limit));
    const [results] = await db.promise().query(sql, values);
    
    res.json({ success: true, documents: results });

// Get a single document by ID (for edit screen prefill)
router.get('/documents/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT DISTINCT
        d.doc_id AS id,
        dt.name AS doc_type,
        f.name AS folder,
        d.reference,
        d.title,
        d.subject,
        d.revision,
        d.rev_date,
        d.from_field,
        d.to_field,
        d.date_received,
        d.google_drive_link,
        d.description,
        d.available_copy,
        d.visible_to_all,
        d.allowed_user_ids,
        d.allowed_roles,
        d.status,
        d.created_at,
        d.updated_at,
        d.created_by_name,
        u.profile_pic AS created_by_profile_pic,
        u.user_email AS created_by_email,
        GROUP_CONCAT(DISTINCT dept.name ORDER BY dept.name SEPARATOR ', ') AS department_names,
        GROUP_CONCAT(DISTINCT dept.department_id ORDER BY dept.name SEPARATOR ', ') AS department_ids,
        GROUP_CONCAT(DISTINCT f2.name ORDER BY f2.name SEPARATOR ', ') AS folder_names,
        GROUP_CONCAT(DISTINCT df.folder_id ORDER BY f2.name SEPARATOR ', ') AS folder_ids
      FROM dms_documents d
      LEFT JOIN document_types dt ON d.doc_type = dt.type_id
      LEFT JOIN folders f ON d.folder_id = f.folder_id
      LEFT JOIN document_departments dd ON d.doc_id = dd.doc_id
      LEFT JOIN departments dept ON dd.department_id = dept.department_id
      LEFT JOIN document_folders df ON d.doc_id = df.doc_id
      LEFT JOIN folders f2 ON df.folder_id = f2.folder_id
      LEFT JOIN dms_user u ON u.user_id = d.created_by_user_id OR u.Username = d.created_by_name OR CONCAT(u.firstname, ' ', u.lastname) = d.created_by_name OR u.user_email = d.created_by_name
      WHERE d.doc_id = ?
      GROUP BY d.doc_id
    `;
    const [rows] = await db.promise().query(sql, [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Document not found' });
    const r = rows[0];
    const document = {
      id: r.id,
      doc_type: r.doc_type || '',
      folder: r.folder || '',
      reference: r.reference || '',
      title: r.title || '',
      subject: r.subject || '',
      revision: r.revision || '',
      rev_date: r.rev_date || null,
      from_field: r.from_field || '',
      to_field: r.to_field || '',
      date_received: r.date_received || null,
      google_drive_link: r.google_drive_link || '',
      description: r.description || '',
      available_copy: r.available_copy || 'soft_copy',
      visible_to_all: r.visible_to_all,
      allowed_user_ids: r.allowed_user_ids || '',
      allowed_roles: r.allowed_roles || '',
      status: r.status,
      created_at: r.created_at,
      updated_at: r.updated_at,
      created_by_name: r.created_by_name,
      created_by_profile_pic: r.created_by_profile_pic,
      department_names: r.department_names || '',
      department_ids: r.department_ids || '',
      folder_names: r.folder_names || '',
      folder_ids: r.folder_ids || ''
    };
    return res.json({ success: true, document });
  } catch (error) {
    console.error('Error fetching document by id:', error);
    return res.status(500).json({ success: false, message: 'Server error - Please try again later' });
  }
});
  } catch (error) {
    console.error('Error fetching latest documents:', error);
    res.status(500).json({ success: false, message: 'Database error.' });
  }
});

// Visibility info for a specific document
// Returns a normalized shape used by the frontend:
// { visible_to_all: boolean, department_ids: number[], user_ids: number[], roles: string[] }
router.get('/documents/:id/visibility', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    // Fetch base document
    const [docs] = await db.promise().query(
      'SELECT visible_to_all, allowed_user_ids, allowed_roles FROM dms_documents WHERE doc_id = ? LIMIT 1',
      [id]
    );
    if (docs.length === 0) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }
    const d = docs[0];

    // Departments
    const [deptRows] = await db.promise().query(
      'SELECT department_id FROM document_departments WHERE doc_id = ?',
      [id]
    );
    const department_ids = Array.isArray(deptRows)
      ? deptRows.map(r => Number(r.department_id)).filter(Boolean)
      : [];

    // Users (CSV -> array of numbers)
    const user_ids = (d.allowed_user_ids || '')
      .toString()
      .split(',')
      .map(s => Number(String(s).trim()))
      .filter(Boolean);

    // Roles (CSV -> array lowercase to match storage)
    const roles = (d.allowed_roles || '')
      .toString()
      .split(',')
      .map(s => String(s).trim().toLowerCase())
      .filter(Boolean);

    return res.json({
      success: true,
      visibility: {
        visible_to_all: d.visible_to_all === 1 || d.visible_to_all === true,
        department_ids,
        user_ids,
        roles,
      }
    });
  } catch (error) {
    console.error('Error fetching document visibility:', error);
    return res.status(500).json({ success: false, message: 'Server error - Please try again later' });
  }
});

// List documents
router.get('/documents', requireAuth, async (req, res) => {
  try {
    const current = req.currentUser || {};
    // Normalize role for consistent comparison (handle both uppercase and lowercase)
    const rawRole = (current.role || '').toString().trim();
    const roleLower = rawRole.toLowerCase();
    const roleUpper = rawRole.toUpperCase();
    const dean = isDeanRole(current.role) || roleLower === 'dean' || roleUpper === 'DEAN';
    const isAdmin = roleLower === 'admin' || roleLower === 'administrator' || roleUpper === 'ADMIN' || roleUpper === 'ADMINISTRATOR';
    const isAdminLike = isAdmin || roleLower === 'dean' || roleLower === 'faculty' || roleUpper === 'DEAN' || roleUpper === 'FACULTY';
    
    // Normalize department_id to number for reliable matching
    const departmentId = current.department_id != null ? Number(current.department_id) : null;
    
    // Enhanced debug logging
    console.log(`[DocumentsAPI /documents] User ID: ${current.id || current.user_id}, Raw Role: "${rawRole}", Lower: "${roleLower}", Upper: "${roleUpper}", isDean: ${dean}, isAdmin: ${isAdmin}, department_id: ${departmentId}, department_id type: ${typeof current.department_id}`);
    
    // Diagnostic: Check if there are any documents linked to this department
    if (departmentId && !isAdmin) {
      try {
        const [deptDocs] = await db.promise().query(
          'SELECT COUNT(*) as count FROM document_departments WHERE department_id = ?',
          [departmentId]
        );
        console.log(`[DocumentsAPI /documents] Diagnostic: Found ${deptDocs[0]?.count || 0} documents linked to department_id ${departmentId} in document_departments table`);
        
        // Get sample documents linked to this department
        if (deptDocs[0]?.count > 0) {
          const [sampleDeptDocs] = await db.promise().query(
            `SELECT dd.doc_id, d.title, d.visible_to_all 
             FROM document_departments dd 
             JOIN dms_documents d ON dd.doc_id = d.doc_id 
             WHERE dd.department_id = ? AND COALESCE(d.deleted, 0) = 0 
             LIMIT 3`,
            [departmentId]
          );
          console.log(`[DocumentsAPI /documents] Sample department documents:`, sampleDeptDocs.map(d => ({
            doc_id: d.doc_id,
            title: d.title?.substring(0, 40),
            visible_to_all: d.visible_to_all
          })));
          
          // Test the EXISTS subquery directly
          const [testExists] = await db.promise().query(
            `SELECT d.doc_id, d.title, d.visible_to_all 
             FROM dms_documents d 
             WHERE COALESCE(d.deleted, 0) = 0 
             AND EXISTS (SELECT 1 FROM document_departments dd2 WHERE dd2.doc_id = d.doc_id AND dd2.department_id = ?) 
             LIMIT 3`,
            [departmentId]
          );
          console.log(`[DocumentsAPI /documents] Test EXISTS query found ${testExists.length} documents for dept ${departmentId}`);
        }
        
        // Test: Find documents created by users in the same department (even if not linked in document_departments)
        const [creatorDeptDocs] = await db.promise().query(
          `SELECT d.doc_id, d.title, d.visible_to_all, d.created_by_name, d.created_by_user_id, cu.department_id as creator_dept
           FROM dms_documents d
           LEFT JOIN dms_user cu ON (cu.user_id = d.created_by_user_id OR cu.Username = d.created_by_name OR CONCAT(cu.firstname, ' ', cu.lastname) = d.created_by_name OR cu.user_email = d.created_by_name)
           WHERE COALESCE(d.deleted, 0) = 0 
           AND cu.department_id = ?
           AND cu.department_id IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM document_departments dd3 WHERE dd3.doc_id = d.doc_id)
           LIMIT 5`,
          [departmentId]
        );
        console.log(`[DocumentsAPI /documents] Found ${creatorDeptDocs.length} documents created by same-dept users (not linked in document_departments):`, creatorDeptDocs.map(d => ({
          doc_id: d.doc_id,
          title: d.title?.substring(0, 40),
          created_by: d.created_by_name,
          creator_dept: d.creator_dept
        })));
        
        // Also check documents with visible_to_all
        const [publicDocs] = await db.promise().query(
          'SELECT COUNT(*) as count FROM dms_documents WHERE COALESCE(deleted, 0) = 0 AND (visible_to_all = 1 OR visible_to_all = true OR LOWER(TRIM(COALESCE(visible_to_all, ""))) IN ("1", "true", "yes", "all", "public", "everyone"))'
        );
        console.log(`[DocumentsAPI /documents] Diagnostic: Found ${publicDocs[0]?.count || 0} public documents`);
      } catch (diagError) {
        console.error('[DocumentsAPI /documents] Diagnostic query error:', diagError);
      }
    }

    const filters = [];
    const values = [];

    // Exclude soft-deleted
    filters.push('COALESCE(d.deleted, 0) = 0');

    // Visibility
    if (isAdminLike) {
      console.log('[DocumentsAPI /documents] Admin-like user (ADMIN/DEAN/FACULTY) - no restrictions');
      // no restriction
    } else if (dean && departmentId) {
      // Dean: public OR department-linked OR explicitly allowed (user/role) OR created by same-dept user OR created by them
      // IMPORTANT: Also include documents created by same-dept users even if not explicitly linked in document_departments
      console.log(`[DocumentsAPI /documents] Dean user with department_id ${departmentId} - applying department filter`);
      filters.push(`((${buildVisibleToAllClause()}) OR (EXISTS (SELECT 1 FROM document_departments dd2 WHERE dd2.doc_id = d.doc_id AND dd2.department_id = ?)) OR (FIND_IN_SET(?, COALESCE(d.allowed_user_ids, "")) > 0) OR (FIND_IN_SET(?, COALESCE(LOWER(REPLACE(d.allowed_roles, " ", "")), "")) > 0) OR (EXISTS (SELECT 1 FROM dms_user cu WHERE (cu.user_id = d.created_by_user_id OR cu.Username = d.created_by_name OR CONCAT(cu.firstname, ' ', cu.lastname) = d.created_by_name OR cu.user_email = d.created_by_name) AND cu.department_id = ? AND cu.department_id IS NOT NULL)) OR (d.created_by_user_id = ?))`);
      values.push(departmentId);
      values.push(String(current.user_id || current.id || ''));
      values.push(roleLower);
      values.push(departmentId);
      values.push(current.user_id || current.id);
    } else {
      if (departmentId) {
        // Non-admin non-dean with dept (e.g., faculty): public OR department-linked OR explicitly allowed (user/role) OR created by same-dept user OR created by them
        // IMPORTANT: Also include documents created by same-dept users even if not explicitly linked in document_departments
        console.log(`[DocumentsAPI /documents] Non-admin/non-dean user (role: ${roleLower}) with department_id ${departmentId} - applying department filter`);
        filters.push(`((${buildVisibleToAllClause()}) OR (EXISTS (SELECT 1 FROM document_departments dd2 WHERE dd2.doc_id = d.doc_id AND dd2.department_id = ?)) OR (FIND_IN_SET(?, COALESCE(d.allowed_user_ids, "")) > 0) OR (FIND_IN_SET(?, COALESCE(LOWER(REPLACE(d.allowed_roles, " ", "")), "")) > 0) OR (EXISTS (SELECT 1 FROM dms_user cu WHERE (cu.user_id = d.created_by_user_id OR cu.Username = d.created_by_name OR CONCAT(cu.firstname, ' ', cu.lastname) = d.created_by_name OR cu.user_email = d.created_by_name) AND cu.department_id = ? AND cu.department_id IS NOT NULL)) OR (d.created_by_user_id = ?))`);
        values.push(departmentId);
        values.push(String(current.user_id || current.id || ''));
        values.push(roleLower);
        values.push(departmentId);
        values.push(current.user_id || current.id);
      } else {
        // No dept: public OR explicitly allowed (user/role) OR created by them
        console.log(`[DocumentsAPI /documents] User (role: ${roleLower}) without department_id - only public/explicit access`);
        filters.push(`((${buildVisibleToAllClause()}) OR (FIND_IN_SET(?, COALESCE(d.allowed_user_ids, "")) > 0) OR (FIND_IN_SET(?, COALESCE(LOWER(REPLACE(d.allowed_roles, " ", "")), "")) > 0) OR (d.created_by_user_id = ?))`);
        values.push(String(current.user_id || current.id || ''));
        values.push(roleLower);
        values.push(current.user_id || current.id);
      }
    }

    

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    
    const sql = `
      SELECT DISTINCT
        d.doc_id AS id,
        dt.name AS doc_type,
        f.name AS folder,
        d.reference,
        d.title,
        d.subject,
        d.revision,
        d.rev_date,
        d.from_field,
        d.to_field,
        d.date_received,
        d.google_drive_link,
        d.description,
        d.available_copy,
        d.visible_to_all,
        d.allowed_user_ids,
        d.allowed_roles,
        d.status,
        d.created_at,
        d.updated_at,
        d.created_by_name,
        u.profile_pic AS created_by_profile_pic,
        GROUP_CONCAT(DISTINCT dept.name ORDER BY dept.name SEPARATOR ', ') AS department_names,
        GROUP_CONCAT(DISTINCT dept.department_id ORDER BY dept.department_id SEPARATOR ',') AS department_ids,
        GROUP_CONCAT(DISTINCT f2.name ORDER BY f2.name SEPARATOR ', ') AS folder_names,
        GROUP_CONCAT(DISTINCT df.folder_id ORDER BY df.folder_id SEPARATOR ',') AS folder_ids
      FROM dms_documents d
      LEFT JOIN document_types dt ON d.doc_type = dt.type_id
      LEFT JOIN folders f ON d.folder_id = f.folder_id
      LEFT JOIN document_departments dd ON d.doc_id = dd.doc_id
      LEFT JOIN departments dept ON dd.department_id = dept.department_id
      LEFT JOIN document_folders df ON d.doc_id = df.doc_id
      LEFT JOIN folders f2 ON df.folder_id = f2.folder_id
      LEFT JOIN dms_user u ON u.Username = d.created_by_name OR CONCAT(u.firstname, ' ', u.lastname) = d.created_by_name OR u.user_email = d.created_by_name
      ${whereClause}
      GROUP BY d.doc_id
      ORDER BY d.created_at DESC
    `;
    
    // Debug: Log SQL query and values
    console.log(`[DocumentsAPI /documents] SQL WHERE clause: ${whereClause}`);
    console.log(`[DocumentsAPI /documents] SQL values:`, values);
    
    const [results] = await db.promise().query(sql, values);
    
    console.log(`[DocumentsAPI /documents] Query returned ${results.length} documents`);
    
    // Detailed analysis of returned documents
    if (results.length > 0) {
      const publicCount = results.filter(r => {
        const vta = r.visible_to_all;
        return vta === 1 || vta === true || 
               (typeof vta === 'string' && ['1', 'true', 'yes', 'all', 'public', 'everyone'].includes(vta.trim().toLowerCase()));
      }).length;
      const deptCount = results.filter(r => {
        const deptIds = (r.department_ids || '').toString();
        return deptIds && deptIds.split(',').some(id => id.trim() === String(departmentId));
      }).length;
      console.log(`[DocumentsAPI /documents] Analysis: ${publicCount} public, ${deptCount} department-specific (dept_id: ${departmentId})`);
      
      if (results.length <= 10) {
        console.log(`[DocumentsAPI /documents] All documents:`, results.map(r => ({
          id: r.id,
          title: r.title?.substring(0, 30),
          visible_to_all: r.visible_to_all,
          department_ids: r.department_ids,
          department_names: r.department_names?.substring(0, 50)
        })));
      }
    } else if (departmentId && !isAdmin) {
      // If no results but user has department, test the EXISTS query directly
      try {
        const [testResults] = await db.promise().query(
          `SELECT d.doc_id, d.title, d.visible_to_all 
           FROM dms_documents d 
           WHERE COALESCE(d.deleted, 0) = 0 
           AND EXISTS (SELECT 1 FROM document_departments dd2 WHERE dd2.doc_id = d.doc_id AND dd2.department_id = ?) 
           LIMIT 5`,
          [departmentId]
        );
        console.log(`[DocumentsAPI /documents] Test query for dept ${departmentId} found ${testResults.length} documents:`, testResults.map(r => ({ id: r.doc_id, title: r.title })));
      } catch (testError) {
        console.error('[DocumentsAPI /documents] Test query error:', testError);
      }
    }
    
    const documents = results.map(r => {
      const mergedIds = (r.department_ids || '').toString();
      return {
        id: r.id,
        doc_type: r.doc_type || '',
        folder: r.folder || '',
        reference: r.reference || '',
        title: r.title || '',
        subject: r.subject || '',
        revision: r.revision || '',
        rev_date: r.rev_date || null,
        from_field: r.from_field || '',
        to_field: r.to_field || '',
        date_received: r.date_received || null,
        google_drive_link: r.google_drive_link || '',
        description: r.description || '',
        available_copy: r.available_copy || 'soft_copy',
        visible_to_all: r.visible_to_all,
        allowed_user_ids: r.allowed_user_ids || '',
        allowed_roles: r.allowed_roles || '',
        status: r.status,
        created_at: r.created_at,
        updated_at: r.updated_at,
        created_by_name: r.created_by_name,
        created_by_email: r.created_by_email,
        created_by_profile_pic: r.created_by_profile_pic,
        department_names: r.department_names || '',
        department_ids: mergedIds,
        folder_names: r.folder_names || '',
        folder_ids: r.folder_ids || ''
      };
    });
    
    return res.json({ success: true, documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return res.status(500).json({ success: false, message: 'Server error - Please try again later' });
  }
});

// Distinct From/To values for current user (most-recent-first)
router.get('/documents/distinct-from-to', requireAuth, async (req, res) => {
  try {
    const { limit = 200 } = req.query;
    const current = req.currentUser || {};
    const possibleCreators = [];
    if (current?.username) possibleCreators.push(current.username);
    const fullName = `${current?.firstname || ''} ${current?.lastname || ''}`.trim();
    if (fullName) possibleCreators.push(fullName);

    const where = possibleCreators.length > 0
      ? `WHERE COALESCE(d.deleted, 0) = 0 AND d.created_by_name IN (${possibleCreators.map(() => '?').join(',')})`
      : 'WHERE COALESCE(d.deleted, 0) = 0';

    const sql = `
      SELECT d.from_field, d.to_field, d.created_at
      FROM dms_documents d
      ${where}
      ORDER BY d.created_at DESC
      LIMIT ?
    `;
    const values = [...possibleCreators, parseInt(limit)];
    const [rows] = await db.promise().query(sql, values);

    // Build distinct lists preserving order
    const seenFrom = new Set();
    const seenTo = new Set();
    const from_values = [];
    const to_values = [];
    for (const r of rows) {
      const f = (r.from_field || '').trim();
      const t = (r.to_field || '').trim();
      if (f && !seenFrom.has(f.toLowerCase())) { seenFrom.add(f.toLowerCase()); from_values.push(f); }
      if (t && !seenTo.has(t.toLowerCase())) { seenTo.add(t.toLowerCase()); to_values.push(t); }
      if (from_values.length >= 50 && to_values.length >= 50) break; // hard cap to keep payload small
    }

    return res.json({ success: true, from_values, to_values });
  } catch (error) {
    console.error('Error fetching distinct from/to:', error);
    return res.status(500).json({ success: false, message: 'Server error - Please try again later' });
  }
});
// Create document
router.post('/documents', requireAuth, async (req, res) => {
  try {
    const {
      category,
      folder,
      folder_ids: folderIdsInput = [],
      reference,
      title,
      subject,
      revision,
      rev_date,
      from_field,
      to_field,
      date_received,
      google_drive_link,
      description,
      available_copy,
      visible_to_all,
      allowed_user_ids: allowedUserIdsInput = [],
      allowed_roles: allowedRolesInput = [],
      departmentIds = [],
      actionRequired = [],
      actionAssignments = []
    } = req.body || {};

    // Normalize basic text inputs for lookups
    const resolvedCategory = (category || '').toString().trim();
    const resolvedFolder = (folder || '').toString().trim();

    // Enforce DEAN visibility: dean can only create documents for their own department
    const roleLower = (req.currentUser?.role || '').toString().trim().toLowerCase();
    const deanDeptId = req.currentUser?.department_id;
    const isDean = roleLower === 'dean' && !!deanDeptId;

    // Normalize incoming arrays
    const toCsv = (v) => {
      if (!v) return '';
      if (Array.isArray(v)) return v.map(x => String(x).trim()).filter(Boolean).join(',');
      return String(v).split(',').map(s => s.trim()).filter(Boolean).join(',');
    };
    const departmentIdsNormalized = isDean
      ? [Number(deanDeptId)]
      : (Array.isArray(departmentIds) ? departmentIds.filter(Boolean).map(Number) : []);
    const visibleToAll = isDean ? 1 * 0 : (visible_to_all ? 1 : 0);
    const allowedUserIdsCsv = isDean ? '' : toCsv(allowedUserIdsInput);
    const allowedRolesCsv = (isDean ? '' : toCsv(allowedRolesInput)).toLowerCase().replace(/\s+/g, '');

    const parseCsv = (csv) => (csv ? String(csv).split(',').map(s => s.trim()).filter(Boolean) : []);

    const insertDoc = async (docTypeId, folderId) => {
      // Build insert statement for dms_documents
      const sql = `
        INSERT INTO dms_documents
          (doc_type, folder_id, reference, title, subject, revision, rev_date, from_field, to_field, date_received, google_drive_link, description, available_copy, visible_to_all, allowed_user_ids, allowed_roles, status, created_by_user_id, created_by_name, created_at, updated_at)
        VALUES
          (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, NOW(), NOW())
      `;
      const createdByUserId = (req.currentUser?.user_id ?? req.currentUser?.id) || null;
      const createdByName = deriveUserName(req.user) || deriveUserName(req.currentUser) || null;
      const values = [
        docTypeId,
        folderId || null,
        reference || '',
        title || '',
        subject || '',
        revision || '',
        rev_date || null,
        from_field || '',
        to_field || '',
        date_received || null,
        google_drive_link || '',
        description || '',
        available_copy || 'soft_copy',
        visibleToAll,
        allowedUserIdsCsv || null,
        allowedRolesCsv || null,
        createdByUserId,
        createdByName
      ];

      try {
        const [result] = await db.promise().query(sql, values);
        const newId = result.insertId;

        // Assign departments
        if (Array.isArray(departmentIdsNormalized) && departmentIdsNormalized.length > 0) {
          for (const deptId of departmentIdsNormalized) {
            await db.promise().query(
              'INSERT INTO document_departments (doc_id, department_id) VALUES (?, ?)',
              [newId, deptId]
            );
          }
        }

        // ...

        const audience = {
          visibleToAll: visibleToAll === 1,
          departments: Array.isArray(departmentIdsNormalized) ? departmentIdsNormalized.filter(Boolean).map(Number) : [],
          roles: parseCsv(allowedRolesCsv).map(r => r.toUpperCase()),
          users: parseCsv(allowedUserIdsCsv).map(n => Number(n))
        };

        // Notification - Create single, appropriate notification based on document type
        const hasAssignments = Array.isArray(actionAssignments) && actionAssignments.length > 0;
        const userName = deriveUserName(req.user) || deriveUserName(req.currentUser) || 'User';
        if (hasAssignments) {
          const reqAudience = { users: [], roles: [], departments: [] };
          for (const a of actionAssignments) {
            if (a?.assigned_to_user_id) reqAudience.users.push(Number(a.assigned_to_user_id));
            if (a?.assigned_to_role) reqAudience.roles.push(String(a.assigned_to_role).toUpperCase());
            if (a?.assigned_to_department_id) reqAudience.departments.push(Number(a.assigned_to_department_id));
          }
          reqAudience.users = Array.from(new Set(reqAudience.users.filter(Boolean)));
          reqAudience.roles = Array.from(new Set(reqAudience.roles.filter(Boolean)));
          reqAudience.departments = Array.from(new Set(reqAudience.departments.filter(Boolean)));

          const requestTitle = `Request Added: ${title}`;
          const requestMessage = `You have a new request "${title}" from ${userName}`;
          await createNotification(requestTitle, requestMessage, 'requested', newId, reqAudience);

          try {
            const reqPayload = { title: requestTitle, message: requestMessage, type: 'requested', related_doc_id: newId, created_at: new Date().toISOString() };
            for (const uid of reqAudience.users) req?.io?.to(`user:${uid}`).emit('notification:new', reqPayload);
            for (const r of reqAudience.roles) req?.io?.to(`role:${r}`).emit('notification:new', reqPayload);
            for (const dpt of reqAudience.departments) req?.io?.to(`dept:${dpt}`).emit('notification:new', reqPayload);
          } catch (e) {
            console.warn('Socket emit failed (notification:new requested):', e?.message || e);
          }
        } else {
          const notificationTitle = `New Document Added: ${title}`;
          const notificationMessage = `A new document "${title}" has been uploaded by ${userName}`;
          await createNotification(notificationTitle, notificationMessage, 'added', newId, audience);

          try {
            const payload = { title: notificationTitle, message: notificationMessage, type: 'added', related_doc_id: newId, created_at: new Date().toISOString() };
            if (visibleToAll === 1) {
              req?.io?.emit('notification:new', payload);
            } else {
              if (Array.isArray(departmentIdsNormalized)) {
                for (const deptId of departmentIdsNormalized) {
                  if (deptId) req?.io?.to(`dept:${deptId}`).emit('notification:new', payload);
                }
              }
              if (allowedUserIdsCsv) {
                const ids = String(allowedUserIdsCsv).split(',').map(s => s.trim()).filter(Boolean);
                for (const uid of ids) {
                  req?.io?.to(`user:${uid}`).emit('notification:new', payload);
                }
              }
              if (allowedRolesCsv) {
                const roles = String(allowedRolesCsv).split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
                for (const r of roles) {
                  req?.io?.to(`role:${r}`).emit('notification:new', payload);
                }
              }
            }
          } catch (e) {
            console.warn('Socket emit failed (notification:new):', e?.message || e);
          }
        }

        // Fetch the created document summary
        const [rows] = await db.promise().query(
          `SELECT d.doc_id AS id, dt.name AS doc_type, d.reference, d.title, d.subject, d.revision, d.rev_date, d.from_field, d.to_field, d.date_received, d.google_drive_link, d.description, d.visible_to_all, d.created_at, d.updated_at,
           GROUP_CONCAT(DISTINCT dept.name ORDER BY dept.name SEPARATOR ', ') AS department_names,
           GROUP_CONCAT(DISTINCT dept.department_id ORDER BY dept.name SEPARATOR ', ') AS department_ids,
           GROUP_CONCAT(DISTINCT ar.action_name ORDER BY ar.action_name SEPARATOR ', ') AS action_required_names
           FROM dms_documents d 
           LEFT JOIN document_types dt ON d.doc_type = dt.type_id 
           LEFT JOIN document_departments dd ON d.doc_id = dd.doc_id
           LEFT JOIN departments dept ON dd.department_id = dept.department_id
           LEFT JOIN document_actions da ON d.doc_id = da.doc_id
           LEFT JOIN action_required ar ON da.action_id = ar.action_id
           WHERE d.doc_id = ?
           GROUP BY d.doc_id`,
          [newId]
        );

        if (rows.length === 0) {
          return res.json({ success: true, message: 'Document added.' });
        }

        const r = rows[0];
        const document = {
          id: r.id,
          doc_type: r.doc_type || '',
          reference: r.reference || '',
          title: r.title || '',
          revision: r.revision || '',
          rev_date: r.rev_date || null,
          from_field: r.from_field || '',
          to_field: r.to_field || '',
          date_received: r.date_received || null,
          google_drive_link: r.google_drive_link || '',
          description: r.description || '',
          visible_to_all: r.visible_to_all,
          created_at: r.created_at,
          updated_at: r.updated_at,
          department_names: r.department_names || '',
          department_ids: r.department_ids || '',
          action_required: r.action_required_names ? r.action_required_names.split(', ').filter(Boolean) : []
        };

        return res.json({ success: true, message: 'Document added.', document });
      } catch (error) {
        console.error('Error inserting document:', error);
        return res.status(500).json({ success: false, message: 'Database error.' });
      }
    };

    // Resolve folder ID (case-insensitive)
    let folderId = null;
    if (resolvedFolder) {
      try {
        const [folderRows] = await db.promise().query('SELECT folder_id FROM folders WHERE LOWER(name) = LOWER(?)', [resolvedFolder]);
        if (folderRows.length > 0) folderId = folderRows[0].folder_id;
      } catch (e) {
        console.error('Error resolving folder:', e);
      }
    }

    if (!resolvedCategory) {
      return await insertDoc(null, folderId);
    }

    // Ensure document type exists (create if missing) - case-insensitive match, insert normalized name
    try {
      const [rows] = await db.promise().query('SELECT type_id FROM document_types WHERE LOWER(name) = LOWER(?)', [resolvedCategory]);
      if (rows.length > 0) {
        return await insertDoc(rows[0].type_id, folderId);
      }
      const [result] = await db.promise().query('INSERT INTO document_types (name) VALUES (?)', [resolvedCategory]);
      return await insertDoc(result.insertId, folderId);
    } catch (error) {
      console.error('Error handling document type:', error);
      return res.status(500).json({ success: false, message: 'Database error.' });
    }
  } catch (error) {
    console.error('Error creating document:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// Update document
router.put('/documents/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const updates = req.body || {};

  // Enforce DEAN restriction on updates: dean can only scope to their own department
  const roleLowerUpdate = (req.currentUser?.role || '').toString().trim().toLowerCase();
  const deanDeptIdUpdate = req.currentUser?.department_id ? Number(req.currentUser.department_id) : null;
  const isDeanUpdate = roleLowerUpdate === 'dean' && !!deanDeptIdUpdate;
  if (isDeanUpdate) {
    // Force not public and clear explicit scopes
    updates.visible_to_all = 0;
    updates.allowed_user_ids = '';
    updates.allowed_roles = '';
    // We'll also force department_ids below via departmentIdsUpdate
  }

  // Validate document exists first
  db.query('SELECT * FROM dms_documents WHERE doc_id = ?', [id], (err, rows) => {
    if (err) {
      console.error('Database error checking document:', err);
      return res.status(500).json({ success: false, message: 'Database error while checking document.' });
    }
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    // Only allow specific fields to be updated
    const allowedFields = {
      title: 'title',
      subject: 'subject',
      reference: 'reference',
      from_field: 'from_field',
      to_field: 'to_field',
      date_received: 'date_received',
      description: 'description',
      google_drive_link: 'google_drive_link',
      available_copy: 'available_copy',
      revision: 'revision',
      rev_date: 'rev_date',
      visible_to_all: 'visible_to_all',
      allowed_user_ids: 'allowed_user_ids',
      allowed_roles: 'allowed_roles'
    };

    const fields = [];
    const values = [];
    // Normalizers
    const toCsv = (v) => {
      if (v === null || v === undefined) return null;
      if (Array.isArray(v)) return v.map(x => String(x).trim()).filter(Boolean).join(',');
      return String(v).split(',').map(s => s.trim()).filter(Boolean).join(',');
    };

    // Helper to normalize booleans from varied payloads
    const normalizeBoolean = (val) => {
      if (typeof val === 'boolean') return val ? 1 : 0;
      if (typeof val === 'number') return val === 1 ? 1 : 0;
      if (typeof val === 'string') {
        const s = val.trim().toLowerCase();
        if (['1','true','yes','on'].includes(s)) return 1;
        if (['0','false','no','off',''].includes(s)) return 0;
        return 0;
      }
      return 0;
    };

    // Apply standard fields
    Object.entries(updates).forEach(([k, v]) => {
      if (!allowedFields[k] || v === undefined || v === null) return;
      // Normalize special fields
      if (k === 'visible_to_all') {
        const normalized = normalizeBoolean(v);
        fields.push(`${allowedFields[k]} = ?`);
        values.push(normalized);
        return;
      }
      if (k === 'allowed_user_ids') {
        const csv = toCsv(v);
        fields.push(`${allowedFields[k]} = ?`);
        values.push(csv || null);
        return;
      }
      if (k === 'allowed_roles') {
        const csv = (toCsv(v) || '').toLowerCase().replace(/\s+/g, '');
        fields.push(`${allowedFields[k]} = ?`);
        values.push(csv || null);
        return;
      }
      fields.push(`${allowedFields[k]} = ?`);
      values.push(v);
    });

    // Handle folder_ids (multi-folder) update separately
    const folderIdsUpdate = Array.isArray(updates.folder_ids)
      ? updates.folder_ids.map(Number).filter(Boolean)
      : null;

    // Handle department_ids (visibility by departments) update separately
    const departmentIdsUpdate = isDeanUpdate
      ? [deanDeptIdUpdate]
      : (Array.isArray(updates.department_ids)
          ? updates.department_ids.map(Number).filter(Boolean)
          : null);

    // Handle category update if provided
    const performUpdate = (typeId) => {
      if (typeId) {
        fields.push('doc_type = ?');
        values.push(typeId);
      }
      const runPostUpdate = async () => {
        // Apply multi-folder changes if provided
        if (folderIdsUpdate) {
          try {
            await db.promise().query('DELETE FROM document_folders WHERE doc_id = ?', [id]);
            if (folderIdsUpdate.length > 0) {
              const placeholders = folderIdsUpdate.map(() => '(?, ?)').join(', ');
              const bulkValues = folderIdsUpdate.flatMap(fid => [id, fid]);
              await db.promise().query(`INSERT INTO document_folders (doc_id, folder_id) VALUES ${placeholders}` , bulkValues);
            }
          } catch (e) {
            console.warn('Failed updating document_folders:', e?.message || e);
          }
        }

        // Apply department visibility changes if provided
        if (departmentIdsUpdate) {
          try {
            await db.promise().query('DELETE FROM document_departments WHERE doc_id = ?', [id]);
            if (departmentIdsUpdate.length > 0) {
              const placeholders = departmentIdsUpdate.map(() => '(?, ?)').join(', ');
              const bulkValues = departmentIdsUpdate.flatMap(did => [id, did]);
              await db.promise().query(`INSERT INTO document_departments (doc_id, department_id) VALUES ${placeholders}` , bulkValues);
            }
          } catch (e) {
            console.warn('Failed updating document_departments:', e?.message || e);
          }
        }
        try {
          // Fetch updated document info to build notification audience
          const [docRows] = await db.promise().query(
            `SELECT d.title, d.visible_to_all, d.allowed_user_ids, d.allowed_roles, d.created_by_user_id, d.created_by_name
             FROM dms_documents d WHERE d.doc_id = ? LIMIT 1`,
            [id]
          );
          const docInfo = Array.isArray(docRows) && docRows[0] ? docRows[0] : {};

          // Departments for audience scoping
          let departmentIds = [];
          try {
            const [deptRows] = await db.promise().query(
              'SELECT department_id FROM document_departments WHERE doc_id = ?',
              [id]
            );
            departmentIds = Array.isArray(deptRows) ? deptRows.map(r => Number(r.department_id)).filter(Boolean) : [];
          } catch (e) {
            console.warn('Failed fetching document departments for update notification:', e?.message || e);
          }

          // Parse CSV helpers
          const parseCsvNums = (csv) => (csv ? String(csv).split(',').map(s => Number(String(s).trim())).filter(Boolean) : []);
          const parseCsvRolesUpper = (csv) => (csv ? String(csv).split(',').map(s => String(s).trim().toUpperCase()).filter(Boolean) : []);

          const audience = {
            visibleToAll: docInfo.visible_to_all === 1 || docInfo.visible_to_all === true,
            departments: departmentIds,
            roles: parseCsvRolesUpper(docInfo.allowed_roles || ''),
            users: parseCsvNums(docInfo.allowed_user_ids || ''),
          };

          // Deduplicate
          audience.users = Array.from(new Set(audience.users));
          audience.roles = Array.from(new Set(audience.roles));
          audience.departments = Array.from(new Set(audience.departments));

          const userName = (req.currentUser?.Username || `${req.currentUser?.firstname || ''} ${req.currentUser?.lastname || ''}`.trim() || req.currentUser?.email || 'User');
          const notifTitle = `Document Updated: ${docInfo.title || ''}`.trim();
          const notifMsg = `${userName} updated "${docInfo.title || 'a document'}"`;

          // Create DB notification (scoped)
          try {
            await createNotification(notifTitle, notifMsg, 'updated', Number(id), audience);
          } catch (e) {
            console.warn('createNotification (updated) failed:', e?.message || e);
          }

          // Emit socket events to appropriate rooms
          try {
            const payload = {
              title: notifTitle,
              message: notifMsg,
              type: 'updated',
              related_doc_id: Number(id),
              created_at: new Date().toISOString()
            };

            // Emit to creator if we can resolve id from request/current user or stored created_by_user_id
            if (docInfo.created_by_user_id) {
              req?.io?.to(`user:${docInfo.created_by_user_id}`).emit('notification:new', payload);
            }
            if (audience.visibleToAll) {
              req?.io?.emit('notification:new', payload);
            } else {
              for (const dpt of audience.departments) req?.io?.to(`dept:${dpt}`).emit('notification:new', payload);
              for (const r of audience.roles) req?.io?.to(`role:${r}`).emit('notification:new', payload);
              for (const uid of audience.users) req?.io?.to(`user:${uid}`).emit('notification:new', payload);
            }
          } catch (e) {
            console.warn('Socket emit failed (notification:new updated):', e?.message || e);
          }
        } catch (e) {
          console.warn('Post-update notification flow failed:', e?.message || e);
        }

        return res.json({ success: true, message: 'Document updated successfully.' });
      };

      if (fields.length === 0) {
        // No direct field updates, but we may still need to update associations
        return db.query('UPDATE dms_documents SET updated_at = NOW() WHERE doc_id = ?', [id], async (updateErr) => {
          if (updateErr) {
            console.error('Database error updating document (timestamp):', updateErr);
            return res.status(500).json({ success: false, message: 'Database error while updating document.' });
          }
          await runPostUpdate();
        });
      }

      db.query(`UPDATE dms_documents SET ${fields.join(', ')}, updated_at = NOW() WHERE doc_id = ?`, [...values, id], async (updateErr) => {
        if (updateErr) {
          console.error('Database error updating document:', updateErr);
          return res.status(500).json({ success: false, message: 'Database error while updating document.' });
        }
        await runPostUpdate();
      });
    };

    if (updates.category) {
      db.query('SELECT type_id FROM document_types WHERE name = ?', [updates.category], (err4, typeRows) => {
        if (err4) {
          console.error('Database error checking document type:', err4);
          return res.status(500).json({ success: false, message: 'Database error while checking document type.' });
        }
        if (typeRows.length > 0) {
          performUpdate(typeRows[0].type_id);
        } else {
          db.query('INSERT INTO document_types (name) VALUES (?)', [updates.category], (err5, result) => {
            if (err5) {
              console.error('Database error creating document type:', err5);
              return res.status(500).json({ success: false, message: 'Database error while creating document type.' });
            }
            performUpdate(result.insertId);
          });
        }
      });
    } else {
      performUpdate(null);
    }
  });
});

// Delete document
router.delete('/documents/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM dms_documents WHERE doc_id = ?', [id], (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error.' });
    return res.json({ success: true, message: 'Document deleted.' });
  });
});

export default router;
