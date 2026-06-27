import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function CartBar() {
  const { itemCount, total } = useCart();
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {itemCount > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2 pointer-events-none"
        >
          <button
            onClick={() => navigate('/cart')}
            className="pointer-events-auto w-full max-w-lg mx-auto flex items-center justify-between bg-brand text-surface font-extrabold text-sm px-5 py-4 rounded-2xl shadow-2xl shadow-brand/30 hover:bg-brand-lit transition-colors active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <span className="bg-surface/20 text-surface rounded-lg w-7 h-7 flex items-center justify-center font-black text-xs">
                {itemCount}
              </span>
              <span>View Order</span>
            </div>
            <div className="flex items-center gap-1">
              <span>${total.toFixed(2)}</span>
              <ChevronRight size={16} strokeWidth={3} />
            </div>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
