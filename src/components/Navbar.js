import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const { itemCount } = useCart();
  const { user, customer } = useAuth();
  const navigate = useNavigate();

  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-50 h-16 flex items-center justify-between px-5 md:px-8"
      style={{
        background: 'linear-gradient(180deg, rgba(6,4,0,0.98) 0%, rgba(10,6,0,0.96) 100%)',
        borderBottom: '1px solid rgba(245,158,11,0.15)',
        boxShadow: '0 1px 0 rgba(245,158,11,0.08), 0 4px 24px rgba(0,0,0,0.6)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <button onClick={() => navigate('/')} className="flex items-center gap-2 focus:outline-none">
        <span className="font-display text-2xl tracking-wide text-white leading-none">
          TJ'S <span className="text-brand">KEBAB</span>
        </span>
        <span className="hidden sm:block text-[10px] text-muted tracking-widest uppercase mt-0.5 font-medium">
          Centre
        </span>
      </button>

      <div className="flex items-center gap-2">
        <Link
          to="/gallery"
          className="text-muted hover:text-brand text-xs font-semibold transition-colors px-2 py-1 hidden sm:block"
        >
          Gallery
        </Link>

        {user ? (
          <Link
            to="/account"
            className="flex items-center gap-1.5 text-muted hover:text-white text-xs font-semibold transition-colors px-2 py-1"
          >
            <User size={14} />
            <span className="hidden sm:inline">{customer?.firstName ?? 'Account'}</span>
            {(customer?.stamps ?? 0) > 0 && (
              <span className="bg-brand text-surface text-[9px] font-black px-1.5 py-0.5 rounded-full">
                {customer.stamps}/5
              </span>
            )}
          </Link>
        ) : (
          <Link
            to="/login"
            className="text-muted hover:text-white text-xs font-semibold transition-colors px-2 py-1 hidden sm:block"
          >
            Sign In
          </Link>
        )}

        <button
          data-cart-btn
          onClick={() => navigate('/cart')}
          className="relative flex items-center gap-2 bg-brand text-surface px-4 py-2 rounded-lg font-bold text-sm hover:bg-brand-lit transition-colors active:scale-95"
        >
          <ShoppingBag size={16} strokeWidth={2.5} />
          <span className="hidden sm:inline">Order</span>
          {itemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-white text-surface text-xs font-black w-5 h-5 rounded-full flex items-center justify-center shadow">
              {itemCount > 9 ? '9+' : itemCount}
            </span>
          )}
        </button>
      </div>
    </motion.header>
  );
}
