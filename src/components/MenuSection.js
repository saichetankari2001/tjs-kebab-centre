import React, { useState } from 'react';
import { motion } from 'framer-motion';
import MenuItemRow from './MenuItemRow';
import ItemModal from './ItemModal';

export default function MenuSection({ category, items, sectionRef, onAdd }) {
  const [modalItem, setModalItem] = useState(null);

  const handleAdd = (item) => {
    // Items with no customisation (snack, dip, drink) go straight to cart
    const noModal = ['snack', 'dip', 'drink'].includes(item.itemType) && !item.sizePrices;
    if (noModal) {
      onAdd(item);
    } else {
      setModalItem(item);
    }
  };

  return (
    <section ref={sectionRef} id={`cat-${category.id}`} className="mb-6">
      {/* Category header with photo banner */}
      <div className="relative h-28 overflow-hidden">
        <img
          src={category.photo}
          alt={category.name}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-surface/90 via-surface/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-surface/80 to-transparent" />
        <div className="relative h-full flex items-end px-5 pb-3">
          <div>
            <h2 className="font-display text-3xl text-white tracking-wide leading-none">
              {category.emoji} {category.name}
            </h2>
            <p className="text-muted text-xs mt-0.5 font-medium">{items.length} items</p>
          </div>
        </div>
      </div>

      {/* Items list */}
      <div className="bg-card border-x border-b border-border rounded-b-xl overflow-hidden">
        {items.length === 0 ? (
          <p className="text-muted text-sm text-center py-8">No items available right now.</p>
        ) : (
          items.map((item) => (
            <MenuItemRow key={item.id} item={item} onAdd={handleAdd} />
          ))
        )}
      </div>

      {/* Item customisation modal */}
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
