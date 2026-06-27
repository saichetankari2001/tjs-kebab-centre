import React, { useEffect, useRef } from 'react';

export default function CategoryNav({ categories, activeCatId, onCategoryClick }) {
  const scrollRef = useRef(null);
  const pillRefs  = useRef({});

  // Auto-scroll active pill into view when activeCatId changes
  useEffect(() => {
    const pill = pillRefs.current[activeCatId];
    const bar  = scrollRef.current;
    if (!pill || !bar) return;
    const pillLeft = pill.offsetLeft;
    const barW     = bar.offsetWidth;
    const pillW    = pill.offsetWidth;
    bar.scrollTo({ left: pillLeft - barW / 2 + pillW / 2, behavior: 'smooth' });
  }, [activeCatId]);

  return (
    <nav
      ref={scrollRef}
      className="sticky top-16 z-40 bg-surface/95 backdrop-blur border-b border-border flex items-center gap-1 overflow-x-auto scrollbar-hide px-3 h-12"
    >
      {categories.map((cat) => {
        const active = cat.id === activeCatId;
        return (
          <button
            key={cat.id}
            ref={(el) => { pillRefs.current[cat.id] = el; }}
            onClick={() => onCategoryClick(cat.id)}
            className={[
              'flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all whitespace-nowrap',
              active
                ? 'bg-brand text-surface shadow shadow-brand/30'
                : 'text-muted hover:text-white hover:bg-card2',
            ].join(' ')}
          >
            {cat.emoji} {cat.name}
          </button>
        );
      })}
    </nav>
  );
}
