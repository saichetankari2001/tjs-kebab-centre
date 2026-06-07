importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyC88dWTwoCGKFYhpdT32wO7xSggk97IgDs",
  authDomain: "tj-s-kebab-centre.firebaseapp.com",
  projectId: "tj-s-kebab-centre",
  storageBucket: "tj-s-kebab-centre.firebasestorage.app",
  messagingSenderId: "527619562751",
  appId: "1:527619562751:web:1d1979b2b98f2139c340ca"
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
