import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

const itemVariant = {
  hidden:  { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
};

export default function MenuItemRow({ item, onAdd }) {
  const displayPrice = item.saladPrice ?? item.price;

  return (
    <motion.div
      variants={itemVariant}
      whileHover={{ x: 3, backgroundColor: 'rgba(245,158,11,0.04)' }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="flex items-center gap-4 py-4 px-4 border-b border-border last:border-0 cursor-pointer transition-colors group"
      onClick={() => onAdd(item)}
    >
      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-semibold text-white text-sm leading-snug">{item.name}</span>
          {item.popular && (
            <span className="text-[9px] font-black tracking-wider bg-brand text-surface px-1.5 py-0.5 rounded uppercase">
              Popular
            </span>
          )}
        </div>
        {item.description && (
          <p className="text-muted text-xs leading-relaxed line-clamp-2">{item.description}</p>
        )}
        {/* Bowl hint */}
        {item.itemType === 'bowl' && (
          <p className="text-brand/70 text-[10px] mt-1 font-medium">
            Salad Bowl ${item.saladPrice} · Rice Bowl ${item.ricePrice}
          </p>
        )}
        {/* HSP hint */}
        {item.itemType === 'hsp' && item.sizePrices && (
          <p className="text-brand/70 text-[10px] mt-1 font-medium">
            S ${item.sizePrices.S} · M ${item.sizePrices.M} · L ${item.sizePrices.L} · XL ${item.sizePrices.XL}
          </p>
        )}
        {/* Chips hint */}
        {item.itemType === 'chips' && item.sizePrices && (
          <p className="text-brand/70 text-[10px] mt-1 font-medium">
            S ${item.sizePrices.S} · M ${item.sizePrices.M} · L ${item.sizePrices.L} · XL ${item.sizePrices.XL}
          </p>
        )}
      </div>

      {/* Price + Add */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <span className="text-brand font-bold text-base">
          {item.itemType === 'bowl' ? `from $${displayPrice}` : `$${displayPrice.toFixed(2)}`}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onAdd(item); }}
          className="w-8 h-8 rounded-full bg-brand text-surface flex items-center justify-center hover:bg-brand-lit transition-colors active:scale-90 shadow shadow-brand/20"
        >
          <Plus size={16} strokeWidth={3} />
        </button>
      </div>
    </motion.div>
  );
}
