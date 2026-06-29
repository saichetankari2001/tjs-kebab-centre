import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ChevronRight, Clock, Star } from 'lucide-react';
import { HERO_PHOTO } from '../data/menu';

const FLOATERS = [
  { emoji: '🥙', x: '68%', y: '18%', delay: 0,   z: 1.0 },
  { emoji: '🌯', x: '80%', y: '38%', delay: 0.6, z: 0.7 },
  { emoji: '🧆', x: '74%', y: '60%', delay: 1.1, z: 0.5 },
  { emoji: '🥩', x: '87%', y: '24%', delay: 0.3, z: 0.9 },
  { emoji: '🌶️', x: '63%', y: '50%', delay: 0.9, z: 0.6 },
  { emoji: '🫙', x: '91%', y: '55%', delay: 1.5, z: 0.4 },
];

// Hours: Sun–Thu 11:30am–12:00am | Fri–Sat 11:30am–2:00am
const HOURS_WEEKDAY = '11:30am – 12:00am';
const HOURS_WEEKEND = '11:30am – 2:00am';

function getOpenStatus() {
  const d   = new Date();
  const day = d.getDay();                                   // 0=Sun…6=Sat
  const min = d.getHours() * 60 + d.getMinutes();
  const OPEN = 11 * 60 + 30;

  // Sat or Sun 12:00am–2:00am — still open from Fri/Sat night
  if ((day === 6 || day === 0) && min < 120) return true;
  // Otherwise: open if past 11:30am
  return min >= OPEN;
}

function getTodayHours() {
  const day = new Date().getDay();
  return (day === 5 || day === 6) ? HOURS_WEEKEND : HOURS_WEEKDAY;
}

