import React, { useRef, useEffect } from 'react';
import { cn } from '../lib/utils';

export default function CategoryNav({ categories, activeCatId, onCategoryClick }) {
  const navRef = useRef(null);

  // Auto-scroll active pill into view
  useEffect(() => {
    if (!navRef.current || !activeCatId) return;
    const btn = navRef.current.querySelector(`[data-cat="${activeCatId}"]`);
    if (btn) btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeCatId]);

  return (
    <div
      ref={navRef}
      className="sticky top-0 z-50 bg-[#111111] border-b border-[#2A2A2A]"
    >
      <div
        className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categories.map(cat => {
          const isActive = cat.id === activeCatId;
          return (
            <button
              key={cat.id}
              data-cat={cat.id}
              onClick={() => onCategoryClick(cat.id)}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 whitespace-nowrap',
                isActive
                  ? 'bg-amber-500 text-[#111111]'
                  : 'bg-transparent border border-[#3A3A3A] text-white hover:border-amber-500/50 hover:text-amber-400'
              )}
            >
              {cat.emoji && <span className="mr-1.5">{cat.emoji}</span>}
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
