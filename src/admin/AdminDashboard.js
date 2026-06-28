import React, { useState, useEffect, useRef } from 'react';
import { signOut } from 'firebase/auth';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, orderBy, increment } from 'firebase/firestore';
import QRCode from 'react-qr-code';
import { auth, db } from '../firebase';
import { SEED_MENU, SEED_DRINKS } from '../data/seedData';
import StaffManagement from './staff/StaffManagement';

const TABS = ['📊 Dashboard', '🍽️ Menu', '📦 Orders', '🎉 Promotions', '🥤 Drinks', '👥 Staff', '📱 QR Code', '📢 Blast', '📬 Subscribers'];

const API_URL = process.env.REACT_APP_API_URL ?? 'http://localhost:4000';

export default function AdminDashboard() {
  const [tab, setTab] = useState(0);
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [drinks, setDrinks] = useState([]);
  const [editItem, setEditItem] = useState(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddPromo, setShowAddPromo] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [qrUrl, setQrUrl] = useState('https://tjs-kebab-centre.netlify.app');
  const [blastMsg, setBlastMsg] = useState('');
  const [blastSubject, setBlastSubject] = useState('');
  const [blastChannels, setBlastChannels] = useState(['email']);
  const [blasting, setBlasting] = useState(false);
  const [blastResult, setBlastResult] = useState(null);
  const [subscribers, setSubscribers] = useState([]);
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

  const seedDatabase = async () => {
    if (!window.confirm('This will add all menu items to the database. Continue?')) return;
    setSeeding(true);
    try {
      for (const item of SEED_MENU) await addDoc(collection(db, 'menuItems'), item);
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

    // Increment loyalty stamps when order is marked ready
    if (status === 'ready') {
      const order = orders.find(o => o.id === id);
      if (order?.customerId) {
        const custRef = doc(db, 'customers', order.customerId);
        const custSnap = await getDoc(custRef);
        if (custSnap.exists()) {
          const currentStamps = custSnap.data().stamps ?? 0;
          const newStamps = currentStamps + 1;
          await updateDoc(custRef, {
            stamps:            newStamps >= 5 ? 0 : newStamps,
            totalOrders:       increment(1),
            freeOrderEligible: newStamps >= 5,
          });
        }
      }
    }

    // Send status-change email/SMS via backend (fire-and-forget)
    const order = orders.find(o => o.id === id);
    const notifyStatuses = ['confirmed', 'preparing', 'ready'];
    if (order && notifyStatuses.includes(status)) {
      const email = order.customerEmail || order.customer?.email;
      const phone = order.customerPhone || order.customer?.phone;
      if (email || phone) {
        fetch(`${API_URL}/api/notify/order-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to:        email  ?? null,
            phone:     phone  ?? null,
            firstName: order.customer?.firstName || order.customerName?.split(' ')[0] || 'there',
            orderId:   id,
            status,
          }),
        }).catch(() => {});
      }
    }
  };

  // ── Inline price editing (debounced 800ms) ──────────────────────────
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

  const toggleItem = async (id, available) => {
    await updateDoc(doc(db, 'menuItems', id), { available: !available });
  };

  const deleteItem = async (id) => {
    if (window.confirm('Delete this item?')) await deleteDoc(doc(db, 'menuItems', id));
  };

  const togglePromo = async (id, active) => {
    await updateDoc(doc(db, 'promotions', id), { active: !active });
  };

  // One-time migration: assigns itemType to all menuItems based on category name
  const assignItemTypes = async () => {
    if (!window.confirm('This will assign itemType to all menu items based on their category. Continue?')) return;
    const { collection: col, getDocs: gd, updateDoc: upd, doc: d } = await import('firebase/firestore');
    const snap = await gd(col(db, 'menuItems'));

    const categoryToItemType = {
      'wraps': 'wrap',
      'wrap': 'wrap',
      'hsp': 'hsp',
      'halal snack pack': 'hsp',
      'rice bowls': 'ricebowl',
      'rice bowl': 'ricebowl',
      'salad bowls': 'salad',
      'salad bowl': 'salad',
      'bowl salad': 'salad',
      'skewers': 'skewer',
      'skewer': 'skewer',
      'chargrilled': 'chargrilled',
      'snacks': 'snack',
      'chips': 'snack',
      'drinks': 'drink',
      'drink': 'drink',
    };

    const isChipsItem = (name) => name?.toLowerCase().includes('chip');

    let updated = 0;
    for (const doc_ of snap.docs) {
      const data = doc_.data();
      const cat = (data.category || data.categoryName || '').toLowerCase();
      const name = (data.name || '').toLowerCase();
      const itemType = categoryToItemType[cat] ?? 'wrap';
      await upd(d(db, 'menuItems', doc_.id), {
        itemType,
        isChips: isChipsItem(name),
      });
      updated++;
    }
    alert(`Updated ${updated} items with itemType.`);
  };

  const todaysOrders = orders.filter(o => {
    if (!o.createdAt) return false;
    const d = o.createdAt.toDate?.() || new Date(o.createdAt);
    return d.toDateString() === new Date().toDateString();
  });
  const todaysRevenue = todaysOrders.reduce((s, o) => s + (o.total || 0), 0);

  const card = (icon, label, value, color = 'var(--brand)') => (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px' }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: 'Playfair Display', fontSize: 28, fontWeight: 700, color }}>{value}</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--warm-dark)' }}>
      {/* Admin Navbar */}
      <div style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: 'var(--brand)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#fff', fontSize: 14 }}>TJ</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Admin Panel</div>
            <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 600 }}>MANAGEMENT CONSOLE</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {menuItems.length === 0 && (
            <button onClick={seedDatabase} disabled={seeding} style={{ background: 'rgba(240,165,0,0.15)', border: '1px solid var(--gold)', color: 'var(--gold)', padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
              {seeding ? '⏳ Seeding...' : '🌱 Seed Database'}
            </button>
          )}
          <button onClick={cleanDuplicates} style={{ background: 'rgba(76,175,80,0.12)', border: '1px solid rgba(76,175,80,0.4)', color: 'var(--green)', padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>🧹 Clean Duplicates</button>
          <button onClick={assignItemTypes} style={{ background: '#F59E0B', color: '#111', padding: '7px 14px', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>🏷️ Set Item Types</button>
          <button onClick={() => signOut(auth)} style={{ background: 'var(--card2)', border: '1px solid var(--border)', color: 'var(--text2)', padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>Sign Out</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: '16px 20px 0', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ background: tab === i ? 'var(--brand)' : 'var(--card)', border: `1px solid ${tab === i ? 'var(--brand)' : 'var(--border)'}`, color: tab === i ? '#fff' : 'var(--text2)', padding: '9px 18px', borderRadius: 20, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.2s' }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: '20px' }}>

        {/* DASHBOARD */}
        {tab === 0 && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Today's Overview</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
              {card('📦', "Today's Orders", todaysOrders.length)}
              {card('💰', "Today's Revenue", `$${todaysRevenue.toFixed(2)}`, 'var(--gold)')}
              {card('🍽️', 'Menu Items', menuItems.filter(m=>m.available).length, 'var(--green)')}
              {card('⏳', 'Pending Orders', orders.filter(o=>o.status==='pending').length, '#FF6B40')}
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14, color: 'var(--gold)' }}>Recent Orders</h3>
            {orders.slice(0, 5).map(order => (
              <OrderRow key={order.id} order={order} onStatusChange={updateOrderStatus} />
            ))}
            {orders.length === 0 && <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '40px 0' }}>No orders yet</p>}
          </div>
        )}

        {/* MENU */}
        {tab === 1 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Menu Items ({menuItems.length})</h2>
              <button onClick={() => setShowAddItem(true)} style={{ background: 'var(--brand)', color: '#000', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 700, fontSize: 14 }}>+ Add Item</button>
            </div>
            <p style={{ color: '#4ade80', fontSize: 11, fontWeight: 700, letterSpacing: 0.5, marginBottom: 20, background: '#16a34a22', border: '1px solid #16a34a44', display: 'inline-block', padding: '3px 10px', borderRadius: 100 }}>
              LIVE — price changes save automatically and reflect instantly in the customer menu
            </p>

            {/* Group items by category using live Firestore data */}
            {Object.entries(
              menuItems.reduce((acc, item) => {
                const cat = item.category || 'Other';
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(item);
                return acc;
              }, {})
            ).map(([cat, catItems]) => (
              <div key={cat} style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                  {catItems[0]?.emoji ?? ''} {cat}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {catItems.map(item => (
                    <div key={item.id} style={{ background: 'var(--card)', border: `1px solid ${item.available ? 'var(--border)' : 'rgba(226,75,74,0.3)'}`, borderRadius: 'var(--radius)', padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: item.available ? 'var(--text)' : 'var(--muted)', marginBottom: 2 }}>{item.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{item.description?.slice(0, 70)}</div>
                        </div>

                        {/* Inline price input */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ color: '#9ca3af', fontSize: 12 }}>$</span>
                          <input
                            type="number" min="0" step="0.50"
                            value={item.price ?? ''}
                            onChange={e => handlePriceChange(item.id, e.target.value)}
                            title="Edit price — saves automatically"
                            style={{ background: '#111', border: '1px solid #2a2a2a', color: '#f59e0b', padding: '4px 6px', borderRadius: 6, fontSize: 14, fontWeight: 700, width: 68, textAlign: 'right', outline: 'none' }}
                            onFocus={e => e.target.style.borderColor = '#f59e0b'}
                            onBlur={e => e.target.style.borderColor = '#2a2a2a'}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                          <button onClick={() => toggleItem(item.id, item.available)} style={{ background: item.available ? 'rgba(76,175,80,0.15)' : 'rgba(226,75,74,0.15)', border: `1px solid ${item.available ? 'rgba(76,175,80,0.4)' : 'rgba(226,75,74,0.4)'}`, color: item.available ? 'var(--green)' : '#FF6B6B', padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                            {item.available ? '✓ On' : '✗ Off'}
                          </button>
                          <button onClick={() => setEditItem(item)} style={{ background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.3)', color: 'var(--gold)', padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Edit</button>
                          <button onClick={() => deleteItem(item.id)} style={{ background: 'rgba(226,75,74,0.1)', border: '1px solid rgba(226,75,74,0.3)', color: '#FF6B6B', padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Del</button>
                        </div>
                      </div>

                      {/* Bowl sub-prices */}
                      {item.itemType === 'bowl' && (
                        <div style={{ display: 'flex', gap: 12, marginTop: 8, paddingTop: 8, borderTop: '1px solid #222' }}>
                          {[['saladPrice', 'Salad'], ['ricePrice', 'Rice']].map(([field, label]) => (
                            <label key={field} style={{ color: '#9ca3af', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                              {label} $
                              <input type="number" min="0" step="0.50" value={item[field] ?? item.price ?? ''}
                                onChange={e => handleBowlPriceChange(item.id, field, e.target.value)}
                                style={{ background: '#111', border: '1px solid #2a2a2a', color: '#f59e0b', padding: '3px 5px', borderRadius: 5, fontSize: 12, width: 52, outline: 'none' }}
                                onFocus={e => e.target.style.borderColor = '#f59e0b'}
                                onBlur={e => e.target.style.borderColor = '#2a2a2a'}
                              />
                            </label>
                          ))}
                        </div>
                      )}

                      {/* HSP / Chips size prices */}
                      {item.sizePrices && (
                        <div style={{ display: 'flex', gap: 10, marginTop: 8, paddingTop: 8, borderTop: '1px solid #222', flexWrap: 'wrap' }}>
                          {Object.entries(item.sizePrices).map(([size, price]) => (
                            <label key={size} style={{ color: '#9ca3af', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                              {size} $
                              <input type="number" min="0" step="1" value={price ?? ''}
                                onChange={e => handleSizePriceChange(item.id, size, e.target.value)}
                                style={{ background: '#111', border: '1px solid #2a2a2a', color: '#f59e0b', padding: '3px 5px', borderRadius: 5, fontSize: 12, width: 50, outline: 'none' }}
                                onFocus={e => e.target.style.borderColor = '#f59e0b'}
                                onBlur={e => e.target.style.borderColor = '#2a2a2a'}
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
          </div>
        )}

        {/* ORDERS */}
        {tab === 2 && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>All Orders ({orders.length})</h2>
            {orders.map(order => <OrderRow key={order.id} order={order} onStatusChange={updateOrderStatus} full />)}
            {orders.length === 0 && <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '60px 0' }}>No orders yet</p>}
          </div>
        )}

        {/* PROMOTIONS */}
        {tab === 3 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700 }}>Promotions</h2>
              <button onClick={() => setShowAddPromo(true)} style={{ background: 'var(--brand)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 700, fontSize: 14 }}>+ Add Promo</button>
            </div>
            {promotions.map(p => (
              <div key={p.id} style={{ background: 'var(--card)', border: `1px solid ${p.active ? 'rgba(240,165,0,0.3)' : 'var(--border)'}`, borderRadius: 'var(--radius)', padding: '16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 32 }}>{p.emoji || '🎉'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 2 }}>{p.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>{p.description}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => togglePromo(p.id, p.active)} style={{ background: p.active ? 'rgba(76,175,80,0.15)' : 'rgba(226,75,74,0.15)', border: `1px solid ${p.active ? 'rgba(76,175,80,0.4)' : 'rgba(226,75,74,0.4)'}`, color: p.active ? 'var(--green)' : '#FF6B6B', padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
                    {p.active ? '✓ Active' : '✗ Off'}
                  </button>
                  <button onClick={() => deleteDoc(doc(db, 'promotions', p.id))} style={{ background: 'rgba(226,75,74,0.1)', border: '1px solid rgba(226,75,74,0.3)', color: '#FF6B6B', padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>Del</button>
                </div>
              </div>
            ))}
            {promotions.length === 0 && <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '40px 0' }}>No promotions yet — add one above!</p>}
          </div>
        )}

        {/* STAFF */}
        {tab === 5 && <StaffManagement />}

        {/* QR CODE */}
        {tab === 6 && (
          <div style={{ maxWidth: 480, margin: '0 auto' }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>📱 QR Code</h2>
            <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 16 }}>Display at the counter — customers scan to order online.</p>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px', marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Order URL</label>
              <input value={qrUrl} onChange={e => setQrUrl(e.target.value)} style={{ width: '100%', background: 'var(--card2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '10px 12px', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div id="qr-print-area" style={{ background: '#fff', borderRadius: 16, padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <QRCode value={qrUrl} size={220} />
              <div style={{ fontFamily: 'Arial', fontWeight: 900, fontSize: 18, color: '#111', letterSpacing: 2 }}>TJ'S KEBAB CENTRE</div>
              <div style={{ fontFamily: 'Arial', fontSize: 12, color: '#555' }}>Scan to view menu &amp; order online</div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => {
                  const el = document.getElementById('qr-print-area');
                  const w = window.open('', '_blank', 'width=420,height=480');
                  w.document.write(`<html><body style="margin:0;background:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh">${el.outerHTML}</body></html>`);
                  w.document.close(); w.print();
                }}
                style={{ flex: 1, background: 'var(--brand)', color: '#000', border: 'none', padding: '13px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
              >🖨️ Print QR</button>
              <a href="/menu-card" target="_blank" rel="noopener noreferrer"
                style={{ flex: 1, background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', padding: '13px', borderRadius: 10, fontWeight: 700, fontSize: 14, textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >📄 Print Menu Card</a>
            </div>
          </div>
        )}

        {/* BLAST */}
        {tab === 7 && (
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>📢 Send Promo Blast</h2>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>
              Send a promotional message to all subscribers via email, SMS, or push. Requires the backend server running at <code>{API_URL}</code>.
            </p>

            {/* Channel selector */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Channels</label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[['email', '📧 Email'], ['sms', '💬 SMS'], ['push', '🔔 Push']].map(([ch, label]) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setBlastChannels(prev =>
                      prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]
                    )}
                    style={{
                      padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      border: `1px solid ${blastChannels.includes(ch) ? 'var(--brand)' : 'var(--border)'}`,
                      background: blastChannels.includes(ch) ? 'rgba(245,158,11,0.12)' : 'var(--card)',
                      color: blastChannels.includes(ch) ? 'var(--brand)' : 'var(--muted)',
                    }}
                  >{label}</button>
                ))}
              </div>
            </div>

            {/* Subject (email only) */}
            {blastChannels.includes('email') && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Email Subject</label>
                <input
                  value={blastSubject}
                  onChange={e => setBlastSubject(e.target.value)}
                  placeholder="e.g. 20% off this weekend only 🥙"
                  style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', padding: '10px 12px', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            )}

            {/* Message */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Message</label>
              <textarea
                value={blastMsg}
                onChange={e => setBlastMsg(e.target.value)}
                placeholder="This weekend only — get 20% off all kebab wraps! Use code KEBAB20 at checkout."
                rows={4}
                style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', padding: '10px 12px', borderRadius: 8, fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>

            {/* Send button */}
            <button
              onClick={async () => {
                if (!blastMsg.trim()) { alert('Message is required'); return; }
                if (!blastChannels.length) { alert('Select at least one channel'); return; }
                if (!window.confirm(`Send blast to all subscribers via: ${blastChannels.join(', ')}?`)) return;

                setBlasting(true);
                setBlastResult(null);
                try {
                  const { auth: firebaseAuth } = await import('../firebase');
                  const token = await firebaseAuth.currentUser?.getIdToken();
                  const res = await fetch(`${API_URL}/api/notify/blast`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ subject: blastSubject || undefined, message: blastMsg, channels: blastChannels }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error ?? 'Blast failed');
                  setBlastResult({ ok: true, data });
                  setBlastMsg('');
                  setBlastSubject('');
                } catch (err) {
                  setBlastResult({ ok: false, error: err.message });
                } finally {
                  setBlasting(false);
                }
              }}
              disabled={blasting}
              style={{ width: '100%', background: 'var(--brand)', color: '#000', border: 'none', padding: '14px', borderRadius: 10, fontWeight: 900, fontSize: 15, cursor: blasting ? 'not-allowed' : 'pointer', opacity: blasting ? 0.6 : 1 }}
            >
              {blasting ? '⏳ Sending...' : '🚀 Send Blast'}
            </button>

            {/* Result */}
            {blastResult && (
              <div style={{ marginTop: 16, padding: '14px 16px', borderRadius: 10, border: `1px solid ${blastResult.ok ? 'rgba(74,222,128,0.3)' : 'rgba(255,107,107,0.3)'}`, background: blastResult.ok ? 'rgba(74,222,128,0.08)' : 'rgba(255,107,107,0.08)' }}>
                {blastResult.ok ? (
                  <>
                    <p style={{ color: '#4ade80', fontWeight: 700, margin: '0 0 6px' }}>✓ Blast sent!</p>
                    {Object.entries(blastResult.data.results ?? {}).map(([ch, r]) => (
                      <p key={ch} style={{ color: 'var(--muted)', fontSize: 13, margin: '2px 0' }}>
                        {ch}: {r?.sent ?? 0} sent, {r?.failed ?? 0} failed
                      </p>
                    ))}
                  </>
                ) : (
                  <p style={{ color: '#FF6B6B', fontWeight: 700, margin: 0 }}>✗ {blastResult.error}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* DRINKS */}
        {tab === 4 && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Drinks ({drinks.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {drinks.map(drink => (
                <div key={drink.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 20 }}>🥤</span>
                  <div style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{drink.name}</div>
                  <div style={{ fontFamily: 'Playfair Display', fontWeight: 700, color: 'var(--brand)' }}>${drink.price?.toFixed(2)}</div>
                  <button onClick={() => updateDoc(doc(db, 'drinks', drink.id), { available: !drink.available })} style={{ background: drink.available ? 'rgba(76,175,80,0.15)' : 'rgba(226,75,74,0.15)', border: `1px solid ${drink.available ? 'rgba(76,175,80,0.4)' : 'rgba(226,75,74,0.4)'}`, color: drink.available ? 'var(--green)' : '#FF6B6B', padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                    {drink.available ? '✓ On' : '✗ Off'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

        {/* SUBSCRIBERS */}
        {tab === 8 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ color: 'var(--brand)', margin: 0, fontSize: 20, fontWeight: 700 }}>📬 Promo Subscribers ({subscribers.length})</h3>
              <button
                onClick={() => {
                  const csv = ['Email,Phone,Channels,Date', ...subscribers.map(s =>
                    `"${s.email ?? ''}","${s.phone ?? ''}","${(s.channels ?? []).join('+')}","${s.createdAt?.toDate?.()?.toLocaleDateString?.('en-AU') ?? ''}"`
                  )].join('\n');
                  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: 'subscribers.csv' });
                  a.click();
                }}
                style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--muted)', padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >Export CSV</button>
            </div>

            {subscribers.length === 0 ? (
              <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '40px 0' }}>No subscribers yet — the promo banner on the menu page drives sign-ups.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Email', 'Phone', 'Channels', 'Signed Up'].map(h => (
                      <th key={h} style={{ color: 'var(--muted)', textAlign: 'left', padding: '8px 12px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                      <td style={{ padding: '9px 12px', color: 'var(--text)' }}>{s.email ?? '—'}</td>
                      <td style={{ padding: '9px 12px', color: 'var(--text)' }}>{s.phone ?? '—'}</td>
                      <td style={{ padding: '9px 12px' }}>
                        {(s.channels ?? []).map(ch => (
                          <span key={ch} style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--brand)', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, marginRight: 4 }}>{ch.toUpperCase()}</span>
                        ))}
                      </td>
                      <td style={{ padding: '9px 12px', color: 'var(--muted)', fontSize: 12 }}>
                        {s.createdAt?.toDate?.()?.toLocaleDateString?.('en-AU') ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

      {/* Modals */}
      {(showAddItem || editItem) && <ItemModal item={editItem} onClose={() => { setShowAddItem(false); setEditItem(null); }} />}
      {showAddPromo && <PromoModal onClose={() => setShowAddPromo(false)} />}
    </div>
  );
}

function OrderRow({ order, onStatusChange, full }) {
  const statusColors = { pending: '#FF6B40', confirmed: 'var(--gold)', preparing: '#4A9EFF', ready: 'var(--green)', delivered: 'var(--green)', cancelled: '#FF6B6B' };
  const time = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString('en-AU') : 'Unknown time';
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginRight: 10 }}>#{order.orderRef}</span>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{time}</span>
        </div>
        <span style={{ fontFamily: 'Playfair Display', fontWeight: 700, fontSize: 16, color: 'var(--gold)' }}>${order.total?.toFixed(2)}</span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>
        <strong>{order.name}</strong> · {order.phone} · {order.orderMode === 'delivery' ? `🛵 ${order.address}` : order.orderMode === 'dinein' ? '🍽️ Dine In' : '🏪 Pickup'}
      </div>
      {full && order.items && (
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
          {order.items.map((item, i) => <span key={i}>{item.displayName || item.name} x{item.qty}{i < order.items.length - 1 ? ', ' : ''}</span>)}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ background: `${statusColors[order.status] || 'var(--muted)'}22`, border: `1px solid ${statusColors[order.status] || 'var(--muted)'}44`, color: statusColors[order.status] || 'var(--muted)', padding: '4px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700, textTransform: 'capitalize' }}>{order.status || 'pending'}</span>
        {['pending','confirmed','preparing','ready','delivered'].map(s => s !== order.status && (
          <button key={s} onClick={() => onStatusChange(order.id, s)} style={{ background: 'var(--card2)', border: '1px solid var(--border)', color: 'var(--text2)', padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>→ {s}</button>
        ))}
      </div>
    </div>
  );
}

function ItemModal({ item, onClose }) {
  const cats = [
    { id: 'signature-bowls', name: 'Signature Bowls', emoji: '🥣', order: 1 },
    { id: 'kebab-wraps', name: 'Kebab Wraps', emoji: '🌯', order: 2 },
    { id: 'hsp', name: 'HSP', emoji: '🍟', order: 3 },
    { id: 'skewers-burgers', name: 'Skewers & Burgers', emoji: '🍢', order: 4 },
    { id: 'falafel', name: 'Falafel', emoji: '🧆', order: 5 },
  ];
  const [form, setForm] = useState(item || { name: '', description: '', price: '', category: 'signature-bowls', popular: false, available: true, order: 99, hasSalad: true, hasSauce: true, hasExtras: true });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const cat = cats.find(c => c.id === form.category);
    const data = { ...form, price: parseFloat(form.price), categoryName: cat.name, categoryEmoji: cat.emoji, categoryOrder: cat.order };
    if (item?.id) await updateDoc(doc(db, 'menuItems', item.id), data);
    else await addDoc(collection(db, 'menuItems'), data);
    setSaving(false);
    onClose();
  };

  const inp = { width: '100%', background: 'var(--card2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '10px 12px', borderRadius: 8, fontSize: 14, outline: 'none' };
  const F = ({ label, children }) => <div style={{ marginBottom: 14 }}><label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{label}</label>{children}</div>;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', padding: '24px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>{item ? 'Edit Item' : 'Add New Item'}</h2>
          <button onClick={onClose} style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text2)', width: 32, height: 32, borderRadius: '50%', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        <F label="Item Name"><input style={inp} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Chicken Rice Bowl" /></F>
        <F label="Description"><textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe the item..." /></F>
        <F label="Price ($)"><input style={inp} type="number" step="0.50" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="0.00" /></F>
        <F label="Category">
          <select style={inp} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
            {cats.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
          </select>
        </F>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          {[['popular', '⭐ Popular'], ['available', '✓ Available'], ['hasSalad', '🥗 Has Salad'], ['hasSauce', '🫙 Has Sauce'], ['hasExtras', '➕ Has Extras']].map(([key, label]) => (
            <button key={key} onClick={() => setForm(p => ({ ...p, [key]: !p[key] }))} style={{ background: form[key] ? 'rgba(232,65,10,0.15)' : 'var(--card2)', border: `1px solid ${form[key] ? 'var(--brand)' : 'var(--border)'}`, color: form[key] ? 'var(--brand)' : 'var(--text2)', padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>{label}</button>
          ))}
        </div>
        <button onClick={save} disabled={saving || !form.name || !form.price} style={{ width: '100%', background: 'var(--brand)', color: '#fff', border: 'none', padding: '13px', borderRadius: 10, fontWeight: 700, fontSize: 16, opacity: saving || !form.name || !form.price ? 0.6 : 1 }}>
          {saving ? '⏳ Saving...' : item ? '💾 Save Changes' : '➕ Add Item'}
        </button>
      </div>
    </div>
  );
}

function PromoModal({ onClose }) {
  const [form, setForm] = useState({ title: '', description: '', emoji: '🎉', active: true });
  const [saving, setSaving] = useState(false);
  const save = async () => { setSaving(true); await addDoc(collection(db, 'promotions'), form); setSaving(false); onClose(); };
  const inp = { width: '100%', background: 'var(--card2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '10px 12px', borderRadius: 8, fontSize: 14, outline: 'none' };
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 440, padding: '24px 20px' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Add Promotion</h2>
        <div style={{ marginBottom: 14 }}><label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Emoji</label><input style={{ ...inp, width: 80 }} value={form.emoji} onChange={e => setForm(p => ({ ...p, emoji: e.target.value }))} /></div>
        <div style={{ marginBottom: 14 }}><label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Title</label><input style={inp} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. 20% Off All Wraps Today!" /></div>
        <div style={{ marginBottom: 20 }}><label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Description</label><input style={inp} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Use code WRAP20 at checkout" /></div>
        <button onClick={save} disabled={!form.title} style={{ width: '100%', background: 'var(--brand)', color: '#fff', border: 'none', padding: '13px', borderRadius: 10, fontWeight: 700, fontSize: 16, opacity: !form.title ? 0.6 : 1 }}>
          {saving ? '⏳ Saving...' : '🎉 Add Promotion'}
        </button>
      </div>
    </div>
  );
}

// Shop notifications hook - add this inside AdminDashboard component
