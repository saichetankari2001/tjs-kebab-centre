import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useMenu } from '../hooks/useMenu';
import { useCart } from '../context/CartContext';
import HeroSection from '../components/HeroSection';
import CategoryNav from '../components/CategoryNav';
import MenuSection from '../components/MenuSection';
import CartBar from '../components/CartBar';
import PromoSignupBanner from '../components/PromoSignupBanner';

const BENTO_ITEMS = [
  {
    icon: '🔥',
    title: 'Chargrilled Fresh Daily',
    body: 'Our meats hit the grill every morning — never frozen, always smoky.',
    span: 'col-span-2 row-span-2',
    accent: 'rgba(234,88,12,0.18)',
    border: 'rgba(234,88,12,0.35)',
    glow: '0 0 60px rgba(234,88,12,0.12)',
    big: true,
  },
  {
    icon: '⚡',
    title: 'Ready in ~15 min',
    body: 'Order ahead, skip the wait.',
    span: 'col-span-1',
    accent: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.28)',
    glow: '0 0 40px rgba(245,158,11,0.10)',
  },
  {
    icon: '🎉',
    title: 'Loyalty Rewards',
    body: 'Every 5th order is FREE. Stamps tracked automatically.',
    span: 'col-span-1',
    accent: 'rgba(16,185,129,0.10)',
    border: 'rgba(16,185,129,0.28)',
    glow: '0 0 40px rgba(16,185,129,0.08)',
  },
  {
    icon: '🥗',
    title: 'Fresh Salad Bar',
    body: 'House-made tabbouleh, hummus & garlic sauce.',
    span: 'col-span-1',
    accent: 'rgba(245,158,11,0.10)',
    border: 'rgba(245,158,11,0.22)',
    glow: 'none',
  },
  {
    icon: '🌙',
    title: 'Late Night Open',
    body: 'Fri & Sat until 2am — the best post-night kebab in town.',
    span: 'col-span-2',
    accent: 'rgba(139,92,246,0.10)',
    border: 'rgba(139,92,246,0.25)',
    glow: '0 0 40px rgba(139,92,246,0.08)',
  },
];

function BentoGrid() {
  return (
    <div className="py-12 px-4 max-w-3xl mx-auto">
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center text-[11px] font-black tracking-[0.22em] text-brand/80 uppercase mb-6"
      >
        ✦ Why TJ's ✦
      </motion.p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 auto-rows-[130px]">
        {BENTO_ITEMS.map((b, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: i * 0.09, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ scale: 1.03, y: -4, transition: { duration: 0.2 } }}
            className={`${b.span} relative rounded-2xl overflow-hidden p-4 flex flex-col justify-between cursor-default`}
            style={{
              background: `linear-gradient(135deg, ${b.accent}, rgba(14,7,0,0.96))`,
              border: `1px solid ${b.border}`,
              boxShadow: b.glow,
            }}
          >
            {/* Top edge glow line */}
            <div className="absolute top-0 left-6 right-6 h-px" style={{ background: `linear-gradient(90deg, transparent, ${b.border}, transparent)` }} />
            {/* Shine */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%)' }} />

            <span className={b.big ? 'text-4xl' : 'text-2xl'}>{b.icon}</span>
            <div>
              <p className={`text-white font-black leading-tight ${b.big ? 'text-lg mb-1' : 'text-sm mb-0.5'}`}>{b.title}</p>
              <p className={`leading-snug ${b.big ? 'text-sm text-brand/70' : 'text-xs text-muted'}`}>{b.body}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

const DISHES_3D = [
  { url: '/images/HSP.jpg',                        label: 'HSP',             desc: 'Halal Snack Pack',        tag: '🔥 Most Popular' },
  { url: '/images/chicken-doner-kebab.jpg',        label: 'Kebab Wrap',      desc: 'Chargrilled & Fresh',     tag: '⭐ Customer Fave' },
  { url: '/images/Chargrilled-ChickenSkewer.jpg',  label: 'Chicken Skewers', desc: 'Marinated & Chargrilled', tag: '🍗 Signature'    },
  { url: '/images/RiceBowl.jpg',                   label: 'Signature Bowl',  desc: 'Rice, Salad & Chicken',  tag: '🥗 Healthy'      },
];

function SignatureDishes3D() {
  return (
    <div className="py-10 px-4 overflow-hidden" style={{ background: 'linear-gradient(180deg, rgba(8,5,0,0.98) 0%, rgba(14,9,0,0.95) 100%)' }}>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center text-[11px] font-black tracking-[0.22em] text-brand/80 uppercase mb-6"
      >
        ✦ Signature Dishes ✦
      </motion.p>

      <div className="flex gap-4 overflow-x-auto pb-3 max-w-5xl mx-auto" style={{ scrollbarWidth: 'none' }}>
        {DISHES_3D.map((d, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 40, rotateX: 20, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: i * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{
              scale: 1.07,
              rotateY: 6,
              rotateX: -4,
              boxShadow: '0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(245,158,11,0.40), 0 0 40px rgba(245,158,11,0.20)',
            }}
            className="relative rounded-2xl overflow-hidden flex-shrink-0 cursor-pointer"
            style={{
              width: 200,
              height: 260,
              border: '1px solid rgba(58,32,0,0.9)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
              transformStyle: 'preserve-3d',
              perspective: 700,
            }}
          >
            <img src={d.url} alt={d.label} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
            {/* Gradient overlay */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(4,2,0,0.95) 0%, rgba(4,2,0,0.30) 55%, transparent 100%)' }} />
            {/* Shine */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 45%)' }} />
            {/* Tag */}
            <div className="absolute top-3 left-3">
              <span className="text-[9px] font-black px-2 py-1 rounded-full" style={{ background: 'rgba(245,158,11,0.90)', color: '#0d0600' }}>
                {d.tag}
              </span>
            </div>
            {/* Info */}
            <div className="absolute bottom-0 left-0 right-0 px-3 pb-4">
              <p className="text-white font-black text-base leading-tight mb-0.5">{d.label}</p>
              <p className="text-brand/80 text-[10px] font-medium">{d.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

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

      {/* ── 3D Signature Dishes Strip ── */}
      <SignatureDishes3D />

      {/* ── Bento feature grid ── */}
      <BentoGrid />

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
