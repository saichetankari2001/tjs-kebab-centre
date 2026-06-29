import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { ChevronRight, Clock, Star } from 'lucide-react';
import { HERO_PHOTO } from '../data/menu';

// 3D Floating food showcase cards — right side of hero
const SHOWCASE = [
  { url: '/images/HSP.jpg',                         label: 'HSP',             rotate: -12, x: 0,   y: -60,  z: 40,  delay: 0    },
  { url: '/images/chicken-doner-kebab.jpg',         label: 'Kebab Wrap',      rotate:  6,  x: 30,  y:  20,  z: 0,   delay: 0.15 },
  { url: '/images/Chargrilled-ChickenSkewer.jpg',   label: 'Chicken Skewers', rotate: 18,  x: -20, y: 100,  z: -40, delay: 0.3  },
];

// Hours
const HOURS = { weekday: '11:30am – 12:00am', weekend: '11:30am – 2:00am' };

function isOpen() {
  const d = new Date(), day = d.getDay(), min = d.getHours() * 60 + d.getMinutes();
  if ((day === 6 || day === 0) && min < 120) return true;
  return min >= 690; // 11:30am
}

function todayHours() {
  const day = new Date().getDay();
  return (day === 5 || day === 6) ? HOURS.weekend : HOURS.weekday;
}

// Cycling "dish of the moment" label
const DISHES = ['Chargrilled Lamb Wrap', 'HSP Large Special', 'Mixed Chicken Skewers', 'Signature Salad Bowl'];

