import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Phone, Mail, MessageSquare, Sparkles } from 'lucide-react';
import { collection, addDoc, setDoc, doc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useCart } from '../context/CartContext';
import { useAuth } from '../hooks/useAuth';
import PromoSignupBanner from '../components/PromoSignupBanner';

const PAYMENT_OPTIONS = [
  { id: 'cash',   label: 'Cash at Counter', icon: '💵', sub: 'Pay when you pick up your order' },
  { id: 'card',   label: 'Card at Counter', icon: '💳', sub: 'Tap or swipe when you arrive'    },
  { id: 'online', label: 'Pay Online',       icon: '📱', sub: 'Stripe payment — coming soon', disabled: true },
];

const CARD = {
  background: 'rgba(14,7,0,0.97)',
  border: '1px solid rgba(50,25,0,0.9)',
  boxShadow: '0 4px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(245,158,11,0.05)',
};

function SectionTitle({ title, icon }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {icon && <span className="text-brand/60">{icon}</span>}
      <h2 className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: 'rgba(245,158,11,0.65)' }}>{title}</h2>
    </div>
  );
}

function Field({ error, children }) {
  return (
    <div>
      {children}
      {error && <p className="text-red-400 text-xs mt-0.5 px-1">{error}</p>}
    </div>
  );
}

