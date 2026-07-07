import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { signOut } from 'firebase/auth';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, orderBy, increment } from 'firebase/firestore';
import QRCode from 'react-qr-code';
import { auth, db } from '../firebase';
import { SEED_MENU, SEED_DRINKS } from '../data/seedData';
import StaffManagement from './staff/StaffManagement';
import UnderwaterScene from '../components/UnderwaterScene';


const API_URL = process.env.REACT_APP_API_URL ?? 'http://localhost:4000';

const NAV_ITEMS = [
  { icon: '⚡', label: 'Overview',    idx: 0 },
  { icon: '🍽️', label: 'Menu',        idx: 1 },
  { icon: '📦', label: 'Orders',      idx: 2 },
  { icon: '🎉', label: 'Promotions',  idx: 3 },
  { icon: '🥤', label: 'Drinks',      idx: 4 },
  { icon: '👥', label: 'Staff',       idx: 5 },
  { icon: '📱', label: 'QR Code',     idx: 6 },
  { icon: '📢', label: 'Blast',       idx: 7 },
  { icon: '📬', label: 'Subscribers', idx: 8 },
];

const STATUS_COLORS = {
  pending:   '#ff8c42',
  confirmed: '#f59e0b',
  preparing: '#4a9eff',
  ready:     '#4ade80',
  delivered: '#4ade80',
  cancelled: '#ff6b6b',
};

// ── HUD tilt card — 3D tilt with corner brackets ─────────────────────────────
function HUDCard({ children, accent = '#f59e0b', style }) {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rotX = useSpring(useTransform(rawY, [-0.5, 0.5], [6, -6]), { stiffness: 280, damping: 38 });
  const rotY = useSpring(useTransform(rawX, [-0.5, 0.5], [-6, 6]), { stiffness: 280, damping: 38 });

  return (
    <motion.div
      onMouseMove={e => {
        const r = e.currentTarget.getBoundingClientRect();
        rawX.set((e.clientX - r.left) / r.width - 0.5);
        rawY.set((e.clientY - r.top)  / r.height - 0.5);
      }}
      onMouseLeave={() => { rawX.set(0); rawY.set(0); }}
      style={{ rotateX: rotX, rotateY: rotY, transformStyle: 'preserve-3d', perspective: 900, ...style }}
    >
      <div style={{
        background: 'rgba(2,6,18,0.78)', border: `1px solid ${accent}30`,
        borderRadius: 3, padding: '22px 24px', position: 'relative', overflow: 'hidden',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        boxShadow: `0 0 0 1px ${accent}12, 0 12px 40px rgba(0,0,0,0.45)`,
        height: '100%', boxSizing: 'border-box',
      }}>
        {/* Corner brackets */}
        {[[0,'top','left'],[1,'top','right'],[2,'bottom','left'],[3,'bottom','right']].map(([i,v,h]) => (
          <div key={i} style={{ position: 'absolute', [v]: -1, [h]: -1, width: 14, height: 14, zIndex: 5, pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', [v]: 0, [h]: 0, width: 11, height: 1.5, background: accent, boxShadow: `0 0 6px ${accent}cc` }} />
            <div style={{ position: 'absolute', [v]: 0, [h]: 0, width: 1.5, height: 11, background: accent, boxShadow: `0 0 6px ${accent}cc` }} />
          </div>
        ))}
        {/* Ambient top glow */}
        <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 1, background: `linear-gradient(90deg, transparent, ${accent}55, transparent)`, pointerEvents: 'none' }} />
        {children}
      </div>
    </motion.div>
  );
}

// ── HUD Sidebar ───────────────────────────────────────────────────────────────
function Sidebar({ tab, setTab, onSignOut, menuItems, seeding, onSeed, onClean, onAssignTypes, open, onClose, isMobile }) {
  if (isMobile && !open) return null;
  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 199, background: 'rgba(0,0,0,0.6)' }} />
      )}
    <div style={{
      position: 'fixed', left: 0, top: 0, bottom: 0, width: 240, zIndex: 200,
      background: 'rgba(3,2,0,0.97)',
      backdropFilter: 'blur(28px)',
      WebkitBackdropFilter: 'blur(28px)',
      borderRight: '1px solid rgba(245,158,11,0.12)',
      display: 'flex', flexDirection: 'column',
      boxShadow: '4px 0 48px rgba(0,0,0,0.7)',
      overflow: 'hidden',
    }}>
      {/* Top amber edge glow */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.6), transparent)', zIndex: 10 }} />

      {/* Vertical scanning line */}
      <div style={{
        position: 'absolute', left: 0, right: 0, height: 1, zIndex: 5, pointerEvents: 'none',
        background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.45), transparent)',
        boxShadow: '0 0 12px rgba(245,158,11,0.3)',
        animation: 'sidebarScan 7s ease-in-out infinite',
      }} />

      {/* Logo / brand */}
      <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid rgba(245,158,11,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{
            width: 40, height: 40, flexShrink: 0,
            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #ea580c 100%)',
            borderRadius: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 900, color: '#0d0600',
            fontFamily: '"Playfair Display", Georgia, serif',
            boxShadow: '0 0 20px rgba(245,158,11,0.3)',
          }}>TJ</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#f5ead0', lineHeight: 1.2, fontFamily: '"Courier New", monospace', letterSpacing: 1 }}>ADMIN PANEL</div>
            <div style={{ fontSize: 8, letterSpacing: 2.5, textTransform: 'uppercase', color: '#f59e0b', fontWeight: 700, marginTop: 3, fontFamily: '"Courier New", monospace', opacity: 0.7 }}>MGMT CONSOLE</div>
          </div>
        </div>

        {/* Status row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 10 }}>
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' }} />
          <span style={{ fontSize: 8, letterSpacing: 2, color: '#4ade80', fontFamily: '"Courier New", monospace' }}>SYS ONLINE</span>
          <span style={{ fontSize: 8, color: 'rgba(245,158,11,0.2)', fontFamily: '"Courier New", monospace', marginLeft: 4 }}>{'//'} LIVE</span>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto', scrollbarWidth: 'none' }}>
        {NAV_ITEMS.map(({ icon, label, idx }) => {
          const active = tab === idx;
          return (
            <motion.button
              key={idx}
              onClick={() => setTab(idx)}
              whileHover={{ x: active ? 0 : 4 }}
              whileTap={{ scale: 0.97 }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 11,
                padding: '9px 12px', borderRadius: 2, border: 'none',
                background: active ? 'rgba(245,158,11,0.08)' : 'transparent',
                color: active ? '#fbbf24' : '#9c8a72',
                fontWeight: active ? 700 : 500, fontSize: 13, fontFamily: 'Inter, sans-serif',
                marginBottom: 1, textAlign: 'left', position: 'relative', overflow: 'hidden',
                borderLeft: active ? '2px solid #f59e0b' : '2px solid transparent',
                boxShadow: active ? '4px 0 20px rgba(245,158,11,0.06) inset' : 'none',
                transition: 'background 0.18s, color 0.18s, border-left-color 0.18s',
              }}
            >
              {/* Active left glow edge */}
              {active && (
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: '#f59e0b', boxShadow: '0 0 12px rgba(245,158,11,0.8)' }} />
              )}

              <span style={{ fontSize: 15, flexShrink: 0 }}>{icon}</span>
              <span style={{ flex: 1, fontFamily: active ? '"Courier New", monospace' : 'Inter, sans-serif', letterSpacing: active ? 0.8 : 0 }}>{label}</span>

              {active && (
                <motion.div
                  layoutId="hud-active-dot"
                  style={{ width: 5, height: 5, borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 10px rgba(245,158,11,0.9)', flexShrink: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Utility + sign out */}
      <div style={{ padding: '10px 8px 14px', borderTop: '1px solid rgba(245,158,11,0.07)' }}>
        {menuItems.length === 0 && (
          <button onClick={onSeed} disabled={seeding}
            style={{ width: '100%', padding: '7px 10px', borderRadius: 2, border: '1px solid rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.06)', color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 4, fontFamily: '"Courier New", monospace', letterSpacing: 0.5 }}
          >{seeding ? '⏳ SEEDING...' : '▸ SEED DB'}</button>
        )}
        <button onClick={onClean}
          style={{ width: '100%', padding: '7px 10px', borderRadius: 2, border: '1px solid rgba(74,222,128,0.15)', background: 'rgba(74,222,128,0.04)', color: '#4ade80', fontSize: 11, fontWeight: 700, marginBottom: 4, fontFamily: '"Courier New", monospace', letterSpacing: 0.5 }}
        >▸ CLEAN DUPS</button>
        <button onClick={onAssignTypes}
          style={{ width: '100%', padding: '7px 10px', borderRadius: 2, border: '1px solid rgba(245,158,11,0.15)', background: 'rgba(245,158,11,0.04)', color: '#fbbf24', fontSize: 11, fontWeight: 700, marginBottom: 8, fontFamily: '"Courier New", monospace', letterSpacing: 0.5 }}
        >▸ SET TYPES</button>
        <button onClick={onSignOut}
          style={{ width: '100%', padding: '9px 10px', borderRadius: 2, border: '1px solid rgba(255,107,107,0.18)', background: 'rgba(255,107,107,0.04)', color: '#ff8888', fontSize: 12, fontWeight: 700, fontFamily: '"Courier New", monospace', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, letterSpacing: 1 }}
        ><span>⇥</span><span>SIGN OUT</span></button>
      </div>

      {/* Bottom amber edge */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.4), transparent)' }} />
    </div>
    </>
  );
}

const pageVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2 } },
};


