import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function StaffPortal() {
  const [pin, setPin] = useState('');
  const [employee, setEmployee] = useState(null);
  const [error, setError] = useState('');
  const [todayLogs, setTodayLogs] = useState([]);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [activeShift, setActiveShift] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handlePinLogin = async () => {
    if (pin.length < 4) { setError('Please enter your 4-digit PIN'); return; }
    setLoading(true); setError('');
    try {
      const q = query(collection(db, 'staff'), where('pin', '==', pin), where('active', '==', true));
      const snap = await getDocs(q);
      if (snap.empty) { setError('Invalid PIN. Please try again.'); setLoading(false); return; }
      const emp = { id: snap.docs[0].id, ...snap.docs[0].data() };
      setEmployee(emp);
      setPin('');
    } catch (e) { setError('Error. Please try again.'); }
    setLoading(false);
  };

  useEffect(() => {
    if (!employee) return;
    const today = new Date(); today.setHours(0,0,0,0);
    const q = query(collection(db, 'timesheets'), where('employeeId', '==', employee.id), orderBy('clockIn', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const todayOnly = logs.filter(l => {
        const d = l.clockIn?.toDate?.() || new Date(l.clockIn);
        return d >= today;
      });
      setTodayLogs(todayOnly);
      const active = logs.find(l => !l.clockOut);
      setActiveShift(active || null);
      setIsClockedIn(!!active);
    });
    return unsub;
  }, [employee]);

  const handleClockIn = async () => {
    setLoading(true);
    try {
      await addDoc(collection(db, 'timesheets'), {
        employeeId: employee.id,
        employeeName: employee.name,
        clockIn: serverTimestamp(),
        clockOut: null,
        date: new Date().toDateString(),
      });
      setSuccess('✅ Clocked in! Have a great shift!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) { setError('Error clocking in.'); }
    setLoading(false);
  };

  const handleClockOut = async () => {
    setLoading(true);
    try {
      if (activeShift) {
        await updateDoc(doc(db, 'timesheets', activeShift.id), { clockOut: serverTimestamp() });
        setSuccess('👋 Clocked out! See you next time!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (e) { setError('Error clocking out: ' + e.message); }
    setLoading(false);
  };

  const formatTime = (ts) => {
    if (!ts) return '—';
    const d = ts.toDate?.() || new Date(ts);
    return d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
  };

  const calcHours = (clockIn, clockOut) => {
    if (!clockIn || !clockOut) return '—';
    const i = clockIn.toDate?.() || new Date(clockIn);
    const o = clockOut.toDate?.() || new Date(clockOut);
    return ((o - i) / 1000 / 60 / 60).toFixed(1) + 'h';
  };

  const calcCurrentHours = () => {
    if (!activeShift?.clockIn) return '0.0h';
    const i = activeShift.clockIn.toDate?.() || new Date(activeShift.clockIn);
    return ((Date.now() - i) / 1000 / 60 / 60).toFixed(1) + 'h';
  };

  if (!employee) return (
    <div style={{ minHeight:'100vh', background:'#F8FAF8', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ width:'100%', maxWidth:380 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:64, height:64, background:'#1A7A4A', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:900, color:'#fff', margin:'0 auto 16px', boxShadow:'0 4px 20px rgba(26,122,74,0.4)' }}>TJ</div>
          <h1 style={{ fontSize:24, fontWeight:800, color:'#1A2E1F', marginBottom:6 }}>Staff Portal</h1>
          <p style={{ color:'#7A9483', fontSize:14 }}>Enter your PIN to clock in/out</p>
        </div>
        <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:16, padding:'28px 24px', boxShadow:'0 4px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:20 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ height:52, background:pin.length>=i?'#1A7A4A':'#F3F7F4', borderRadius:10, border:`1.5px solid ${pin.length>=i?'#1A7A4A':'#E5E7EB'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, color:pin.length>=i?'#fff':'#9CA3AF', transition:'all 0.15s' }}>
                {pin.length>=i?'●':'○'}
              </div>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
            {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((num,i)=>(
              <button key={i} onClick={()=>{ if(num==='⌫') setPin(p=>p.slice(0,-1)); else if(num!==''&&pin.length<4) setPin(p=>p+num); }} style={{ background:num==='⌫'?'rgba(232,65,10,0.08)':'#F3F7F4', border:`1px solid ${num==='⌫'?'rgba(232,65,10,0.2)':'#E5E7EB'}`, color:num==='⌫'?'#E8410A':'#1A2E1F', height:52, borderRadius:10, fontSize:20, fontWeight:600, cursor:num===''?'default':'pointer', opacity:num===''?0:1 }}>{num}</button>
            ))}
          </div>
          {error && <div style={{ background:'rgba(232,65,10,0.06)', border:'1px solid rgba(232,65,10,0.2)', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#E8410A', marginBottom:12 }}>{error}</div>}
          <button onClick={handlePinLogin} disabled={pin.length<4||loading} style={{ width:'100%', background:pin.length<4?'#E5E7EB':'#1A7A4A', color:pin.length<4?'#9CA3AF':'#fff', border:'none', padding:'14px', borderRadius:10, fontWeight:700, fontSize:16, cursor:pin.length<4?'not-allowed':'pointer', boxShadow:pin.length>=4?'0 4px 16px rgba(26,122,74,0.3)':'none' }}>
            {loading?'Checking...':'Enter →'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#F8FAF8', padding:20 }}>
      <div style={{ maxWidth:440, margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:800, color:'#1A2E1F' }}>Hi, {employee.name}! 👋</h1>
            <p style={{ fontSize:13, color:'#7A9483', marginTop:2 }}>{new Date().toLocaleDateString('en-AU',{weekday:'long',day:'numeric',month:'long'})}</p>
          </div>
          <button onClick={()=>setEmployee(null)} style={{ background:'#fff', border:'1px solid #E5E7EB', color:'#3D5944', padding:'8px 14px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>Sign Out</button>
        </div>

        {success && <div style={{ background:'rgba(26,122,74,0.08)', border:'1px solid rgba(26,122,74,0.2)', borderRadius:12, padding:'14px 16px', marginBottom:20, fontSize:14, color:'#1A7A4A', fontWeight:600 }}>{success}</div>}

        {/* Status Card */}
        <div style={{ background:'#fff', border:`2px solid ${isClockedIn?'#1A7A4A':'#E5E7EB'}`, borderRadius:16, padding:'24px 20px', marginBottom:20, textAlign:'center', boxShadow:'0 4px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize:52, marginBottom:12 }}>{isClockedIn?'🟢':'🔴'}</div>
          <div style={{ fontSize:22, fontWeight:800, color:isClockedIn?'#1A7A4A':'#E8410A', marginBottom:6 }}>
            {isClockedIn?'Currently On Shift':'Not Clocked In'}
          </div>
          {isClockedIn && activeShift && (
            <div style={{ fontSize:14, color:'#7A9483', marginBottom:4 }}>
              Started at {formatTime(activeShift.clockIn)} · {calcCurrentHours()} so far
            </div>
          )}
          <div style={{ fontSize:13, color:'#7A9483', marginBottom:24 }}>
            {isClockedIn?'Tap below to end your shift':'Tap below to start your shift'}
          </div>

          {/* CLOCK IN / CLOCK OUT BUTTONS */}
          {!isClockedIn ? (
            <button onClick={handleClockIn} disabled={loading} style={{ width:'100%', background:'#1A7A4A', color:'#fff', border:'none', padding:'16px', borderRadius:12, fontSize:18, fontWeight:800, cursor:'pointer', boxShadow:'0 6px 20px rgba(26,122,74,0.4)', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
              🟢 {loading?'Please wait...':'CLOCK IN'}
            </button>
          ) : (
            <button onClick={handleClockOut} disabled={loading} style={{ width:'100%', background:'#E8410A', color:'#fff', border:'none', padding:'16px', borderRadius:12, fontSize:18, fontWeight:800, cursor:'pointer', boxShadow:'0 6px 20px rgba(232,65,10,0.4)', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
              🔴 {loading?'Please wait...':'CLOCK OUT'}
            </button>
          )}
        </div>

        {/* Today's Shifts */}
        <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:16, padding:'20px', boxShadow:'0 4px 16px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize:16, fontWeight:800, color:'#1A7A4A', marginBottom:14 }}>Today's Shifts</h2>
          {todayLogs.length===0?(
            <p style={{ color:'#7A9483', fontSize:13, textAlign:'center', padding:'20px 0' }}>No shifts recorded today</p>
          ):(
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {todayLogs.map(log=>(
                <div key={log.id} style={{ background:'#F8FAF8', borderRadius:10, padding:'12px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid #E5E7EB' }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:'#1A2E1F', marginBottom:2 }}>
                      {formatTime(log.clockIn)} — {log.clockOut?formatTime(log.clockOut):<span style={{ color:'#1A7A4A', fontWeight:700 }}>Active</span>}
                    </div>
                    <div style={{ fontSize:11, color:'#7A9483' }}>Duration: {calcHours(log.clockIn, log.clockOut)}</div>
                  </div>
                  <div style={{ background:log.clockOut?'rgba(26,122,74,0.1)':'rgba(232,65,10,0.1)', border:`1px solid ${log.clockOut?'rgba(26,122,74,0.3)':'rgba(232,65,10,0.3)'}`, color:log.clockOut?'#1A7A4A':'#E8410A', fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:8 }}>
                    {log.clockOut?'✓ Complete':'● On Shift'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
