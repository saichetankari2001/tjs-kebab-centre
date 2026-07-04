import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, useScroll, useTransform, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { ChevronRight, Clock, Star } from 'lucide-react';
import { HERO_PHOTO } from '../data/menu';
import VisualCanvas from './VisualCanvas';

const HOURS = { weekday: '11:30am – 12:00am', weekend: '11:30am – 2:00am' };

function isOpen() {
  const d = new Date(), day = d.getDay(), min = d.getHours() * 60 + d.getMinutes();
  if ((day === 6 || day === 0) && min < 120) return true;
  return min >= 690;
}
function todayHours() {
  const day = new Date().getDay();
  return (day === 5 || day === 6) ? HOURS.weekend : HOURS.weekday;
}

const DISHES = ['Chargrilled Lamb Wrap', 'HSP Large Special', 'Mixed Chicken Skewers', 'Signature Salad Bowl'];

// Floating food showcase — right side desktop
const SHOWCASE = [
  { url: '/images/HSP.jpg',                         label: 'HSP',             rotate: -12, x: 0,   y: -60,  z: 40,  delay: 0    },
  { url: '/images/chicken-doner-kebab.jpg',         label: 'Kebab Wrap',      rotate:  6,  x: 30,  y:  20,  z: 0,   delay: 0.15 },
  { url: '/images/Chargrilled-ChickenSkewer.jpg',   label: 'Chicken Skewers', rotate: 18,  x: -20, y: 100,  z: -40, delay: 0.3  },
];

