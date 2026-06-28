import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

const itemVariant = {
  hidden:  { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] } },
};

export default function MenuItemRow({ item, onAdd, thumbnail }) {
  const displayPrice = item.saladPrice ?? item.price;

  return (
    <motion.div
      variants={itemVariant}
      whileHover={{ backgroundColor: 'rgba(245,158,11,0.06)' }}
      whileTap={{ scale: 0.987 }}
      className="flex items-center gap-3 py-3.5 px-4 border-b last:border-0 cursor-pointer group relative"
      style={{ borderColor: 'rgba(44,24,0,0.8)' }}
      onClick={() => onAdd(item)}
    >
      {/* Amber left accent */}
      <motion.div
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
        style={{ background: 'linear-gradient(180deg, #fbbf24, #ea580c)' }}
        initial={{ scaleY: 0, opacity: 0 }}
        whileHover={{ scaleY: 1, opacity: 1 }}
        transition={{ duration: 0.18 }}
      />

      {/* Text */}
      <div className="flex-1 min-w-0 pl-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-semibold text-white text-sm leading-snug">{item.name}</span>
          {item.popular && (
            <span
              className="text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded uppercase"
              style={{ background: 'linear-gradient(135deg,#fbbf24,#ea580c)', color: '#060400' }}
            >
              Popular
            </span>
          )}
        </div>
        {item.description && (
          <p className="text-muted text-xs leading-relaxed line-clamp-2">{item.description}</p>
        )}
        {/* Bowl hint */}
        {item.itemType === 'bowl' && item.saladPrice && (
          <p className="text-brand/75 text-[10px] mt-1 font-semibold">
            Salad ${item.saladPrice} · Rice ${item.ricePrice}
          </p>
        )}
        {/* HSP / Chips size hint */}
        {(item.itemType === 'hsp' || item.itemType === 'chips') && item.sizePrices && (
          <p className="text-brand/75 text-[10px] mt-1 font-semibold">
            {Object.entries(item.sizePrices).map(([s, p]) => `${s} $${p}`).join(' · ')}
          </p>
        )}
      </div>

      {/* Price + Add button */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <span className="text-gradient-brand font-black text-sm">
          {item.itemType === 'bowl' ? `from $${displayPrice}` : `$${Number(displayPrice).toFixed(2)}`}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onAdd(item); }}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:scale-110 active:scale-90 transition-transform shadow"
          style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', boxShadow: '0 2px 10px rgba(245,158,11,0.35)' }}
        >
          <Plus size={15} strokeWidth={3} className="text-surface" style={{ color: '#060400' }} />
        </button>
      </div>

      {/* Food photo thumbnail — like Uber Eats */}
      {thumbnail && (
        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border" style={{ borderColor: 'rgba(44,24,0,0.8)' }}>
          <motion.img
            src={thumbnail}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.4 }}
          />
        </div>
      )}
    </motion.div>
  );
}
