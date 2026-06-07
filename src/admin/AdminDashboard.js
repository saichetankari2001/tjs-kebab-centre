import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { SEED_MENU, SEED_DRINKS } from '../data/seedData';
import StaffManagement from './staff/StaffManagement';

const TABS = ['📊 Dashboard', '🍽️ Menu', '📦 Orders', '🎉 Promotions', '🥤 Drinks', '👥 Staff'];

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

  useEffect(() => {
    const unsubs = [
      onSnapshot(query(collection(db, 'menuItems'), orderBy('categoryOrder'), orderBy('order')), snap => setMenuItems(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), snap => setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(db, 'promotions'), snap => setPromotions(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, 'drinks'), orderBy('order')), snap => setDrinks(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
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

  const STATUS_MESSAGES = {
    confirmed: { title: "Order Confirmed! ✅", body: "TJ's Kebab received your order. We're on it!" },
    preparing: { title: "Being Prepared 👨‍🍳", body: "Our chefs are cooking your food right now!" },
    ready: { title: "Ready! 🥙", body: "Your order is ready for pickup/delivery!" },
    picked: { title: "On the Way! 🛵", body: "Your driver has picked up your order!" },
    delivered: { title: "Delivered! 🎉", body: "Your order has arrived. Enjoy your meal!" },
  };

  const updateOrderStatus = async (id, status) => {
    await updateDoc(doc(db, 'orders', id), { status });
    // Send notification
    const order = orders.find(o => o.id === id);
    if (order?.fcmToken && STATUS_MESSAGES[status]) {
      const { title, body } = STATUS_MESSAGES[status];
      try {
        const { addDoc, collection: col, serverTimestamp: st } = await import('firebase/firestore');
        await addDoc(col(db, 'notifications'), { token: order.fcmToken, title, body, orderId: id, createdAt: new Date().toISOString() });
      } catch(e) { console.log('Notification error:', e); }
    }
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700 }}>Menu Items ({menuItems.length})</h2>
              <button onClick={() => setShowAddItem(true)} style={{ background: 'var(--brand)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 700, fontSize: 14, boxShadow: 'var(--shadow-glow)' }}>+ Add Item</button>
            </div>
            {['signature-bowls','kebab-wraps','hsp','skewers-burgers','falafel'].map(cat => {
              const catItems = menuItems.filter(m => m.category === cat);
              if (!catItems.length) return null;
              return (
                <div key={cat} style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                    {catItems[0]?.categoryEmoji} {catItems[0]?.categoryName}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {catItems.map(item => (
                      <div key={item.id} style={{ background: 'var(--card)', border: `1px solid ${item.available ? 'var(--border)' : 'rgba(226,75,74,0.3)'}`, borderRadius: 'var(--radius)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: item.available ? 'var(--text)' : 'var(--muted)', marginBottom: 2 }}>{item.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{item.description?.slice(0, 60)}...</div>
                        </div>
                        <div style={{ fontFamily: 'Playfair Display', fontSize: 18, fontWeight: 700, color: 'var(--brand)', minWidth: 55 }}>${item.price?.toFixed(2)}</div>
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                          <button onClick={() => toggleItem(item.id, item.available)} style={{ background: item.available ? 'rgba(76,175,80,0.15)' : 'rgba(226,75,74,0.15)', border: `1px solid ${item.available ? 'rgba(76,175,80,0.4)' : 'rgba(226,75,74,0.4)'}`, color: item.available ? 'var(--green)' : '#FF6B6B', padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                            {item.available ? '✓ On' : '✗ Off'}
                          </button>
                          <button onClick={() => setEditItem(item)} style={{ background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.3)', color: 'var(--gold)', padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>Edit</button>
                          <button onClick={() => deleteItem(item.id)} style={{ background: 'rgba(226,75,74,0.1)', border: '1px solid rgba(226,75,74,0.3)', color: '#FF6B6B', padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>Del</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
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