export default function HeroSection({ onCtaClick }) {
  const sectionRef = useRef(null);
  const { scrollY } = useScroll();

  // Parallax: background drifts down 25% while content rises 8%
  const bgY      = useTransform(scrollY, [0, 600], ['0%', '25%']);
  const contentY = useTransform(scrollY, [0, 600], ['0%', '-8%']);
  const opacity  = useTransform(scrollY, [0, 400], [1, 0]);

  const open         = getOpenStatus();
  const todayHours   = getTodayHours();

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden flex flex-col justify-end"
      style={{ minHeight: '82vh', perspective: '1000px' }}
    >

      {/* ── Background photo with parallax ── */}
      <motion.div
        className="absolute inset-0 w-full h-[120%] -top-[10%]"
        style={{ y: bgY }}
      >
        <motion.img
          src={HERO_PHOTO}
          alt="TJ's Kebab Centre"
          className="w-full h-full object-cover"
          loading="eager"
          initial={{ scale: 1.12 }}
          animate={{ scale: 1.02 }}
          transition={{ duration: 10, ease: 'easeOut' }}
        />
      </motion.div>

      {/* ── Layered overlays ── */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(6,4,0,0.97) 0%, rgba(6,4,0,0.82) 42%, rgba(6,4,0,0.45) 65%, rgba(6,4,0,0.15) 100%)' }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(6,4,0,1) 0%, rgba(6,4,0,0.65) 30%, transparent 58%)' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 60% at 15% 55%, rgba(245,158,11,0.20) 0%, transparent 60%)' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 55% 55% at 80% 35%, rgba(234,88,12,0.24) 0%, transparent 50%)' }} />

      {/* ── Cinematic scan shimmer ── */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(245,158,11,0.06) 50%, transparent 100%)', width: '200%' }}
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'linear', repeatDelay: 8 }}
      />

      {/* ── Top golden line ── */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(245,158,11,0.7) 40%, rgba(234,88,12,0.4) 70%, transparent 100%)' }} />

      {/* ── 3D Depth floating emojis ── */}
      {FLOATERS.map((f, i) => (
        <motion.span
          key={i}
          className="absolute text-3xl select-none pointer-events-none hidden lg:block"
          style={{
            left: f.x, top: f.y,
            filter: 'drop-shadow(0 0 10px rgba(245,158,11,0.5))',
            translateZ: `${f.z * 40}px`,
          }}
          initial={{ opacity: 0, scale: 0.4, rotateY: -30 }}
          animate={{
            opacity: 0.80,
            scale: f.z,
            rotateY: 0,
            y: [0, -16 * f.z, 0],
          }}
          transition={{
            opacity: { delay: f.delay + 0.8, duration: 0.7 },
            scale:   { delay: f.delay + 0.8, duration: 0.7 },
            rotateY: { delay: f.delay + 0.8, duration: 1.0 },
            y:       { delay: f.delay, duration: 3.2 + i * 0.4, repeat: Infinity, ease: 'easeInOut' },
          }}
        >{f.emoji}</motion.span>
      ))}

      {/* ── Content with parallax ── */}
      <motion.div
        className="relative z-10 px-6 md:px-14 pb-16 pt-16 max-w-4xl"
        style={{ y: contentY, opacity }}
      >

        {/* Status + Hours row */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.55 }}
          className="flex items-center flex-wrap gap-3 mb-6"
        >
          {/* OPEN / CLOSED status */}
          <span
            className="flex items-center gap-2 text-[11px] font-black px-3 py-1.5 rounded-full backdrop-blur-sm border"
            style={open ? {
              background: 'rgba(16,185,129,0.14)',
              borderColor: 'rgba(52,211,153,0.35)',
              color: '#34d399',
            } : {
              background: 'rgba(239,68,68,0.12)',
              borderColor: 'rgba(239,68,68,0.30)',
              color: '#f87171',
            }}
          >
            <motion.span
              animate={{ opacity: open ? [1, 0.2, 1] : 1 }}
              transition={{ repeat: Infinity, duration: 1.1 }}
              className="w-2 h-2 rounded-full"
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
            Today: {todayHours}
          </span>

          {/* Full hours note */}
          <span className="text-muted text-[10px] hidden sm:block">
            Sun–Thu 11:30am–12am &nbsp;·&nbsp; Fri–Sat 11:30am–2am
          </span>
        </motion.div>

        {/* Title — 3D depth with drop shadow layers */}
        <motion.h1
          className="font-display leading-none tracking-wide mb-4"
          initial={{ opacity: 0, y: 40, rotateX: 12 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ delay: 0.18, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: 'bottom center' }}
        >
          <span className="text-white block" style={{ fontSize: 'clamp(3.2rem,11vw,7.5rem)', textShadow: '0 4px 40px rgba(0,0,0,0.9), 0 0 80px rgba(245,158,11,0.08)' }}>TJ'S</span>
          <span className="text-gradient-brand block" style={{ fontSize: 'clamp(3.8rem,13vw,9rem)', textShadow: '0 4px 60px rgba(245,158,11,0.35), 0 8px 80px rgba(0,0,0,0.6)' }}>KEBAB</span>
          <span className="text-white block" style={{ fontSize: 'clamp(2.2rem,8vw,5.5rem)', textShadow: '0 4px 40px rgba(0,0,0,0.9)' }}>CENTRE</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.5 }}
          className="text-muted-warm text-sm sm:text-base mb-8 max-w-sm leading-relaxed"
        >
          Chargrilled meats, homemade sauces &amp; fresh salads — made fresh to order.{' '}
          <span className="text-brand font-semibold">Pickup only.</span>
        </motion.p>

        {/* CTA row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.45 }}
          className="flex items-center flex-wrap gap-3"
        >
          <motion.button
            onClick={onCtaClick}
            whileHover={{ scale: 1.06, boxShadow: '0 0 48px rgba(245,158,11,0.55), 0 8px 32px rgba(0,0,0,0.5)' }}
            whileTap={{ scale: 0.94 }}
            className="group relative overflow-hidden flex items-center gap-2 font-black text-sm tracking-widest uppercase px-8 py-4 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 45%, #ea580c 100%)',
              color: '#060400',
              boxShadow: '0 0 30px rgba(245,158,11,0.42), 0 4px 20px rgba(0,0,0,0.4)',
            }}
          >
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.32) 50%, transparent 100%)' }}
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' }}
            />
            ORDER NOW
            <ChevronRight size={16} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
          </motion.button>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl backdrop-blur-sm border"
            style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.10)' }}
          >
            {[...Array(5)].map((_, i) => <Star key={i} size={11} fill="#f59e0b" className="text-brand" />)}
            <span className="text-white text-xs font-bold ml-1">4.9</span>
            <span className="text-muted text-xs ml-0.5">· 200+ reviews</span>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Bottom amber gradient line */}
      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(245,158,11,0.5) 50%, transparent 100%)' }} />
    </section>
  );
}
