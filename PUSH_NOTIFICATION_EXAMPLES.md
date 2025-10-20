# Push Notification Integration Examples

This document shows how to integrate push notifications into your existing code.

## Example 1: Update Document Upload to Send Push Notifications

**Before:**
```javascript
// Old code in DocumentsAPI.js
const notificationId = await createNotification(
  'New Document Uploaded',
  `${user.username} uploaded "${title}"`,
  'document_upload',
  documentId,
  { roles: ['ADMIN', 'DEAN'] }
);

// Emit Socket.IO event
io.emit('notification:new', { notificationId });
```

**After:**
```javascript
// New code with push notifications
import { createNotificationWithPush } from './notifications/notificationHelper.js';

const notificationId = await createNotificationWithPush(
  'New Document Uploaded',
  `${user.username} uploaded "${title}"`,
  'document_upload',
  documentId,
  { roles: ['ADMIN', 'DEAN'] },
  true, // Send push notification
  io    // Socket.IO instance
);
```

## Example 2: Update User Registration to Send Push Notifications

**File:** `GoogleApi.js` or `LoginAPI.js`

**Before:**
```javascript
// Create notification for new user registration
db.query(
  `INSERT INTO notifications (title, message, type, visible_to_all)
   VALUES (?, ?, 'user_registration', 0)`,
  [notifTitle, notifMessage],
  (notifErr, notifResult) => {
    // ... handle notification targeting
  }
);
```

**After:**
```javascript
import { createNotificationWithPush } from '../notifications/notificationHelper.js';

await createNotificationWithPush(
  `New User Registration: ${username}`,
  `A new user "${username}" (${email}) has registered`,
  'user_registration',
  null,
  { roles: ['ADMIN', 'DEAN'] },
  true,
  req.io
);
```

## Example 3: Document Status Change Notification

**File:** `DocumentsAPI.js`

```javascript
// When document status changes (approved/rejected)
import { createNotificationWithPush } from './notifications/notificationHelper.js';

router.post('/documents/:id/status', requireAuth, async (req, res) => {
  const { status } = req.body;
  const documentId = req.params.id;
  
  // Update document status...
  
  // Get document owner
  const [doc] = await db.promise().query(
    'SELECT uploaded_by, title FROM documents WHERE document_id = ?',
    [documentId]
  );
  
  if (doc.length > 0) {
    const statusText = status === 'approved' ? 'approved' : 'rejected';
    
    // Notify document owner
    await createNotificationWithPush(
      `Document ${statusText.toUpperCase()}`,
      `Your document "${doc[0].title}" has been ${statusText}`,
      'document_status',
      documentId,
      { users: [doc[0].uploaded_by] },
      true,
      req.io
    );
  }
  
  res.json({ success: true });
});
```

## Example 4: Comment/Feedback Notification

**File:** `DocumentsAPI.js`

```javascript
// When someone comments on a document
router.post('/documents/:id/comment', requireAuth, async (req, res) => {
  const { comment } = req.body;
  const documentId = req.params.id;
  const userId = req.currentUser.id;
  
  // Save comment...
  
  // Get document owner and title
  const [doc] = await db.promise().query(
    'SELECT uploaded_by, title FROM documents WHERE document_id = ?',
    [documentId]
  );
  
  if (doc.length > 0 && doc[0].uploaded_by !== userId) {
    // Notify document owner (don't notify yourself)
    await createNotificationWithPush(
      'New Comment on Your Document',
      `Someone commented on "${doc[0].title}"`,
      'document_comment',
      documentId,
      { users: [doc[0].uploaded_by] },
      true,
      req.io
    );
  }
  
  res.json({ success: true });
});
```

## Example 5: Deadline Reminder (Scheduled)

