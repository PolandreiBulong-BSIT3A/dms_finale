# 🔔 Push Notifications - Quick Start

## What's New?

Your ISPSC DMS now supports **browser push notifications** that work even when users are away from the website!

## ✨ Features

- ✅ Notifications when browser tab is closed
- ✅ Notifications when user is on different website
- ✅ Works on desktop and mobile browsers
- ✅ Automatic subscription management
- ✅ Integrated with existing notification system
- ✅ Secure with VAPID authentication

## 🚀 Quick Setup (5 minutes)

### 1. Generate VAPID Keys
```bash
npx web-push generate-vapid-keys
```

### 2. Add to `.env`
```env
VAPID_PUBLIC_KEY=your-public-key-here
VAPID_PRIVATE_KEY=your-private-key-here
VAPID_SUBJECT=mailto:admin@ispsctagudindms.com
```

### 3. Install Dependency
```bash
npm install web-push
```

### 4. Run Database Migration
```sql
-- Run this in your MySQL database
CREATE TABLE IF NOT EXISTS push_subscriptions (
  subscription_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  subscription_data TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_subscription (user_id),
  FOREIGN KEY (user_id) REFERENCES dms_user(user_id) ON DELETE CASCADE
);
```

### 5. Deploy
```bash
npm run build
git add -A
git commit -m "Add push notifications"
git push
```

## 📖 Documentation

- **[Complete Setup Guide](./PUSH_NOTIFICATIONS_SETUP.md)** - Detailed installation and configuration
- **[Integration Examples](./PUSH_NOTIFICATION_EXAMPLES.md)** - Code examples for common use cases
- **[Migration SQL](./migrations/add_push_subscriptions_table.sql)** - Database schema

## 🎯 How to Use

### For Developers

Replace your existing notification code:

**Old:**
```javascript
db.query('INSERT INTO notifications...', callback);
```

**New:**
```javascript
import { createNotificationWithPush } from './notifications/notificationHelper.js';

await createNotificationWithPush(
  'Notification Title',
  'Notification message',
  'notification_type',
  relatedDocId,
  { roles: ['ADMIN'], users: [userId] },
  true, // Send push notification
  io    // Socket.IO instance
);
```

### For Users

1. Log in to the system
2. Allow notifications when prompted
3. Receive notifications even when away!

## 🧪 Testing

Test if it works:

1. Open browser console (F12)
2. Run:
```javascript
const { showTestNotification } = await import('/src/lib/utils/pushNotifications.js');
await showTestNotification();
```
3. Close the browser tab
4. You should still receive the notification!

## 📁 New Files Added

```
ispsc_dms/
├── public/
│   └── sw.js                                    # Service worker
├── src/
│   └── lib/
│       ├── utils/
│       │   └── pushNotifications.js             # Push notification utilities
│       └── api/
│           └── backend/
│               └── notifications/
│                   ├── NotificationsAPI.js      # Updated with push endpoints
│                   └── notificationHelper.js    # Helper function
├── migrations/
│   └── add_push_subscriptions_table.sql         # Database migration
├── PUSH_NOTIFICATIONS_SETUP.md                  # Full setup guide
├── PUSH_NOTIFICATION_EXAMPLES.md                # Code examples
└── PUSH_NOTIFICATIONS_README.md                 # This file
```

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VAPID_PUBLIC_KEY` | Yes | Public key for push notifications |
| `VAPID_PRIVATE_KEY` | Yes | Private key (keep secret!) |
| `VAPID_SUBJECT` | Yes | Contact email (mailto:...) |

### Browser Requirements

- Chrome 50+
- Firefox 44+
- Edge 17+
- Safari 16+
- Opera 37+

## 🔒 Security

- ✅ HTTPS required (except localhost)
- ✅ User permission required
- ✅ VAPID authentication
- ✅ Subscription validation
- ✅ Automatic cleanup of invalid subscriptions

## 🐛 Troubleshooting

### Notifications not showing?

1. Check browser permission settings
2. Verify HTTPS is enabled
3. Check service worker registration
4. Review browser console for errors

### See detailed troubleshooting in [PUSH_NOTIFICATIONS_SETUP.md](./PUSH_NOTIFICATIONS_SETUP.md#troubleshooting)

## 📊 Performance

- **Subscription size**: ~500 bytes per user
- **Delivery time**: Near-instant
- **Battery impact**: Minimal (handled by browser)
- **Max payload**: 4KB per notification

## 🎉 Benefits

1. **Better User Engagement**: Users stay informed even when away
2. **Real-time Updates**: Instant notification delivery
3. **Cross-platform**: Works on desktop and mobile
4. **Offline Support**: Notifications queue when offline
5. **Professional**: Modern web app experience

## 📞 Support

For questions or issues:
1. Check the [Setup Guide](./PUSH_NOTIFICATIONS_SETUP.md)
2. Review [Examples](./PUSH_NOTIFICATION_EXAMPLES.md)
3. Test with `showTestNotification()`
4. Check browser console and server logs

---

**Ready to go!** Follow the Quick Setup above and start sending push notifications in 5 minutes.

**Last Updated**: October 2025
