import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';

const ITEMS = [
  { id: 1,  url: '/images/wrap-chicken.jpg',   title: 'Chicken Kebab Wrap',     category: 'Wraps'   },
  { id: 2,  url: '/images/wrap-lamb.jpg',      title: 'Lamb Kebab Wrap',        category: 'Wraps'   },
  { id: 3,  url: '/images/wrap-beef.jpg',      title: 'Mixed Kebab Wrap',       category: 'Wraps'   },
  { id: 4,  url: '/images/chicken-skewers.jpg',title: 'Chargrilled Chicken',    category: 'Chicken' },
  { id: 5,  url: '/images/chicken-grill.jpg',  title: 'Chicken Skewers on BBQ', category: 'Chicken' },
  { id: 6,  url: '/images/wrap-lamb.jpg',      title: 'Chargrilled Lamb',       category: 'Lamb'    },
  { id: 7,  url: '/images/chicken-grill.jpg',  title: 'Lamb Skewers on Grill',  category: 'Lamb'    },
  { id: 8,  url: '/images/hsp-box.jpg',        title: 'HSP – Halal Snack Pack', category: 'HSP'     },
  { id: 9,  url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&q=80', title: 'Crispy Chips',  category: 'Chips'   },
  { id: 10, url: '/images/bowl-rice.jpg',      title: 'Chicken Rice Bowl',      category: 'Bowls'   },
  { id: 11, url: '/images/bowl-salad.jpg',     title: 'Chicken Salad Bowl',     category: 'Bowls'   },
  { id: 12, url: '/images/tabbouleh.jpg',      title: 'Fresh Tabbouleh',        category: 'Salads'  },
];

const CATEGORIES = ['All', ...new Set(ITEMS.map(i => i.category))];

function getColumns(w) {
  if (w < 640)  return 1;
  if (w < 1024) return 2;
  if (w < 1280) return 3;
  return 4;
}

const cardVariant = {
  hidden:  { opacity: 0, y: 24, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.48, ease: [0.16,1,0.3,1] } },
};

// 3D tilt card — mouse tracking per card
function TiltCard({ item, onClick }) {
  const ref  = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [shine, setShine] = useState({ x: 50, y: 50 });

  const onMouseMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;   // 0–1
    const py = (e.clientY - rect.top)  / rect.height;  // 0–1
    setTilt({ x: (py - 0.5) * -14, y: (px - 0.5) * 14 });
    setShine({ x: px * 100, y: py * 100 });
  };

  const onMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setShine({ x: 50, y: 50 });
  };

  return (
    <motion.div
      ref={ref}
      className="mb-4 break-inside-avoid"
      variants={cardVariant}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.12 }}
      style={{ perspective: 900 }}
    >
      <motion.div
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        animate={{ rotateX: tilt.x, rotateY: tilt.y }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        className="group relative cursor-pointer overflow-hidden rounded-2xl border"
        style={{
          borderColor: 'rgba(58,32,0,0.8)',
          background: '#1a0d00',
          transformStyle: 'preserve-3d',
        }}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onClick()}
      >
        <motion.img
          src={item.url}
          alt={item.title}
          className="w-full object-cover"
          style={{ aspectRatio: item.id % 3 === 0 ? '4/5' : item.id % 2 === 0 ? '1/1' : '4/3' }}
          whileHover={{ scale: 1.07 }}
          transition={{ duration: 0.45 }}
          loading="lazy"
        />

        {/* 3D shine layer follows mouse */}
        <div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${shine.x}% ${shine.y}%, rgba(255,255,255,0.10) 0%, transparent 60%)`,
          }}
        />

        {/* Hover overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ background: 'rgba(6,4,0,0.74)', backdropFilter: 'blur(4px)' }}
        >
          <ZoomIn size={32} className="text-white mb-2 opacity-90" />
          <h3 className="text-white font-bold text-base text-center px-3 mb-2">{item.title}</h3>
          <span
            className="text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded"
            style={{ background: 'rgba(245,158,11,0.20)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.35)' }}
          >
            {item.category}
          </span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

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
    <div className="min-h-screen px-4 py-14" style={{ background: 'transparent' }}>
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <span
            className="inline-block text-[11px] font-black tracking-widest uppercase px-3 py-1.5 rounded-full mb-4 border"
            style={{ background: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.30)', color: '#f59e0b' }}
          >
            Menu Gallery
          </span>
          <h2 className="text-4xl font-display tracking-wide text-white mb-3">OUR DELICIOUS MENU</h2>
          <p className="text-muted text-sm max-w-xl mx-auto">
            Chargrilled kebabs, signature bowls, HSP and more — all made fresh to order.
          </p>
        </motion.div>

        {/* Category filter */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-wrap justify-center gap-2 mb-10"
        >
          {CATEGORIES.map(cat => (
            <motion.button
              key={cat}
              onClick={() => setFilter(cat)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-xs font-bold px-4 py-2 rounded-full border transition-all"
              style={filter === cat ? {
                background: 'linear-gradient(135deg,#fbbf24,#f59e0b)',
                color: '#0d0600',
                borderColor: 'transparent',
                boxShadow: '0 2px 14px rgba(245,158,11,0.35)',
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

        {/* Masonry grid with 3D cards */}
        <div style={{ columnCount: columns, columnGap: '1rem' }}>
          {filtered.map(item => (
            <TiltCard
              key={item.id}
              item={item}
              onClick={() => setSelected(item.id)}
            />
          ))}
        </div>

        {/* Lightbox */}
        <AnimatePresence>
          {selected !== null && selectedItem && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4"
              style={{ background: 'rgba(0,0,0,0.94)' }}
              onClick={() => setSelected(null)}
              role="dialog"
              aria-modal="true"
            >
              <motion.div
                initial={{ scale: 0.78, opacity: 0, rotateY: -8 }}
                animate={{ scale: 1,    opacity: 1, rotateY: 0 }}
                exit={{ scale: 0.78,    opacity: 0, rotateY: 8 }}
                transition={{ type: 'spring', damping: 24, stiffness: 260 }}
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
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 text-white/80 hover:text-white rounded-full p-1.5 transition-colors"
                  style={{ background: 'rgba(0,0,0,0.55)' }}
                  aria-label="Previous"
                >
                  <ChevronLeft size={30} />
                </button>

                <button
                  onClick={e => { e.stopPropagation(); navLightbox(1); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-white/80 hover:text-white rounded-full p-1.5 transition-colors"
                  style={{ background: 'rgba(0,0,0,0.55)' }}
                  aria-label="Next"
                >
                  <ChevronRight size={30} />
                </button>

                <motion.img
                  key={selected}
                  src={selectedItem.url}
                  alt={selectedItem.title}
                  className="rounded-2xl"
                  style={{ maxHeight: '78vh', maxWidth: '88vw', objectFit: 'contain' }}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                />

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
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
