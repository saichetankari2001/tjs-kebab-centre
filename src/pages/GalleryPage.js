import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';

const ITEMS = [
  { id: 1,  url: '/images/chicken-doner-kebab.jpg',       title: 'Chicken Kebab Wrap',     category: 'Wraps'   },
  { id: 2,  url: '/images/Lamb-Kebab.jpg',                title: 'Lamb Kebab Wrap',        category: 'Wraps'   },
  { id: 3,  url: '/images/Mixed-kebab.jpg',               title: 'Mixed Kebab Wrap',       category: 'Wraps'   },
  { id: 4,  url: '/images/Chargrilled-ChickenSkewer.jpg', title: 'Chargrilled Chicken',    category: 'Chicken' },
  { id: 5,  url: '/images/Chargrilled-ChickenSkewer.jpg', title: 'Chicken Skewers on BBQ', category: 'Chicken' },
  { id: 6,  url: '/images/Chargrilled-LambSkewer.jpg',    title: 'Chargrilled Lamb',       category: 'Lamb'    },
  { id: 7,  url: '/images/Chargrilled-LambSkewer.jpg',    title: 'Lamb Skewers on Grill',  category: 'Lamb'    },
  { id: 8,  url: '/images/HSP.jpg',                       title: 'HSP – Halal Snack Pack', category: 'HSP'     },
  { id: 9,  url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80',
            title: 'Crispy Chips',                                                          category: 'Chips'   },
  { id: 10, url: '/images/RiceBowl.jpg',                  title: 'Chicken Rice Bowl',      category: 'Bowls'   },
  { id: 11, url: '/images/SalaBowl.jpg',                  title: 'Chicken Salad Bowl',     category: 'Bowls'   },
  { id: 12, url: '/images/Tabouli.jpg',                   title: 'Fresh Tabbouleh',        category: 'Salads'  },
];

const CATEGORIES = ['All', ...new Set(ITEMS.map(i => i.category))];

/* floating orb config */
const ORBS = [
  { w: 520, h: 520, top: '2%',  left: '-8%', color: 'rgba(245,158,11,0.10)', dur: 20, delay: 0   },
  { w: 380, h: 380, top: '40%', left: '75%', color: 'rgba(234,88,12,0.09)',  dur: 25, delay: 5   },
  { w: 300, h: 300, top: '70%', left: '20%', color: 'rgba(245,158,11,0.07)', dur: 18, delay: 8   },
  { w: 260, h: 260, top: '15%', left: '55%', color: 'rgba(234,88,12,0.06)',  dur: 22, delay: 12  },
  { w: 180, h: 180, top: '85%', left: '80%', color: 'rgba(251,191,36,0.08)', dur: 15, delay: 3   },
];

/* tiny floating sparks */
const SPARKS = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: `${Math.random() * 100}%`,
  size: Math.random() * 3 + 1.5,
  dur:  Math.random() * 10 + 8,
  delay: Math.random() * 12,
  opacity: Math.random() * 0.35 + 0.1,
}));

function getColumns(w) {
  if (w < 640)  return 1;
  if (w < 1024) return 2;
  if (w < 1280) return 3;
  return 4;
}

const cardVariant = {
  hidden:  { opacity: 0, y: 32, scale: 0.93 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.16,1,0.3,1] } },
};

