import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

const CARD = { background: '#1b1509', border: '1px solid #332810', borderRadius: 12, padding: '16px 18px', marginBottom: 12 };

export default function StaffManagement() {
  const [staff,    setStaff]    = useState([]);
  const [sessions, setSessions] = useState([]);
  const [addForm,  setAddForm]  = useState({ name: '', email: '', role: 'Team Member', pin: '' });
  const [adding,   setAdding]   = useState(false);
  const [filterDate, setFilterDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('roster'); // 'roster' | 'timesheets'

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'staff'), orderBy('name')), snap =>
      setStaff(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return unsub;
  }, []);

  useEffect(() => {
    if (activeTab !== 'timesheets') return;
    const startOfDay = new Date(filterDate + 'T00:00:00');
    const endOfDay   = new Date(filterDate + 'T23:59:59');
    getDocs(
      query(collection(db, 'staffSessions'), where('clockIn', '>=', startOfDay), where('clockIn', '<=', endOfDay))
    ).then(snap => setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [filterDate, activeTab]);

  const addStaff = async (e) => {
    e.preventDefault(); setAdding(true);
    await addDoc(collection(db, 'staff'), { ...addForm, createdAt: new Date().toISOString() });
    setAddForm({ name: '', email: '', role: 'Team Member', pin: '' });
    setAdding(false);
  };

  const removeStaff = async (id) => {
    if (!window.confirm('Remove this staff member?')) return;
    await deleteDoc(doc(db, 'staff', id));
  };

  const toggleActive = async (id, current) =>
    updateDoc(doc(db, 'staff', id), { active: !current });

  // Group sessions by staff for timesheet summary
  const byStaff = sessions.reduce((acc, s) => {
    const key = s.staffName ?? s.staffEmail ?? s.staffId;
    if (!acc[key]) acc[key] = { sessions: [], totalHours: 0 };
    acc[key].sessions.push(s);
    acc[key].totalHours += s.hoursWorked ?? 0;
    return acc;
  }, {});

  const exportCSV = () => {
    const rows = [['Name', 'Clock In', 'Clock Out', 'Hours']];
    sessions.forEach(s => {
      rows.push([
        s.staffName ?? s.staffEmail ?? '',
        s.clockIn?.toDate?.()?.toLocaleString?.('en-AU') ?? '',
        s.clockOut ? new Date(s.clockOut).toLocaleString('en-AU') : 'Active',
        s.hoursWorked?.toFixed?.(2) ?? '',
      ]);
    });
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: `timesheets-${filterDate}.csv`,
    });
    a.click();
  };

  const S = {
    tab: (active) => ({
      background: active ? '#f59e0b' : 'transparent',
      color: active ? '#000' : '#9c8a72',
      border: active ? 'none' : '1px solid #332810',
      padding: '7px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
    }),
    input: { background: '#111', border: '1px solid #332810', color: '#f0ead8', padding: '9px 12px', borderRadius: 7, fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' },
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>👥 Staff</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setActiveTab('roster')} style={S.tab(activeTab === 'roster')}>Roster</button>
          <button onClick={() => setActiveTab('timesheets')} style={S.tab(activeTab === 'timesheets')}>Timesheets</button>
        </div>
      </div>

      {/* ── ROSTER ── */}
      {activeTab === 'roster' && <>
        <div style={{ ...CARD, marginBottom: 20 }}>
          <p style={{ color: '#9c8a72', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Add Staff Member</p>
          <form onSubmit={addStaff} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input placeholder="Full name" value={addForm.name} onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))} required style={S.input} />
            <input placeholder="Email (for staff portal login)" value={addForm.email} onChange={e => setAddForm(p => ({ ...p, email: e.target.value }))} type="email" required style={S.input} />
            <select value={addForm.role} onChange={e => setAddForm(p => ({ ...p, role: e.target.value }))} style={{ ...S.input, cursor: 'pointer' }}>
              {['Team Member', 'Shift Leader', 'Manager'].map(r => <option key={r}>{r}</option>)}
            </select>
            <button type="submit" disabled={adding} style={{ background: '#f59e0b', color: '#000', border: 'none', borderRadius: 7, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              {adding ? 'Adding...' : '+ Add'}
            </button>
          </form>
          <p style={{ color: '#4a4030', fontSize: 11, marginTop: 8 }}>
            Staff use their email + password to log into the Staff Portal (/staff) to clock in/out. Set their password through Firebase Auth.
          </p>
        </div>

        {staff.length === 0 && <p style={{ color: '#9c8a72', textAlign: 'center', padding: '30px 0' }}>No staff added yet.</p>}
        {staff.map(s => (
          <div key={s.id} style={{ ...CARD, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#251e0e', border: '1px solid #332810', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#f59e0b', fontSize: 15, flexShrink: 0 }}>
              {s.name?.charAt(0)?.toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#f0ead8', fontWeight: 700, fontSize: 14 }}>{s.name}</div>
              <div style={{ color: '#9c8a72', fontSize: 12 }}>{s.role} · {s.email}</div>
            </div>
            <button onClick={() => toggleActive(s.id, s.active)} style={{ background: s.active !== false ? 'rgba(74,222,128,0.1)' : 'rgba(226,75,74,0.1)', border: `1px solid ${s.active !== false ? '#16a34a44' : '#ef444444'}`, color: s.active !== false ? '#4ade80' : '#f87171', padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
              {s.active !== false ? 'Active' : 'Inactive'}
            </button>
            <button onClick={() => removeStaff(s.id)} style={{ background: 'rgba(226,75,74,0.1)', border: '1px solid #ef444433', color: '#f87171', padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>✕</button>
          </div>
        ))}
      </>}

      {/* ── TIMESHEETS ── */}
      {activeTab === 'timesheets' && <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
            style={{ background: '#111', border: '1px solid #332810', color: '#f0ead8', padding: '8px 12px', borderRadius: 7, fontSize: 13, outline: 'none' }} />
          <button onClick={exportCSV} style={{ background: '#1b1509', border: '1px solid #332810', color: '#9c8a72', padding: '8px 16px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Export CSV</button>
        </div>

        {sessions.length === 0 && <p style={{ color: '#9c8a72', textAlign: 'center', padding: '30px 0' }}>No sessions on {filterDate}.</p>}

        {Object.entries(byStaff).map(([name, { sessions: ss, totalHours }]) => (
          <div key={name} style={CARD}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ color: '#f0ead8', fontWeight: 700 }}>{name}</span>
              <span style={{ color: '#f59e0b', fontWeight: 800 }}>{totalHours.toFixed(2)}h total</span>
            </div>
            {ss.map(s => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', color: '#9c8a72', fontSize: 13, padding: '4px 0', borderTop: '1px solid #1a1a1a' }}>
                <span>
                  {s.clockIn?.toDate?.()?.toLocaleTimeString?.('en-AU', { hour: '2-digit', minute: '2-digit' }) ?? '—'}
                  {' → '}
                  {s.clockOut ? new Date(s.clockOut).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }) : <span style={{ color: '#4ade80' }}>Active</span>}
                </span>
                <span style={{ color: '#f0ead8' }}>{s.hoursWorked != null ? `${s.hoursWorked.toFixed(2)}h` : '...'}</span>
              </div>
            ))}
          </div>
        ))}
      </>}
    </div>
  );
}
