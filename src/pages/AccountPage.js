import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, ShoppingBag } from 'lucide-react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import LoyaltyCard from '../components/LoyaltyCard';

const STATUS_LABEL = {
  pending:   { label: 'Received',  color: 'text-blue-400'  },
  preparing: { label: 'Preparing', color: 'text-amber-400' },
  ready:     { label: 'Ready',     color: 'text-green-400' },
};

export default function AccountPage() {
  const { user, customer, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [orders,        setOrders]        = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!user) { setOrdersLoading(false); return; }
    getDocs(
      query(
        collection(db, 'orders'),
        where('customerId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(10)
      )
    )
      .then((snap) => setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
      .catch(() => {})
      .finally(() => setOrdersLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-surface flex items-center justify-center">
        <div className="text-brand font-display text-xl tracking-wider animate-pulse">LOADING...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-surface flex flex-col items-center justify-center gap-5 px-4 text-center">
        <span className="text-6xl">🥙</span>
        <h2 className="font-display text-4xl text-white tracking-wide">JOIN THE LOYALTY PROGRAMME</h2>
        <p className="text-muted text-sm max-w-xs">Sign in or create an account to earn stamps and claim your free kebab!</p>
        <div className="flex gap-3">
          <Link to="/login"  className="bg-brand text-surface font-black text-sm px-6 py-3 rounded-xl hover:bg-brand-lit transition-colors">Sign In</Link>
          <Link to="/signup" className="bg-card border border-border text-white font-semibold text-sm px-6 py-3 rounded-xl hover:border-brand/40 transition-colors">Create Account</Link>
        </div>
        <div className="w-full max-w-sm mt-2">
          <LoyaltyCard stamps={0} />
        </div>
      </div>
    );
  }

  const handleSignOut = async () => { await signOut(); navigate('/'); };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pb-10"
      style={{ background: 'transparent' }}
    >
      {/* ── Cinematic profile header ── */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #1e0e00 0%, #120800 60%, #0d0600 100%)' }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 100% at 20% 50%, rgba(245,158,11,0.18) 0%, transparent 60%)' }} />
        <motion.img
          src="/images/chicken-doner-kebab.jpg"
          alt=""
          className="absolute right-0 top-0 h-full w-1/2 object-cover hidden md:block"
          style={{ filter: 'brightness(0.3)', maskImage: 'linear-gradient(to left, rgba(0,0,0,0.6), transparent)' }}
          initial={{ scale: 1.1 }} animate={{ scale: 1 }} transition={{ duration: 8 }}
        />
        <div className="relative px-5 py-7 max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.05, rotateZ: 5 }}
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.25),rgba(234,88,12,0.15))', border: '1px solid rgba(245,158,11,0.30)' }}
              >
                🥙
              </motion.div>
              <div>
                <p className="font-display text-2xl text-white tracking-wide">
                  {customer?.firstName ? customer.firstName.toUpperCase() : 'MY ACCOUNT'}
                </p>
                <p className="text-muted/80 text-xs">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-muted hover:text-brand text-xs font-semibold transition-colors px-3 py-2 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <LogOut size={12} />
              Sign out
            </button>
          </motion.div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-6">
        <section>
          <p className="text-xs font-black text-muted tracking-widest uppercase mb-3">My Stamps</p>
          <LoyaltyCard
            stamps={customer?.stamps ?? 0}
            freeOrderEligible={customer?.freeOrderEligible ?? false}
          />
        </section>

        <section>
          <p className="text-xs font-black text-muted tracking-widest uppercase mb-3">Recent Orders</p>
          {ordersLoading ? (
            <div className="text-muted text-sm text-center py-6">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <ShoppingBag size={28} className="text-muted mx-auto mb-2" />
              <p className="text-muted text-sm">No orders yet</p>
              <Link to="/" className="text-brand text-sm font-semibold hover:underline mt-1 block">Browse menu →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {orders.map((order) => {
                const statusInfo = STATUS_LABEL[order.status] ?? { label: order.status, color: 'text-muted' };
                const date = order.createdAt?.toDate?.()
                  ? order.createdAt.toDate().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
                  : 'Recent';
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 16, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.05 }}
                    whileHover={{ scale: 1.01, boxShadow: '0 4px 24px rgba(245,158,11,0.10)' }}
                    className="rounded-xl p-4"
                    style={{ background: 'rgba(26,13,0,0.95)', border: '1px solid rgba(58,32,0,0.9)' }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-muted text-xs">{date}</span>
                      <span className={`text-xs font-semibold ${statusInfo.color}`}>{statusInfo.label}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-white text-sm font-semibold">
                          {order.itemCount ?? order.items?.length ?? 1} item{(order.itemCount ?? order.items?.length ?? 1) !== 1 ? 's' : ''}
                        </p>
                        <p className="text-muted text-xs mt-0.5">
                          {order.items?.slice(0, 2).map((i) => i.name).join(', ')}
                          {order.items?.length > 2 ? ` +${order.items.length - 2} more` : ''}
                        </p>
                      </div>
                      <span className="text-brand font-black text-base">${order.total?.toFixed(2)}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </motion.div>
  );
}
