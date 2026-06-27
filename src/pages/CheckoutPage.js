import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Mail, MessageSquare, Sparkles } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useCart } from '../context/CartContext';
import { useAuth } from '../hooks/useAuth';
import PromoSignupBanner from '../components/PromoSignupBanner';

const PAYMENT_OPTIONS = [
  { id: 'cash',   label: 'Cash at Counter', icon: '💵', sub: 'Pay when you pick up your order' },
  { id: 'card',   label: 'Card at Counter', icon: '💳', sub: 'Tap or swipe when you arrive'    },
  { id: 'online', label: 'Pay Online',       icon: '📱', sub: 'Stripe payment — coming soon', disabled: true },
];

const inputCls = (err) =>
  `w-full bg-card border ${err ? 'border-red-500' : 'border-border'} rounded-xl px-4 py-3 text-sm text-white placeholder-muted outline-none focus:border-brand/50 transition-colors`;

function SectionTitle({ title, icon }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {icon && <span className="text-muted">{icon}</span>}
      <h2 className="text-xs font-black text-muted tracking-widest uppercase">{title}</h2>
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

      // Fire-and-forget — never block navigation on notification failure
      if (form.email.trim()) {
        fetch(`${process.env.REACT_APP_API_URL ?? 'http://localhost:4000'}/api/notify/order-confirm`, {
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
        state: {
          orderId:      orderRef.id,
          customerName: form.firstName.trim(),
          total,
        },
      });
    } catch (err) {
      console.error('Order failed:', err);
      alert('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (itemCount === 0) {
    navigate('/');
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="min-h-screen bg-surface pb-32">
      {/* Promo banner */}
      <PromoSignupBanner />

      {/* Header */}
      <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur border-b border-border flex items-center gap-3 px-4 h-14">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-full bg-card2 flex items-center justify-center text-muted hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <span className="font-bold text-white text-base flex-1">Checkout</span>
        <span className="bg-brand/20 text-brand text-xs font-black px-3 py-1 rounded-full tracking-wider uppercase">
          PICKUP
        </span>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 space-y-5">

        {/* Customer details */}
        <section>
          <SectionTitle icon={<User size={14} />} title="Your Details" />
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Field error={errors.firstName}>
                <input
                  value={form.firstName}
                  onChange={set('firstName')}
                  placeholder="First name"
                  className={inputCls(errors.firstName)}
                />
              </Field>
              <Field error={errors.lastName}>
                <input
                  value={form.lastName}
                  onChange={set('lastName')}
                  placeholder="Last name"
                  className={inputCls(errors.lastName)}
                />
              </Field>
            </div>
            <Field error={errors.phone}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                  <Phone size={13} />
                </span>
                <input
                  value={form.phone}
                  onChange={set('phone')}
                  placeholder="+61 4xx xxx xxx"
                  type="tel"
                  className={`${inputCls(errors.phone)} pl-9`}
                />
              </div>
            </Field>
            <Field error={errors.email}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                  <Mail size={13} />
                </span>
                <input
                  value={form.email}
                  onChange={set('email')}
                  placeholder="you@email.com (optional)"
                  type="email"
                  className={`${inputCls(errors.email)} pl-9`}
                />
              </div>
            </Field>
            <Field>
              <div className="relative">
                <span className="absolute left-3 top-3.5 text-muted">
                  <MessageSquare size={13} />
                </span>
                <textarea
                  value={form.note}
                  onChange={set('note')}
                  placeholder="Allergies, extra requests..."
                  rows={2}
                  className={`${inputCls()} pl-9 resize-none`}
                />
              </div>
            </Field>
          </div>
        </section>

        {/* Promo sign-up section */}
        <section className="bg-brand/5 border border-brand/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-brand" />
            <div>
              <p className="text-white font-bold text-sm">Get exclusive deals &amp; promo codes</p>
              <p className="text-muted text-xs">Sign up to receive TJ's specials, discounts &amp; new menu alerts</p>
            </div>
          </div>
          <div className="flex gap-3 mb-3 flex-wrap">
            {[
              ['email', '📧', 'Email',       optEmail, setOptEmail],
              ['sms',   '💬', 'SMS',          optSMS,   setOptSMS  ],
              ['push',  '🔔', 'Push alerts', optPush,  setOptPush ],
            ].map(([id, ic, label, val, setter]) => (
              <label
                key={id}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-xs font-semibold transition-all ${
                  val
                    ? 'border-brand text-brand bg-brand/10'
                    : 'border-border text-muted hover:border-brand/40'
                }`}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={val}
                  onChange={(e) => setter(e.target.checked)}
                />
                {ic} {label}
              </label>
            ))}
          </div>
          {(optEmail || optSMS) && (
            <div className="space-y-2">
              {optEmail && (
                <input
                  type="email"
                  value={promoEmail}
                  onChange={(e) => setPromoEmail(e.target.value)}
                  placeholder={`Email${form.email ? ` (using ${form.email})` : ''}`}
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-muted outline-none focus:border-brand/50 transition-colors"
                />
              )}
              {optSMS && (
                <input
                  type="tel"
                  value={promoSMS}
                  onChange={(e) => setPromoSMS(e.target.value)}
                  placeholder="+61 4xx xxx xxx"
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-muted outline-none focus:border-brand/50 transition-colors"
                />
              )}
            </div>
          )}
        </section>

        {/* Payment method */}
        <section>
          <SectionTitle title="Payment Method" />
          <div className="space-y-2">
            {PAYMENT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                disabled={opt.disabled}
                onClick={() => !opt.disabled && setPayment(opt.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                  payment === opt.id ? 'border-brand bg-brand/5' : 'border-border bg-card'
                } ${opt.disabled ? 'opacity-40 cursor-not-allowed' : 'hover:border-brand/40'}`}
              >
                <span className="text-xl w-6 text-center">{opt.icon}</span>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">{opt.label}</p>
                  <p className="text-muted text-xs">{opt.sub}</p>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border-2 transition-colors flex-shrink-0 ${
                    payment === opt.id ? 'border-brand bg-brand' : 'border-muted'
                  }`}
                />
              </button>
            ))}
          </div>
        </section>

        {/* Order summary */}
        <section className="bg-card border border-border rounded-xl overflow-hidden">
          <p className="text-xs font-bold text-muted tracking-wider uppercase px-4 pt-3 pb-2 border-b border-border">
            Order Summary
          </p>
          {cart.map((item, i) => (
            <div
              key={i}
              className="flex justify-between px-4 py-2 text-sm border-b border-border last:border-0"
            >
              <span className="text-white">
                {item.displayName ?? item.name}
                {item.qty > 1 && ` ×${item.qty}`}
              </span>
              <span className="text-muted">${(item.price * item.qty).toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between px-4 py-3 font-black">
            <span className="text-white">Total</span>
            <span className="text-brand text-lg">${total.toFixed(2)}</span>
          </div>
        </section>
      </div>

      {/* Submit CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-5 pt-3 bg-surface/95 backdrop-blur border-t border-border">
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand text-surface font-black text-sm py-4 rounded-xl flex items-center justify-between px-6 hover:bg-brand-lit transition-colors active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow shadow-brand/20"
        >
          <span>{submitting ? 'Placing Order...' : 'Place Order'}</span>
          {!submitting && <span>${total.toFixed(2)} →</span>}
        </button>
      </div>
    </form>
  );
}
