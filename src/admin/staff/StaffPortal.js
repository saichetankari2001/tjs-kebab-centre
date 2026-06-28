import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, updateDoc, doc, query, where, orderBy, limit, getDocs, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase';

export default function StaffPortal() {
  const [user,           setUser]           = useState(null);
  const [staffProfile,   setStaffProfile]   = useState(null);
  const [activeSession,  setActiveSession]  = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [elapsed,        setElapsed]        = useState(0);
  const [email,          setEmail]          = useState('');
  const [password,       setPassword]       = useState('');
  const [loginError,     setLoginError]     = useState('');
  const [loggingIn,      setLoggingIn]      = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDocs(query(collection(db, 'staff'), where('email', '==', u.email), limit(1)));
        if (!snap.empty) setStaffProfile({ id: snap.docs[0].id, ...snap.docs[0].data() });
        const sessionSnap = await getDocs(
          query(collection(db, 'staffSessions'), where('staffId', '==', u.uid), where('clockOut', '==', null), limit(1))
        );
        if (!sessionSnap.empty) setActiveSession({ id: sessionSnap.docs[0].id, ...sessionSnap.docs[0].data() });
      } else {
        setStaffProfile(null); setActiveSession(null); setElapsed(0);
      }
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      query(collection(db, 'staffSessions'), where('staffId', '==', user.uid), orderBy('clockIn', 'desc'), limit(10)),
      snap => setRecentSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, [user]);

  useEffect(() => {
    if (!activeSession?.clockIn) return;
    const clockInMs = activeSession.clockIn?.toDate?.()?.getTime?.() ?? Date.now();
    const tick = () => setElapsed(Math.floor((Date.now() - clockInMs) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeSession]);

  const login = async (e) => {
    e.preventDefault(); setLoggingIn(true); setLoginError('');
    try { await signInWithEmailAndPassword(auth, email, password); }
    catch { setLoginError('Incorrect email or password.'); }
    setLoggingIn(false);
  };

  const clockIn = async () => {
    const ref = await addDoc(collection(db, 'staffSessions'), {
      staffId: user.uid, staffName: staffProfile?.name ?? user.email,
      staffEmail: user.email, clockIn: serverTimestamp(), clockOut: null, hoursWorked: null,
    });
    setActiveSession({ id: ref.id, clockIn: { toDate: () => new Date() } });
  };

  const clockOut = async () => {
    if (!activeSession) return;
    const now = new Date();
    const hoursWorked = parseFloat(((now - (activeSession.clockIn?.toDate?.() ?? now)) / 3600000).toFixed(2));
    await updateDoc(doc(db, 'staffSessions', activeSession.id), { clockOut: now.toISOString(), hoursWorked });
    setActiveSession(null); setElapsed(0);
  };

  const fmt = (s) => `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor((s%3600)/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  const S = {
    page:  { minHeight: '100vh', background: '#0e0b07', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 },
    card:  { background: '#1b1509', border: '1px solid #332810', borderRadius: 16, padding: 28, width: '100%', maxWidth: 400 },
    title: { color: '#f59e0b', fontSize: 24, fontWeight: 900, letterSpacing: 2, marginBottom: 4 },
    sub:   { color: '#9c8a72', fontSize: 13, marginBottom: 24 },
    input: { background: '#111', border: '1px solid #332810', color: '#fff', padding: '12px 14px', borderRadius: 8, fontSize: 14, width: '100%', outline: 'none', marginBottom: 10, boxSizing: 'border-box' },
    btn:   (bg) => ({ background: bg, color: bg === '#f59e0b' ? '#000' : '#fff', border: 'none', padding: '14px', borderRadius: 10, fontSize: 15, fontWeight: 800, width: '100%', cursor: 'pointer', marginBottom: 10 }),
    timer: { fontSize: 52, fontWeight: 900, color: '#f59e0b', textAlign: 'center', fontVariantNumeric: 'tabular-nums', marginBottom: 16, letterSpacing: 2 },
    row:   { background: '#111', border: '1px solid #251e0e', borderRadius: 8, padding: '10px 14px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 },
  };

  if (!user) return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.title}>TJ'S KEBAB</div>
        <div style={S.sub}>Staff Portal — sign in to clock in/out</div>
        <form onSubmit={login}>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Staff email" required style={S.input} />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required style={S.input} />
          {loginError && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 10 }}>{loginError}</p>}
          <button type="submit" disabled={loggingIn} style={S.btn('#f59e0b')}>{loggingIn ? 'Signing in...' : 'SIGN IN'}</button>
        </form>
      </div>
    </div>
  );

  const today = new Date();
  const todaySessions = recentSessions.filter(s => s.clockIn?.toDate?.()?.toDateString() === today.toDateString());
  const todayHours = todaySessions.reduce((sum, s) => sum + (s.hoursWorked ?? 0), 0);

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={S.title}>TJ'S KEBAB</div>
            <div style={{ color: '#f0ead8', fontWeight: 700, fontSize: 15 }}>{staffProfile?.name ?? user.email}</div>
            <div style={{ color: '#9c8a72', fontSize: 12 }}>
              {today.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
          <button onClick={() => signOut(auth)} style={{ background: 'none', border: '1px solid #332810', color: '#9c8a72', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Sign out</button>
        </div>

        {activeSession && <>
          <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '14px 16px', textAlign: 'center', marginBottom: 14 }}>
            <p style={{ color: '#9c8a72', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 8px' }}>Clocked In</p>
            <div style={S.timer}>{fmt(elapsed)}</div>
          </div>
          <button onClick={clockOut} style={S.btn('#ef4444')}>🔴 CLOCK OUT</button>
        </>}
        {!activeSession && <button onClick={clockIn} style={S.btn('#16a34a')}>🟢 CLOCK IN</button>}

        <div style={{ marginTop: 20, borderTop: '1px solid #251e0e', paddingTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ color: '#9c8a72', fontSize: 12, fontWeight: 700 }}>TODAY'S HOURS</span>
            <span style={{ color: '#f59e0b', fontWeight: 800 }}>{todayHours.toFixed(2)}h</span>
          </div>
          {todaySessions.map(s => (
            <div key={s.id} style={S.row}>
              <span style={{ color: '#9c8a72' }}>
                {s.clockIn?.toDate?.()?.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }) ?? '—'}
                {' → '}
                {s.clockOut ? new Date(s.clockOut).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }) : <span style={{ color: '#4ade80' }}>NOW</span>}
              </span>
              <span style={{ color: '#f0ead8', fontWeight: 700 }}>{s.hoursWorked != null ? `${s.hoursWorked}h` : '...'}</span>
            </div>
          ))}
          {todaySessions.length === 0 && !activeSession && (
            <p style={{ color: '#9c8a72', fontSize: 12, textAlign: 'center', margin: 0 }}>No sessions recorded today.</p>
          )}
        </div>
      </div>
    </div>
  );
}
