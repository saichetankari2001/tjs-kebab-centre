import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

let currentSessionId = null;

export async function recordLogin() {
  try {
    const ref = await addDoc(collection(db, 'staffSessions'), {
      device:    'Merchant Tablet',
      loginTime: serverTimestamp(),
      logoutTime: null,
    });
    currentSessionId = ref.id;
  } catch (e) {
    console.warn('Could not record login:', e.message);
  }
}

export async function recordLogout() {
  if (!currentSessionId) return;
  try {
    await updateDoc(doc(db, 'staffSessions', currentSessionId), {
      logoutTime: serverTimestamp(),
    });
    currentSessionId = null;
  } catch (e) {
    console.warn('Could not record logout:', e.message);
  }
}

export function useStaffSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'staffSessions'), orderBy('loginTime', 'desc'), limit(50));
    const unsub = onSnapshot(
      q,
      snap => { setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); },
      err  => { console.warn('Staff sessions error:', err.message); setLoading(false); }
    );
    return unsub;
  }, []);

  return { sessions, loading };
}
