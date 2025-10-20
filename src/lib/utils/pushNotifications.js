// Push Notification Utility
// Handles browser push notification subscriptions

import { buildUrl, fetchJson } from '../api/frontend/client.js';

// Check if push notifications are supported
export const isPushNotificationSupported = () => {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
};

// Request notification permission
export const requestNotificationPermission = async () => {
  if (!isPushNotificationSupported()) {
    console.warn('Push notifications are not supported in this browser');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

// Get current notification permission status
export const getNotificationPermission = () => {
  if (!isPushNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
};

// Register service worker
export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers are not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });
    console.log('Service Worker registered:', registration);
    
    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;
    console.log('Service Worker is ready');
    
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
};

// Convert VAPID public key to Uint8Array
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

// Subscribe to push notifications
export const subscribeToPushNotifications = async (userId) => {
  if (!isPushNotificationSupported()) {
    console.warn('Push notifications not supported');
    return null;
  }

  try {
    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;
    
    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Get VAPID public key from server
      const vapidResponse = await fetchJson(buildUrl('notifications/vapid-public-key'));
      const vapidPublicKey = vapidResponse.publicKey;
      
      if (!vapidPublicKey) {
        console.error('VAPID public key not available');
        return null;
      }

      // Subscribe to push notifications
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });
      
      console.log('Push subscription created:', subscription);
    } else {
      console.log('Already subscribed to push notifications');
    }

    // Send subscription to server
    const response = await fetchJson(buildUrl('notifications/subscribe'), {
      method: 'POST',
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        userId: userId
      })
    });

    if (response.success) {
      console.log('Push subscription saved to server');
      return subscription;
    } else {
      console.error('Failed to save push subscription:', response.message);
      return null;
    }
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return null;
  }
};

// Unsubscribe from push notifications
export const unsubscribeFromPushNotifications = async (userId) => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      console.log('Unsubscribed from push notifications');
      
      // Notify server
      await fetchJson(buildUrl('notifications/unsubscribe'), {
        method: 'POST',
        body: JSON.stringify({ userId })
      }).catch(err => console.error('Failed to notify server:', err));
      
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return false;
  }
};

// Show a test notification
export const showTestNotification = async () => {
  if (!isPushNotificationSupported()) {
    alert('Push notifications are not supported in this browser');
    return;
  }

  const permission = await requestNotificationPermission();
  if (!permission) {
    alert('Notification permission denied');
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  await registration.showNotification('ISPSC DMS Test', {
    body: 'This is a test notification. You will receive notifications like this when you are away.',
    icon: '/icons/favicon.ico',
    badge: '/icons/favicon.ico',
    tag: 'test-notification',
    requireInteraction: false,
    vibrate: [200, 100, 200]
  });
};