**File:** `scheduledTasks.js` (create if doesn't exist)

```javascript
import cron from 'node-cron';
import db from './connections/connection.js';
import { createNotificationWithPush } from './notifications/notificationHelper.js';

// Run every day at 9 AM
cron.schedule('0 9 * * *', async () => {
  console.log('Checking for upcoming deadlines...');
  
  // Get documents with deadlines in next 3 days
  const [documents] = await db.promise().query(`
    SELECT d.document_id, d.title, d.deadline, d.uploaded_by
    FROM documents d
    WHERE d.deadline BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 3 DAY)
    AND d.status = 'pending'
  `);
  
  for (const doc of documents) {
    await createNotificationWithPush(
      '⏰ Deadline Reminder',
      `Document "${doc.title}" deadline is approaching`,
      'deadline_reminder',
      doc.document_id,
      { users: [doc.uploaded_by] },
      true,
      null // No Socket.IO for scheduled tasks
    );
  }
  
  console.log(`Sent ${documents.length} deadline reminders`);
});
```

## Example 6: Bulk Notification to Department

**File:** `AnnouncementsAPI.js`

```javascript
// When creating a department announcement
router.post('/announcements', requireAuth, async (req, res) => {
  const { title, message, departmentId } = req.body;
  
  // Save announcement...
  
  // Notify entire department
  await createNotificationWithPush(
    `📢 ${title}`,
    message,
    'announcement',
    null,
    { departments: [departmentId] },
    true,
    req.io
  );
  
  res.json({ success: true });
});
```

## Example 7: System Maintenance Alert

**File:** `SystemMaintenanceAPI.js`

```javascript
// When scheduling system maintenance
router.post('/system/maintenance/schedule', requireAuth, async (req, res) => {
  const { startTime, endTime, message } = req.body;
  
  // Save maintenance schedule...
  
  // Notify all users
  await createNotificationWithPush(
    '🔧 Scheduled Maintenance',
    `System will be under maintenance from ${startTime} to ${endTime}. ${message}`,
    'system_maintenance',
    null,
    { visibleToAll: true },
    true,
    req.io
  );
  
  res.json({ success: true });
});
```

## Example 8: Permission Request Notification

**File:** `RequestsAPI.js`

```javascript
// When user requests access to a document
router.post('/documents/:id/request-access', requireAuth, async (req, res) => {
  const documentId = req.params.id;
  const userId = req.currentUser.id;
  
  // Get document owner
  const [doc] = await db.promise().query(
    'SELECT uploaded_by, title FROM documents WHERE document_id = ?',
    [documentId]
  );
  
  if (doc.length > 0) {
    // Notify document owner
    await createNotificationWithPush(
      'Access Request',
      `Someone requested access to "${doc[0].title}"`,
      'access_request',
      documentId,
      { users: [doc[0].uploaded_by] },
      true,
      req.io
    );
  }
  
  res.json({ success: true });
});
```

## Migration Guide

### Step 1: Find All Notification Creation Code

Search for:
- `INSERT INTO notifications`
- `createNotification(`
- `db.query.*notifications`

### Step 2: Replace with Helper Function

Replace manual notification creation with:
```javascript
import { createNotificationWithPush } from './notifications/notificationHelper.js';

await createNotificationWithPush(title, message, type, docId, audience, true, io);
```

### Step 3: Update Imports

Add to the top of files:
```javascript
import { createNotificationWithPush } from './notifications/notificationHelper.js';
```

### Step 4: Pass Socket.IO Instance

Make sure routes have access to `io`:
```javascript
router.post('/some-route', requireAuth, async (req, res) => {
  const io = req.io; // Access Socket.IO from request
  // ... use io in createNotificationWithPush
});
```

## Testing Checklist

- [ ] User receives notification when logged in
- [ ] User receives notification when tab is closed (browser open)
- [ ] User receives notification on mobile device
- [ ] Notification shows correct title and message
- [ ] Clicking notification opens the app
- [ ] Multiple users receive targeted notifications
- [ ] Push notifications work with Socket.IO notifications
- [ ] Invalid subscriptions are cleaned up automatically

## Common Issues

### Issue: Notifications not received when tab closed
**Solution**: Check if service worker is registered and user granted permission

### Issue: All users receiving notifications
**Solution**: Check audience targeting in `createNotificationWithPush`

### Issue: Duplicate notifications
**Solution**: Make sure you're not calling both old and new notification methods

### Issue: Push notification shows but Socket.IO doesn't
**Solution**: Ensure `io` parameter is passed to `createNotificationWithPush`

---

**Pro Tip**: Start by updating one notification type (e.g., document upload), test thoroughly, then migrate others.
