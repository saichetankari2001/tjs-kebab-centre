import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';

const ITEMS = [
  { id: 1,  url: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=800&q=80',  title: 'Kebab Wrap',             category: 'Wraps'    },
  { id: 2,  url: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=800&q=80',  title: 'Chicken Kebab',          category: 'Wraps'    },
  { id: 3,  url: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800&q=80',  title: 'Chargrilled Chicken',    category: 'Chicken'  },
  { id: 4,  url: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800&q=80',  title: 'Chicken Skewers',        category: 'Chicken'  },
  { id: 5,  url: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&q=80',  title: 'Chargrilled Lamb',       category: 'Lamb'     },
  { id: 6,  url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',     title: 'Lamb Kebab',             category: 'Lamb'     },
  { id: 7,  url: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=800&q=80',  title: 'HSP – Halal Snack Pack', category: 'HSP'      },
  { id: 8,  url: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=800&q=80',  title: 'HSP Special',            category: 'HSP'      },
  { id: 9,  url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&q=80',  title: 'Crispy Chips',           category: 'Chips'    },
  { id: 10, url: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&q=80',     title: 'Loaded Chips',           category: 'Loaded'   },
  { id: 11, url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',  title: 'Signature Bowl',         category: 'Bowls'    },
  { id: 12, url: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80',     title: 'Fresh Falafel',          category: 'Falafel'  },
];

const CATEGORIES = ['All', ...new Set(ITEMS.map(i => i.category))];

function getColumns(w) {
  if (w < 640)  return 1;
  if (w < 1024) return 2;
  if (w < 1280) return 3;
  return 4;
}

const cardVariant = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

export default function GalleryPage() {
  const [filter,    setFilter]    = useState('All');
  const [selected,  setSelected]  = useState(null);
  const [columns,   setColumns]   = useState(3);

  useEffect(() => {
    const onResize = () => setColumns(getColumns(window.innerWidth));
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const filtered = filter === 'All' ? ITEMS : ITEMS.filter(i => i.category === filter);
  const selectedItem = ITEMS.find(i => i.id === selected);

  const navigate = useCallback((dir) => {
    if (selected === null) return;
    const idx = ITEMS.findIndex(i => i.id === selected);
    const next = (idx + dir + ITEMS.length) % ITEMS.length;
    setSelected(ITEMS[next].id);
  }, [selected]);

  useEffect(() => {
    const onKey = (e) => {
      if (selected === null) return;
      if (e.key === 'ArrowRight') navigate(1);
      if (e.key === 'ArrowLeft')  navigate(-1);
      if (e.key === 'Escape')     setSelected(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, navigate]);

  return (
    <div className="min-h-screen px-4 py-14" style={{ background: 'transparent' }}>
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-wrap justify-center gap-2 mb-10"
        >
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className="text-xs font-bold px-4 py-2 rounded-full border transition-all"
              style={filter === cat ? {
                background: 'linear-gradient(135deg,#fbbf24,#f59e0b)',
                color: '#0d0600',
                borderColor: 'transparent',
                boxShadow: '0 2px 12px rgba(245,158,11,0.30)',
              } : {
                background: 'rgba(245,158,11,0.05)',
                color: '#9c8a72',
                borderColor: 'rgba(58,32,0,0.8)',
              }}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* Masonry grid */}
        <div style={{ columnCount: columns, columnGap: '1rem' }}>
          {filtered.map(item => (
            <motion.div
              key={item.id}
              className="mb-4 break-inside-avoid"
              variants={cardVariant}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
            >
              <div
                className="group relative cursor-pointer overflow-hidden rounded-2xl border"
                style={{ borderColor: 'rgba(58,32,0,0.8)', background: '#1a0d00' }}
                onClick={() => setSelected(item.id)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setSelected(item.id)}
              >
                <motion.img
                  src={item.url}
                  alt={item.title}
                  className="w-full object-cover"
                  style={{ aspectRatio: item.id % 3 === 0 ? '4/5' : item.id % 2 === 0 ? '1/1' : '4/3' }}
                  whileHover={{ scale: 1.06 }}
                  transition={{ duration: 0.4 }}
                  loading="lazy"
                />
                {/* Hover overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.22 }}
                  className="absolute inset-0 flex flex-col items-center justify-center"
                  style={{ background: 'rgba(6,4,0,0.72)', backdropFilter: 'blur(4px)' }}
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
              </div>
            </motion.div>
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
              style={{ background: 'rgba(0,0,0,0.92)' }}
              onClick={() => setSelected(null)}
              role="dialog"
              aria-modal="true"
            >
              <motion.div
                initial={{ scale: 0.82, opacity: 0 }}
                animate={{ scale: 1,    opacity: 1 }}
                exit={{ scale: 0.82,    opacity: 0 }}
                transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                onClick={e => e.stopPropagation()}
                className="relative"
                style={{ maxWidth: '90vw', maxHeight: '90vh' }}
              >
                {/* Close */}
                <button
                  onClick={() => setSelected(null)}
                  className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors"
                  aria-label="Close"
                >
                  <X size={26} />
                </button>

                {/* Prev */}
                <button
                  onClick={e => { e.stopPropagation(); navigate(-1); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 text-white/80 hover:text-white rounded-full p-1 transition-colors"
                  style={{ background: 'rgba(0,0,0,0.5)' }}
                  aria-label="Previous"
                >
                  <ChevronLeft size={30} />
                </button>

                {/* Next */}
                <button
                  onClick={e => { e.stopPropagation(); navigate(1); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-white/80 hover:text-white rounded-full p-1 transition-colors"
                  style={{ background: 'rgba(0,0,0,0.5)' }}
                  aria-label="Next"
                >
                  <ChevronRight size={30} />
                </button>

                {/* Image */}
                <motion.img
                  key={selected}
                  src={selectedItem.url}
                  alt={selectedItem.title}
                  className="rounded-2xl"
                  style={{ maxHeight: '78vh', maxWidth: '88vw', objectFit: 'contain' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.22 }}
                />

                {/* Caption */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
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
