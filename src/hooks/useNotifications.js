import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import app from '../firebase';

const VAPID_KEY = 'YOUR_VAPID_KEY'; // We'll add this after setup

export async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;
    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    return token;
  } catch (err) {
    console.log('Notification permission error:', err);
    return null;
  }
}

export async function saveTokenToOrder(orderId, token) {
  if (!token || !orderId) return;
  try {
    await updateDoc(doc(db, 'orders', orderId), { fcmToken: token });
  } catch (err) {
    console.log('Error saving token:', err);
  }
}

export function listenForMessages(callback) {
  try {
    const messaging = getMessaging(app);
    return onMessage(messaging, payload => {
      callback(payload);
    });
  } catch (err) {
    return () => {};
  }
}

// Send notification via Firebase - called from admin when status changes
export async function sendOrderNotification(token, title, body) {
  try {
    await addDoc(collection(db, 'notifications'), {
      token, title, body,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.log('Error sending notification:', err);
  }
}
