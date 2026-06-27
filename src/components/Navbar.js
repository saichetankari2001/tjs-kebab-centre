import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { itemCount } = useCart();
  const navigate = useNavigate();

  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-50 h-16 bg-card border-b border-border flex items-center justify-between px-5 md:px-8"
    >
      {/* Logo */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 focus:outline-none"
      >
        <span className="font-display text-2xl tracking-wide text-white leading-none">
          TJ'S <span className="text-brand">KEBAB</span>
        </span>
        <span className="hidden sm:block text-[10px] text-muted tracking-widest uppercase mt-0.5 font-medium">
          Centre
        </span>
      </button>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        <button
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
