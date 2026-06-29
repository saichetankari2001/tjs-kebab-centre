import React, { useState } from 'react';
import { motion } from 'framer-motion';
import MenuItemRow from './MenuItemRow';
import ItemModal from './ItemModal';

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

  return (
    <section ref={sectionRef} id={`cat-${category.id}`} className="mb-6">
      {/* Category header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative h-36 overflow-hidden rounded-t-xl"
        style={{ perspective: 800 }}
      >
        {/* Background image with Ken Burns zoom */}
        <motion.img
          src={category.photo}
          alt={category.name}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          initial={{ scale: 1.10, rotateX: 4 }}
          whileInView={{ scale: 1, rotateX: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 6, ease: 'easeOut' }}
        />
        {/* Rich layered overlays for depth */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0e0b07]/96 via-[#0e0b07]/70 to-[#0e0b07]/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0b07]/90 via-transparent to-transparent" />
        {/* Amber colour wash */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand/12 via-brand/3 to-transparent" />
        {/* Top golden shimmer line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-brand/60 via-brand/20 to-transparent" />

        <div className="relative h-full flex items-end px-5 pb-4">
          <div>
            <span className="text-brand/80 text-[10px] font-black tracking-[0.2em] uppercase block mb-1">
              {items.length} items
            </span>
            <h2 className="font-display text-4xl text-white tracking-wide leading-none drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
              {category.emoji} {category.name}
            </h2>
          </div>
        </div>
      </motion.div>

      {/* Items list with stagger */}
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
