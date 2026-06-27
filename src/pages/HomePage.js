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
    <div className="bg-surface min-h-screen pb-24">
      <PromoSignupBanner />
      <HeroSection onCtaClick={() => scrollToCategory(categories[0]?.id)} />
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
