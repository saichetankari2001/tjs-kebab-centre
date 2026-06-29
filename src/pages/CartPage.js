import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Minus, Trash2, Tag } from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useCart } from '../context/CartContext';

export default function CartPage() {
  const { cart, addItem, removeItem, deleteItem, total, itemCount } = useCart();
  const navigate = useNavigate();
  const [drinks, setDrinks] = useState([]);
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');

  useEffect(() => {
    getDocs(query(collection(db, 'drinks'), orderBy('order')))
      .then((snap) =>
        setDrinks(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((d) => d.available !== false)
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
      {/* ── Cinematic header ── */}
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
        <span className="text-brand text-xs font-black px-2.5 py-1 rounded-full" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.20)' }}>
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
      <div className="mx-4 mt-4 rounded-2xl overflow-hidden" style={{ background: 'rgba(26,13,0,0.95)', border: '1px solid rgba(58,32,0,0.8)', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}>
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
                      item.customisations.sauces?.length &&
                        `Sauces: ${item.customisations.sauces.join(', ')}`,
                      item.customisations.salads?.length &&
                        `Salad: ${item.customisations.salads.join(', ')}`,
                      item.customisations.extras?.length &&
                        `Extras: ${item.customisations.extras.join(', ')}`,
                      item.customisations.note,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}
                <p className="text-brand font-bold text-sm mt-1">
                  ${(item.price * item.qty).toFixed(2)}
                </p>
              </div>

              {/* Qty controls */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => removeItem(item.cartId)}
                  className="w-7 h-7 rounded-full bg-card2 flex items-center justify-center text-muted hover:text-white hover:bg-brand transition-colors"
                >
                  <Minus size={12} />
                </button>
                <span className="text-white font-bold text-sm w-5 text-center">
                  {item.qty}
                </span>
                <button
                  onClick={() => addItem({ ...item, id: item.baseId || item.id })}
                  className="w-7 h-7 rounded-full bg-card2 flex items-center justify-center text-muted hover:text-white hover:bg-brand transition-colors"
                >
                  <Plus size={12} />
                </button>
                <button
                  onClick={() => deleteItem(item.cartId)}
                  className="w-7 h-7 rounded-full bg-card2 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors ml-1"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Drinks upsell */}
      {drinks.length > 0 && (
        <div className="mx-4 mt-4">
          <p className="text-muted text-xs font-bold tracking-wider uppercase mb-2 px-1">
            Add a drink?
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {drinks.map((drink) => {
              const drinkInCart = cart.find(
                (c) =>
                  (c.baseId === drink.id || c.id === drink.id) &&
                  (!c.customisations ||
                    (!c.customisations.salads?.length &&
                      !c.customisations.sauces?.length))
              );
              const qty = drinkInCart ? drinkInCart.qty : 0;
              return (
                <div
                  key={drink.id}
                  className={`flex-shrink-0 bg-card border rounded-xl px-4 py-3 flex flex-col gap-1 ${
                    qty > 0 ? 'border-brand/40' : 'border-border'
                  }`}
                >
                  <p className="text-white text-sm font-semibold whitespace-nowrap">
                    {drink.name}
                  </p>
                  <p className="text-brand text-xs font-bold">
                    ${drink.price.toFixed(2)}
                  </p>
                  {qty === 0 ? (
                    <button
                      onClick={() => addItem({ ...drink })}
                      className="mt-1 w-7 h-7 rounded-full bg-card2 flex items-center justify-center text-muted hover:text-white hover:bg-brand transition-colors"
                    >
                      <Plus size={12} />
                    </button>
                  ) : (
                    <div className="mt-1 flex items-center gap-2">
                      <button
                        onClick={() => removeItem(drinkInCart.cartId)}
                        className="w-7 h-7 rounded-full bg-card2 flex items-center justify-center text-muted hover:text-white hover:bg-brand transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-white font-bold text-sm w-5 text-center">
                        {qty}
                      </span>
                      <button
                        onClick={() => addItem({ ...drink })}
                        className="w-7 h-7 rounded-full bg-card2 flex items-center justify-center text-muted hover:text-white hover:bg-brand transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Promo code */}
      <div className="mx-4 mt-4">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2.5">
            <Tag size={14} className="text-muted flex-shrink-0" />
            <input
              type="text"
              value={promoCode}
              onChange={(e) => {
                setPromoCode(e.target.value.toUpperCase());
                setPromoError('');
              }}
              placeholder="Promo code"
              className="flex-1 bg-transparent text-white text-sm placeholder:text-muted outline-none"
            />
          </div>
          <button
            onClick={handlePromo}
            className="bg-card border border-border text-muted text-sm font-semibold px-4 rounded-xl hover:border-brand/40 hover:text-white transition-colors"
          >
            Apply
          </button>
        </div>
        {promoError && (
          <p className="text-red-400 text-xs mt-1 px-1">{promoError}</p>
        )}
      </div>

      {/* Order summary */}
      <div className="mx-4 mt-4 bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex justify-between px-4 py-3 border-b border-border text-sm">
          <span className="text-muted">
            Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''})
          </span>
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

      {/* CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-5 pt-3 bg-surface/95 backdrop-blur border-t border-border">
        <button
          onClick={() => navigate('/checkout')}
          className="w-full bg-brand text-surface font-black text-sm py-4 rounded-xl flex items-center justify-between px-6 hover:bg-brand-lit transition-colors active:scale-[0.98] shadow shadow-brand/20"
        >
          <span>Proceed to Checkout</span>
          <span>${total.toFixed(2)} →</span>
        </button>
      </div>
    </motion.div>
  );
}
