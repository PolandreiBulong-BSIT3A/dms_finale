# Push Notifications Setup Guide

This guide explains how to set up and use browser push notifications to notify users even when they're away from the website.

## Overview

The push notification system allows you to send notifications to users even when:
- The browser tab is closed (but browser is running)
- The user is on a different website
- The user's device is locked (on mobile)

## Prerequisites

1. **HTTPS Required**: Push notifications only work on HTTPS (or localhost for development)
2. **Browser Support**: Modern browsers (Chrome, Firefox, Edge, Safari 16+)
3. **User Permission**: Users must grant notification permission

## Setup Steps

### 1. Generate VAPID Keys

VAPID keys are required for web push notifications. Generate them using:

```bash
npx web-push generate-vapid-keys
```

This will output:
```
Public Key: BNxJvXxz7V8kQ9Z8KqH5Yv5rYxQ8Z8KqH5Yv5rYxQ8Z8KqH5Yv5rYxQ8Z8KqH5Yv5rYxQ8Z8KqH5Yv5rYxQ
Private Key: your-private-key-here
```

### 2. Add Environment Variables

Add these to your `.env` file:

```env
# Push Notification Configuration
VAPID_PUBLIC_KEY=your-public-key-here
VAPID_PRIVATE_KEY=your-private-key-here
VAPID_SUBJECT=mailto:admin@ispsctagudindms.com
```

**⚠️ IMPORTANT**: Never commit your private key to version control!

### 3. Install Dependencies

Install the `web-push` library:

```bash
npm install web-push
```

### 4. Run Database Migration

Execute the SQL migration to create the `push_subscriptions` table:

```bash
# Using MySQL CLI
mysql -u your_username -p your_database < migrations/add_push_subscriptions_table.sql

# Or run the SQL directly in your database client
```

### 5. Rebuild and Deploy

```bash
npm run build
git add -A
git commit -m "Add push notification support"
git push
```

## How It Works

### User Flow

1. **User logs in** → Service worker is registered automatically
2. **Permission check** → If already granted, subscribes to push notifications
3. **Notification created** → Backend sends push notification to subscribed users
4. **User receives notification** → Even if browser tab is closed

### Technical Flow

```
Frontend (Service Worker) ←→ Backend (NotificationsAPI) ←→ Push Service (Browser)
         ↓                              ↓
    User Browser                  Database (push_subscriptions)
```

## Usage

### For Developers: Sending Push Notifications

Use the `createNotificationWithPush` helper function:

```javascript
import { createNotificationWithPush } from './notificationHelper.js';

// Example: Notify all admins
await createNotificationWithPush(
  'New Document Uploaded',
  'A new document requires your review',
  'document_upload',
  documentId,
  {
    roles: ['ADMIN', 'DEAN']
  },
  true, // sendPush = true
  io    // Socket.IO instance
);

// Example: Notify specific users
await createNotificationWithPush(
  'Document Approved',
  'Your document has been approved',
  'document_status',
  documentId,
  {
    users: [userId1, userId2]
  },
  true,
  io
);

// Example: Notify entire department
await createNotificationWithPush(
  'Department Meeting',
  'Meeting scheduled for tomorrow at 2 PM',
  'announcement',
  null,
  {
    departments: [departmentId]
  },
  true,
  io
);
```

### For Users: Enabling Notifications

Users will be prompted to enable notifications when they log in. They can also:

1. Click the notification icon in the browser address bar
2. Allow notifications when prompted
3. Manage notification settings in browser settings

## Testing

### Test Push Notifications Locally

1. **Open the application** in your browser
2. **Open DevTools** (F12) → Console
3. **Run this command**:

```javascript
// Request permission and show test notification
const { showTestNotification } = await import('/src/lib/utils/pushNotifications.js');
await showTestNotification();
```

### Test When Tab is Closed

1. **Log in** to the application
2. **Grant notification permission** when prompted
3. **Close the browser tab** (keep browser running)
4. **Trigger a notification** from another user or admin panel
5. **You should receive a notification** even though the tab is closed

## Troubleshooting

### Notifications Not Showing

