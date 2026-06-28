import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import LoyaltyCard from '../components/LoyaltyCard';

const STATUS_STEPS = [
  { key: 'pending',   label: 'Order Placed', icon: '✓'   },
  { key: 'preparing', label: 'Preparing',    icon: '👨‍🍳' },
  { key: 'ready',     label: 'Ready for Pickup', icon: '📦' },
];

const STATUS_ORDER = ['pending', 'preparing', 'ready'];

export default function OrderConfirmationPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { orderId: paramOrderId } = useParams();
  const { user, customer } = useAuth();

  const stateOrderId    = location.state?.orderId;
  const customerName    = location.state?.customerName;
  const total           = location.state?.total;
  const legacyOrderRef  = location.state?.orderRef;

  const orderId = paramOrderId || stateOrderId;

  const [status, setStatus]     = useState('pending');
  const [order,  setOrder]      = useState(null);

  // Real-time listener on Firestore order doc
  useEffect(() => {
    if (!orderId) return;
    const ref  = doc(db, 'orders', orderId);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setStatus(data.status ?? 'pending');
        setOrder(data);
      }
    });
    return unsub;
  }, [orderId]);

  const currentStep = STATUS_ORDER.indexOf(status);

  // Fallback: no orderId means we can't show anything useful
  if (!orderId && !legacyOrderRef) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <button
          onClick={() => navigate('/')}
          className="text-brand font-bold underline"
        >
          Back to Menu
        </button>
      </div>
    );
  }

  // Use Firestore items if available, otherwise fall back to location.state.items
  const items     = order?.items  ?? location.state?.items  ?? [];
  const orderTotal = order?.total ?? total;
  const displayName = customerName || order?.customerName || order?.customer?.firstName;

  // Short display ID: last 6 chars of Firestore doc id
  const shortId = orderId
    ? orderId.slice(-6).toUpperCase()
    : legacyOrderRef?.toString().toUpperCase() ?? '——';

  // Loyalty stamp placeholder — Plan 2 will wire up real logic
  // For now we display "Order 1 of 5 for your FREE kebab!"

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center px-4 py-10 gap-7 text-center animate-fadeIn">

      {/* Kebab icon */}
      <div className="w-24 h-24 rounded-full bg-brand/10 border-2 border-brand/20 flex items-center justify-center text-5xl animate-slideUp">
        🥙
      </div>

      {/* Heading */}
      <div className="space-y-1.5 animate-slideUp">
        <h1 className="font-display text-5xl text-white tracking-wider">
          ORDER PLACED!
        </h1>
        <p className="text-muted text-sm">
          {displayName ? `Thanks ${displayName}!` : 'Thank you!'}{' '}
          We'll have it ready for pickup soon.
        </p>
        <p className="text-muted text-xs font-mono">Order #{shortId}</p>
      </div>

      {/* ── Status Tracker ── */}
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-5 animate-slideUp">
        <p className="text-[10px] font-black text-muted tracking-widest uppercase mb-5">
          Order Status
        </p>

        <div className="flex items-center justify-between">
          {STATUS_STEPS.map((step, idx) => {
            const done    = idx <= currentStep;
            const current = idx === currentStep;

            return (
              <React.Fragment key={step.key}>
                {/* Step dot + label */}
                <div className="flex flex-col items-center gap-1.5 min-w-0">
                  <div
                    className={[
                      'w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-500',
                      done
                        ? 'bg-brand border-brand text-surface'
                        : 'bg-card2 border-border text-muted',
                      current
                        ? 'ring-2 ring-brand/30 ring-offset-2 ring-offset-card'
                        : '',
                    ].join(' ')}
                  >
                    {step.icon}
                  </div>
                  <span
                    className={[
                      'text-[9px] font-bold leading-tight px-0.5',
                      done ? 'text-brand' : 'text-muted',
                    ].join(' ')}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connector line */}
                {idx < STATUS_STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 mx-2 bg-border rounded overflow-hidden">
                    <div
                      className={[
                        'h-full bg-brand rounded transition-all duration-700',
                        idx < currentStep ? 'w-full' : 'w-0',
                      ].join(' ')}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Live pill */}
        {status !== 'ready' && (
          <div className="mt-4 flex justify-center">
            <span className="bg-brand/10 text-brand border border-brand/30 rounded-full text-[10px] font-black px-3 py-0.5 tracking-widest uppercase">
              ● Live
            </span>
          </div>
        )}
      </div>

      {/* ── Order Summary ── */}
      {(items.length > 0 || orderTotal != null) && (
        <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-5 text-left animate-slideUp">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black text-muted tracking-widest uppercase">
              Your Order
            </p>
            <span className="bg-brand/10 text-brand border border-brand/20 rounded-full text-[10px] font-black px-2.5 py-0.5 tracking-widest uppercase">
              Pickup
            </span>
          </div>

          {items.length > 0 && (
            <div className="space-y-2 mb-4">
              {items.map((item, i) => (
                <div
                  key={i}
                  className="flex justify-between text-sm"
                >
                  <span className="text-white">
                    {item.displayName ?? item.name}
                    {item.qty > 1 && (
                      <span className="text-muted ml-1">×{item.qty}</span>
                    )}
                  </span>
                  <span className="text-muted tabular-nums">
                    ${(item.price * item.qty).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {orderTotal != null && (
            <div className="border-t border-border pt-3 flex justify-between items-center">
              <span className="text-muted text-xs font-bold uppercase tracking-wider">
                Total
              </span>
              <span className="text-brand font-black text-2xl">
                ${orderTotal.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Loyalty Stamps ── */}
      {user && customer ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="w-full max-w-sm"
        >
          <p className="text-[10px] font-black text-muted tracking-widest uppercase mb-3 text-center">
            Your Loyalty Progress
          </p>
          <LoyaltyCard stamps={customer.stamps} freeOrderEligible={customer.freeOrderEligible} />
        </motion.div>
      ) : (
        <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-5 animate-slideUp text-center">
          <p className="text-[10px] font-black text-muted tracking-widest uppercase mb-2">Loyalty Rewards</p>
          <p className="text-white text-sm font-semibold mb-1">Earn a free kebab!</p>
          <p className="text-muted text-xs mb-3">Create an account to track your stamps and get rewarded after 5 orders.</p>
          <a href="/signup" className="inline-block bg-brand text-surface font-black text-xs px-5 py-2.5 rounded-lg hover:bg-brand-lit transition-colors">
            Join Loyalty Programme →
          </a>
        </div>
      )}

      {/* ── Back to Menu ── */}
      <button
        onClick={() => navigate('/')}
        className="w-full max-w-sm bg-brand text-surface font-black text-sm py-4 rounded-xl hover:bg-brand-lit transition-colors active:scale-95 shadow shadow-brand/20 animate-slideUp"
      >
        BACK TO MENU
      </button>

    </div>
  );
}
