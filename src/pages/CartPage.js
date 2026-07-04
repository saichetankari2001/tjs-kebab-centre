import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Minus, Trash2, Tag } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useCart } from '../context/CartContext';
import { getItemThumbnail } from '../utils/itemThumbnail';

/* ── 3D drink card ── */
function DrinkCard({ drink, qty, onAdd, onRemove, delay }) {
  const thumb = getItemThumbnail({ ...drink, itemType: 'drink' });
  const [tilt, setTilt]   = useState({ x: 0, y: 0 });
  const [shine, setShine] = useState({ x: 50, y: 50 });
  const ref = useRef(null);
  const selected = qty > 0;

  const onMove = (e) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setTilt({
      x: ((e.clientY - r.top  - r.height / 2) / (r.height / 2)) * 16,
      y: -((e.clientX - r.left - r.width  / 2) / (r.width  / 2)) * 16,
    });
    setShine({
      x: ((e.clientX - r.left) / r.width)  * 100,
      y: ((e.clientY - r.top)  / r.height) * 100,
    });
  };
  const onLeave = () => { setTilt({ x: 0, y: 0 }); setShine({ x: 50, y: 50 }); };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ scale: 1.07, zIndex: 10 }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        rotateX: tilt.x,
        rotateY: tilt.y,
        transformPerspective: 700,
        flexShrink: 0,
        width: 116,
        borderRadius: 18,
        overflow: 'hidden',
        position: 'relative',
        cursor: 'pointer',
        background: selected
          ? 'linear-gradient(160deg, rgba(245,158,11,0.18) 0%, rgba(234,88,12,0.09) 100%)'
          : 'rgba(20,10,0,0.97)',
        border: `1px solid ${selected ? 'rgba(245,158,11,0.6)' : 'rgba(60,30,0,0.85)'}`,
        boxShadow: selected
          ? '0 10px 40px rgba(245,158,11,0.35), inset 0 0 0 1px rgba(245,158,11,0.12)'
          : '0 6px 28px rgba(0,0,0,0.55)',
      }}
    >
      {/* Shine overlay */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none', borderRadius: 18,
        background: `radial-gradient(circle at ${shine.x}% ${shine.y}%, rgba(255,210,100,0.14) 0%, transparent 60%)`,
      }} />

      {/* Photo */}
      <div style={{ height: 104, overflow: 'hidden', position: 'relative' }}>
        <motion.img
          src={thumb}
          alt={drink.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          animate={{ scale: selected ? 1.12 : 1 }}
          transition={{ duration: 0.5 }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        {/* Gradient fade into card bottom */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(20,10,0,1) 0%, rgba(20,10,0,0.35) 45%, transparent 100%)',
        }} />
        {/* Selected tick */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              style={{
                position: 'absolute', top: 7, right: 7, zIndex: 5,
                width: 22, height: 22, borderRadius: '50%',
                background: 'rgba(245,158,11,1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 10px rgba(245,158,11,0.5)',
              }}
            >
              <span style={{ fontSize: 11, color: '#0d0600', fontWeight: 900 }}>✓</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info */}
      <div style={{ padding: '8px 10px 10px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        <p style={{ color: '#fff', fontSize: 11, fontWeight: 600, lineHeight: 1.3, margin: 0 }}>
          {drink.name}
        </p>
        <p style={{ color: 'rgba(245,158,11,1)', fontSize: 12, fontWeight: 900, margin: 0 }}>
          ${drink.price.toFixed(2)}
        </p>

        {qty === 0 ? (
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={onAdd}
            style={{
              marginTop: 5, width: '100%', height: 30, borderRadius: 10,
              border: '1px solid rgba(245,158,11,0.38)',
              background: 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(234,88,12,0.09))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
          >
            <Plus size={14} color="rgba(245,158,11,1)" />
          </motion.button>
        ) : (
          <div style={{
            marginTop: 5, display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', gap: 3,
          }}>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={onRemove}
              style={{
                width: 28, height: 28, borderRadius: '50%',
                border: '1px solid rgba(245,158,11,0.32)',
                background: 'rgba(245,158,11,0.13)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}
            >
              <Minus size={12} color="rgba(245,158,11,1)" />
            </motion.button>
            <motion.span
              key={qty}
              initial={{ scale: 1.4, color: 'rgba(245,158,11,1)' }}
              animate={{ scale: 1,   color: '#ffffff' }}
              transition={{ duration: 0.25 }}
              style={{ fontWeight: 900, fontSize: 13 }}
            >
              {qty}
            </motion.span>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={onAdd}
              style={{
                width: 28, height: 28, borderRadius: '50%',
                border: '1px solid rgba(245,158,11,0.32)',
                background: 'rgba(245,158,11,0.13)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}
            >
              <Plus size={12} color="rgba(245,158,11,1)" />
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ── Page ── */
export default function CartPage() {
  const { cart, addItem, removeItem, deleteItem, total, itemCount } = useCart();
  const navigate = useNavigate();
  const [drinks,     setDrinks]     = useState([]);
  const [promoCode,  setPromoCode]  = useState('');
  const [promoError, setPromoError] = useState('');

  useEffect(() => {
    getDocs(collection(db, 'drinks'))
      .then((snap) =>
        setDrinks(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((d) => d.available !== false)
            .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
        )
      )
      .catch(() => {});
  }, []);

  const handlePromo = () => setPromoError('Invalid or expired promo code.');

  if (itemCount === 0) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="text-6xl">🥙</span>
        <h2 className="font-display text-4xl text-white tracking-wide">Your order is empty</h2>
        <p className="text-muted text-sm">Add some delicious items from our menu!</p>
        <button
          onClick={() => navigate('/')}
          className="mt-2 bg-brand text-surface font-black text-sm px-8 py-3 rounded-xl hover:bg-brand-lit transition-colors"
        >
          BROWSE MENU
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pb-32"
      style={{ background: 'transparent' }}
    >
      {/* ── Sticky header ── */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45 }}
        className="sticky top-0 z-30 backdrop-blur flex items-center gap-3 px-4 h-14"
        style={{ background: 'rgba(6,4,0,0.96)', borderBottom: '1px solid rgba(245,158,11,0.14)' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-brand transition-colors"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.12)' }}
        >
          <ArrowLeft size={16} />
        </button>
        <span className="font-display text-xl text-white flex-1 tracking-wide">YOUR ORDER</span>
        <span className="text-brand text-xs font-black px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.20)' }}>
          {itemCount} item{itemCount !== 1 ? 's' : ''}
        </span>
      </motion.div>

      {/* ── Pickup notice ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mx-4 mt-4 rounded-xl px-4 py-3 flex items-center gap-3"
        style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(234,88,12,0.06))', border: '1px solid rgba(245,158,11,0.22)' }}
      >
        <span className="text-xl">🏃</span>
        <div>
          <p className="text-white font-black text-sm tracking-wider">PICKUP ONLY</p>
          <p className="text-muted text-xs">Come grab your order — ready in ~15 min</p>
        </div>
      </motion.div>

      {/* ── Cart items ── */}
      <div className="mx-4 mt-4 rounded-2xl overflow-hidden"
        style={{ background: 'rgba(26,13,0,0.95)', border: '1px solid rgba(58,32,0,0.8)', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}>
        <AnimatePresence initial={false}>
          {cart.map((item, idx) => (
            <motion.div
              key={item.cartId ?? idx}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.04 }}
              whileHover={{ backgroundColor: 'rgba(245,158,11,0.04)' }}
              className="flex items-center gap-3 px-4 py-3 border-b"
              style={{ borderColor: 'rgba(58,32,0,0.5)' }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">
                  {item.displayName ?? item.name}
                </p>
                {item.customisations && (
                  <p className="text-muted text-xs mt-0.5 leading-snug line-clamp-2">
                    {[
                      item.customisations.bowlType,
                      item.customisations.skewBase,
                      item.customisations.size && `Size: ${item.customisations.size}`,
                      item.customisations.extraMeat && `+${item.customisations.extraMeat}`,
                      item.customisations.sauces?.length && `Sauces: ${item.customisations.sauces.join(', ')}`,
                      item.customisations.salads?.length && `Salad: ${item.customisations.salads.join(', ')}`,
                      item.customisations.extras?.length && `Extras: ${item.customisations.extras.join(', ')}`,
                      item.customisations.note,
                    ].filter(Boolean).join(' · ')}
                  </p>
                )}
                <p className="text-brand font-bold text-sm mt-1">
                  ${(item.price * item.qty).toFixed(2)}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => removeItem(item.cartId)}
                  className="w-7 h-7 rounded-full bg-card2 flex items-center justify-center text-muted hover:text-white hover:bg-brand transition-colors">
                  <Minus size={12} />
                </button>
                <span className="text-white font-bold text-sm w-5 text-center">{item.qty}</span>
                <button onClick={() => addItem({ ...item, id: item.baseId || item.id })}
                  className="w-7 h-7 rounded-full bg-card2 flex items-center justify-center text-muted hover:text-white hover:bg-brand transition-colors">
                  <Plus size={12} />
                </button>
                <button onClick={() => deleteItem(item.cartId)}
                  className="w-7 h-7 rounded-full bg-card2 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors ml-1">
                  <Trash2 size={12} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── 3D Drinks upsell ── */}
      {drinks.length > 0 && (
        <div className="mx-4 mt-6">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.18, duration: 0.4 }}
            className="flex items-center gap-2.5 mb-4 px-1"
          >
            <motion.span
              className="text-2xl"
              animate={{ rotate: [0, -8, 8, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
            >
              🥤
            </motion.span>
            <div>
              <p className="font-display text-base text-white tracking-widest">ADD A DRINK</p>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.35, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  height: 2, width: 52, borderRadius: 2, originX: 0,
                  background: 'linear-gradient(90deg, rgba(245,158,11,1), rgba(234,88,12,0.4), transparent)',
                }}
              />
            </div>
          </motion.div>

          {/* Drink cards row */}
          <div
            className="flex gap-3 overflow-x-auto pb-3"
            style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', perspective: 800 }}
          >
            {drinks.map((drink, idx) => {
              const drinkInCart = cart.find(
                (c) => (c.baseId === drink.id || c.id === drink.id) &&
                  (!c.customisations || (!c.customisations.salads?.length && !c.customisations.sauces?.length))
              );
              const qty = drinkInCart ? drinkInCart.qty : 0;
              return (
                <DrinkCard
                  key={drink.id}
                  drink={drink}
                  qty={qty}
                  delay={idx * 0.06}
                  onAdd={() => addItem({ ...drink })}
                  onRemove={() => removeItem(drinkInCart?.cartId)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* ── Promo code ── */}
      <div className="mx-4 mt-4">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2.5">
            <Tag size={14} className="text-muted flex-shrink-0" />
            <input
              type="text"
              value={promoCode}
              onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(''); }}
              placeholder="Promo code"
              className="flex-1 bg-transparent text-white text-sm placeholder:text-muted outline-none"
            />
          </div>
          <button onClick={handlePromo}
            className="bg-card border border-border text-muted text-sm font-semibold px-4 rounded-xl hover:border-brand/40 hover:text-white transition-colors">
            Apply
          </button>
        </div>
        {promoError && <p className="text-red-400 text-xs mt-1 px-1">{promoError}</p>}
      </div>

      {/* ── Order summary ── */}
      <div className="mx-4 mt-4 bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex justify-between px-4 py-3 border-b border-border text-sm">
          <span className="text-muted">Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''})</span>
          <span className="text-white font-semibold">${total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between px-4 py-3 border-b border-border text-sm">
          <span className="text-muted">Pickup</span>
          <span className="text-green-400 font-semibold">Free</span>
        </div>
        <div className="flex justify-between px-4 py-4 text-base font-black">
          <span className="text-white">Total</span>
          <span className="text-brand">${total.toFixed(2)}</span>
        </div>
      </div>

      {/* ── Checkout CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-5 pt-3 bg-surface/95 backdrop-blur border-t border-border">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/checkout')}
          className="w-full bg-brand text-surface font-black text-sm py-4 rounded-xl flex items-center justify-between px-6 hover:bg-brand-lit transition-colors shadow shadow-brand/20"
        >
          <span>Proceed to Checkout</span>
          <span>${total.toFixed(2)} →</span>
        </motion.button>
      </div>
    </motion.div>
  );
}
