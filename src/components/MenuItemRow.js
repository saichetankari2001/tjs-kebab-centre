import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

const itemVariant = {
  hidden:  { opacity: 0, y: 18, scale: 0.98 },
  visible: { opacity: 1, y: 0,  scale: 1,   transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

export default function MenuItemRow({ item, onAdd }) {
  const displayPrice = item.saladPrice ?? item.price;

  return (
    <motion.div
      variants={itemVariant}
      whileHover={{ backgroundColor: 'rgba(245,158,11,0.07)', x: 2 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className="flex items-center gap-4 py-4 px-4 border-b last:border-0 cursor-pointer group relative"
      style={{ borderColor: 'rgba(245,158,11,0.08)' }}
      onClick={() => onAdd(item)}
    >
      {/* Amber left accent on hover */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-0.5 bg-brand rounded-full"
        initial={{ scaleY: 0, opacity: 0 }}
        whileHover={{ scaleY: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
      />
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
        <span className="text-gradient-brand font-black text-base">
          {item.itemType === 'bowl' ? `from $${displayPrice}` : `$${Number(displayPrice).toFixed(2)}`}
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