1. **Check browser permission**: 
   - Chrome: `chrome://settings/content/notifications`
   - Firefox: `about:preferences#privacy` → Notifications

2. **Check HTTPS**: Push notifications require HTTPS (except localhost)

3. **Check service worker registration**:
   ```javascript
   navigator.serviceWorker.getRegistrations().then(console.log)
   ```

4. **Check subscription**:
   ```javascript
   navigator.serviceWorker.ready.then(reg => 
     reg.pushManager.getSubscription().then(console.log)
   )
   ```

### Invalid VAPID Keys

If you see "Invalid VAPID keys" error:
1. Generate new keys: `npx web-push generate-vapid-keys`
2. Update `.env` file
3. Restart server
4. Clear browser cache and resubscribe

### Database Errors

If you see "Table 'push_subscriptions' doesn't exist":
1. Run the migration: `migrations/add_push_subscriptions_table.sql`
2. Verify table exists: `SHOW TABLES LIKE 'push_subscriptions';`

## Browser Compatibility

| Browser | Version | Support |
|---------|---------|---------|
| Chrome  | 50+     | ✅ Full |
| Firefox | 44+     | ✅ Full |
| Edge    | 17+     | ✅ Full |
| Safari  | 16+     | ✅ Full |
| Opera   | 37+     | ✅ Full |

## Security Considerations

1. **VAPID Keys**: Keep private key secret, never expose in frontend code
2. **User Consent**: Always request permission, never force
3. **HTTPS Only**: Push notifications require secure connection
4. **Subscription Validation**: Backend validates user owns subscription
5. **Rate Limiting**: Consider rate limiting push notifications

## Performance

- **Subscription Storage**: ~500 bytes per user
- **Push Payload**: Max 4KB per notification
- **Delivery**: Near-instant (depends on browser push service)
- **Battery Impact**: Minimal (handled by browser)

## API Reference

### Frontend Functions

```javascript
// Check if push notifications are supported
isPushNotificationSupported(): boolean

// Request notification permission
requestNotificationPermission(): Promise<boolean>

// Get current permission status
getNotificationPermission(): 'granted' | 'denied' | 'default' | 'unsupported'

// Subscribe to push notifications
subscribeToPushNotifications(userId: number): Promise<PushSubscription>

// Unsubscribe from push notifications
unsubscribeFromPushNotifications(userId: number): Promise<boolean>

// Show test notification
showTestNotification(): Promise<void>
```

### Backend Functions

```javascript
// Send push notification to specific users
sendPushNotification(userIds: number[], payload: object): Promise<void>

// Create notification with push
createNotificationWithPush(
  title: string,
  message: string,
  type: string,
  relatedDocId: number | null,
  audience: object,
  sendPush: boolean,
  io: SocketIO
): Promise<number>
```

## Examples

### Example 1: Document Upload Notification

```javascript
// When a document is uploaded
await createNotificationWithPush(
  'New Document: Annual Report 2024',
  'John Doe uploaded a new document for review',
  'document_upload',
  documentId,
  {
    roles: ['ADMIN', 'DEAN'],
    departments: [uploadDepartmentId]
  },
  true,
  req.io
);
```

### Example 2: User Registration Notification

```javascript
// When a new user registers
await createNotificationWithPush(
  'New User Registration',
  `${username} has registered and needs approval`,
  'user_registration',
  null,
  {
    roles: ['ADMIN']
  },
  true,
  req.io
);
```

### Example 3: Urgent System Alert

```javascript
// System-wide urgent notification
await createNotificationWithPush(
  '🚨 System Maintenance',
  'System will be down for maintenance in 30 minutes',
  'system_alert',
  null,
  {
    visibleToAll: true
  },
  true,
  req.io
);
```

## Next Steps

1. ✅ Generate VAPID keys
2. ✅ Add to environment variables
3. ✅ Run database migration
4. ✅ Install dependencies
5. ✅ Test locally
6. ✅ Deploy to production
7. ✅ Monitor push notification delivery

## Support

For issues or questions:
- Check browser console for errors
- Review server logs for push failures
- Test with `showTestNotification()`
- Verify VAPID keys are correct

---

**Last Updated**: October 2025
