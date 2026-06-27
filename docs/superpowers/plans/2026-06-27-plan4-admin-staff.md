# TJ's Kebab Centre — Plan 4: Admin Enhancements + Staff Hours

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the admin panel with inline live price editing (changes reflect in the customer menu instantly), a subscribers view, and enhance the staff portal with proper clock-in/clock-out time tracking, daily hours summary, and simple export.

**Architecture:** All changes to existing `src/admin/AdminDashboard.js` and `src/admin/staff/StaffPortal.js`. Price edits write directly to Firestore `menuItems` — the customer menu reads via onSnapshot so changes are live within seconds. Staff sessions stored in Firestore `staffSessions` collection with `staffId`, `clockIn`, `clockOut`, `hoursWorked`.

**Tech Stack:** React 18, Firebase Firestore (existing), Tailwind (admin uses inline styles — keep consistent)

## Global Constraints
- Admin panel keeps existing inline style approach (no Tailwind in admin — consistency with existing code)
- Price changes must debounce 800ms before writing to Firestore (prevent too many writes while typing)
- Staff clock-in/out times stored as ISO strings in Firestore
- Only the currently logged-in staff member can see their own clock button (others see read-only)
- Plan 1 + Plan 2 must be complete; Plan 3 optional

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Modify | `src/admin/AdminDashboard.js` | inline price editing, availability toggle UX, subscriber tab |
| Modify | `src/admin/staff/StaffPortal.js` | clock in/out with Firestore session tracking |
| Modify | `src/admin/staff/StaffManagement.js` | hours summary per staff per day, CSV export |

---

### Task 1: Inline price editing in Admin Menu tab

**Files:**
- Modify: `src/admin/AdminDashboard.js`

**Goal:** When admin types a new price for any menu item, it debounces 800ms then writes to Firestore. The customer menu (via onSnapshot) updates in real-time.

- [ ] **Step 1: Add debounced price update helper to AdminDashboard**

At the top of the component function, add a debounce ref map and the update handler:
```js
const priceTimers = useRef({});

const handlePriceChange = (id, newPrice) => {
  // Optimistic UI — update local state immediately
  setMenuItems(prev => prev.map(item => item.id === id ? { ...item, price: parseFloat(newPrice) || item.price } : item));

  // Debounce the Firestore write 800ms
  clearTimeout(priceTimers.current[id]);
  priceTimers.current[id] = setTimeout(async () => {
    const parsed = parseFloat(newPrice);
    if (!isNaN(parsed) && parsed > 0) {
      await updateDoc(doc(db, 'menuItems', id), { price: parsed });
    }
  }, 800);
};
```

- [ ] **Step 2: Replace the menu item price display with an editable input**

In the Menu tab render, find where item price is displayed (look for `item.price` or `${item.price}`). Replace the static display with:

```jsx
{/* Price input — saves to Firestore on change (debounced 800ms) */}
<div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
  <span style={{ color: '#9ca3af', fontSize: 11 }}>$</span>
  <input
    type="number"
    min="0"
    step="0.50"
    value={item.price}
    onChange={e => handlePriceChange(item.id, e.target.value)}
    title="Edit price — saves automatically"
    style={{
      background: '#111',
      border: '1px solid #2a2a2a',
      color: '#f59e0b',
      padding: '4px 6px',
      borderRadius: 6,
      fontSize: 13,
      fontWeight: 700,
      width: 65,
      textAlign: 'right',
      outline: 'none',
    }}
    onFocus={e => e.target.style.borderColor = '#f59e0b'}
    onBlur={e  => e.target.style.borderColor = '#2a2a2a'}
  />
</div>
```

- [ ] **Step 3: Add a "Live" indicator badge next to the Menu tab heading**

Below the "🍽️ Menu" tab content heading, add:
```jsx
<span style={{ background: '#16a34a22', border: '1px solid #16a34a', color: '#4ade80', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, letterSpacing: '0.5px' }}>
  LIVE — price changes reflect instantly in menu
</span>
```

