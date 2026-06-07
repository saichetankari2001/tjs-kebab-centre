// ============================================================
// FIREBASE CONFIG
// ============================================================
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyC88dWTwoCGKFYhpdT32wO7xSggk97IgDs",
  authDomain: "tj-s-kebab-centre.firebaseapp.com",
  projectId: "tj-s-kebab-centre",
  storageBucket: "tj-s-kebab-centre.firebasestorage.app",
  messagingSenderId: "527619562751",
  appId: "1:527619562751:web:1d1979b2b98f2139c340ca"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
