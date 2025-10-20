// Notification Helper
// Centralized function to create notifications and send push notifications

import db from '../connections/connection.js';
import { sendPushNotification } from './NotificationsAPI.js';

/**
 * Create a notification and optionally send push notifications
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type (e.g., 'document_upload', 'user_registration')
 * @param {number|null} relatedDocId - Related document ID (optional)
 * @param {object} audience - Target audience configuration
 * @param {number[]} audience.users - Array of user IDs
 * @param {string[]} audience.roles - Array of roles (e.g., ['ADMIN', 'DEAN'])
 * @param {number[]} audience.departments - Array of department IDs
 * @param {boolean} audience.visibleToAll - If true, visible to all users
 * @param {boolean} sendPush - Whether to send push notifications (default: true)
 * @param {object} io - Socket.IO instance for real-time notifications (optional)
 * @returns {Promise<number|null>} - Notification ID or null if failed
 */
export const createNotificationWithPush = async (
  title, 
  message, 
  type, 
  relatedDocId = null, 
  audience = {}, 
  sendPush = true,
  io = null
) => {
  try {
    const visibleToAll = audience?.visibleToAll ? 1 : 0;
    
    // Create notification in database
    const [res] = await db.promise().query(
      'INSERT INTO notifications (title, message, type, visible_to_all, related_doc_id) VALUES (?, ?, ?, ?, ?)',
      [title, message, type, visibleToAll, relatedDocId]
    );
    
    const notificationId = res.insertId;
    console.log(`Created notification ${notificationId}: ${title}`);

    // If visible to all, no need to specify targets
    if (visibleToAll === 1) {
      // Send push to all users with subscriptions
      if (sendPush) {
        const [allUsers] = await db.promise().query('SELECT user_id FROM dms_user WHERE status = "active"');
        const userIds = allUsers.map(u => u.user_id);
        await sendPushNotification(userIds, {
          title,
          message,
          type,
          notificationId,
          url: '/#/dashboard'
        });
      }

      // Emit Socket.IO event
      if (io) {
        io.emit('notification:new', { notificationId, title, message, type });
      }

      return notificationId;
    }

    // Handle targeted notifications
    const depts = Array.isArray(audience?.departments) ? audience.departments.filter(Boolean) : [];
    const roles = Array.isArray(audience?.roles) ? audience.roles.map(r => String(r).toUpperCase()).filter(Boolean) : [];
    const users = Array.isArray(audience?.users) ? audience.users.map(u => Number(u)).filter(Boolean) : [];

    // Insert department targets
    if (depts.length > 0) {
      const values = depts.flatMap(d => [notificationId, d]);
      const placeholders = depts.map(() => '(?, ?)').join(', ');
      await db.promise().query(
        `INSERT INTO notification_departments (notification_id, department_id) VALUES ${placeholders}`, 
        values
      );
    }

    // Insert role targets
    if (roles.length > 0) {
      const values = roles.flatMap(r => [notificationId, r]);
      const placeholders = roles.map(() => '(?, ?)').join(', ');
      await db.promise().query(
        `INSERT INTO notification_roles (notification_id, role) VALUES ${placeholders}`, 
        values
      );
    }

    // Insert user targets
    if (users.length > 0) {
      const values = users.flatMap(u => [notificationId, u]);
      const placeholders = users.map(() => '(?, ?)').join(', ');
      await db.promise().query(
        `INSERT INTO notification_users (notification_id, user_id) VALUES ${placeholders}`, 
        values
      );
    }

    // Collect all target user IDs for push notifications
    let targetUserIds = [...users];

    // Get users from departments
    if (depts.length > 0) {
      const deptPlaceholders = depts.map(() => '?').join(',');
      const [deptUsers] = await db.promise().query(
        `SELECT user_id FROM dms_user WHERE department_id IN (${deptPlaceholders}) AND status = 'active'`,
        depts
      );
      targetUserIds.push(...deptUsers.map(u => u.user_id));
    }

    // Get users from roles
    if (roles.length > 0) {
      const rolePlaceholders = roles.map(() => '?').join(',');
      const [roleUsers] = await db.promise().query(
        `SELECT user_id FROM dms_user WHERE role IN (${rolePlaceholders}) AND status = 'active'`,
        roles
      );
      targetUserIds.push(...roleUsers.map(u => u.user_id));
    }

    // Remove duplicates
    targetUserIds = [...new Set(targetUserIds)];

    // Send push notifications
    if (sendPush && targetUserIds.length > 0) {
      await sendPushNotification(targetUserIds, {
        title,
        message,
        type,
        notificationId,
        url: '/#/dashboard'
      });
    }

    // Emit Socket.IO events to specific rooms
    if (io) {
      users.forEach(userId => {
        io.to(`user:${userId}`).emit('notification:new', { notificationId, title, message, type });
      });
      depts.forEach(deptId => {
        io.to(`dept:${deptId}`).emit('notification:new', { notificationId, title, message, type });
      });
      roles.forEach(role => {
        io.to(`role:${role}`).emit('notification:new', { notificationId, title, message, type });
      });
    }

    return notificationId;
  } catch (error) {
    console.error('Error creating notification with push:', error);
    return null;
  }
};

export default createNotificationWithPush;