- [ ] **Step 4: Verify**

In admin, change a price. Open the customer menu in another tab. Within 1–2 seconds the price should update without a page refresh.

- [ ] **Step 5: Commit**
```bash
git add src/admin/AdminDashboard.js
git commit -m "feat: inline live price editing in admin — debounced Firestore write, real-time menu update"
```

---

### Task 2: Inline price editing for bowl and HSP items (sizePrices)

**Files:**
- Modify: `src/admin/AdminDashboard.js`

**Goal:** Bowl items have `saladPrice` and `ricePrice`. HSP items have `sizePrices: {S,M,L,XL}`. Admin should be able to edit all of these inline.

- [ ] **Step 1: Add handlers for saladPrice, ricePrice, and sizePrices**

```js
const handleBowlPriceChange = (id, field, newPrice) => {
  setMenuItems(prev => prev.map(item => item.id === id ? { ...item, [field]: parseFloat(newPrice) || item[field] } : item));
  clearTimeout(priceTimers.current[`${id}_${field}`]);
  priceTimers.current[`${id}_${field}`] = setTimeout(async () => {
    const parsed = parseFloat(newPrice);
    if (!isNaN(parsed) && parsed > 0) {
      await updateDoc(doc(db, 'menuItems', id), { [field]: parsed });
    }
  }, 800);
};

const handleSizePriceChange = (id, size, newPrice) => {
  setMenuItems(prev => prev.map(item =>
    item.id === id
      ? { ...item, sizePrices: { ...item.sizePrices, [size]: parseFloat(newPrice) || item.sizePrices?.[size] } }
      : item
  ));
  clearTimeout(priceTimers.current[`${id}_size_${size}`]);
  priceTimers.current[`${id}_size_${size}`] = setTimeout(async () => {
    const parsed = parseFloat(newPrice);
    if (!isNaN(parsed) && parsed > 0) {
      await updateDoc(doc(db, 'menuItems', id), { [`sizePrices.${size}`]: parsed });
    }
  }, 800);
};
```

- [ ] **Step 2: Show bowl/HSP price inputs conditionally in menu item row**

In the menu item render, after the main price input, add:
```jsx
{/* Bowl items: show saladPrice + ricePrice inputs */}
{item.itemType === 'bowl' && (
  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
    <label style={{ color: '#9ca3af', fontSize: 11 }}>
      Salad $<input type="number" min="0" step="0.50" value={item.saladPrice ?? item.price}
        onChange={e => handleBowlPriceChange(item.id, 'saladPrice', e.target.value)}
        style={{ background: '#111', border: '1px solid #2a2a2a', color: '#f59e0b', padding: '3px 5px', borderRadius: 5, fontSize: 12, width: 50, outline: 'none' }} />
    </label>
    <label style={{ color: '#9ca3af', fontSize: 11 }}>
      Rice $<input type="number" min="0" step="0.50" value={item.ricePrice ?? (item.price + 1)}
        onChange={e => handleBowlPriceChange(item.id, 'ricePrice', e.target.value)}
        style={{ background: '#111', border: '1px solid #2a2a2a', color: '#f59e0b', padding: '3px 5px', borderRadius: 5, fontSize: 12, width: 50, outline: 'none' }} />
    </label>
  </div>
)}

{/* HSP items: show S/M/L/XL size price inputs */}
{item.itemType === 'hsp' && item.sizePrices && (
  <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
    {Object.entries(item.sizePrices).map(([size, price]) => (
      <label key={size} style={{ color: '#9ca3af', fontSize: 11 }}>
        {size} $<input type="number" min="0" step="1" value={price}
          onChange={e => handleSizePriceChange(item.id, size, e.target.value)}
          style={{ background: '#111', border: '1px solid #2a2a2a', color: '#f59e0b', padding: '3px 5px', borderRadius: 5, fontSize: 12, width: 48, outline: 'none' }} />
      </label>
    ))}
  </div>
)}
```

