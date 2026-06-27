import React, { useState, useEffect, useRef } from 'react';
import { useMenu } from '../hooks/useMenu';
import HeroSection from '../components/HeroSection';
import PromoSignupBanner from '../components/PromoSignupBanner';
import CategoryNav from '../components/CategoryNav';
import MenuGrid from '../components/MenuGrid';
import CartBar from '../components/CartBar';

export default function HomePage() {
  const { categories, drinks, promotions, loading } = useMenu();
  const [activeCatId, setActiveCatId] = useState(null);
  const categoryRefs = useRef({});
  const scrollingRef = useRef(false);

  const firstCatId = categories[0]?.id;
  const displayActiveCat = activeCatId || firstCatId;

  // IntersectionObserver — highlight active category as user scrolls
  useEffect(() => {
    if (!categories.length) return;
    const observers = [];
    categories.forEach(cat => {
      const el = categoryRefs.current[cat.id];
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !scrollingRef.current) {
            setActiveCatId(cat.id);
          }
        },
        { rootMargin: '-80px 0px -55% 0px', threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, [categories]);

  const scrollToCategory = (catId) => {
    setActiveCatId(catId);
    const el = categoryRefs.current[catId];
    if (!el) return;
    scrollingRef.current = true;
    const NAVBAR_H = 64;
    const CATNAV_H = 52;
    const top = el.getBoundingClientRect().top + window.scrollY - NAVBAR_H - CATNAV_H;
    window.scrollTo({ top, behavior: 'smooth' });
    setTimeout(() => { scrollingRef.current = false; }, 900);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="text-amber-500 text-lg font-semibold animate-pulse">Loading menu...</div>
      </div>
    );
  }

  // Build category list for nav (include Drinks if present)
  const navCategories = [
    ...categories,
    ...(drinks.length > 0 ? [{ id: 'drinks', name: 'Drinks', emoji: '🥤' }] : []),
  ];

  return (
    <div className="bg-[#111111] min-h-screen">
      <PromoSignupBanner />

      {/* Promotions banner (if any) */}
      {promotions.length > 0 && (
        <div className="px-4 pt-4 space-y-2">
          {promotions.map(promo => (
            <div key={promo.id} className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
              <span className="text-2xl">{promo.emoji || '🎉'}</span>
              <div>
                <p className="text-amber-400 font-bold text-sm">{promo.title}</p>
                <p className="text-amber-400/70 text-xs">{promo.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <HeroSection onCtaClick={() => scrollToCategory(firstCatId)} />

      <CategoryNav
        categories={navCategories}
        activeCatId={displayActiveCat}
        onCategoryClick={scrollToCategory}
      />

      <MenuGrid
        categories={categories}
        drinks={drinks}
        categoryRefs={categoryRefs}
      />

      <CartBar />
    </div>
  );
}
