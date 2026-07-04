import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CategoryNav({ categories, activeCatId, onCategoryClick }) {
  const scrollRef = useRef(null);
  const pillRefs  = useRef({});

  useEffect(() => {
    const pill = pillRefs.current[activeCatId];
    const bar  = scrollRef.current;
    if (!pill || !bar) return;
    bar.scrollTo({ left: pill.offsetLeft - bar.offsetWidth / 2 + pill.offsetWidth / 2, behavior: 'smooth' });
  }, [activeCatId]);

  return (
    <nav
      ref={scrollRef}
      className="sticky top-16 z-40 flex items-center gap-1.5 overflow-x-auto scrollbar-hide px-4 h-14"
      style={{
        background: 'rgba(8,4,0,0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(245,158,11,0.12)',
        boxShadow: '0 4px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(245,158,11,0.08)',
      }}
    >
      {/* Subtle left fade to indicate scroll */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 z-10"
        style={{ background: 'linear-gradient(to right, rgba(8,4,0,0.9), transparent)' }} />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 z-10"
        style={{ background: 'linear-gradient(to left, rgba(8,4,0,0.9), transparent)' }} />

      {categories.map((cat) => {
        const active = cat.id === activeCatId;
        return (
          <button
            key={cat.id}
            ref={(el) => { pillRefs.current[cat.id] = el; }}
            onClick={() => onCategoryClick(cat.id)}
            className="relative flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold tracking-wide whitespace-nowrap transition-colors duration-200 outline-none"
            style={{ color: active ? '#ffffff' : 'rgba(160,140,110,0.75)' }}
          >
            {/* Active pill background */}
            <AnimatePresence>
              {active && (
                <motion.span
                  layoutId="cat-pill"
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.28) 0%, rgba(234,88,12,0.16) 100%)',
                    border: '1px solid rgba(245,158,11,0.45)',
                    boxShadow: '0 0 20px rgba(245,158,11,0.20), inset 0 1px 0 rgba(255,255,255,0.08)',
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
            </AnimatePresence>

            {/* Inactive hover glow */}
            {!active && (
              <motion.span
                className="absolute inset-0 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-200"
                style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.15)' }}
              />
            )}

            <span className="relative z-10 flex items-center gap-1.5">
              <span>{cat.emoji}</span>
              <span>{cat.name}</span>
            </span>

            {/* Active amber dot below */}
            {active && (
              <motion.span
                layoutId="cat-dot"
                className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                style={{ background: '#f59e0b', boxShadow: '0 0 6px rgba(245,158,11,0.8)' }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