export default function HeroSection({ onCtaClick }) {
  const sectionRef   = useRef(null);
  const { scrollY }  = useScroll();
  const bgY          = useTransform(scrollY, [0, 600], ['0%', '28%']);
  const contentY     = useTransform(scrollY, [0, 600], ['0%', '-10%']);
  const fadeOut      = useTransform(scrollY, [0, 380], [1, 0]);

  const open         = isOpen();
  const hours        = todayHours();

  const [dishIdx, setDishIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDishIdx(i => (i + 1) % DISHES.length), 3200);
    return () => clearInterval(t);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden flex flex-col justify-end"
      style={{ minHeight: '86vh' }}
    >

      {/* ── PARALLAX BACKGROUND ── */}
      <motion.div className="absolute inset-0 w-full h-[125%] -top-[12%]" style={{ y: bgY }}>
        <motion.img
          src={HERO_PHOTO}
          alt="TJ's Kebab Centre"
          className="w-full h-full object-cover"
          loading="eager"
          initial={{ scale: 1.14 }}
          animate={{ scale: 1.03 }}
          transition={{ duration: 12, ease: 'easeOut' }}
        />
      </motion.div>

      {/* ── CINEMATIC OVERLAYS ── */}
      {/* Directional darkness so food shows right */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(100deg, rgba(4,2,0,0.97) 0%, rgba(4,2,0,0.88) 38%, rgba(4,2,0,0.55) 62%, rgba(4,2,0,0.20) 100%)' }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(4,2,0,1) 0%, rgba(4,2,0,0.60) 32%, transparent 60%)' }} />
      {/* Amber ember glow left */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 65% 70% at 8% 60%, rgba(245,158,11,0.22) 0%, transparent 60%)' }} />
      {/* Orange glow right — lights the food */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 50% 50% at 82% 38%, rgba(234,88,12,0.28) 0%, transparent 52%)' }} />
      {/* Vignette edges */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.45) 100%)' }} />

      {/* ── CINEMATIC SCAN LINE ── */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.035) 50%, transparent 100%)', width: '220%' }}
        animate={{ x: ['-110%', '110%'] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'linear', repeatDelay: 10 }}
      />

      {/* ── GOLDEN FRAME LINES ── */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(245,158,11,0.8) 40%, rgba(234,88,12,0.5) 70%, transparent 100%)' }} />
      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(245,158,11,0.5) 50%, transparent 100%)' }} />

      {/* ── 3D FLOATING FOOD SHOWCASE (desktop right side) ── */}
      <div
        className="absolute right-8 lg:right-16 xl:right-24 top-1/2 -translate-y-1/2 hidden lg:block"
        style={{ width: 260, height: 360, perspective: '700px', perspectiveOrigin: '50% 50%' }}
      >
        {SHOWCASE.map((card, i) => (
          <motion.div
            key={i}
            className="absolute rounded-2xl overflow-hidden border"
            style={{
              width: 200,
              height: 240,
              left: 30 + card.x,
              top: 60 + card.y,
              borderColor: 'rgba(245,158,11,0.30)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.65), 0 0 0 1px rgba(245,158,11,0.12)',
              rotateZ: card.rotate,
              translateZ: card.z,
              transformStyle: 'preserve-3d',
            }}
            initial={{ opacity: 0, scale: 0.7, rotateY: -30, translateZ: card.z - 60 }}
            animate={{
              opacity: 1,
              scale: 1,
              rotateY: [0, 4, -4, 0],
              translateZ: [card.z, card.z + 12, card.z],
              y: [0, -10, 0],
            }}
            transition={{
              opacity: { delay: card.delay + 0.4, duration: 0.7 },
              scale:   { delay: card.delay + 0.4, duration: 0.7 },
              rotateY: { delay: card.delay + 1, duration: 6 + i, repeat: Infinity, ease: 'easeInOut' },
              translateZ: { delay: card.delay + 1, duration: 4 + i * 0.5, repeat: Infinity, ease: 'easeInOut' },
              y:       { delay: card.delay + 1, duration: 3 + i * 0.4, repeat: Infinity, ease: 'easeInOut' },
            }}
            whileHover={{ scale: 1.08, rotateY: 0, zIndex: 10 }}
          >
            <img
              src={card.url}
              alt={card.label}
              className="w-full h-full object-cover"
              loading="eager"
            />
            {/* Amber label */}
            <div
              className="absolute bottom-0 left-0 right-0 px-3 py-2"
              style={{ background: 'linear-gradient(to top, rgba(6,4,0,0.92) 0%, transparent 100%)' }}
            >
              <span className="text-brand text-xs font-black tracking-wider">{card.label}</span>
            </div>
            {/* Shine overlay */}
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%)' }}
            />
          </motion.div>
        ))}

        {/* Ambient glow under cards */}
        <motion.div
          className="absolute bottom-0 left-1/2 -translate-x-1/2"
          style={{ width: 180, height: 40, background: 'radial-gradient(ellipse, rgba(245,158,11,0.28) 0%, transparent 70%)', filter: 'blur(12px)' }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* ── MAIN CONTENT ── */}
      <motion.div
        className="relative z-10 px-6 md:px-14 pb-16 pt-20 max-w-2xl"
        style={{ y: contentY, opacity: fadeOut }}
      >

        {/* Open / Closed + Hours */}
        <motion.div
          initial={{ opacity: 0, x: -28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="flex items-center flex-wrap gap-3 mb-6"
        >
          {/* Dynamic OPEN / CLOSED */}
          <span
            className="flex items-center gap-2 text-[11px] font-black px-3.5 py-1.5 rounded-full backdrop-blur-sm border"
            style={open ? {
              background: 'rgba(16,185,129,0.15)',
              borderColor: 'rgba(52,211,153,0.40)',
              color: '#34d399',
            } : {
              background: 'rgba(239,68,68,0.12)',
              borderColor: 'rgba(239,68,68,0.30)',
              color: '#f87171',
            }}
          >
            <motion.span
              animate={{ opacity: open ? [1, 0.15, 1] : 1 }}
              transition={{ repeat: Infinity, duration: 1.0 }}
              className="w-2 h-2 rounded-full inline-block"
              style={{ background: open ? '#34d399' : '#f87171' }}
            />
            {open ? 'OPEN NOW' : 'CLOSED'}
          </span>

          {/* Today's hours */}
          <span
            className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm border"
            style={{ background: 'rgba(245,158,11,0.10)', borderColor: 'rgba(245,158,11,0.22)', color: '#d4a84b' }}
          >
            <Clock size={10} />
            Today: {hours}
          </span>

          <span className="text-muted/70 text-[10px] hidden sm:block">
            Sun–Thu 11:30am–12am &nbsp;·&nbsp; Fri–Sat 11:30am–2am
          </span>
        </motion.div>

        {/* 3D Animated Title */}
        <motion.h1
          className="font-display leading-none tracking-wide mb-4"
          initial={{ opacity: 0, y: 50, rotateX: 18, perspective: 600 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ delay: 0.2, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: 'bottom left' }}
        >
          <span className="text-white block" style={{ fontSize: 'clamp(3.2rem,10vw,7.5rem)', textShadow: '0 4px 0 rgba(0,0,0,0.6), 0 0 60px rgba(0,0,0,0.8)' }}>TJ'S</span>
          <span className="text-gradient-brand block" style={{ fontSize: 'clamp(3.8rem,12vw,9rem)', textShadow: '0 4px 0 rgba(180,90,0,0.4), 0 0 80px rgba(245,158,11,0.30)' }}>KEBAB</span>
          <span className="text-white block" style={{ fontSize: 'clamp(2.2rem,7vw,5.5rem)', textShadow: '0 4px 0 rgba(0,0,0,0.6)' }}>CENTRE</span>
        </motion.h1>

        {/* Subtitle with cycling dish name */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="mb-8"
        >
          <p className="text-muted-warm text-sm sm:text-base max-w-sm leading-relaxed mb-2">
            Chargrilled meats, homemade sauces &amp; fresh salads — made fresh to order.{' '}
            <span className="text-brand font-semibold">Pickup only.</span>
          </p>
          {/* Cycling featured dish */}
          <div className="flex items-center gap-2">
            <span className="text-muted/60 text-xs">Try today:</span>
            <AnimatePresence mode="wait">
              <motion.span
                key={dishIdx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="text-brand text-xs font-bold"
              >
                {DISHES[dishIdx]}
              </motion.span>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.48, duration: 0.45 }}
          className="flex items-center flex-wrap gap-3"
        >
          <motion.button
            onClick={onCtaClick}
            whileHover={{ scale: 1.07, boxShadow: '0 0 52px rgba(245,158,11,0.60), 0 8px 32px rgba(0,0,0,0.5)' }}
            whileTap={{ scale: 0.93 }}
            className="group relative overflow-hidden flex items-center gap-2 font-black text-sm tracking-widest uppercase px-8 py-4 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #ea580c 100%)',
              color: '#060400',
              boxShadow: '0 0 32px rgba(245,158,11,0.45), 0 4px 20px rgba(0,0,0,0.4)',
            }}
          >
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)' }}
              animate={{ x: ['-100%', '220%'] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2.2, ease: 'easeInOut' }}
            />
            ORDER NOW
            <ChevronRight size={16} strokeWidth={3} className="group-hover:translate-x-1.5 transition-transform" />
          </motion.button>

          {/* Stars */}
          <div
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border"
            style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.10)' }}
          >
            {[...Array(5)].map((_, i) => <Star key={i} size={11} fill="#f59e0b" className="text-brand" />)}
            <span className="text-white text-xs font-bold ml-1">4.9</span>
            <span className="text-muted text-xs ml-0.5">· 200+ reviews</span>
          </div>
        </motion.div>
      </motion.div>

    </section>
  );
}
