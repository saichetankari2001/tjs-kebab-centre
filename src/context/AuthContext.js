import React, { createContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,     setUser]     = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    let customerUnsub = () => {};

    const authUnsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      customerUnsub();

      if (firebaseUser) {
        customerUnsub = onSnapshot(doc(db, 'customers', firebaseUser.uid), (snap) => {
          setCustomer(snap.exists() ? { id: snap.id, ...snap.data() } : null);
        });
      } else {
        setCustomer(null);
      }

      setLoading(false);
    });

    return () => { authUnsub(); customerUnsub(); };
  }, []);

  const signUp = async (firstName, lastName, email, password, phone) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'customers', cred.user.uid), {
      firstName,
      lastName,
      email,
      phone: phone || null,
      stamps: 0,
      totalOrders: 0,
      freeOrderEligible: false,
      notifyEmail: true,
      notifySMS: false,
      notifyPush: false,
      fcmToken: null,
      createdAt: new Date().toISOString(),
    });
  };

  const signIn  = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const signOut = () => firebaseSignOut(auth);

  return (
    <AuthContext.Provider value={{ user, customer, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