- [ ] **Step 3: Verify**

In admin, change a bowl's salad price. Open customer menu — Chicken Bowl should show new salad price. Change HSP size price — customer modal size button should reflect it.

- [ ] **Step 4: Commit**
```bash
git add src/admin/AdminDashboard.js
git commit -m "feat: inline price editing for bowl saladPrice/ricePrice and HSP sizePrices"
```

---

### Task 3: Subscribers tab in Admin

**Files:**
- Modify: `src/admin/AdminDashboard.js`

**Goal:** New tab showing all promo subscribers with their opted-in channels and sign-up date.

- [ ] **Step 1: Add subscribers tab**

Update `TABS`:
```js
const TABS = ['📊 Dashboard', '🍽️ Menu', '📦 Orders', '🎉 Promotions', '🥤 Drinks', '👥 Staff', '📱 QR Code', '📢 Blast', '📬 Subscribers'];
```

Add subscriber state (already added in Plan 3 — skip if done):
```js
const [subscribers, setSubscribers] = useState([]);
```

Add to useEffect onSnapshot array:
```js
onSnapshot(collection(db, 'subscribers'), snap => setSubscribers(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
```

Add tab render (tab === 8):
```jsx
{tab === 8 && (
  <div style={{ padding: '20px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <h3 style={{ color: '#f59e0b', margin: 0 }}>📬 Promo Subscribers ({subscribers.length})</h3>
      <button
        onClick={() => {
          const csv = ['Email,Phone,Channels,Date', ...subscribers.map(s =>
            `"${s.email ?? ''}","${s.phone ?? ''}","${(s.channels ?? []).join('+')}","${s.createdAt?.toDate?.()?.toLocaleDateString?.() ?? ''}"`
          )].join('\n');
          const blob = new Blob([csv], { type: 'text/csv' });
          const url  = URL.createObjectURL(blob);
          const a    = document.createElement('a'); a.href = url; a.download = 'subscribers.csv'; a.click();
        }}
        style={{ background: '#222', border: '1px solid #333', color: '#9ca3af', padding: '6px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}
      >
        Export CSV
      </button>
    </div>

    {subscribers.length === 0 ? (
      <p style={{ color: '#9ca3af', textAlign: 'center', padding: '40px 0' }}>No subscribers yet. Promo signup banner drives sign-ups from the menu page and checkout.</p>
    ) : (
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #2a2a2a' }}>
            {['Email', 'Phone', 'Channels', 'Date'].map(h => (
              <th key={h} style={{ color: '#9ca3af', textAlign: 'left', padding: '8px 12px', fontWeight: 600 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {subscribers.map(s => (
            <tr key={s.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
              <td style={{ padding: '8px 12px', color: '#f5f5f5' }}>{s.email ?? '—'}</td>
              <td style={{ padding: '8px 12px', color: '#f5f5f5' }}>{s.phone ?? '—'}</td>
              <td style={{ padding: '8px 12px' }}>
                {(s.channels ?? []).map(ch => (
                  <span key={ch} style={{ background: '#f59e0b22', color: '#f59e0b', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, marginRight: 4 }}>
                    {ch.toUpperCase()}
                  </span>
                ))}
              </td>
              <td style={{ padding: '8px 12px', color: '#9ca3af', fontSize: 12 }}>
                {s.createdAt?.toDate?.()?.toLocaleDateString?.('en-AU') ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
)}
```

- [ ] **Step 2: Verify**

Sign up via promo banner. Admin subscribers tab shows the new entry with email, channels, and date. Export CSV downloads a file.

- [ ] **Step 3: Commit**
```bash
git add src/admin/AdminDashboard.js
git commit -m "feat: add Subscribers tab to admin — list, channels, date, CSV export"
```

---

### Task 4: Staff clock in/out with Firestore session tracking

**Files:**
- Modify: `src/admin/staff/StaffPortal.js`

