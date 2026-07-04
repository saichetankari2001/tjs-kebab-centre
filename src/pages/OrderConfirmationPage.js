import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import LoyaltyCard from '../components/LoyaltyCard';

const STATUS_STEPS = [
  { key: 'pending',   label: 'Order Placed',   icon: '✓',  desc: 'We received your order'       },
  { key: 'preparing', label: 'Preparing',       icon: '👨‍🍳', desc: 'Being made fresh right now' },
  { key: 'ready',     label: 'Ready to Pickup', icon: '📦', desc: 'Come grab your order!'        },
];
const STATUS_ORDER = ['pending', 'preparing', 'ready'];

const CARD = {
  background: 'rgba(14,7,0,0.97)',
  border: '1px solid rgba(50,25,0,0.9)',
  boxShadow: '0 8px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(245,158,11,0.05)',
};

export default function OrderConfirmationPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { orderId: paramOrderId } = useParams();
  const { customer } = useAuth();

  const stateOrderId   = location.state?.orderId;
  const customerName   = location.state?.customerName;
  const total          = location.state?.total;
  const legacyOrderRef = location.state?.orderRef;
  const orderId = paramOrderId || stateOrderId;

  const [status,    setStatus]    = useState('pending');
  const [order,     setOrder]     = useState(null);
  const [minsLeft,  setMinsLeft]  = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!orderId) return;
    const unsub = onSnapshot(doc(db, 'orders', orderId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setStatus(data.status ?? 'pending');
        setOrder(data);
      }
    });
    return unsub;
  }, [orderId]);

  // Countdown timer — ticks every second while order is accepted
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!order?.estimatedMinutes || !order?.acceptedAt) { setMinsLeft(null); return; }
    if (status === 'ready') { setMinsLeft(0); return; }

    const readyAt = order.acceptedAt.toDate().getTime() + order.estimatedMinutes * 60000;

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((readyAt - Date.now()) / 60000));
      setMinsLeft(remaining);
    };
    tick();
    timerRef.current = setInterval(tick, 10000);
    return () => clearInterval(timerRef.current);
  }, [order?.estimatedMinutes, order?.acceptedAt, status]);

  const currentStep = STATUS_ORDER.indexOf(status);

  if (!orderId && !legacyOrderRef) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <button onClick={() => navigate('/')} className="text-brand font-bold underline">Back to Menu</button>
      </div>
    );
  }

  const items      = order?.items  ?? location.state?.items  ?? [];
  const orderTotal = order?.total  ?? total;
  const displayName = customerName || order?.customerName || order?.customer?.firstName;
  const shortId     = orderId
    ? orderId.slice(-6).toUpperCase()
    : legacyOrderRef?.toString().toUpperCase() ?? '——';

  const stampCount = customer?.stamps ?? 0;
  const isReady    = status === 'ready';

  return (
    <div className="min-h-screen pb-16">

      {/* ── Cinematic success header ── */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(160deg,#1e0e00,#120800 50%,#0d0600)' }}>
        <img
          src="https://images.unsplash.com/photo-1599487489082-78e929282ae0?auto=format&fit=crop&w=900&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'brightness(0.22) saturate(1.6)', mixBlendMode: 'luminosity' }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom,rgba(4,2,0,0.4) 0%,rgba(4,2,0,0.96) 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 80% at 50% 40%,rgba(245,158,11,0.20) 0%,transparent 65%)' }} />
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(245,158,11,0.7),transparent)' }} />

        <div className="relative px-6 pt-14 pb-10 text-center max-w-lg mx-auto">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 18, delay: 0.1 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl text-5xl mb-5"
            style={{ background:'linear-gradient(135deg,rgba(245,158,11,0.25),rgba(234,88,12,0.15))', border:'1px solid rgba(245,158,11,0.35)', boxShadow:'0 0 40px rgba(245,158,11,0.25)' }}
          >
            🥙
          </motion.div>
          <motion.h1
            initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2, duration:0.5 }}
            className="font-display text-5xl text-white tracking-wide leading-none mb-2"
            style={{ textShadow:'0 2px 30px rgba(245,158,11,0.3)' }}
          >
            ORDER PLACED!
          </motion.h1>
          <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}>
            <p className="text-sm mb-1" style={{ color:'rgba(200,180,150,0.9)' }}>
              {displayName ? `Thanks ${displayName}! ` : ''}We'll have it ready for pickup soon.
            </p>
            <p className="text-xs font-mono tracking-widest" style={{ color:'rgba(245,158,11,0.65)' }}>ORDER #{shortId}</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-sm mx-auto px-4 pt-6 space-y-5">

        {/* ── Estimated time countdown ── */}
        {minsLeft !== null && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 20 }}
            className="relative rounded-2xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.14),rgba(234,88,12,0.08),rgba(14,7,0,0.97))', border: '1px solid rgba(245,158,11,0.35)', boxShadow: '0 0 40px rgba(245,158,11,0.10)' }}
          >
            <div className="absolute top-0 left-8 right-8 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(245,158,11,0.6),transparent)' }} />
            <div className="px-5 py-4 flex items-center gap-4">
              <motion.div
                animate={minsLeft > 0 ? { rotate: [0, -8, 8, -8, 0] } : {}}
                transition={{ repeat: Infinity, duration: 2.5, repeatDelay: 1 }}
                className="text-4xl select-none"
              >
                {minsLeft === 0 ? '🎉' : '⏱️'}
              </motion.div>
              <div className="flex-1 min-w-0">
                {minsLeft === 0 ? (
                  <>
                    <p className="font-black text-base leading-tight"
                      style={{ background: 'linear-gradient(135deg,#fbbf24,#ea580c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                      Should be ready now!
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(245,158,11,0.55)' }}>Head to the counter to collect your order</p>
                  </>
                ) : (
                  <>
                    <p className="text-[10px] font-black tracking-[0.18em] uppercase mb-0.5" style={{ color: 'rgba(245,158,11,0.55)' }}>Estimated Ready In</p>
                    <p className="font-black leading-none" style={{ fontSize: '2.2rem', background: 'linear-gradient(135deg,#fbbf24,#ea580c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                      {minsLeft} <span style={{ fontSize: '1rem' }}>min{minsLeft !== 1 ? 's' : ''}</span>
                    </p>
                  </>
                )}
              </div>
              {minsLeft > 0 && (
                <div className="text-right flex-shrink-0">
                  <p className="text-[9px] font-black tracking-widest uppercase" style={{ color: 'rgba(245,158,11,0.4)' }}>Est. time</p>
                  <p className="text-xs font-bold" style={{ color: 'rgba(245,158,11,0.55)' }}>{order?.estimatedMinutes} min total</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Live status tracker ── */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 }}
          className="rounded-2xl p-5" style={CARD}>
          <div className="flex items-center justify-between mb-5">
            <p className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color:'rgba(245,158,11,0.65)' }}>Order Status</p>
            <AnimatePresence>
              {status !== 'ready' && (
                <motion.span initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                  className="text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full flex items-center gap-1.5"
                  style={{ background:'rgba(16,185,129,0.12)', color:'#34d399', border:'1px solid rgba(52,211,153,0.28)' }}>
                  <motion.span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"
                    animate={{ opacity:[1,0.15,1] }} transition={{ repeat:Infinity, duration:1 }} />
                  LIVE
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center">
            {STATUS_STEPS.map((step, idx) => {
              const done    = idx <= currentStep;
              const current = idx === currentStep;
              return (
                <React.Fragment key={step.key}>
                  <div className="flex flex-col items-center gap-1.5 flex-1">
                    <motion.div
                      animate={current ? { boxShadow:['0 0 0 rgba(245,158,11,0)','0 0 18px rgba(245,158,11,0.5)','0 0 0 rgba(245,158,11,0)'] } : {}}
                      transition={{ repeat:Infinity, duration:1.8 }}
                      className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-500"
                      style={done
                        ? { background:'linear-gradient(135deg,#fbbf24,#ea580c)', borderColor:'transparent', color:'#060400', boxShadow:'0 4px 16px rgba(245,158,11,0.40)' }
                        : { background:'rgba(255,255,255,0.03)', borderColor:'rgba(50,25,0,0.8)', color:'rgba(156,138,114,0.5)' }}
                    >
                      {step.icon}
                    </motion.div>
                    <span className="text-[9px] font-bold text-center leading-tight" style={{ color: done ? '#fbbf24' : 'rgba(156,138,114,0.4)' }}>
                      {step.label}
                    </span>
                  </div>
                  {idx < STATUS_STEPS.length - 1 && (
                    <div className="h-0.5 w-10 mx-1 rounded overflow-hidden flex-shrink-0" style={{ background:'rgba(50,25,0,0.8)' }}>
                      <motion.div className="h-full rounded"
                        style={{ background:'linear-gradient(90deg,#fbbf24,#ea580c)' }}
                        initial={{ width:0 }}
                        animate={{ width: idx < currentStep ? '100%' : '0%' }}
                        transition={{ duration:0.7, ease:'easeOut' }} />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <motion.p key={status} initial={{ opacity:0 }} animate={{ opacity:1 }}
            className="text-center text-xs mt-4" style={{ color:'rgba(245,158,11,0.6)' }}>
            {STATUS_STEPS[currentStep]?.desc ?? ''}
          </motion.p>

          {isReady && (
            <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }}
              transition={{ type:'spring', stiffness:300, damping:18 }}
              className="mt-4 rounded-xl px-4 py-3 text-center"
              style={{ background:'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(16,185,129,0.08))', border:'1px solid rgba(52,211,153,0.30)' }}>
              <p className="text-green-400 font-black text-sm">Your order is ready! 🎉</p>
              <p className="text-xs mt-0.5" style={{ color:'rgba(52,211,153,0.65)' }}>Come to the counter to collect</p>
            </motion.div>
          )}
        </motion.div>

        {/* ── Stamp earned banner ── */}
        {customer && (
          <motion.div
            initial={{ scale:0.88, opacity:0 }} animate={{ scale:1, opacity:1 }}
            transition={{ delay:0.5, type:'spring', stiffness:280, damping:22 }}
            className="rounded-2xl px-4 py-3 flex items-center gap-3"
            style={{ background:'linear-gradient(135deg,rgba(245,158,11,0.16),rgba(234,88,12,0.08))', border:'1px solid rgba(245,158,11,0.28)' }}>
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-black text-sm"
                style={{ background:'linear-gradient(135deg,#fbbf24,#ea580c)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                {customer.freeOrderEligible ? 'FREE ORDER UNLOCKED!' : 'Stamp Earned!'}
              </p>
              <p className="text-xs" style={{ color:'rgba(156,138,114,0.8)' }}>
                {customer.freeOrderEligible
                  ? 'Your next kebab is on us 🥙'
                  : `${stampCount}/5 — ${5 - stampCount} more for a FREE order`}
              </p>
            </div>
          </motion.div>
        )}

        {/* ── Loyalty card ── */}
        {customer && (
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.6 }}>
            <LoyaltyCard stamps={stampCount} freeOrderEligible={customer.freeOrderEligible ?? false} />
          </motion.div>
        )}

        {/* ── Order summary ── */}
        {(items.length > 0 || orderTotal != null) && (
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35 }}
            className="rounded-2xl overflow-hidden" style={CARD}>
            <div className="px-5 pt-4 pb-2" style={{ borderBottom:'1px solid rgba(50,25,0,0.7)' }}>
              <p className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color:'rgba(245,158,11,0.65)' }}>Your Order</p>
            </div>
            {items.length > 0 && items.map((item, i) => (
              <div key={i} className="flex justify-between px-5 py-2.5 text-sm" style={{ borderBottom:'1px solid rgba(35,18,0,0.6)' }}>
                <span style={{ color:'rgba(255,255,255,0.9)' }}>
                  {item.displayName ?? item.name}{item.qty > 1 ? ` ×${item.qty}` : ''}
                </span>
                <span className="text-muted">${((item.price ?? 0) * (item.qty ?? 1)).toFixed(2)}</span>
              </div>
            ))}
            {orderTotal != null && (
              <div className="flex justify-between items-center px-5 py-4">
                <span className="text-white font-black">Total</span>
                <span className="font-black text-xl"
                  style={{ background:'linear-gradient(135deg,#fbbf24,#ea580c)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                  ${orderTotal.toFixed(2)}
                </span>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Back to menu ── */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.7 }} className="text-center pb-4">
          <motion.button onClick={() => navigate('/')}
            whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
            className="font-black text-sm tracking-widest uppercase px-8 py-3 rounded-xl"
            style={{ background:'rgba(245,158,11,0.10)', border:'1px solid rgba(245,158,11,0.25)', color:'#fbbf24' }}>
            BACK TO MENU →
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
