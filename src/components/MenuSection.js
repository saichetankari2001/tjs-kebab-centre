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
        initial={{ opacity: 0, x: -16 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative h-28 overflow-hidden rounded-t-xl"
      >
        <img
          src={category.photo}
          alt={category.name}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
        {/* Warm amber-tinted overlay instead of cold grey */}
        <div className="absolute inset-0 bg-gradient-to-r from-surface/95 via-[#0e0b07]/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-surface/80 to-transparent" />
        {/* Subtle amber glow from left */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand/8 via-transparent to-transparent" />

        <div className="relative h-full flex items-end px-5 pb-3">
          <div>
            <h2 className="font-display text-3xl text-white tracking-wide leading-none">
              {category.emoji} {category.name}
            </h2>
            <p className="text-muted-warm text-xs mt-0.5 font-medium">{items.length} items</p>
          </div>
        </div>
      </motion.div>

      {/* Items list with stagger */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        className="bg-card border-x border-b border-border rounded-b-xl overflow-hidden"
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
