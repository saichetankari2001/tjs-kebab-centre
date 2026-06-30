importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "%REACT_APP_FIREBASE_API_KEY%",
  authDomain: "%REACT_APP_FIREBASE_AUTH_DOMAIN%",
  projectId: "%REACT_APP_FIREBASE_PROJECT_ID%",
  storageBucket: "%REACT_APP_FIREBASE_STORAGE_BUCKET%",
  messagingSenderId: "%REACT_APP_FIREBASE_MESSAGING_SENDER_ID%",
  appId: "%REACT_APP_FIREBASE_APP_ID%"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  const { title, body, icon } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: icon || '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: payload.data,
  });
});