// ── Main dashboard ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [tab, setTab]               = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [menuItems, setMenuItems]   = useState([]);
  const [orders, setOrders]         = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [drinks, setDrinks]         = useState([]);
  const [editItem, setEditItem]     = useState(null);
  const [showAddItem, setShowAddItem]   = useState(false);
  const [showAddPromo, setShowAddPromo] = useState(false);
  const [seeding, setSeeding]       = useState(false);
  const [qrUrl, setQrUrl]           = useState('https://tjs-kebab-centre.netlify.app');
  const [blastMsg, setBlastMsg]     = useState('');
  const [blastSubject, setBlastSubject] = useState('');
  const [blastChannels, setBlastChannels] = useState(['email']);
  const [blasting, setBlasting]     = useState(false);
  const [blastResult, setBlastResult]   = useState(null);
  const [subscribers, setSubscribers]   = useState([]);
  const priceTimers = useRef({});

  useEffect(() => {
    const unsubs = [
      onSnapshot(query(collection(db, 'menuItems'), orderBy('categoryOrder'), orderBy('order')), snap => setMenuItems(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), snap => setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(db, 'promotions'), snap => setPromotions(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, 'drinks'), orderBy('order')), snap => setDrinks(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(db, 'subscribers'), snap => setSubscribers(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const seedDatabase = async () => {
    if (!window.confirm('This will add all menu items to the database. Continue?')) return;
    setSeeding(true);
    try {
      for (const item of SEED_MENU)  await addDoc(collection(db, 'menuItems'), item);
      for (const drink of SEED_DRINKS) await addDoc(collection(db, 'drinks'), drink);
      alert('✅ Database seeded successfully!');
    } catch (e) { alert('Error: ' + e.message); }
    setSeeding(false);
  };

  const cleanDuplicates = async () => {
    if (!window.confirm('Delete all duplicate menu items and drinks from the database?')) return;
    try {
      let deleted = 0;
      const menuSnap = await getDocs(collection(db, 'menuItems'));
      const seenMenu = new Map();
      for (const d of menuSnap.docs) {
        const key = `${(d.data().category||'').trim().toLowerCase()}__${(d.data().name||'').trim().toLowerCase()}`;
        if (seenMenu.has(key)) { await deleteDoc(doc(db, 'menuItems', d.id)); deleted++; }
        else seenMenu.set(key, d.id);
      }
      const drinkSnap = await getDocs(collection(db, 'drinks'));
      const seenDrinks = new Map();
      for (const d of drinkSnap.docs) {
        const key = (d.data().name || '').trim().toLowerCase();
        if (seenDrinks.has(key)) { await deleteDoc(doc(db, 'drinks', d.id)); deleted++; }
        else seenDrinks.set(key, d.id);
      }
      alert(`✅ Removed ${deleted} duplicate${deleted !== 1 ? 's' : ''}. Menu is now clean.`);
    } catch (e) { alert('Error: ' + e.message); }
  };

  const updateOrderStatus = async (id, status) => {
    await updateDoc(doc(db, 'orders', id), { status });
    if (status === 'ready') {
      const order = orders.find(o => o.id === id);
      if (order?.customerId) {
        const custRef  = doc(db, 'customers', order.customerId);
        const custSnap = await getDoc(custRef);
        if (custSnap.exists()) {
          const currentStamps = custSnap.data().stamps ?? 0;
          const newStamps = currentStamps + 1;
          await updateDoc(custRef, { stamps: newStamps >= 5 ? 0 : newStamps, totalOrders: increment(1), freeOrderEligible: newStamps >= 5 });
        }
      }
    }
    const order = orders.find(o => o.id === id);
    if (order && ['confirmed', 'preparing', 'ready'].includes(status)) {
      const email = order.customerEmail || order.customer?.email;
      const phone = order.customerPhone || order.customer?.phone;
      if (email || phone) {
        fetch(`${API_URL}/api/notify/order-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: email ?? null, phone: phone ?? null, firstName: order.customer?.firstName || order.customerName?.split(' ')[0] || 'there', orderId: id, status }),
        }).catch(() => {});
      }
    }
  };

  const handlePriceChange = (id, newPrice) => {
    setMenuItems(prev => prev.map(item => item.id === id ? { ...item, price: parseFloat(newPrice) || item.price } : item));
    clearTimeout(priceTimers.current[id]);
    priceTimers.current[id] = setTimeout(async () => {
      const parsed = parseFloat(newPrice);
      if (!isNaN(parsed) && parsed > 0) await updateDoc(doc(db, 'menuItems', id), { price: parsed });
    }, 800);
  };

  const handleBowlPriceChange = (id, field, newPrice) => {
    setMenuItems(prev => prev.map(item => item.id === id ? { ...item, [field]: parseFloat(newPrice) || item[field] } : item));
    clearTimeout(priceTimers.current[`${id}_${field}`]);
    priceTimers.current[`${id}_${field}`] = setTimeout(async () => {
      const parsed = parseFloat(newPrice);
      if (!isNaN(parsed) && parsed > 0) await updateDoc(doc(db, 'menuItems', id), { [field]: parsed });
    }, 800);
  };

  const handleSizePriceChange = (id, size, newPrice) => {
    setMenuItems(prev => prev.map(item =>
      item.id === id ? { ...item, sizePrices: { ...item.sizePrices, [size]: parseFloat(newPrice) || item.sizePrices?.[size] } } : item
    ));
    clearTimeout(priceTimers.current[`${id}_size_${size}`]);
    priceTimers.current[`${id}_size_${size}`] = setTimeout(async () => {
      const parsed = parseFloat(newPrice);
      if (!isNaN(parsed) && parsed > 0) await updateDoc(doc(db, 'menuItems', id), { [`sizePrices.${size}`]: parsed });
    }, 800);
  };

  const toggleItem   = async (id, available) => updateDoc(doc(db, 'menuItems', id), { available: !available });
  const deleteItem   = async (id) => { if (window.confirm('Delete this item?')) await deleteDoc(doc(db, 'menuItems', id)); };
  const togglePromo  = async (id, active)   => updateDoc(doc(db, 'promotions', id), { active: !active });

  const assignItemTypes = async () => {
    if (!window.confirm('This will assign itemType to all menu items based on their category. Continue?')) return;
    const { collection: col, getDocs: gd, updateDoc: upd, doc: d } = await import('firebase/firestore');
    const snap = await gd(col(db, 'menuItems'));
    const categoryToItemType = { 'wraps': 'wrap', 'wrap': 'wrap', 'hsp': 'hsp', 'halal snack pack': 'hsp', 'rice bowls': 'ricebowl', 'rice bowl': 'ricebowl', 'salad bowls': 'salad', 'salad bowl': 'salad', 'bowl salad': 'salad', 'skewers': 'skewer', 'skewer': 'skewer', 'chargrilled': 'chargrilled', 'snacks': 'snack', 'chips': 'snack', 'drinks': 'drink', 'drink': 'drink' };
    const isChipsItem = (name) => name?.toLowerCase().includes('chip');
    let updated = 0;
    for (const doc_ of snap.docs) {
      const data = doc_.data();
      const cat  = (data.category || data.categoryName || '').toLowerCase();
      const name = (data.name || '').toLowerCase();
      await upd(d(db, 'menuItems', doc_.id), { itemType: categoryToItemType[cat] ?? 'wrap', isChips: isChipsItem(name) });
      updated++;
    }
    alert(`Updated ${updated} items with itemType.`);
  };

  // ── Computed ──────────────────────────────────────────────────────────────
  const todaysOrders  = orders.filter(o => { if (!o.createdAt) return false; const d = o.createdAt.toDate?.() || new Date(o.createdAt); return d.toDateString() === new Date().toDateString(); });
  const todaysRevenue = todaysOrders.reduce((s, o) => s + (o.total || 0), 0);
  const pendingCount  = orders.filter(o => o.status === 'pending').length;

  // ── Shared field style ────────────────────────────────────────────────────
  const inp = { width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(245,158,11,0.18)', color: '#f5ead0', padding: '11px 14px', borderRadius: 2, fontSize: 13, outline: 'none', fontFamily: '"Courier New", monospace', boxSizing: 'border-box', letterSpacing: 0.5 };

  // ── Section heading ───────────────────────────────────────────────────────
  const SectionHead = ({ title, action }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 3, height: 18, background: 'linear-gradient(180deg, #fbbf24, #f59e0b)', borderRadius: 1, flexShrink: 0 }} />
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f5ead0', margin: 0, fontFamily: '"Courier New", monospace', letterSpacing: 1 }}>{title.toUpperCase()}</h2>
        </div>
        <div style={{ width: 40, height: 1, background: 'linear-gradient(90deg, #f59e0b, transparent)', marginTop: 7, marginLeft: 13 }} />
      </div>
      {action}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'transparent', display: 'flex' }}>

      {/* Three.js underwater abyss scene */}
      <UnderwaterScene />


      <Sidebar
        tab={tab}
        setTab={(t) => { setTab(t); if (isMobile) setSidebarOpen(false); }}
        onSignOut={() => signOut(auth)}
        menuItems={menuItems} seeding={seeding}
        onSeed={seedDatabase} onClean={cleanDuplicates} onAssignTypes={assignItemTypes}
        open={sidebarOpen} onClose={() => setSidebarOpen(false)} isMobile={isMobile}
      />

      {/* Main content */}
      <div style={{ marginLeft: isMobile ? 0 : 240, flex: 1, position: 'relative', zIndex: 1 }}>

        {/* Sticky HUD header */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 100,
          background: 'rgba(3,1,0,0.94)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(245,158,11,0.09)',
          padding: '0 32px', height: 56,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Left: hamburger (mobile) + breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isMobile && (
              <button onClick={() => setSidebarOpen(o => !o)} style={{
                background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                color: '#f59e0b', borderRadius: 4, padding: '6px 10px', fontSize: 16,
                cursor: 'pointer', lineHeight: 1,
              }}>☰</button>
            )}
            <span style={{ fontSize: 16 }}>{NAV_ITEMS[tab]?.icon}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#f5ead0', fontFamily: '"Courier New", monospace', letterSpacing: 2, textTransform: 'uppercase' }}>{NAV_ITEMS[tab]?.label}</span>
            {!isMobile && <span style={{ fontSize: 9, color: 'rgba(245,158,11,0.35)', fontFamily: '"Courier New", monospace', letterSpacing: 1 }}>{'//'} TJ-KEBAB-CENTRE</span>}
          </div>
          {/* Right: live status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80' }} />
            <span style={{ fontSize: 9, color: '#4ade80', fontWeight: 700, letterSpacing: 2, fontFamily: '"Courier New", monospace' }}>LIVE FEED</span>
          </div>
        </div>

        <div style={{ padding: '28px 32px' }}>
          <AnimatePresence mode="wait">

            {/* ── OVERVIEW ── */}
            {tab === 0 && (
              <motion.div key="overview" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
                  {[
                    { icon: '📦', label: "TODAY'S ORDERS",  value: todaysOrders.length, accent: '#f59e0b', sub: `${orders.length} total` },
                    { icon: '💰', label: "TODAY'S REVENUE",  value: `$${todaysRevenue.toFixed(2)}`, accent: '#fbbf24', sub: 'incl. GST' },
                    { icon: '🍽️', label: 'ACTIVE ITEMS',  value: menuItems.filter(m => m.available).length, accent: '#4ade80', sub: `of ${menuItems.length} total` },
                    { icon: '⏳', label: 'PENDING',  value: pendingCount, accent: '#ff8c42', sub: 'awaiting action' },
                  ].map(({ icon, label, value, accent, sub }) => (
                    <HUDCard key={label} accent={accent} style={{ height: '100%' }}>
                      <div style={{ position: 'absolute', top: -24, right: -24, width: 90, height: 90, borderRadius: '50%', background: `radial-gradient(circle, ${accent}1a 0%, transparent 70%)`, pointerEvents: 'none' }} />
                      <div style={{ fontSize: 22, marginBottom: 10 }}>{icon}</div>
                      <div style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', color: `${accent}aa`, marginBottom: 7, fontFamily: '"Courier New", monospace' }}>{label}</div>
                      <div style={{ fontSize: 32, fontWeight: 800, color: accent, fontFamily: '"Courier New", monospace', lineHeight: 1, letterSpacing: -1 }}>{value}</div>
                      {sub && <div style={{ fontSize: 11, color: 'rgba(156,138,114,0.7)', marginTop: 6, fontFamily: '"Courier New", monospace', letterSpacing: 0.5 }}>{sub}</div>}
                    </HUDCard>
                  ))}
                </div>

                <SectionHead title="Recent Orders" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <AnimatePresence initial={false}>
                    {orders.slice(0, 8).map((order, i) => (
                      <motion.div key={order.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ delay: i * 0.04, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
                        <OrderRow order={order} onStatusChange={updateOrderStatus} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {orders.length === 0 && <EmptyState msg="NO ORDERS IN FEED" />}
                </div>
              </motion.div>
            )}

            {/* ── MENU ── */}
            {tab === 1 && (
              <motion.div key="menu" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <SectionHead
                  title={`Menu Items (${menuItems.length})`}
                  action={<button onClick={() => setShowAddItem(true)} style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#0d0600', border: 'none', padding: '9px 20px', borderRadius: 2, fontWeight: 700, fontSize: 11, letterSpacing: 2, fontFamily: '"Courier New", monospace', boxShadow: '0 4px 16px rgba(245,158,11,0.25)' }}>+ ADD ITEM</button>}
                />
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.16)', borderRadius: 2, padding: '4px 14px', marginBottom: 24, fontSize: 10, color: '#4ade80', fontWeight: 700, letterSpacing: 1.5, fontFamily: '"Courier New", monospace' }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' }} />
                  LIVE — PRICE CHANGES PUSH TO CUSTOMER MENU INSTANTLY
                </div>
                {Object.entries(
                  menuItems.reduce((acc, item) => {
                    const cat = item.category || 'Other';
                    if (!acc[cat]) acc[cat] = [];
                    acc[cat].push(item);
                    return acc;
                  }, {})
                ).map(([cat, catItems]) => (
                  <div key={cat} style={{ marginBottom: 28 }}>
                    <h3 style={{ fontSize: 9, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 10, fontFamily: '"Courier New", monospace', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{catItems[0]?.emoji ?? '◆'}</span><span>{cat}</span>
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {catItems.map(item => (
                        <div key={item.id} style={{ background: 'rgba(2,6,18,0.78)', backdropFilter: 'blur(8px)', border: `1px solid ${item.available ? 'rgba(245,158,11,0.1)' : 'rgba(255,107,107,0.18)'}`, borderLeft: `2px solid ${item.available ? 'rgba(245,158,11,0.35)' : 'rgba(255,107,107,0.4)'}`, borderRadius: 2, padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, fontSize: 13, color: item.available ? '#f5ead0' : '#9c8a72', marginBottom: 2, fontFamily: 'Inter, sans-serif' }}>{item.name}</div>
                              <div style={{ fontSize: 11, color: '#9c8a72', fontFamily: 'Inter, sans-serif' }}>{item.description?.slice(0, 72)}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ color: '#9c8a72', fontSize: 11, fontFamily: '"Courier New", monospace' }}>$</span>
                              <input type="number" min="0" step="0.50" value={item.price ?? ''} onChange={e => handlePriceChange(item.id, e.target.value)} title="Edit price"
                                style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b', padding: '5px 7px', borderRadius: 2, fontSize: 13, fontWeight: 700, width: 68, textAlign: 'right', outline: 'none', fontFamily: '"Courier New", monospace' }}
                                onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.7)'} onBlur={e => e.target.style.borderColor = 'rgba(245,158,11,0.2)'}
                              />
                            </div>
                            <div style={{ display: 'flex', gap: 5 }}>
                              <button onClick={() => toggleItem(item.id, item.available)} style={{ background: item.available ? 'rgba(74,222,128,0.07)' : 'rgba(255,107,107,0.07)', border: `1px solid ${item.available ? 'rgba(74,222,128,0.25)' : 'rgba(255,107,107,0.25)'}`, color: item.available ? '#4ade80' : '#ff8888', padding: '4px 11px', borderRadius: 2, fontSize: 11, fontWeight: 700, fontFamily: '"Courier New", monospace' }}>{item.available ? 'ON' : 'OFF'}</button>
                              <button onClick={() => setEditItem(item)} style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.16)', color: '#f59e0b', padding: '4px 11px', borderRadius: 2, fontSize: 11, fontWeight: 700, fontFamily: '"Courier New", monospace' }}>EDIT</button>
                              <button onClick={() => deleteItem(item.id)} style={{ background: 'rgba(255,107,107,0.06)', border: '1px solid rgba(255,107,107,0.16)', color: '#ff8888', padding: '4px 11px', borderRadius: 2, fontSize: 11, fontWeight: 700, fontFamily: '"Courier New", monospace' }}>DEL</button>
                            </div>
                          </div>
                          {item.itemType === 'bowl' && (
                            <div style={{ display: 'flex', gap: 14, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                              {[['saladPrice', 'Salad'], ['ricePrice', 'Rice']].map(([field, label]) => (
                                <label key={field} style={{ color: '#9c8a72', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6, fontFamily: '"Courier New", monospace' }}>{label} $
                                  <input type="number" min="0" step="0.50" value={item[field] ?? item.price ?? ''} onChange={e => handleBowlPriceChange(item.id, field, e.target.value)}
                                    style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b', padding: '3px 6px', borderRadius: 2, fontSize: 11, width: 52, outline: 'none', fontFamily: '"Courier New", monospace' }}
                                    onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.6)'} onBlur={e => e.target.style.borderColor = 'rgba(245,158,11,0.2)'}
                                  />
                                </label>
                              ))}
                            </div>
                          )}
                          {item.sizePrices && (
                            <div style={{ display: 'flex', gap: 12, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.04)', flexWrap: 'wrap' }}>
                              {Object.entries(item.sizePrices).map(([size, price]) => (
                                <label key={size} style={{ color: '#9c8a72', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6, fontFamily: '"Courier New", monospace' }}>{size} $
                                  <input type="number" min="0" step="1" value={price ?? ''} onChange={e => handleSizePriceChange(item.id, size, e.target.value)}
                                    style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b', padding: '3px 5px', borderRadius: 2, fontSize: 11, width: 48, outline: 'none', fontFamily: '"Courier New", monospace' }}
                                    onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.6)'} onBlur={e => e.target.style.borderColor = 'rgba(245,158,11,0.2)'}
                                  />
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* ── ORDERS ── */}
            {tab === 2 && (
              <motion.div key="orders" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <SectionHead title={`All Orders (${orders.length})`} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <AnimatePresence initial={false}>
                    {orders.map((order, i) => (
                      <motion.div key={order.id} initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ delay: Math.min(i, 8) * 0.035, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
                        <OrderRow order={order} onStatusChange={updateOrderStatus} full />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {orders.length === 0 && <EmptyState msg="NO ORDERS IN FEED" />}
                </div>
              </motion.div>
            )}

            {/* ── PROMOTIONS ── */}
            {tab === 3 && (
              <motion.div key="promotions" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <SectionHead
                  title="Promotions"
                  action={<button onClick={() => setShowAddPromo(true)} style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#0d0600', border: 'none', padding: '9px 20px', borderRadius: 2, fontWeight: 700, fontSize: 11, letterSpacing: 2, fontFamily: '"Courier New", monospace' }}>+ ADD PROMO</button>}
                />
                {promotions.map(p => (
                  <div key={p.id} style={{ background: 'rgba(2,6,18,0.78)', backdropFilter: 'blur(8px)', border: `1px solid ${p.active ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)'}`, borderLeft: `2px solid ${p.active ? '#f59e0b' : 'rgba(255,255,255,0.1)'}`, borderRadius: 2, padding: '14px 18px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 28 }}>{p.emoji || '🎉'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#f5ead0', marginBottom: 3, fontFamily: 'Inter, sans-serif' }}>{p.title}</div>
                      <div style={{ fontSize: 12, color: '#9c8a72', fontFamily: 'Inter, sans-serif' }}>{p.description}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => togglePromo(p.id, p.active)} style={{ background: p.active ? 'rgba(74,222,128,0.07)' : 'rgba(255,107,107,0.07)', border: `1px solid ${p.active ? 'rgba(74,222,128,0.25)' : 'rgba(255,107,107,0.25)'}`, color: p.active ? '#4ade80' : '#ff8888', padding: '6px 14px', borderRadius: 2, fontSize: 11, fontWeight: 700, fontFamily: '"Courier New", monospace' }}>{p.active ? 'ACTIVE' : 'OFFLINE'}</button>
                      <button onClick={() => deleteDoc(doc(db, 'promotions', p.id))} style={{ background: 'rgba(255,107,107,0.06)', border: '1px solid rgba(255,107,107,0.16)', color: '#ff8888', padding: '6px 12px', borderRadius: 2, fontSize: 11, fontWeight: 700, fontFamily: '"Courier New", monospace' }}>DEL</button>
                    </div>
                  </div>
                ))}
                {promotions.length === 0 && <EmptyState msg="NO PROMOTIONS ACTIVE" />}
              </motion.div>
            )}

            {/* ── DRINKS ── */}
            {tab === 4 && (
              <motion.div key="drinks" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <SectionHead title={`Drinks (${drinks.length})`} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {drinks.map(drink => (
                    <div key={drink.id} style={{ background: 'rgba(2,6,18,0.78)', backdropFilter: 'blur(8px)', border: '1px solid rgba(245,158,11,0.09)', borderLeft: '2px solid rgba(245,158,11,0.25)', borderRadius: 2, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span style={{ fontSize: 20 }}>🥤</span>
                      <div style={{ flex: 1, fontWeight: 600, fontSize: 13, color: '#f5ead0', fontFamily: 'Inter, sans-serif' }}>{drink.name}</div>
                      <div style={{ fontWeight: 700, color: '#f59e0b', fontFamily: '"Courier New", monospace', fontSize: 14 }}>${drink.price?.toFixed(2)}</div>
                      <button onClick={() => updateDoc(doc(db, 'drinks', drink.id), { available: !drink.available })} style={{ background: drink.available ? 'rgba(74,222,128,0.07)' : 'rgba(255,107,107,0.07)', border: `1px solid ${drink.available ? 'rgba(74,222,128,0.25)' : 'rgba(255,107,107,0.25)'}`, color: drink.available ? '#4ade80' : '#ff8888', padding: '4px 12px', borderRadius: 2, fontSize: 11, fontWeight: 700, fontFamily: '"Courier New", monospace' }}>
                        {drink.available ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  ))}
                  {drinks.length === 0 && <EmptyState msg="NO DRINKS IN DATABASE" />}
                </div>
              </motion.div>
            )}

            {/* ── STAFF ── */}
            {tab === 5 && (
              <motion.div key="staff" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <StaffManagement />
              </motion.div>
            )}

            {/* ── QR CODE ── */}
            {tab === 6 && (
              <motion.div key="qr" variants={pageVariants} initial="initial" animate="animate" exit="exit" style={{ maxWidth: 500 }}>
                <SectionHead title="QR Code" />
                <p style={{ fontSize: 13, color: '#9c8a72', marginBottom: 18, fontFamily: 'Inter, sans-serif' }}>Display at the counter — customers scan to order online.</p>
                <div style={{ background: 'rgba(2,6,18,0.78)', border: '1px solid rgba(245,158,11,0.11)', borderRadius: 2, padding: '14px 18px', marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 9, color: '#9c8a72', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2.5, marginBottom: 8, fontFamily: '"Courier New", monospace' }}>ORDER URL</label>
                  <input value={qrUrl} onChange={e => setQrUrl(e.target.value)} style={inp} />
                </div>
                <div id="qr-print-area" style={{ background: '#fff', borderRadius: 4, padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                  <QRCode value={qrUrl} size={220} />
                  <div style={{ fontFamily: 'Arial', fontWeight: 900, fontSize: 18, color: '#111', letterSpacing: 2 }}>TJ'S KEBAB CENTRE</div>
                  <div style={{ fontFamily: 'Arial', fontSize: 12, color: '#555' }}>Scan to view menu &amp; order online</div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => { const el = document.getElementById('qr-print-area'); const w = window.open('', '_blank', 'width=420,height=480'); w.document.write(`<html><body style="margin:0;background:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh">${el.outerHTML}</body></html>`); w.document.close(); w.print(); }}
                    style={{ flex: 1, background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#0d0600', border: 'none', padding: '12px', borderRadius: 2, fontWeight: 700, fontSize: 13, fontFamily: '"Courier New", monospace', letterSpacing: 1 }}
                  >▸ PRINT QR</button>
                  <a href="/menu-card" target="_blank" rel="noopener noreferrer"
                    style={{ flex: 1, background: 'rgba(2,6,18,0.78)', border: '1px solid rgba(245,158,11,0.14)', color: '#f5ead0', padding: '12px', borderRadius: 2, fontWeight: 700, fontSize: 13, textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Courier New", monospace', letterSpacing: 1 }}
                  >▸ PRINT MENU</a>
                </div>
              </motion.div>
            )}

            {/* ── BLAST ── */}
            {tab === 7 && (
              <motion.div key="blast" variants={pageVariants} initial="initial" animate="animate" exit="exit" style={{ maxWidth: 580 }}>
                <SectionHead title="Promo Blast" />
                <p style={{ fontSize: 12, color: '#9c8a72', marginBottom: 22, fontFamily: '"Courier New", monospace', letterSpacing: 0.5 }}>
                  Transmit promotional message to all subscribers. Backend endpoint: <code style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.08)', padding: '1px 6px', borderRadius: 2 }}>{API_URL}</code>.
                </p>
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 9, color: '#9c8a72', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2.5, marginBottom: 10, fontFamily: '"Courier New", monospace' }}>CHANNELS</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[['email', '📧 EMAIL'], ['sms', '💬 SMS'], ['push', '🔔 PUSH']].map(([ch, label]) => (
                      <button key={ch} onClick={() => setBlastChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch])}
                        style={{ padding: '8px 16px', borderRadius: 2, fontSize: 11, fontWeight: 700, fontFamily: '"Courier New", monospace', letterSpacing: 1.5, border: `1px solid ${blastChannels.includes(ch) ? 'rgba(245,158,11,0.45)' : 'rgba(255,255,255,0.08)'}`, background: blastChannels.includes(ch) ? 'rgba(245,158,11,0.08)' : 'rgba(2,6,18,0.78)', color: blastChannels.includes(ch) ? '#f59e0b' : '#9c8a72' }}
                      >{label}</button>
                    ))}
                  </div>
                </div>
                {blastChannels.includes('email') && (
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 9, color: '#9c8a72', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2.5, marginBottom: 8, fontFamily: '"Courier New", monospace' }}>EMAIL SUBJECT</label>
                    <input value={blastSubject} onChange={e => setBlastSubject(e.target.value)} placeholder="e.g. 20% off this weekend only 🥙" style={inp} />
                  </div>
                )}
                <div style={{ marginBottom: 22 }}>
                  <label style={{ display: 'block', fontSize: 9, color: '#9c8a72', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2.5, marginBottom: 8, fontFamily: '"Courier New", monospace' }}>MESSAGE</label>
                  <textarea value={blastMsg} onChange={e => setBlastMsg(e.target.value)} placeholder="This weekend only — get 20% off all kebab wraps! Use code KEBAB20 at checkout." rows={4} style={{ ...inp, minHeight: 100, resize: 'vertical' }} />
                </div>
                <button
                  onClick={async () => {
                    if (!blastMsg.trim()) { alert('Message is required'); return; }
                    if (!blastChannels.length) { alert('Select at least one channel'); return; }
                    if (!window.confirm(`Send blast to all subscribers via: ${blastChannels.join(', ')}?`)) return;
                    setBlasting(true); setBlastResult(null);
                    try {
                      const { auth: firebaseAuth } = await import('../firebase');
                      const token = await firebaseAuth.currentUser?.getIdToken();
                      const res  = await fetch(`${API_URL}/api/notify/blast`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ subject: blastSubject || undefined, message: blastMsg, channels: blastChannels }) });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error ?? 'Blast failed');
                      setBlastResult({ ok: true, data }); setBlastMsg(''); setBlastSubject('');
                    } catch (err) { setBlastResult({ ok: false, error: err.message }); }
                    finally { setBlasting(false); }
                  }}
                  disabled={blasting}
                  style={{ width: '100%', background: blasting ? 'rgba(245,158,11,0.25)' : 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#0d0600', border: 'none', padding: '13px', borderRadius: 2, fontWeight: 900, fontSize: 12, fontFamily: '"Courier New", monospace', letterSpacing: 3 }}
                >{blasting ? '⏳ TRANSMITTING...' : '▶▶ SEND BLAST'}</button>
                {blastResult && (
                  <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 2, border: `1px solid ${blastResult.ok ? 'rgba(74,222,128,0.2)' : 'rgba(255,107,107,0.2)'}`, background: blastResult.ok ? 'rgba(74,222,128,0.04)' : 'rgba(255,107,107,0.04)', borderLeft: `3px solid ${blastResult.ok ? '#4ade80' : '#ff6b6b'}` }}>
                    {blastResult.ok
                      ? Object.entries(blastResult.data.results ?? {}).map(([ch, r]) => <p key={ch} style={{ color: '#9c8a72', fontSize: 12, margin: '2px 0', fontFamily: '"Courier New", monospace' }}>{ch.toUpperCase()}: {r?.sent ?? 0} SENT // {r?.failed ?? 0} FAILED</p>)
                      : <p style={{ color: '#ff8888', fontWeight: 700, margin: 0, fontFamily: '"Courier New", monospace', fontSize: 12, letterSpacing: 1 }}>■ ERR // {blastResult.error}</p>
                    }
                  </div>
                )}
              </motion.div>
            )}

            {/* ── SUBSCRIBERS ── */}
            {tab === 8 && (
              <motion.div key="subscribers" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <SectionHead
                  title={`Subscribers (${subscribers.length})`}
                  action={
                    <button
                      onClick={() => {
                        const csv = ['Email,Phone,Channels,Date', ...subscribers.map(s => `"${s.email ?? ''}","${s.phone ?? ''}","${(s.channels ?? []).join('+')}","${s.createdAt?.toDate?.()?.toLocaleDateString?.('en-AU') ?? ''}"`)].join('\n');
                        const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: 'subscribers.csv' });
                        a.click();
                      }}
                      style={{ background: 'rgba(2,6,18,0.78)', border: '1px solid rgba(245,158,11,0.16)', color: '#9c8a72', padding: '7px 16px', borderRadius: 2, fontSize: 11, fontWeight: 700, fontFamily: '"Courier New", monospace', letterSpacing: 1.5 }}
                    >EXPORT CSV</button>
                  }
                />
                {subscribers.length === 0 ? (
                  <EmptyState msg="NO SUBSCRIBERS — PROMO BANNER DRIVES SIGN-UPS" />
                ) : (
                  <div style={{ background: 'rgba(2,6,18,0.78)', backdropFilter: 'blur(8px)', border: '1px solid rgba(245,158,11,0.09)', borderRadius: 2, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: '"Courier New", monospace' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(245,158,11,0.09)', background: 'rgba(245,158,11,0.03)' }}>
                          {['EMAIL', 'PHONE', 'CHANNELS', 'SIGNED UP'].map(h => (
                            <th key={h} style={{ color: 'rgba(245,158,11,0.55)', textAlign: 'left', padding: '10px 14px', fontWeight: 700, fontSize: 9, textTransform: 'uppercase', letterSpacing: 2 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {subscribers.map(s => (
                          <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '10px 14px', color: '#f5ead0', letterSpacing: 0.5 }}>{s.email ?? '—'}</td>
                            <td style={{ padding: '10px 14px', color: '#f5ead0' }}>{s.phone ?? '—'}</td>
                            <td style={{ padding: '10px 14px' }}>
                              {(s.channels ?? []).map(ch => <span key={ch} style={{ background: 'rgba(245,158,11,0.08)', color: '#f59e0b', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 2, marginRight: 4, letterSpacing: 1 }}>{ch.toUpperCase()}</span>)}
                            </td>
                            <td style={{ padding: '10px 14px', color: '#9c8a72', fontSize: 11 }}>{s.createdAt?.toDate?.()?.toLocaleDateString?.('en-AU') ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* Modals */}
      {(showAddItem || editItem) && <ItemModal item={editItem} onClose={() => { setShowAddItem(false); setEditItem(null); }} />}
      {showAddPromo && <PromoModal onClose={() => setShowAddPromo(false)} />}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ msg }) {
  return (
    <div style={{ textAlign: 'center', padding: '56px 20px', color: '#9c8a72', fontFamily: '"Courier New", monospace', letterSpacing: 2, fontSize: 11, textTransform: 'uppercase' }}>
      <div style={{ fontSize: 24, marginBottom: 12, opacity: 0.25, color: '#f59e0b' }}>◆</div>
      {msg}
    </div>
  );
}

// ── Order row — HUD terminal style ────────────────────────────────────────────
function OrderRow({ order, onStatusChange, full }) {
  const statusColor = STATUS_COLORS[order.status] || '#9c8a72';
  const time = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString('en-AU') : 'Unknown';
  return (
    <div style={{
      background: 'rgba(2,6,18,0.78)', backdropFilter: 'blur(18px)',
      WebkitBackdropFilter: 'blur(18px)',
      border: '1px solid rgba(245,158,11,0.10)',
      borderLeft: `3px solid ${statusColor}`,
      borderRadius: 2, padding: '13px 16px',
      boxShadow: `inset 2px 0 16px ${statusColor}08`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 7 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 800, fontSize: 12, color: '#fbbf24', fontFamily: '"Courier New", monospace', letterSpacing: 1 }}>#{order.orderRef}</span>
          <span style={{ fontSize: 10, color: 'rgba(156,138,114,0.6)', fontFamily: '"Courier New", monospace', letterSpacing: 0.5 }}>{time}</span>
        </div>
        <span style={{ fontWeight: 800, fontSize: 14, color: '#f59e0b', fontFamily: '"Courier New", monospace' }}>${order.total?.toFixed(2)}</span>
      </div>
      <div style={{ fontSize: 12, color: '#b89c7a', marginBottom: 9, fontFamily: 'Inter, sans-serif' }}>
        <strong style={{ color: '#f5ead0' }}>{order.name}</strong>
        {' · '}{order.phone}
        {' · '}{order.orderMode === 'delivery' ? `🛵 ${order.address}` : order.orderMode === 'dinein' ? '🍽️ Dine In' : '🏪 Pickup'}
      </div>
      {full && order.items && (
        <div style={{ fontSize: 11, color: '#9c8a72', marginBottom: 9, fontFamily: '"Courier New", monospace', letterSpacing: 0.5 }}>
          {order.items.map((item, i) => <span key={i}>{item.displayName || item.name} ×{item.qty}{i < order.items.length - 1 ? '  //  ' : ''}</span>)}
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ background: `${statusColor}14`, border: `1px solid ${statusColor}44`, color: statusColor, padding: '3px 10px', borderRadius: 2, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', fontFamily: '"Courier New", monospace', letterSpacing: 1.5 }}>{order.status || 'pending'}</span>
        {['pending', 'confirmed', 'preparing', 'ready', 'delivered'].filter(s => s !== order.status).map(s => (
          <button key={s} onClick={() => onStatusChange(order.id, s)} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#9c8a72', padding: '3px 9px', borderRadius: 2, fontSize: 10, fontWeight: 600, fontFamily: '"Courier New", monospace', letterSpacing: 0.8 }}>→ {s}</button>
        ))}
      </div>
    </div>
  );
}

// ── Item modal ────────────────────────────────────────────────────────────────
function ItemModal({ item, onClose }) {
  const cats = [
    { id: 'signature-bowls', name: 'Signature Bowls', emoji: '🥣', order: 1 },
    { id: 'kebab-wraps',     name: 'Kebab Wraps',     emoji: '🌯', order: 2 },
    { id: 'hsp',             name: 'HSP',              emoji: '🍟', order: 3 },
    { id: 'skewers-burgers', name: 'Skewers & Burgers',emoji: '🍢', order: 4 },
    { id: 'falafel',         name: 'Falafel',          emoji: '🧆', order: 5 },
  ];
  const [form, setForm] = useState(item || { name: '', description: '', price: '', category: 'signature-bowls', popular: false, available: true, order: 99, hasSalad: true, hasSauce: true, hasExtras: true });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const cat  = cats.find(c => c.id === form.category);
    const data = { ...form, price: parseFloat(form.price), categoryName: cat.name, categoryEmoji: cat.emoji, categoryOrder: cat.order };
    if (item?.id) await updateDoc(doc(db, 'menuItems', item.id), data);
    else await addDoc(collection(db, 'menuItems'), data);
    setSaving(false);
    onClose();
  };

  const fi = { width: '100%', background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(245,158,11,0.18)', color: '#f5ead0', padding: '11px 14px', borderRadius: 2, fontSize: 13, outline: 'none', fontFamily: '"Courier New", monospace', boxSizing: 'border-box', letterSpacing: 0.5 };
  const F = ({ label, children }) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 9, color: 'rgba(245,158,11,0.55)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2.5, marginBottom: 7, fontFamily: '"Courier New", monospace' }}>{label}</label>
      {children}
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{ background: 'rgba(4,2,0,0.98)', backdropFilter: 'blur(28px)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 3, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', padding: '26px 24px', position: 'relative' }}
      >
        {/* Corner brackets on modal */}
        {[['top','left'],['top','right'],['bottom','left'],['bottom','right']].map(([v,h],i) => (
          <div key={i} style={{ position: 'absolute', [v]: -1, [h]: -1, width: 14, height: 14, zIndex: 5, pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', [v]: 0, [h]: 0, width: 10, height: 1.5, background: '#f59e0b' }} />
            <div style={{ position: 'absolute', [v]: 0, [h]: 0, width: 1.5, height: 10, background: '#f59e0b' }} />
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h2 style={{ fontSize: 14, fontWeight: 800, color: '#f5ead0', margin: 0, fontFamily: '"Courier New", monospace', letterSpacing: 2, textTransform: 'uppercase' }}>{item ? '▸ EDIT ITEM' : '▸ ADD NEW ITEM'}</h2>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#9c8a72', width: 32, height: 32, borderRadius: 2, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Courier New", monospace' }}>✕</button>
        </div>
        <F label="Item Name"><input style={fi} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Chicken Rice Bowl" /></F>
        <F label="Description"><textarea style={{ ...fi, minHeight: 80, resize: 'vertical' }} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe the item..." /></F>
        <F label="Price ($)"><input style={fi} type="number" step="0.50" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="0.00" /></F>
        <F label="Category">
          <select style={{ ...fi, appearance: 'none' }} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
            {cats.map(c => <option key={c.id} value={c.id} style={{ background: '#0d0600' }}>{c.emoji} {c.name}</option>)}
          </select>
        </F>
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
          {[['popular', '⭐ Popular'], ['available', '✓ Available'], ['hasSalad', '🥗 Salad'], ['hasSauce', '🫙 Sauce'], ['hasExtras', '➕ Extras']].map(([key, label]) => (
            <button key={key} onClick={() => setForm(p => ({ ...p, [key]: !p[key] }))} style={{ background: form[key] ? 'rgba(245,158,11,0.09)' : 'rgba(255,255,255,0.03)', border: `1px solid ${form[key] ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.07)'}`, color: form[key] ? '#f59e0b' : '#9c8a72', padding: '6px 12px', borderRadius: 2, fontSize: 11, fontWeight: 700, fontFamily: '"Courier New", monospace', letterSpacing: 0.5 }}>{label}</button>
          ))}
        </div>
        <button onClick={save} disabled={saving || !form.name || !form.price} style={{ width: '100%', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#0d0600', border: 'none', padding: '12px', borderRadius: 2, fontWeight: 800, fontSize: 12, letterSpacing: 2.5, fontFamily: '"Courier New", monospace', opacity: saving || !form.name || !form.price ? 0.45 : 1 }}>
          {saving ? 'SAVING...' : item ? 'SAVE CHANGES' : 'ADD ITEM'}
        </button>
      </motion.div>
    </div>
  );
}

// ── Promo modal ───────────────────────────────────────────────────────────────
function PromoModal({ onClose }) {
  const [form, setForm] = useState({ title: '', description: '', emoji: '🎉', active: true });
  const [saving, setSaving] = useState(false);
  const save = async () => { setSaving(true); await addDoc(collection(db, 'promotions'), form); setSaving(false); onClose(); };
  const fi = { width: '100%', background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(245,158,11,0.18)', color: '#f5ead0', padding: '11px 14px', borderRadius: 2, fontSize: 13, outline: 'none', fontFamily: '"Courier New", monospace', boxSizing: 'border-box', letterSpacing: 0.5 };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{ background: 'rgba(4,2,0,0.98)', backdropFilter: 'blur(28px)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 3, width: '100%', maxWidth: 440, padding: '26px 24px', position: 'relative' }}
      >
        {[['top','left'],['top','right'],['bottom','left'],['bottom','right']].map(([v,h],i) => (
          <div key={i} style={{ position: 'absolute', [v]: -1, [h]: -1, width: 14, height: 14, zIndex: 5, pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', [v]: 0, [h]: 0, width: 10, height: 1.5, background: '#f59e0b' }} />
            <div style={{ position: 'absolute', [v]: 0, [h]: 0, width: 1.5, height: 10, background: '#f59e0b' }} />
          </div>
        ))}
        <h2 style={{ fontSize: 14, fontWeight: 800, color: '#f5ead0', marginBottom: 22, fontFamily: '"Courier New", monospace', letterSpacing: 2 }}>▸ ADD PROMOTION</h2>
        <div style={{ marginBottom: 14 }}><label style={{ display: 'block', fontSize: 9, color: 'rgba(245,158,11,0.55)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2.5, marginBottom: 7, fontFamily: '"Courier New", monospace' }}>EMOJI</label><input style={{ ...fi, width: 80 }} value={form.emoji} onChange={e => setForm(p => ({ ...p, emoji: e.target.value }))} /></div>
        <div style={{ marginBottom: 14 }}><label style={{ display: 'block', fontSize: 9, color: 'rgba(245,158,11,0.55)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2.5, marginBottom: 7, fontFamily: '"Courier New", monospace' }}>TITLE</label><input style={fi} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. 20% Off All Wraps Today!" /></div>
        <div style={{ marginBottom: 22 }}><label style={{ display: 'block', fontSize: 9, color: 'rgba(245,158,11,0.55)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2.5, marginBottom: 7, fontFamily: '"Courier New", monospace' }}>DESCRIPTION</label><input style={fi} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Use code WRAP20 at checkout" /></div>
        <button onClick={save} disabled={!form.title} style={{ width: '100%', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#0d0600', border: 'none', padding: '12px', borderRadius: 2, fontWeight: 800, fontSize: 12, letterSpacing: 2.5, fontFamily: '"Courier New", monospace', opacity: !form.title ? 0.45 : 1 }}>
          {saving ? 'SAVING...' : 'ADD PROMOTION'}
        </button>
      </motion.div>
    </div>
  );
}
