import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function CartBar() {
  const { itemCount, total } = useCart();
  const navigate = useNavigate();

  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pointer-events-none">
      <button
        onClick={() => navigate('/cart')}
        className="w-full max-w-2xl mx-auto flex items-center justify-between bg-amber-500 hover:bg-amber-400 text-[#111111] font-extrabold py-4 px-6 rounded-2xl shadow-2xl shadow-amber-500/30 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] pointer-events-auto"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-[#111111]/20 rounded-full flex items-center justify-center text-sm font-bold">
            {itemCount}
          </div>
          <span className="text-base">View Order</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base">${total.toFixed(2)}</span>
          <ShoppingBag size={18} />
        </div>
      </button>
    </div>
  );
}