/* ── 3D tilt card — photo always visible, info at bottom ── */
function TiltCard({ item, onClick }) {
  const ref = useRef(null);
  const [tilt,  setTilt]  = useState({ x: 0, y: 0 });
  const [shine, setShine] = useState({ x: 50, y: 50 });
  const [hover, setHover] = useState(false);

  const onMouseMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top)  / r.height;
    setTilt({ x: (py - 0.5) * -16, y: (px - 0.5) * 16 });
    setShine({ x: px * 100, y: py * 100 });
  };
  const onMouseLeave = () => { setTilt({ x: 0, y: 0 }); setShine({ x: 50, y: 50 }); setHover(false); };

  return (
    <motion.div
      ref={ref}
      className="mb-4 break-inside-avoid"
      variants={cardVariant}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      style={{ perspective: 900 }}
    >
      <motion.div
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onHoverStart={() => setHover(true)}
        onHoverEnd={() => setHover(false)}
        animate={{ rotateX: tilt.x, rotateY: tilt.y }}
        transition={{ type: 'spring', stiffness: 340, damping: 26 }}
        whileHover={{ scale: 1.03 }}
        className="relative cursor-pointer overflow-hidden rounded-2xl"
        style={{
          transformStyle: 'preserve-3d',
          border: hover
            ? '1px solid rgba(245,158,11,0.55)'
            : '1px solid rgba(58,32,0,0.75)',
          boxShadow: hover
            ? '0 12px 50px rgba(245,158,11,0.28), 0 0 0 1px rgba(245,158,11,0.12) inset'
            : '0 6px 30px rgba(0,0,0,0.5)',
          transition: 'border-color 0.3s, box-shadow 0.3s',
        }}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onClick()}
      >
        {/* Photo — always fully visible */}
        <motion.img
          src={item.url}
          alt={item.title}
          className="w-full object-cover"
          style={{ aspectRatio: item.id % 3 === 0 ? '4/5' : item.id % 2 === 0 ? '1/1' : '4/3', display: 'block' }}
          animate={{ scale: hover ? 1.06 : 1 }}
          transition={{ duration: 0.5 }}
          loading="lazy"
        />

        {/* Shine layer */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `radial-gradient(circle at ${shine.x}% ${shine.y}%, rgba(255,210,100,0.13) 0%, transparent 60%)`,
          opacity: hover ? 1 : 0,
          transition: 'opacity 0.3s',
        }} />

        {/* Bottom gradient + always-visible title */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(6,4,0,0.90) 0%, rgba(6,4,0,0.55) 40%, transparent 100%)', padding: '32px 14px 13px' }}>
          <p style={{ color: '#fff', fontWeight: 700, fontSize: 13, marginBottom: 5, lineHeight: 1.3 }}>{item.title}</p>
          <span style={{
            fontSize: 9, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase',
            padding: '3px 8px', borderRadius: 4,
            background: 'rgba(245,158,11,0.22)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.38)',
          }}>
            {item.category}
          </span>
        </div>

        {/* Hover: zoom button (top-right) */}
        <AnimatePresence>
          {hover && (
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.18 }}
              className="absolute top-3 right-3 flex items-center justify-center rounded-full"
              style={{ width: 36, height: 36, background: 'rgba(245,158,11,0.95)', boxShadow: '0 2px 16px rgba(245,158,11,0.5)' }}
            >
              <ZoomIn size={16} color="#0d0600" strokeWidth={2.5} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

