import React, { useState } from 'react';
import { motion } from 'framer-motion';
import MenuItemRow from './MenuItemRow';
import ItemModal from './ItemModal';
import { getCategoryPhoto } from '../utils/itemThumbnail';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

export default function MenuSection({ category, items, sectionRef, onAdd }) {
  const [modalItem, setModalItem] = useState(null);

  const handleAdd = (item) => {
    const noModal = ['snack', 'dip', 'drink'].includes(item.itemType) && !item.sizePrices;
    if (noModal) onAdd(item);
    else setModalItem(item);
  };

  const photoSrc = getCategoryPhoto(category.name, category.photo);

  return (
    <section ref={sectionRef} id={`cat-${category.id}`} className="mb-6">
      {/* ── Cinematic category header ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-t-xl h-40 md:h-[220px]"
      >
        {/* Background photo — warm cinematic filter, no animation */}
        <img
          src={photoSrc}
          alt={category.name}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          style={{ filter: 'saturate(1.35) contrast(1.08) brightness(0.8)' }}
          onError={(e) => {
            const fallback = 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80';
            if (e.target.src !== fallback) e.target.src = fallback;
          }}
        />

        {/* Layer 1 — deep left-to-right dark vignette */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(105deg, rgba(4,2,0,0.97) 0%, rgba(4,2,0,0.82) 40%, rgba(4,2,0,0.30) 70%, rgba(4,2,0,0.10) 100%)' }}
        />

        {/* Layer 2 — bottom-up dark gradient */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(4,2,0,1) 0%, rgba(4,2,0,0.5) 30%, transparent 60%)' }}
        />

        {/* Layer 3 — amber radial glow left */}
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 55% 90% at -5% 50%, rgba(245,158,11,0.22) 0%, transparent 60%)' }}
        />

        {/* Layer 4 — 2px amber bottom border line */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[2px]"
          style={{ background: 'linear-gradient(90deg, rgba(245,158,11,0.9) 0%, rgba(234,88,12,0.4) 40%, transparent 70%)' }}
        />

        {/* Text — absolute, bottom edge */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-4 flex items-end justify-between">
          <div>
            <span
              className="block mb-1 font-black tracking-[0.2em] uppercase"
              style={{ fontSize: '10px', color: 'rgba(245,158,11,0.85)' }}
            >
              {items.length} item{items.length !== 1 ? 's' : ''}
            </span>
            <h2
              className="font-display text-4xl md:text-5xl text-white tracking-wide leading-none"
              style={{ textShadow: '0 2px 24px rgba(0,0,0,0.9)' }}
            >
              {category.emoji} {category.name}
            </h2>
          </div>

          {/* Bottom-right tag */}
          <div className="pb-1">
            <span
              className="font-semibold tracking-wide"
              style={{ fontSize: '10px', color: 'rgba(245,158,11,0.75)' }}
            >
              Made fresh to order
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── Items list with stagger ── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        className="border-x border-b rounded-b-xl overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #130a00 0%, #0e0700 100%)',
          borderColor: 'rgba(44,24,0,0.9)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(245,158,11,0.06)',
        }}
      >
        {items.length === 0 ? (
          <p className="text-muted text-sm text-center py-8">No items available right now.</p>
        ) : (
          items.map((item) => (
            <MenuItemRow key={item.id} item={item} onAdd={handleAdd} />
          ))
        )}
      </motion.div>

      {modalItem && (
        <ItemModal
          item={modalItem}
          isOpen={!!modalItem}
          onClose={() => setModalItem(null)}
        />
      )}
    </section>
  );
}