**Goal:** Staff member logs in, clicks "Clock In" — creates `staffSessions` Firestore doc with `staffId`, `staffName`, `clockIn` timestamp. Clicks "Clock Out" — updates same doc with `clockOut` and calculates `hoursWorked`.

- [ ] **Step 1: Rewrite src/admin/staff/StaffPortal.js**
```jsx
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

  // Auth state
  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Look up staff profile
        const snap = await getDocs(query(collection(db, 'staff'), where('email', '==', u.email), limit(1)));
        if (!snap.empty) setStaffProfile({ id: snap.docs[0].id, ...snap.docs[0].data() });
        // Check for open session
        const sessionSnap = await getDocs(
          query(collection(db, 'staffSessions'), where('staffId', '==', u.uid), where('clockOut', '==', null), limit(1))
        );
        if (!sessionSnap.empty) setActiveSession({ id: sessionSnap.docs[0].id, ...sessionSnap.docs[0].data() });
      } else {
        setStaffProfile(null);
        setActiveSession(null);
      }
    });
  }, []);

  // Load recent sessions
  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      query(collection(db, 'staffSessions'), where('staffId', '==', user.uid), orderBy('clockIn', 'desc'), limit(10)),
      (snap) => setRecentSessions(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, [user]);

  // Elapsed timer while clocked in
  useEffect(() => {
    if (!activeSession?.clockIn) return;
    const clockInMs = activeSession.clockIn?.toDate?.()?.getTime?.() ?? Date.now();
    const tick = () => setElapsed(Math.floor((Date.now() - clockInMs) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const login = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch { setLoginError('Incorrect email or password.'); }
  };

  const clockIn = async () => {
    const sessionRef = await addDoc(collection(db, 'staffSessions'), {
      staffId:    user.uid,
      staffName:  staffProfile?.name ?? user.email,
      staffEmail: user.email,
      clockIn:    serverTimestamp(),
      clockOut:   null,
      hoursWorked: null,
    });
    setActiveSession({ id: sessionRef.id, clockIn: { toDate: () => new Date() } });
  };

  const clockOut = async () => {
    if (!activeSession) return;
    const now        = new Date();
    const clockInMs  = activeSession.clockIn?.toDate?.()?.getTime?.() ?? Date.now();
    const hoursWorked = (now.getTime() - clockInMs) / 3600000;
    await updateDoc(doc(db, 'staffSessions', activeSession.id), {
      clockOut:    now.toISOString(),
      hoursWorked: parseFloat(hoursWorked.toFixed(2)),
    });
    setActiveSession(null);
    setElapsed(0);
  };

  const formatElapsed = (secs) => {
    const h = Math.floor(secs / 3600).toString().padStart(2, '0');
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const S = { // inline styles
    page:   { minHeight: '100vh', background: '#0f0f0f', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 },
    card:   { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 16, padding: 28, width: '100%', maxWidth: 400 },
    title:  { color: '#f59e0b', fontSize: 24, fontWeight: 900, letterSpacing: 2, marginBottom: 4 },
    sub:    { color: '#9ca3af', fontSize: 13, marginBottom: 24 },
    input:  { background: '#111', border: '1px solid #333', color: '#fff', padding: '12px 14px', borderRadius: 8, fontSize: 14, width: '100%', outline: 'none', marginBottom: 10 },
    btn:    (color) => ({ background: color, color: color === '#f59e0b' ? '#000' : '#fff', border: 'none', padding: '14px', borderRadius: 10, fontSize: 15, fontWeight: 800, width: '100%', cursor: 'pointer', marginBottom: 10 }),
    timer:  { fontSize: 48, fontWeight: 900, color: '#f59e0b', textAlign: 'center', fontVariantNumeric: 'tabular-nums', marginBottom: 16, letterSpacing: 2 },
    session:{ background: '#111', border: '1px solid #222', borderRadius: 8, padding: '10px 14px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 },
  };

  // ── Login screen ───────────────────────────────────────
  if (!user) {
    return (
      <div style={S.page}>
        <div style={S.card}>
          <div style={S.title}>TJ'S KEBAB</div>
          <div style={S.sub}>Staff Portal — Sign in to clock in/out</div>
          <form onSubmit={login}>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Staff email" required style={S.input} />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required style={S.input} />
            {loginError && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 10 }}>{loginError}</p>}
            <button type="submit" style={S.btn('#f59e0b')}>SIGN IN</button>
          </form>
        </div>
      </div>
    );
  }

  // ── Clock in/out screen ────────────────────────────────
  const today = new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' });
  const todaySessions = recentSessions.filter(s => {
    if (!s.clockIn?.toDate) return false;
    const d = s.clockIn.toDate();
    const now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const todayHours = todaySessions.reduce((sum, s) => sum + (s.hoursWorked ?? 0), 0);

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={S.title}>TJ'S KEBAB</div>
            <div style={{ color: '#f5f5f5', fontWeight: 700, fontSize: 15 }}>{staffProfile?.name ?? user.email}</div>
            <div style={{ color: '#9ca3af', fontSize: 12 }}>{today}</div>
          </div>
          <button onClick={() => signOut(auth)} style={{ background: 'none', border: '1px solid #333', color: '#9ca3af', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
            Sign out
          </button>
        </div>

        {/* Timer */}
        {activeSession && (
          <>
            <div style={{ background: '#f59e0b11', border: '1px solid #f59e0b33', borderRadius: 10, padding: '12px 16px', textAlign: 'center', marginBottom: 16 }}>
              <p style={{ color: '#9ca3af', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Currently Clocked In</p>
              <div style={S.timer}>{formatElapsed(elapsed)}</div>
            </div>
            <button onClick={clockOut} style={S.btn('#ef4444')}>🔴 CLOCK OUT</button>
          </>
        )}

        {!activeSession && (
          <button onClick={clockIn} style={S.btn('#16a34a')}>🟢 CLOCK IN</button>
        )}

        {/* Today's summary */}
        <div style={{ marginTop: 20, borderTop: '1px solid #222', paddingTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ color: '#9ca3af', fontSize: 12, fontWeight: 700 }}>TODAY'S HOURS</span>
            <span style={{ color: '#f59e0b', fontWeight: 800 }}>{todayHours.toFixed(2)}h</span>
          </div>
          {todaySessions.map(s => (
            <div key={s.id} style={S.session}>
              <span style={{ color: '#9ca3af' }}>
                {s.clockIn?.toDate?.()?.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }) ?? '—'}
                {' → '}
                {s.clockOut ? new Date(s.clockOut).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }) : 'NOW'}
              </span>
              <span style={{ color: '#f5f5f5', fontWeight: 700 }}>{s.hoursWorked != null ? `${s.hoursWorked}h` : '...'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Navigate to `/staff`. Log in with a staff email. Clock In — timer starts counting. Clock Out — session saved to Firestore `staffSessions` with `hoursWorked`. Today's sessions shown below.

- [ ] **Step 3: Commit**
```bash
git add src/admin/staff/StaffPortal.js
git commit -m "feat: rebuild StaffPortal — clock in/out timer, Firestore session tracking, daily hours"
```

---

### Task 5: Staff hours summary in Admin

**Files:**
- Modify: `src/admin/staff/StaffManagement.js`

**Goal:** Admin Staff tab shows each staff member's hours worked today and a weekly summary table. Export CSV button.

- [ ] **Step 1: Update StaffManagement.js**

Open `src/admin/staff/StaffManagement.js`. Add a sessions view alongside existing staff management:

```jsx
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';

