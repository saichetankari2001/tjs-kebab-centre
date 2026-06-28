import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Clock, Zap, Star } from 'lucide-react';
import { HERO_PHOTO } from '../data/menu';

const FLOATERS = [
  { emoji: '🥙', x: '68%', y: '18%', delay: 0 },
  { emoji: '🌯', x: '80%', y: '38%', delay: 0.6 },
  { emoji: '🧆', x: '74%', y: '60%', delay: 1.1 },
  { emoji: '🥩', x: '87%', y: '24%', delay: 0.3 },
  { emoji: '🌶️', x: '63%', y: '50%', delay: 0.9 },
  { emoji: '🫙', x: '91%', y: '55%', delay: 1.5 },
];

export default function HeroSection({ onCtaClick }) {
  const [orderCount, setOrderCount] = useState(() => 44 + Math.floor(Math.random() * 18));

  useEffect(() => {
    const id = setInterval(() => {
      if (Math.random() > 0.6) setOrderCount(n => n + 1);
    }, 9000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative w-full overflow-hidden flex flex-col justify-end" style={{ minHeight: '78vh' }}>

      {/* ── Background photo ── */}
      <motion.img
        src={HERO_PHOTO}
        alt="TJ's Kebab Centre"
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
        initial={{ scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 8, ease: 'easeOut' }}
      />

      {/* ── Layered overlays — directional so food shows right ── */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(6,4,0,0.97) 0%, rgba(6,4,0,0.80) 40%, rgba(6,4,0,0.45) 65%, rgba(6,4,0,0.15) 100%)' }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(6,4,0,1) 0%, rgba(6,4,0,0.65) 28%, transparent 55%)' }} />
      {/* Vivid amber glow left */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 60% at 15% 55%, rgba(245,158,11,0.18) 0%, transparent 60%)' }} />
      {/* Vivid orange glow right — lights the food */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 55% 55% at 80% 35%, rgba(234,88,12,0.22) 0%, transparent 50%)' }} />

      {/* ── Animated scan shimmer ── */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(245,158,11,0.05) 50%, transparent 100%)', width: '200%' }}
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'linear', repeatDelay: 7 }}
      />

      {/* ── Floating food emojis ── */}
      {FLOATERS.map((f, i) => (
        <motion.span
          key={i}
          className="absolute text-3xl select-none pointer-events-none hidden lg:block"
          style={{ left: f.x, top: f.y, filter: 'drop-shadow(0 0 8px rgba(245,158,11,0.4))' }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 0.75, scale: 1, y: [0, -14, 0] }}
          transition={{
            opacity: { delay: f.delay + 0.8, duration: 0.6 },
            scale:   { delay: f.delay + 0.8, duration: 0.6 },
            y:       { delay: f.delay, duration: 3 + i * 0.35, repeat: Infinity, ease: 'easeInOut' },
          }}
        >{f.emoji}</motion.span>
      ))}

      {/* ── Top golden shimmer line ── */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(245,158,11,0.7) 40%, rgba(234,88,12,0.4) 70%, transparent 100%)' }} />

      {/* ── Content ── */}
      <div className="relative z-10 px-6 md:px-14 pb-14 pt-16 max-w-4xl">

        {/* Live badges */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="flex items-center flex-wrap gap-3 mb-5"
        >
          <span className="flex items-center gap-2 border border-green-500/40 text-green-400 text-[11px] font-black px-3 py-1.5 rounded-full backdrop-blur-sm" style={{ background: 'rgba(16,185,129,0.12)' }}>
            <motion.span
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.1 }}
              className="w-2 h-2 bg-green-400 rounded-full"
            />
            OPEN NOW
          </span>
          <span className="flex items-center gap-1.5 text-brand text-[11px] font-bold backdrop-blur-sm border border-brand/20 px-2.5 py-1.5 rounded-full" style={{ background: 'rgba(245,158,11,0.10)' }}>
            <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
              <Zap size={10} fill="currentColor" />
            </motion.span>
            <motion.span key={orderCount} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
              {orderCount} orders today
            </motion.span>
          </span>
          <span className="flex items-center gap-1 text-muted-warm text-[11px] font-medium">
            <Clock size={10} />
            Pickup in ~15 min
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="font-display leading-none tracking-wide mb-3"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="text-white block" style={{ fontSize: 'clamp(3.2rem,11vw,7.5rem)', textShadow: '0 0 40px rgba(0,0,0,0.8)' }}>TJ'S</span>
          <span className="text-gradient-brand block" style={{ fontSize: 'clamp(3.8rem,13vw,9rem)', textShadow: '0 0 60px rgba(245,158,11,0.3)' }}>KEBAB</span>
          <span className="text-white block" style={{ fontSize: 'clamp(2.2rem,8vw,5.5rem)', textShadow: '0 0 40px rgba(0,0,0,0.8)' }}>CENTRE</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-muted-warm text-sm sm:text-base mb-8 max-w-sm leading-relaxed"
        >
          Chargrilled meats, homemade sauces &amp; fresh salads — made fresh to order.{' '}
          <span className="text-brand font-semibold">Pickup only.</span>
        </motion.p>

        {/* CTA row */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42, duration: 0.45 }}
          className="flex items-center flex-wrap gap-3"
        >
          {/* Main CTA */}
          <motion.button
            onClick={onCtaClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group relative overflow-hidden flex items-center gap-2 font-black text-sm tracking-widest uppercase px-8 py-4 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 45%, #ea580c 100%)',
              color: '#060400',
              boxShadow: '0 0 30px rgba(245,158,11,0.40), 0 4px 20px rgba(0,0,0,0.4)',
            }}
          >
            {/* shimmer pass */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.30) 50%, transparent 100%)' }}
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' }}
            />
            ORDER NOW
            <ChevronRight size={16} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
          </motion.button>

          {/* Stars */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl backdrop-blur-sm border"
            style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.10)' }}
          >
            {[...Array(5)].map((_, i) => <Star key={i} size={11} fill="#f59e0b" className="text-brand" />)}
            <span className="text-white text-xs font-bold ml-1">4.9</span>
            <span className="text-muted text-xs ml-0.5">· 200+ reviews</span>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom amber line */}
      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(245,158,11,0.5) 50%, transparent 100%)' }} />
    </section>
  );
}
