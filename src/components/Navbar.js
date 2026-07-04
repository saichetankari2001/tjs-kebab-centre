import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, User } from 'lucide-react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const { itemCount } = useCart();
  const { user, customer } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Scroll progress bar
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });

  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-50 h-16 flex items-center justify-between px-5 md:px-8"
      style={{
        background: scrolled
          ? 'rgba(4,2,0,0.97)'
          : 'linear-gradient(180deg, rgba(6,4,0,0.98) 0%, rgba(10,6,0,0.96) 100%)',
        borderBottom: scrolled ? '1px solid rgba(245,158,11,0.22)' : '1px solid rgba(245,158,11,0.12)',
        boxShadow: scrolled
          ? '0 1px 0 rgba(245,158,11,0.12), 0 8px 40px rgba(0,0,0,0.7)'
          : '0 1px 0 rgba(245,158,11,0.06), 0 4px 24px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(18px)',
        transition: 'background 0.3s, border-color 0.3s, box-shadow 0.3s',
      }}
    >
      {/* Scroll progress line */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[2px] origin-left pointer-events-none"
        style={{
          scaleX,
          background: 'linear-gradient(90deg, #fbbf24, #f59e0b, #ea580c)',
        }}
      />

      <button onClick={() => navigate('/')} className="flex items-center gap-2 focus:outline-none group">
        <span className="font-display text-2xl tracking-wide text-white leading-none transition-all">
          TJ'S{' '}
          <span
            className="text-brand"
            style={{ textShadow: scrolled ? '0 0 20px rgba(245,158,11,0.5)' : 'none', transition: 'text-shadow 0.3s' }}
          >
            KEBAB
          </span>
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

        <motion.button
          data-cart-btn
          onClick={() => navigate('/cart')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.93 }}
          className="relative flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm text-surface transition-all"
          style={{
            background: 'linear-gradient(135deg,#fbbf24,#ea580c)',
            boxShadow: '0 0 24px rgba(245,158,11,0.35)',
          }}
        >
          <ShoppingBag size={16} strokeWidth={2.5} />
          <span className="hidden sm:inline">Order</span>
          {itemCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 bg-white text-surface text-xs font-black w-5 h-5 rounded-full flex items-center justify-center shadow"
            >
              {itemCount > 9 ? '9+' : itemCount}
            </motion.span>
          )}
        </motion.button>
      </div>
    </motion.header>
  );
}