/* ── Main page ── */
export default function GalleryPage() {
  const [filter,   setFilter]   = useState('All');
  const [selected, setSelected] = useState(null);
  const [columns,  setColumns]  = useState(3);

  useEffect(() => {
    const onResize = () => setColumns(getColumns(window.innerWidth));
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const filtered     = filter === 'All' ? ITEMS : ITEMS.filter(i => i.category === filter);
  const selectedItem = ITEMS.find(i => i.id === selected);

  const navLightbox = useCallback((dir) => {
    if (selected === null) return;
    const idx  = ITEMS.findIndex(i => i.id === selected);
    const next = (idx + dir + ITEMS.length) % ITEMS.length;
    setSelected(ITEMS[next].id);
  }, [selected]);

  useEffect(() => {
    const onKey = (e) => {
      if (selected === null) return;
      if (e.key === 'ArrowRight') navLightbox(1);
      if (e.key === 'ArrowLeft')  navLightbox(-1);
      if (e.key === 'Escape')     setSelected(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, navLightbox]);

  return (
    <div className="relative min-h-screen px-4 py-14 overflow-hidden" style={{ background: 'transparent' }}>

      {/* ── Animated background atmosphere ── */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>

        {/* Animated glow orbs */}
        {ORBS.map((orb, i) => (
          <motion.div
            key={i}
            animate={{
              x: [0, orb.w * 0.06, -orb.w * 0.04, 0],
              y: [0, -orb.h * 0.08, orb.h * 0.05, 0],
              scale: [1, 1.08, 0.95, 1],
            }}
            transition={{ duration: orb.dur, repeat: Infinity, ease: 'easeInOut', delay: orb.delay }}
            style={{
              position: 'absolute',
              top: orb.top, left: orb.left,
              width: orb.w, height: orb.h,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${orb.color} 0%, transparent 72%)`,
              filter: 'blur(55px)',
            }}
          />
        ))}

        {/* Floating sparks */}
        {SPARKS.map(s => (
          <motion.div
            key={s.id}
            style={{
              position: 'absolute',
              left: s.x,
              bottom: '-10px',
              width: s.size,
              height: s.size,
              borderRadius: '50%',
              background: 'rgba(245,158,11,0.7)',
              boxShadow: '0 0 6px rgba(245,158,11,0.5)',
            }}
            animate={{
              y: [0, -(window.innerHeight + 20)],
              opacity: [0, s.opacity, s.opacity, 0],
              x: [0, Math.sin(s.id) * 40],
            }}
            transition={{
              duration: s.dur,
              repeat: Infinity,
              delay: s.delay,
              ease: 'linear',
            }}
          />
        ))}

        {/* Subtle dot grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(245,158,11,0.08) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)',
        }} />

        {/* Top radial glow */}
        <div style={{
          position: 'absolute', top: '-15%', left: '50%', transform: 'translateX(-50%)',
          width: 700, height: 400, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(245,158,11,0.07) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }} />
      </div>

      {/* ── Content ── */}
      <div className="relative mx-auto max-w-7xl" style={{ zIndex: 1 }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-block text-[11px] font-black tracking-widest uppercase px-3 py-1.5 rounded-full mb-4 border"
            style={{ background: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.30)', color: '#f59e0b' }}
          >
            Menu Gallery
          </motion.span>
          <h2 className="text-4xl font-display tracking-wide text-white mb-3">OUR DELICIOUS MENU</h2>
          <p className="text-muted text-sm max-w-xl mx-auto">
            Chargrilled kebabs, signature bowls, HSP and more — all made fresh to order.
          </p>
          {/* Decorative line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.4, duration: 0.7, ease: [0.16,1,0.3,1] }}
            style={{
              height: 2, width: 80, margin: '18px auto 0', borderRadius: 2, originX: 0.5,
              background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.8), transparent)',
            }}
          />
        </motion.div>

        {/* Category filter */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap justify-center gap-2 mb-10"
        >
          {CATEGORIES.map(cat => (
            <motion.button
              key={cat}
              onClick={() => setFilter(cat)}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              className="text-xs font-bold px-4 py-2 rounded-full border transition-all"
              style={filter === cat ? {
                background: 'linear-gradient(135deg,#fbbf24,#f59e0b)',
                color: '#0d0600',
                borderColor: 'transparent',
                boxShadow: '0 2px 18px rgba(245,158,11,0.4)',
              } : {
                background: 'rgba(245,158,11,0.06)',
                color: '#9c8a72',
                borderColor: 'rgba(58,32,0,0.8)',
              }}
            >
              {cat}
            </motion.button>
          ))}
        </motion.div>

        {/* Masonry grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={filter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ columnCount: columns, columnGap: '1rem' }}
          >
            {filtered.map(item => (
              <TiltCard key={item.id} item={item} onClick={() => setSelected(item.id)} />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Lightbox */}
        <AnimatePresence>
          {selected !== null && selectedItem && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4"
              style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)' }}
              onClick={() => setSelected(null)}
              role="dialog"
              aria-modal="true"
            >
              <motion.div
                initial={{ scale: 0.75, opacity: 0, rotateY: -10 }}
                animate={{ scale: 1,    opacity: 1, rotateY: 0  }}
                exit={{ scale: 0.75,    opacity: 0, rotateY: 10 }}
                transition={{ type: 'spring', damping: 22, stiffness: 240 }}
                onClick={e => e.stopPropagation()}
                className="relative"
                style={{ maxWidth: '90vw', maxHeight: '90vh', perspective: 1000 }}
              >
                <button
                  onClick={() => setSelected(null)}
                  className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors"
                  aria-label="Close"
                >
                  <X size={26} />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); navLightbox(-1); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 text-white/80 hover:text-brand rounded-full p-1.5 transition-colors"
                  style={{ background: 'rgba(0,0,0,0.6)' }}
                  aria-label="Previous"
                >
                  <ChevronLeft size={30} />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); navLightbox(1); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-white/80 hover:text-brand rounded-full p-1.5 transition-colors"
                  style={{ background: 'rgba(0,0,0,0.6)' }}
                  aria-label="Next"
                >
                  <ChevronRight size={30} />
                </button>

                <motion.img
                  key={selected}
                  src={selectedItem.url}
                  alt={selectedItem.title}
                  className="rounded-2xl"
                  style={{ maxHeight: '78vh', maxWidth: '88vw', objectFit: 'contain', boxShadow: '0 20px 80px rgba(245,158,11,0.25)' }}
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.28 }}
                />

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 }}
                  className="mt-4 text-center"
                >
                  <p className="text-white font-bold text-lg mb-2">{selectedItem.title}</p>
                  <span
                    className="text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full"
                    style={{ background: 'rgba(245,158,11,0.20)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.35)' }}
                  >
                    {selectedItem.category}
                  </span>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
