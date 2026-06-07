import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../firebase';

export default function StaffManagement() {
  const [staff, setStaff] = useState([]);
  const [timesheets, setTimesheets] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', role: 'Staff', pin: '' });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('staff');

  useEffect(() => {
    const unsub1 = onSnapshot(collection(db, 'staff'), snap =>
      setStaff(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsub2 = onSnapshot(query(collection(db, 'timesheets'), orderBy('clockIn', 'desc')), snap =>
      setTimesheets(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsub1(); unsub2(); };
  }, []);

  const generatePin = () => Math.floor(1000 + Math.random() * 9000).toString();

  const addStaff = async () => {
    if (!form.name || !form.pin) return;
    setSaving(true);
    await addDoc(collection(db, 'staff'), { ...form, active: true, createdAt: new Date().toISOString() });
    setForm({ name: '', role: 'Staff', pin: '' });
    setShowAdd(false);
    setSaving(false);
  };

  const toggleStaff = async (id, active) => {
    await updateDoc(doc(db, 'staff', id), { active: !active });
  };

  const deleteStaff = async (id) => {
    if (window.confirm('Remove this staff member?')) await deleteDoc(doc(db, 'staff', id));
  };

  const formatTime = (ts) => {
    if (!ts) return '—';
    const d = ts.toDate?.() || new Date(ts);
    return d.toLocaleString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const calcHours = (clockIn, clockOut) => {
    if (!clockIn || !clockOut) return null;
    const i = clockIn.toDate?.() || new Date(clockIn);
    const o = clockOut.toDate?.() || new Date(clockOut);
    return ((o - i) / 1000 / 60 / 60).toFixed(1);
  };

  const inp = { width: '100%', background: 'var(--card2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '10px 12px', borderRadius: 8, fontSize: 14, outline: 'none' };

  const todayShifts = timesheets.filter(t => {
    const d = t.clockIn?.toDate?.() || new Date(t.clockIn || 0);
    return d.toDateString() === new Date().toDateString();
  });

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['staff', '👥 Staff'], ['timesheets', '🕐 Timesheets']].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{ background: activeTab === id ? 'var(--brand)' : 'var(--card)', border: `1px solid ${activeTab === id ? 'var(--brand)' : 'var(--border)'}`, color: activeTab === id ? '#fff' : 'var(--text2)', padding: '8px 18px', borderRadius: 20, fontSize: 13, fontWeight: 600, transition: 'all 0.2s' }}>{label}</button>
        ))}
      </div>

      {activeTab === 'staff' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>Staff Members ({staff.length})</h3>
            <button onClick={() => setShowAdd(true)} style={{ background: 'var(--brand)', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: 10, fontWeight: 700, fontSize: 13 }}>+ Add Staff</button>
          </div>

          {/* Today's active shifts */}
          {todayShifts.filter(t => !t.clockOut).length > 0 && (
            <div style={{ background: 'rgba(76,175,80,0.08)', border: '1px solid rgba(76,175,80,0.2)', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)', marginBottom: 8 }}>🟢 Currently On Shift</div>
              {todayShifts.filter(t => !t.clockOut).map(t => (
                <div key={t.id} style={{ fontSize: 13, color: 'var(--text2)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{t.employeeName}</span>
                  <span style={{ color: 'var(--muted)' }}>Since {formatTime(t.clockIn)}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {staff.map(emp => (
              <div key={emp.id} style={{ background: 'var(--card)', border: `1px solid ${emp.active ? 'var(--border)' : 'rgba(226,75,74,0.2)'}`, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, background: emp.active ? 'rgba(232,65,10,0.15)' : 'var(--card2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Playfair Display', fontSize: 16, fontWeight: 700, color: emp.active ? 'var(--brand)' : 'var(--muted)', flexShrink: 0 }}>
                  {emp.name?.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: emp.active ? 'var(--text)' : 'var(--muted)', marginBottom: 2 }}>{emp.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{emp.role} · PIN: <span style={{ fontFamily: 'monospace', color: 'var(--gold)', letterSpacing: 2 }}>{emp.pin}</span></div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => toggleStaff(emp.id, emp.active)} style={{ background: emp.active ? 'rgba(76,175,80,0.1)' : 'rgba(226,75,74,0.1)', border: `1px solid ${emp.active ? 'rgba(76,175,80,0.3)' : 'rgba(226,75,74,0.3)'}`, color: emp.active ? 'var(--green)' : '#FF6B6B', padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                    {emp.active ? '✓ Active' : '✗ Off'}
                  </button>
                  <button onClick={() => deleteStaff(emp.id)} style={{ background: 'rgba(226,75,74,0.1)', border: '1px solid rgba(226,75,74,0.3)', color: '#FF6B6B', padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>Del</button>
                </div>
              </div>
            ))}
            {staff.length === 0 && <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '40px 0' }}>No staff added yet — click "+ Add Staff" above</p>}
          </div>
        </div>
      )}

      {activeTab === 'timesheets' && (
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Timesheets</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {timesheets.map(log => {
              const hours = calcHours(log.clockIn, log.clockOut);
              return (
                <div key={log.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 3 }}>{log.employeeName}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      In: {formatTime(log.clockIn)} · Out: {log.clockOut ? formatTime(log.clockOut) : <span style={{ color: 'var(--green)' }}>Active</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'Playfair Display', fontSize: 16, fontWeight: 700, color: hours ? 'var(--gold)' : 'var(--green)' }}>
                      {hours ? `${hours}h` : 'On Shift'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{log.date}</div>
                  </div>
                </div>
              );
            })}
            {timesheets.length === 0 && <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '40px 0' }}>No timesheet records yet</p>}
          </div>
        </div>
      )}

      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div style={{ background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 400, padding: '24px 20px' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Add Staff Member</h2>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Full Name</label>
              <input style={inp} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Ahmed Hassan" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Role</label>
              <select style={inp} value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                <option>Staff</option>
                <option>Delivery Driver</option>
                <option>Kitchen</option>
                <option>Cashier</option>
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>4-Digit PIN</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input style={{ ...inp, flex: 1, fontFamily: 'monospace', fontSize: 18, letterSpacing: 4 }} maxLength={4} value={form.pin} onChange={e => setForm(p => ({ ...p, pin: e.target.value.replace(/\D/g, '').slice(0,4) }))} placeholder="e.g. 1234" />
                <button onClick={() => setForm(p => ({ ...p, pin: generatePin() }))} style={{ background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.3)', color: 'var(--gold)', padding: '0 14px', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>Generate</button>
              </div>
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>This PIN is what the staff member uses to clock in/out</p>
            </div>
            <button onClick={addStaff} disabled={!form.name || form.pin.length < 4 || saving} style={{ width: '100%', background: 'var(--brand)', color: '#fff', border: 'none', padding: '13px', borderRadius: 10, fontWeight: 700, fontSize: 16, opacity: !form.name || form.pin.length < 4 ? 0.6 : 1 }}>
              {saving ? '⏳ Adding...' : '✓ Add Staff Member'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