export default function CheckoutPage() {
  const { cart, total, itemCount, clearCart } = useCart();
  const { user, customer } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: customer?.firstName ?? '',
    lastName:  customer?.lastName  ?? '',
    phone:     customer?.phone     ?? '',
    email:     user?.email         ?? '',
    note: '',
  });
  const [payment,    setPayment]    = useState('cash');
  const [promoEmail, setPromoEmail] = useState('');
  const [promoSMS,   setPromoSMS]   = useState('');
  const [optEmail,   setOptEmail]   = useState(false);
  const [optSMS,     setOptSMS]     = useState(false);
  const [optPush,    setOptPush]    = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors,     setErrors]     = useState({});

  const set = (k) => (e) => {
    setForm((p) => ({ ...p, [k]: e.target.value }));
    setErrors((p) => ({ ...p, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'Required';
    if (!form.lastName.trim())  e.lastName  = 'Required';
    if (!form.phone.trim())     e.phone     = 'Required';
    if (form.email.trim() && !/\S+@\S+\.\S+/.test(form.email))
      e.email = 'Invalid email';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      const orderRef = await addDoc(collection(db, 'orders'), {
        customerId: user?.uid ?? null,
        customer: {
          firstName: form.firstName.trim(),
          lastName:  form.lastName.trim(),
          phone:     form.phone.trim(),
          email:     form.email.trim() || null,
        },
        customerName:  `${form.firstName.trim()} ${form.lastName.trim()}`,
        customerPhone: form.phone.trim(),
        customerEmail: form.email.trim() || null,
        items: cart.map((item) => ({
          name:           item.displayName ?? item.name,
          price:          item.price,
          qty:            item.qty,
          customisations: item.customisations ?? {},
        })),
        total,
        itemCount,
        payment,
        specialNote: form.note.trim() || null,
        status:      'pending',
        isPickup:    true,
        orderType:   'pickup',
        createdAt:   serverTimestamp(),
        promoConsent: { email: optEmail, sms: optSMS, push: optPush },
        promoContact: {
          email: optEmail ? (promoEmail || form.email.trim() || null) : null,
          phone: optSMS   ? promoSMS : null,
        },
      });
      clearCart();

      if (user?.uid) {
        const customerRef = doc(db, 'customers', user.uid);
        const newStamps = (customer?.stamps ?? 0) + 1;
        const stampUpdate = newStamps >= 5
          ? { stamps: 0, totalOrders: increment(1), freeOrderEligible: true }
          : { stamps: increment(1), totalOrders: increment(1) };
        setDoc(customerRef, stampUpdate, { merge: true })
          .catch(err => console.warn('Stamp update failed:', err.message));
      }

      if (form.email.trim()) {
        fetch(`${process.env.REACT_APP_API_URL ?? 'https://tjs-kebab-centre-production.up.railway.app'}/api/notify/order-confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to:        form.email.trim(),
            firstName: form.firstName.trim(),
            orderId:   orderRef.id,
            items:     cart.map((i) => ({ name: i.displayName ?? i.name, price: i.price, qty: i.qty })),
            total,
            phone: form.phone.trim() || null,
          }),
        }).catch(() => {});
      }

      navigate(`/order-confirmation/${orderRef.id}`, {
        state: { orderId: orderRef.id, customerName: form.firstName.trim(), total },
      });
    } catch (err) {
      console.error('Order failed:', err);
      alert('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (itemCount === 0) { navigate('/'); return null; }

  const iStyle = (err) => ({
    background: 'rgba(255,255,255,0.03)',
    border: `1px solid ${err ? 'rgba(239,68,68,0.5)' : 'rgba(50,25,0,0.9)'}`,
    borderRadius: '12px',
    padding: '12px 16px',
    color: 'white',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
    transition: 'border-color 0.2s',
  });

  const onFocus  = (e) => { e.target.style.borderColor = 'rgba(245,158,11,0.5)'; };
  const onBlurFn = (err) => (e) => { e.target.style.borderColor = err ? 'rgba(239,68,68,0.5)' : 'rgba(50,25,0,0.9)'; };

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onSubmit={handleSubmit}
      className="min-h-screen pb-32"
    >
      <PromoSignupBanner />

      {/* ── Cinematic header ── */}
      <motion.div
        initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }}
        className="sticky top-0 z-30 backdrop-blur flex items-center gap-3 px-4 h-14"
        style={{ background: 'rgba(6,4,0,0.97)', borderBottom: '1px solid rgba(245,158,11,0.14)' }}
      >
        <button type="button" onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-brand transition-colors"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.12)' }}>
          <ArrowLeft size={16} />
        </button>
        <span className="font-display text-xl text-white flex-1 tracking-wide">CHECKOUT</span>
        <span className="text-[10px] font-black px-3 py-1 rounded-full tracking-widest uppercase"
          style={{ background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.22)', color: '#fbbf24' }}>
          PICKUP ONLY
        </span>
      </motion.div>

      <div className="max-w-lg mx-auto px-4 pt-5 space-y-4">

        {/* ── Customer details ── */}
        <motion.section initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }}
          className="rounded-2xl p-5" style={CARD}>
          <SectionTitle icon={<User size={13} />} title="Your Details" />
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Field error={errors.firstName}>
                <input value={form.firstName} onChange={set('firstName')} placeholder="First name"
                  style={iStyle(errors.firstName)} onFocus={onFocus} onBlur={onBlurFn(errors.firstName)} />
              </Field>
              <Field error={errors.lastName}>
                <input value={form.lastName} onChange={set('lastName')} placeholder="Last name"
                  style={iStyle(errors.lastName)} onFocus={onFocus} onBlur={onBlurFn(errors.lastName)} />
              </Field>
            </div>
            <Field error={errors.phone}>
              <div className="relative">
                <Phone size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color:'rgba(156,138,114,0.6)' }} />
                <input value={form.phone} onChange={set('phone')} placeholder="+61 4xx xxx xxx" type="tel"
                  style={{ ...iStyle(errors.phone), paddingLeft: '36px' }} onFocus={onFocus} onBlur={onBlurFn(errors.phone)} />
              </div>
            </Field>
            <Field error={errors.email}>
              <div className="relative">
                <Mail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color:'rgba(156,138,114,0.6)' }} />
                <input value={form.email} onChange={set('email')} placeholder="you@email.com (optional)" type="email"
                  style={{ ...iStyle(errors.email), paddingLeft: '36px' }} onFocus={onFocus} onBlur={onBlurFn(errors.email)} />
              </div>
            </Field>
            <Field>
              <div className="relative">
                <MessageSquare size={13} className="absolute left-3.5 top-3.5 pointer-events-none" style={{ color:'rgba(156,138,114,0.6)' }} />
                <textarea value={form.note} onChange={set('note')} placeholder="Allergies, extra requests..." rows={2}
                  style={{ ...iStyle(false), paddingLeft: '36px', resize: 'none' }} onFocus={onFocus} onBlur={onBlurFn(false)} />
              </div>
            </Field>
          </div>
        </motion.section>

        {/* ── Promo sign-up ── */}
        <motion.section initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.10 }}
          className="rounded-2xl p-4"
          style={{ background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.18)', boxShadow: CARD.boxShadow }}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={15} className="text-brand" />
            <div>
              <p className="text-white font-bold text-sm">Get exclusive deals &amp; promo codes</p>
              <p className="text-xs" style={{ color:'rgba(156,138,114,0.8)' }}>Sign up for TJ's specials, discounts &amp; new menu alerts</p>
            </div>
          </div>
          <div className="flex gap-2 mb-3 flex-wrap">
            {[['email','📧','Email',optEmail,setOptEmail],['sms','💬','SMS',optSMS,setOptSMS],['push','🔔','Push',optPush,setOptPush]].map(([id,ic,label,val,setter]) => (
              <label key={id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer text-xs font-semibold transition-all"
                style={val ? { border:'1px solid rgba(245,158,11,0.6)', color:'#fbbf24', background:'rgba(245,158,11,0.12)' }
                           : { border:'1px solid rgba(50,25,0,0.8)', color:'#9c8a72', background:'rgba(255,255,255,0.02)' }}>
                <input type="checkbox" className="hidden" checked={val} onChange={(e) => setter(e.target.checked)} />
                {ic} {label}
              </label>
            ))}
          </div>
          {(optEmail || optSMS) && (
            <div className="space-y-2">
              {optEmail && <input type="email" value={promoEmail} onChange={(e) => setPromoEmail(e.target.value)}
                placeholder={`Email${form.email ? ` (using ${form.email})` : ''}`}
                style={{ ...iStyle(false), fontSize:'13px' }} onFocus={onFocus} onBlur={onBlurFn(false)} />}
              {optSMS && <input type="tel" value={promoSMS} onChange={(e) => setPromoSMS(e.target.value)}
                placeholder="+61 4xx xxx xxx"
                style={{ ...iStyle(false), fontSize:'13px' }} onFocus={onFocus} onBlur={onBlurFn(false)} />}
            </div>
          )}
        </motion.section>

        {/* ── Payment method ── */}
        <motion.section initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}
          className="rounded-2xl p-5" style={CARD}>
          <SectionTitle title="Payment Method" />
          <div className="space-y-2">
            {PAYMENT_OPTIONS.map((opt) => (
              <button key={opt.id} type="button" disabled={opt.disabled}
                onClick={() => !opt.disabled && setPayment(opt.id)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={payment === opt.id
                  ? { border:'1px solid rgba(245,158,11,0.50)', background:'rgba(245,158,11,0.08)' }
                  : { border:'1px solid rgba(50,25,0,0.8)', background:'rgba(255,255,255,0.02)' }}>
                <span className="text-xl w-7 text-center">{opt.icon}</span>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">{opt.label}</p>
                  <p className="text-muted text-xs">{opt.sub}</p>
                </div>
                <div className="w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all"
                  style={payment === opt.id ? { borderColor:'#f59e0b', background:'#f59e0b' } : { borderColor:'rgba(100,70,40,0.8)' }} />
              </button>
            ))}
          </div>
        </motion.section>

        {/* ── Order summary ── */}
        <motion.section initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.20 }}
          className="rounded-2xl overflow-hidden" style={CARD}>
          <div className="px-5 pt-4 pb-2 flex items-center justify-between" style={{ borderBottom:'1px solid rgba(50,25,0,0.7)' }}>
            <p className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color:'rgba(245,158,11,0.65)' }}>Order Summary</p>
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full tracking-widest uppercase"
              style={{ background:'rgba(245,158,11,0.10)', border:'1px solid rgba(245,158,11,0.20)', color:'#fbbf24' }}>
              Pickup
            </span>
          </div>
          {cart.map((item, i) => (
            <div key={i} className="flex justify-between px-5 py-2.5 text-sm" style={{ borderBottom:'1px solid rgba(35,18,0,0.6)' }}>
              <span style={{ color:'rgba(255,255,255,0.9)' }}>{item.displayName ?? item.name}{item.qty > 1 && ` ×${item.qty}`}</span>
              <span className="text-muted">${(item.price * item.qty).toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between items-center px-5 py-4">
            <span className="text-white font-black text-base">Total</span>
            <span className="font-black text-xl"
              style={{ background:'linear-gradient(135deg,#fbbf24,#ea580c)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
              ${total.toFixed(2)}
            </span>
          </div>
        </motion.section>
      </div>

      {/* ── Fixed CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 backdrop-blur"
        style={{ background:'rgba(6,4,0,0.97)', borderTop:'1px solid rgba(245,158,11,0.12)' }}>
        <motion.button type="submit" disabled={submitting}
          whileHover={{ scale: submitting ? 1 : 1.02, boxShadow:'0 0 40px rgba(245,158,11,0.5)' }}
          whileTap={{ scale: 0.97 }}
          className="relative w-full overflow-hidden font-black text-sm tracking-widest uppercase py-4 rounded-xl disabled:opacity-60 flex items-center justify-between px-6"
          style={{ background:'linear-gradient(135deg,#fbbf24,#f59e0b,#ea580c)', color:'#060400' }}>
          <motion.div className="absolute inset-0 pointer-events-none"
            style={{ background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent)' }}
            animate={{ x:['-100%','220%'] }}
            transition={{ duration:1.6, repeat:Infinity, repeatDelay:2.5, ease:'easeInOut' }} />
          <span>{submitting ? 'Placing Order...' : 'PLACE ORDER'}</span>
          {!submitting && <span>${total.toFixed(2)} →</span>}
        </motion.button>
      </div>
    </motion.form>
  );
}
