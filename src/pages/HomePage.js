import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useMenu } from '../hooks/useMenu';
import { useCart } from '../context/CartContext';
import HeroSection from '../components/HeroSection';
import CategoryNav from '../components/CategoryNav';
import MenuSection from '../components/MenuSection';
import CartBar from '../components/CartBar';
import PromoSignupBanner from '../components/PromoSignupBanner';

export default function HomePage() {
  const { categories, loading } = useMenu();
  const { addItem } = useCart();
  const [activeCatId,  setActiveCatId]  = useState(null);
  const sectionRefs  = useRef({});
  const scrollingRef = useRef(false);

  // IntersectionObserver — highlight active category pill while scrolling
  useEffect(() => {
    if (!categories.length) return;
    const observers = [];
    categories.forEach(({ id }) => {
      const el = sectionRefs.current[id];
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !scrollingRef.current) setActiveCatId(id);
        },
        { rootMargin: '-112px 0px -55% 0px', threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [categories]);

  const scrollToCategory = (catId) => {
    setActiveCatId(catId);
    const el = sectionRefs.current[catId];
    if (!el) return;
    scrollingRef.current = true;
    const OFFSET = 64 + 48 + 16; // navbar + catNav + padding
    const top = el.getBoundingClientRect().top + window.scrollY - OFFSET;
    window.scrollTo({ top, behavior: 'smooth' });
    setTimeout(() => { scrollingRef.current = false; }, 900);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-brand font-display text-2xl tracking-wider"
        >
          LOADING MENU...
        </motion.div>
      </div>
    );
  }

  const activeId = activeCatId || categories[0]?.id;

  return (
    <div className="min-h-screen pb-24" style={{ background: 'transparent' }}>
      <PromoSignupBanner />
      <HeroSection onCtaClick={() => scrollToCategory(categories[0]?.id)} />

      {/* ── Live ticker bar ── */}
      <div
        className="w-full overflow-hidden py-2 text-[11px] font-bold tracking-widest uppercase"
        style={{
          background: 'linear-gradient(90deg, rgba(245,158,11,0.12) 0%, rgba(234,88,12,0.08) 50%, rgba(245,158,11,0.12) 100%)',
          borderTop: '1px solid rgba(245,158,11,0.18)',
          borderBottom: '1px solid rgba(245,158,11,0.18)',
        }}
      >
        <motion.div
          animate={{ x: [0, -1200] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
          className="flex gap-10 whitespace-nowrap"
          style={{ width: 'max-content' }}
        >
          {[...Array(4)].map((_, i) => (
            <span key={i} className="flex items-center gap-8">
              <span className="text-brand">🥙 Chargrilled Kebabs</span>
              <span className="text-brand/60">·</span>
              <span className="text-orange-400">🌶️ Homemade Sauces</span>
              <span className="text-brand/60">·</span>
              <span className="text-brand">🧆 Fresh Falafel</span>
              <span className="text-brand/60">·</span>
              <span className="text-orange-400">🏃 Pickup Ready in ~15 min</span>
              <span className="text-brand/60">·</span>
              <span className="text-brand">🎉 Loyalty: Every 5th Order FREE</span>
              <span className="text-brand/60">·</span>
            </span>
          ))}
        </motion.div>
      </div>

      <CategoryNav
        categories={categories}
        activeCatId={activeId}
        onCategoryClick={scrollToCategory}
      />

      <div className="max-w-3xl mx-auto px-3 pt-4">
        {categories.map((cat) => (
          <MenuSection
            key={cat.id}
            category={cat}
            items={cat.items}
            sectionRef={(el) => { sectionRefs.current[cat.id] = el; }}
            onAdd={addItem}
          />
        ))}
      </div>

      <CartBar />
    </div>
  );
}
