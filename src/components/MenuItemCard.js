import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import { useCart } from '../context/CartContext';
import ItemModal from './ItemModal';

export default function MenuItemCard({ item }) {
  const { cart } = useCart();
  const [modalOpen, setModalOpen] = useState(false);
  const qty = cart.filter(c => c.baseId === item.id).reduce((s, c) => s + c.qty, 0);

  return (
    <>
      <div
        onClick={() => setModalOpen(true)}
        className={cn(
          'relative bg-[#1C1C1E] rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 group',
          'border hover:border-amber-500/40 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30',
          qty > 0 ? 'border-amber-500/60' : 'border-[#2A2A2A]'
        )}
      >
        {/* Food photo */}
        {item.image ? (
          <div className="w-full aspect-video overflow-hidden">
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="w-full aspect-video bg-[#2A2A2A] flex items-center justify-center">
            <span className="text-4xl opacity-30">🥙</span>
          </div>
        )}

        {/* Popular badge */}
        {item.popular && (
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-amber-500 rounded-full text-[10px] font-bold text-[#111111] tracking-wide">
            ★ POPULAR
          </div>
        )}

        {/* Qty badge */}
        {qty > 0 && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-xs font-bold text-[#111111]">
            {qty}
          </div>
        )}

        {/* Card body */}
        <div className="p-4">
          <h3 className="text-white font-semibold text-sm leading-snug mb-1">{item.name}</h3>
          {item.description && (
            <p className="text-[#9CA3AF] text-xs leading-relaxed line-clamp-2 mb-3">
              {item.description}
            </p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-amber-500 font-bold text-base">${item.price.toFixed(2)}</span>
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
              qty > 0 ? 'bg-amber-500' : 'bg-[#2A2A2A] group-hover:bg-amber-500/20'
            )}>
              <Plus size={16} className={qty > 0 ? 'text-[#111111]' : 'text-amber-500'} />
            </div>
          </div>
        </div>
      </div>

      <ItemModal item={item} isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
