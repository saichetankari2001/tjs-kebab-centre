import React from 'react';
import MenuItemCard from './MenuItemCard';

export default function MenuGrid({ categories, drinks, categoryRefs }) {
  const drinksCategory = drinks.length > 0
    ? { id: 'drinks', name: 'Drinks', emoji: '🥤', items: drinks }
    : null;

  const allCategories = drinksCategory
    ? [...categories, drinksCategory]
    : categories;

  return (
    <div className="bg-[#111111] min-h-screen pb-32">
      {allCategories.map(cat => (
        <div
          key={cat.id}
          id={`cat-${cat.id}`}
          ref={el => { if (categoryRefs?.current) categoryRefs.current[cat.id] = el; }}
          className="px-4 pt-8"
        >
          {/* Category header */}
          <div className="flex items-center gap-2 mb-4">
            {cat.emoji && <span className="text-2xl">{cat.emoji}</span>}
            <h2 className="text-white text-xl font-extrabold">{cat.name}</h2>
          </div>

          {/* Items grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {cat.items.map(item => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