export default function StaffManagement() {
  const [sessions, setSessions] = useState([]);
  const [dateFilter, setDateFilter] = useState(() => new Date().toISOString().slice(0, 10)); // YYYY-MM-DD

  useEffect(() => {
    const startOfDay = new Date(dateFilter + 'T00:00:00');
    const endOfDay   = new Date(dateFilter + 'T23:59:59');
    return onSnapshot(
      query(
        collection(db, 'staffSessions'),
        where('clockIn', '>=', Timestamp.fromDate(startOfDay)),
        where('clockIn', '<=', Timestamp.fromDate(endOfDay)),
        orderBy('clockIn', 'desc')
      ),
      (snap) => setSessions(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, [dateFilter]);

  const byStaff = sessions.reduce((acc, s) => {
    const name = s.staffName ?? s.staffEmail ?? 'Unknown';
    if (!acc[name]) acc[name] = { sessions: [], totalHours: 0 };
    acc[name].sessions.push(s);
    acc[name].totalHours += s.hoursWorked ?? 0;
    return acc;
  }, {});

  const exportCSV = () => {
    const rows = ['Staff,Clock In,Clock Out,Hours'];
    sessions.forEach(s => {
      const ci = s.clockIn?.toDate?.()?.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }) ?? '';
      const co = s.clockOut ? new Date(s.clockOut).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }) : 'active';
      rows.push(`"${s.staffName ?? s.staffEmail}","${ci}","${co}","${s.hoursWorked ?? ''}"`);
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url; a.download = `staff-hours-${dateFilter}.csv`; a.click();
  };

  return (
    <div style={{ padding: 20, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ color: '#f59e0b', margin: 0 }}>👥 Staff Hours</h3>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            style={{ background: '#222', border: '1px solid #333', color: '#f5f5f5', padding: '6px 10px', borderRadius: 6, fontSize: 13 }}
          />
          <button onClick={exportCSV}
            style={{ background: '#222', border: '1px solid #333', color: '#9ca3af', padding: '6px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
            Export CSV
          </button>
        </div>
      </div>

      {Object.entries(byStaff).length === 0 ? (
        <p style={{ color: '#9ca3af', textAlign: 'center', padding: '40px 0' }}>No sessions recorded for {dateFilter}</p>
      ) : (
        Object.entries(byStaff).map(([name, data]) => (
          <div key={name} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 12, marginBottom: 14, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', background: '#111', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #2a2a2a' }}>
              <span style={{ color: '#f5f5f5', fontWeight: 700 }}>{name}</span>
              <span style={{ color: '#f59e0b', fontWeight: 800 }}>{data.totalHours.toFixed(2)}h total</span>
            </div>
            {data.sessions.map(s => (
              <div key={s.id} style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #111', fontSize: 13 }}>
                <span style={{ color: '#9ca3af' }}>
                  {s.clockIn?.toDate?.()?.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }) ?? '?'}
                  {' → '}
                  {s.clockOut ? new Date(s.clockOut).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }) : <span style={{ color: '#4ade80' }}>Active</span>}
                </span>
                <span style={{ color: '#f5f5f5', fontWeight: 600 }}>{s.hoursWorked != null ? `${s.hoursWorked}h` : '...'}</span>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

After staff clocks in and out, open admin Staff tab. Sessions appear under the staff member's name with clock-in/out times and hours. Date picker changes the view. Export CSV downloads.

- [ ] **Step 3: Final build check**
```bash
npm run build
```
Expected: successful build.

- [ ] **Step 4: Final commit**
```bash
git add src/admin/staff/StaffManagement.js src/admin/AdminDashboard.js
git commit -m "feat: staff hours summary in admin — date filter, per-staff breakdown, CSV export"
git commit -m "feat: Plan 4 complete — inline price editing, subscribers tab, staff hours tracking"
```

---

## Plan 4 Complete

After all tasks:
- Admin Menu tab: edit any price inline → saves to Firestore → customer menu updates within 2s
- Bowl and HSP items show all sub-prices editable
- Subscribers tab lists all promo sign-ups with export
- Staff portal: clock in/out with live timer, sessions stored in Firestore
- Admin staff view: daily hours breakdown per staff member, date picker, CSV export

**Next:** Plan 5 (Printable menu card + QR code enhancement)