export default function HeroSection({ onCtaClick }) {
  const sectionRef  = useRef(null);
  const { scrollY } = useScroll();
  const bgY         = useTransform(scrollY, [0, 600], ['0%', '28%']);
  const contentY    = useTransform(scrollY, [0, 600], ['0%', '-10%']);
  const fadeOut     = useTransform(scrollY, [0, 380], [1, 0]);

  const open  = isOpen();
  const hours = todayHours();

  const [dishIdx, setDishIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDishIdx(i => (i + 1) % DISHES.length), 3200);
    return () => clearInterval(t);
  }, []);

  // Cursor-tracking glow
  const cursorX = useMotionValue(50);
  const cursorY = useMotionValue(50);
  const springX = useSpring(cursorX, { stiffness: 60, damping: 20 });
  const springY = useSpring(cursorY, { stiffness: 60, damping: 20 });

  const handleMouseMove = useCallback((e) => {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    cursorX.set(((e.clientX - rect.left) / rect.width)  * 100);
    cursorY.set(((e.clientY - rect.top)  / rect.height) * 100);
  }, [cursorX, cursorY]);

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className="relative w-full overflow-hidden flex flex-col justify-end"
      style={{ minHeight: '92vh' }}
    >

      {/* ── LAYER 0: 3D warp-speed particle canvas ── */}
      <VisualCanvas />

      {/* ── LAYER 1: Parallax food photo ── */}
      <motion.div className="absolute inset-0 w-full h-[125%] -top-[12%]" style={{ y: bgY, zIndex: 1 }}>
        <motion.img
          src={HERO_PHOTO}
          alt="TJ's Kebab Centre"
          className="w-full h-full object-cover"
          loading="eager"
          initial={{ scale: 1.14 }}
          animate={{ scale: 1.03 }}
          transition={{ duration: 12, ease: 'easeOut' }}
          style={{ opacity: 0.45 }}
        />
      </motion.div>

      {/* ── LAYER 2: Aurora gradient blobs ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 2 }}>
        {/* Aurora 1 — deep amber blob left */}
        <div style={{
          position: 'absolute', width: '80vw', height: '80vw',
          left: '-20vw', top: '10%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.22) 0%, rgba(234,88,12,0.12) 40%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'aurora1 9s ease-in-out infinite',
        }} />
        {/* Aurora 2 — orange blob center-right */}
        <div style={{
          position: 'absolute', width: '70vw', height: '70vw',
          right: '-10vw', top: '20%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(234,88,12,0.20) 0%, rgba(239,68,68,0.08) 40%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'aurora2 12s ease-in-out infinite',
        }} />
        {/* Aurora 3 — deep purple/teal accent bottom */}
        <div style={{
          position: 'absolute', width: '60vw', height: '60vw',
          left: '20%', bottom: '-10%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.14) 0%, rgba(6,182,212,0.07) 50%, transparent 70%)',
          filter: 'blur(70px)',
          animation: 'aurora3 15s ease-in-out infinite',
        }} />
      </div>

      {/* ── LAYER 3: Cinematic dark overlays ── */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 3 }}>
        <div style={{ position:'absolute',inset:0, background:'linear-gradient(100deg, rgba(4,2,0,0.92) 0%, rgba(4,2,0,0.78) 38%, rgba(4,2,0,0.40) 62%, rgba(4,2,0,0.10) 100%)' }} />
        <div style={{ position:'absolute',inset:0, background:'linear-gradient(to top, rgba(4,2,0,1) 0%, rgba(4,2,0,0.55) 30%, transparent 60%)' }} />
        <div style={{ position:'absolute',inset:0, background:'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)' }} />
      </div>

      {/* ── LAYER 4: Cursor-tracking spotlight ── */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 4,
          background: useTransform(
            [springX, springY],
            ([gx, gy]) =>
              `radial-gradient(ellipse 55% 50% at ${gx}% ${gy}%, rgba(245,158,11,0.16) 0%, rgba(234,88,12,0.08) 40%, transparent 70%)`
          ),
        }}
      />

      {/* ── LAYER 5: Pulsing energy rings (centre of section) ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 4 }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 320, height: 320,
              borderRadius: '50%',
              border: '1px solid rgba(245,158,11,0.18)',
              animation: `pulseRing 4s ease-out infinite`,
              animationDelay: `${i * 1.33}s`,
            }}
          />
        ))}
      </div>

      {/* ── LAYER 6: Orbiting micro-orbs ── */}
      <div
        className="absolute pointer-events-none hidden lg:block"
        style={{ zIndex: 5, right: '14%', top: '40%', width: 0, height: 0 }}
      >
        {/* Fast orbit — amber */}
        <div style={{
          position: 'absolute', width: 8, height: 8, borderRadius: '50%',
          background: 'radial-gradient(circle, #fbbf24 0%, rgba(245,158,11,0.3) 70%, transparent 100%)',
          boxShadow: '0 0 16px rgba(245,158,11,0.9), 0 0 40px rgba(245,158,11,0.4)',
          animation: 'orbit 6s linear infinite',
        }} />
        {/* Slow orbit — purple */}
        <div style={{
          position: 'absolute', width: 5, height: 5, borderRadius: '50%',
          background: 'radial-gradient(circle, #a78bfa 0%, rgba(139,92,246,0.3) 70%, transparent 100%)',
          boxShadow: '0 0 12px rgba(139,92,246,0.9), 0 0 30px rgba(139,92,246,0.4)',
          animation: 'orbitCcw 10s linear infinite',
        }} />
        {/* Medium orbit — teal */}
        <div style={{
          position: 'absolute', width: 4, height: 4, borderRadius: '50%',
          background: 'radial-gradient(circle, #22d3ee 0%, rgba(6,182,212,0.3) 70%, transparent 100%)',
          boxShadow: '0 0 10px rgba(6,182,212,0.9), 0 0 24px rgba(6,182,212,0.4)',
          animation: 'orbit 14s linear infinite',
          animationDelay: '-4s',
        }} />
      </div>

      {/* ── LAYER 7: Frame lines ── */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 6 }}>
        <div style={{ position:'absolute',top:0,left:0,right:0,height:1, background:'linear-gradient(90deg, transparent 0%, rgba(245,158,11,0.8) 40%, rgba(234,88,12,0.5) 70%, transparent 100%)' }} />
        <div style={{ position:'absolute',bottom:0,left:0,right:0,height:1, background:'linear-gradient(90deg, transparent 0%, rgba(245,158,11,0.5) 50%, transparent 100%)' }} />
        {/* Corner accents */}
        <div style={{ position:'absolute',top:20,left:20,width:40,height:40,borderTop:'1px solid rgba(245,158,11,0.5)',borderLeft:'1px solid rgba(245,158,11,0.5)' }} />
        <div style={{ position:'absolute',top:20,right:20,width:40,height:40,borderTop:'1px solid rgba(245,158,11,0.5)',borderRight:'1px solid rgba(245,158,11,0.5)' }} />
        <div style={{ position:'absolute',bottom:20,left:20,width:40,height:40,borderBottom:'1px solid rgba(245,158,11,0.5)',borderLeft:'1px solid rgba(245,158,11,0.5)' }} />
        <div style={{ position:'absolute',bottom:20,right:20,width:40,height:40,borderBottom:'1px solid rgba(245,158,11,0.5)',borderRight:'1px solid rgba(245,158,11,0.5)' }} />
      </div>

      {/* ── LAYER 8: Scan line sweep ── */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 6, background:'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)', width:'220%' }}
        animate={{ x:['-110%','110%'] }}
        transition={{ duration:5, repeat:Infinity, ease:'linear', repeatDelay:12 }}
      />

      {/* ── LAYER 9: 3D Food showcase cards (desktop) ── */}
      <div
        className="absolute right-8 lg:right-16 xl:right-24 top-1/2 -translate-y-1/2 hidden lg:block"
        style={{ width:260, height:360, perspective:'700px', perspectiveOrigin:'50% 50%', zIndex:7 }}
      >
        {SHOWCASE.map((card, i) => (
          <motion.div
            key={i}
            className="absolute rounded-2xl overflow-hidden border"
            style={{
              width:200, height:240,
              left: 30 + card.x, top: 60 + card.y,
              borderColor:'rgba(245,158,11,0.30)',
              boxShadow:'0 16px 48px rgba(0,0,0,0.65), 0 0 0 1px rgba(245,158,11,0.12)',
              rotateZ: card.rotate, translateZ: card.z,
              transformStyle:'preserve-3d',
            }}
            initial={{ opacity:0, scale:0.7, rotateY:-30, translateZ: card.z - 60 }}
            animate={{
              opacity:1, scale:1,
              rotateY:[0,4,-4,0], translateZ:[card.z, card.z+14, card.z],
              y:[0,-12,0],
            }}
            transition={{
              opacity:  { delay:card.delay+0.4, duration:0.7 },
              scale:    { delay:card.delay+0.4, duration:0.7 },
              rotateY:  { delay:card.delay+1, duration:6+i,   repeat:Infinity, ease:'easeInOut' },
              translateZ:{ delay:card.delay+1, duration:4+i*0.5,repeat:Infinity, ease:'easeInOut' },
              y:        { delay:card.delay+1, duration:3+i*0.4,repeat:Infinity, ease:'easeInOut' },
            }}
            whileHover={{ scale:1.08, rotateY:0, zIndex:10 }}
          >
            <img src={card.url} alt={card.label} className="w-full h-full object-cover" loading="eager" />
            <div className="absolute bottom-0 left-0 right-0 px-3 py-2" style={{ background:'linear-gradient(to top, rgba(6,4,0,0.92) 0%, transparent 100%)' }}>
              <span className="text-brand text-xs font-black tracking-wider">{card.label}</span>
            </div>
            <div className="absolute inset-0" style={{ background:'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%)' }} />
          </motion.div>
        ))}
        <motion.div
          className="absolute bottom-0 left-1/2 -translate-x-1/2"
          style={{ width:180,height:40,background:'radial-gradient(ellipse, rgba(245,158,11,0.28) 0%, transparent 70%)',filter:'blur(12px)' }}
          animate={{ opacity:[0.5,1,0.5] }}
          transition={{ duration:3, repeat:Infinity, ease:'easeInOut' }}
        />
      </div>

      {/* ── LAYER 10: Main content ── */}
      <motion.div
        className="relative px-6 md:px-14 pb-16 pt-20 max-w-2xl"
        style={{ y:contentY, opacity:fadeOut, zIndex:8 }}
      >
        {/* Open / Closed + Hours */}
        <motion.div
          initial={{ opacity:0, x:-28 }} animate={{ opacity:1, x:0 }}
          transition={{ delay:0.1, duration:0.6 }}
          className="flex items-center flex-wrap gap-3 mb-6"
        >
          <span
            className="flex items-center gap-2 text-[11px] font-black px-3.5 py-1.5 rounded-full backdrop-blur-sm border"
            style={open ? {
              background:'rgba(16,185,129,0.15)', borderColor:'rgba(52,211,153,0.40)', color:'#34d399',
            } : {
              background:'rgba(239,68,68,0.12)', borderColor:'rgba(239,68,68,0.30)', color:'#f87171',
            }}
          >
            <motion.span
              animate={{ opacity: open ? [1,0.15,1] : 1 }}
              transition={{ repeat:Infinity, duration:1.0 }}
              className="w-2 h-2 rounded-full inline-block"
              style={{ background: open ? '#34d399' : '#f87171' }}
            />
            {open ? 'OPEN NOW' : 'CLOSED'}
          </span>
          <span
            className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm border"
            style={{ background:'rgba(245,158,11,0.10)', borderColor:'rgba(245,158,11,0.22)', color:'#d4a84b' }}
          >
            <Clock size={10} /> Today: {hours}
          </span>
        </motion.div>

        {/* Character-by-character title */}
        <h1 className="font-display leading-none tracking-wide mb-4" style={{ transformOrigin:'bottom left' }}>
          {[
            { word:"TJ'S",  cls:'text-white',         size:'clamp(3.2rem,10vw,7.5rem)', shadow:'0 4px 0 rgba(0,0,0,0.7)' },
            { word:'KEBAB', cls:'text-holographic',    size:'clamp(3.8rem,12vw,9rem)',   shadow:'none' },
            { word:'CENTRE',cls:'text-white',          size:'clamp(2.2rem,7vw,5.5rem)',  shadow:'0 4px 0 rgba(0,0,0,0.7)' },
          ].map((line, li) => (
            <div key={li} className="block overflow-hidden" style={{ lineHeight:1.02 }}>
              {line.word.split('').map((ch, ci) => (
                <motion.span
                  key={ci}
                  className={line.cls}
                  style={{ display:'inline-block', fontSize:line.size, textShadow:line.shadow, whiteSpace:'pre' }}
                  initial={{ y:'110%', opacity:0, rotateX:40 }}
                  animate={{ y:0, opacity:1, rotateX:0 }}
                  transition={{ delay:0.15 + li*0.12 + ci*0.035, duration:0.65, ease:[0.16,1,0.3,1] }}
                >
                  {ch}
                </motion.span>
              ))}
            </div>
          ))}
        </h1>

        {/* Subtitle + cycling dish */}
        <motion.div initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5, duration:0.5 }} className="mb-8">
          <p className="text-muted-warm text-sm sm:text-base max-w-sm leading-relaxed mb-2">
            Chargrilled meats, homemade sauces &amp; fresh salads — made fresh to order.{' '}
            <span className="text-brand font-semibold">Pickup only.</span>
          </p>
          <div className="flex items-center gap-2">
            <span className="text-muted/60 text-xs">Try today:</span>
            <AnimatePresence mode="wait">
              <motion.span
                key={dishIdx}
                initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
                transition={{ duration:0.3 }}
                className="text-brand text-xs font-bold"
              >
                {DISHES[dishIdx]}
              </motion.span>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.65, duration:0.45 }} className="flex items-center flex-wrap gap-3">
          <motion.button
            onClick={onCtaClick}
            whileHover={{ scale:1.07, boxShadow:'0 0 52px rgba(245,158,11,0.70), 0 8px 32px rgba(0,0,0,0.5)' }}
            whileTap={{ scale:0.93 }}
            className="group relative overflow-hidden flex items-center gap-2 font-black text-sm tracking-widest uppercase px-8 py-4 rounded-xl"
            style={{
              background:'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #ea580c 100%)',
              color:'#060400',
              boxShadow:'0 0 32px rgba(245,158,11,0.50), 0 4px 20px rgba(0,0,0,0.4)',
            }}
          >
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{ background:'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.40) 50%, transparent 100%)' }}
              animate={{ x:['-100%','220%'] }}
              transition={{ duration:1.5, repeat:Infinity, repeatDelay:2.2, ease:'easeInOut' }}
            />
            ORDER NOW
            <ChevronRight size={16} strokeWidth={3} className="group-hover:translate-x-1.5 transition-transform" />
          </motion.button>

          <div
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border"
            style={{ background:'rgba(255,255,255,0.05)', borderColor:'rgba(255,255,255,0.10)', backdropFilter:'blur(8px)' }}
          >
            {[...Array(5)].map((_,i) => <Star key={i} size={11} fill="#f59e0b" className="text-brand" />)}
            <span className="text-white text-xs font-bold ml-1">4.9</span>
            <span className="text-muted text-xs ml-0.5">· 200+ reviews</span>
          </div>
        </motion.div>
      </motion.div>

    </section>
  );
}
