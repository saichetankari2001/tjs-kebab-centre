import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { getItemThumbnail } from '../utils/itemThumbnail';

function FlyingThumb({ src, startX, startY, onDone }) {
  const cartEl = document.querySelector('[data-cart-btn]');
  const cr = cartEl ? cartEl.getBoundingClientRect() : null;
  const tx = cr ? cr.left + cr.width / 2 - startX - 30 : window.innerWidth - startX - 80;
  const ty = cr ? cr.top  + cr.height / 2 - startY - 30 : 24 - startY;
  return createPortal(
    <motion.img
      src={src}
      alt=""
      style={{
        position: 'fixed', left: startX, top: startY,
        width: 60, height: 60, borderRadius: 12, zIndex: 9999,
        objectFit: 'cover', pointerEvents: 'none',
        filter: 'saturate(1.3) contrast(1.05)',
        boxShadow: '0 4px 20px rgba(245,158,11,0.5)',
      }}
      initial={{ x: 0, y: 0, scale: 1, opacity: 1, rotate: 0 }}
      animate={{ x: tx, y: ty, scale: 0.15, opacity: 0, rotate: 12 }}
      transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
      onAnimationComplete={onDone}
    />,
    document.body
  );
}

const itemVariant = {
  hidden:  { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] } },
};

export default function MenuItemRow({ item, onAdd }) {
  const displayPrice = item.saladPrice ?? item.price;
  const thumb = getItemThumbnail(item);

  const thumbRef = useRef(null);
  const [tilt,      setTilt]      = useState({ x: 0, y: 0 });
  const [shine,     setShine]     = useState({ x: 50, y: 50 });
  const [imgHidden, setImgHidden] = useState(false);
  const [flyPos,    setFlyPos]    = useState(null);

  const onMouseMove = (e) => {
    const el = thumbRef.current;
    if (!el) return;
    const r  = el.getBoundingClientRect();
    const px = (e.clientX - r.left)  / r.width;
    const py = (e.clientY - r.top)   / r.height;
    setTilt({ x: (py - 0.5) * -18, y: (px - 0.5) * 18 });
    setShine({ x: px * 100, y: py * 100 });
  };

  const onMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setShine({ x: 50, y: 50 });
  };

  return (
    <motion.div
      variants={itemVariant}
      className="flex items-center gap-4 px-4 py-4 cursor-pointer group relative"
      style={{
        minHeight: '100px',
        background: 'rgba(16,8,0,0.98)',
        borderBottom: '1px solid rgba(40,20,0,0.8)',
      }}
      whileHover={{ backgroundColor: 'rgba(245,158,11,0.05)' }}
      whileTap={{ scale: 0.987 }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onClick={() => onAdd(item)}
    >
      {/* Amber left accent bar — appears on hover */}
      <motion.div
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
        style={{ background: 'linear-gradient(180deg, #fbbf24, #ea580c)' }}
        initial={{ scaleY: 0, opacity: 0 }}
        whileHover={{ scaleY: 1, opacity: 1 }}
        transition={{ duration: 0.18 }}
      />

      {/* ── Left side: text info ── */}
      <div className="flex-1 min-w-0 pl-1">
        {/* Name + popular badge */}
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span
            className="font-semibold text-white leading-snug"
            style={{ fontSize: '15px' }}
          >
            {item.name}
          </span>
          {item.popular && (
            <span
              className="text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded uppercase flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#fbbf24,#ea580c)', color: '#060400' }}
            >
              Popular
            </span>
          )}
        </div>

        {/* Description */}
        {item.description && (
          <p
            className="text-muted text-xs leading-relaxed line-clamp-2"
            style={{ maxWidth: '32ch' }}
          >
            {item.description}
          </p>
        )}

        {/* Bowl salad/rice prices */}
        {item.itemType === 'bowl' && item.saladPrice && (
          <p className="text-[10px] mt-1 font-semibold" style={{ color: 'rgba(245,158,11,0.75)' }}>
            Salad ${item.saladPrice} · Rice ${item.ricePrice}
          </p>
        )}

        {/* HSP / chips size prices */}
        {(item.itemType === 'hsp' || item.itemType === 'chips') && item.sizePrices && (
          <p className="text-[10px] mt-1 font-semibold" style={{ color: 'rgba(245,158,11,0.75)' }}>
            {Object.entries(item.sizePrices).map(([s, p]) => `${s} $${p}`).join(' · ')}
          </p>
        )}

        {/* Price */}
        <p className="mt-1.5 font-black text-base" style={{ color: '#f59e0b' }}>
          {item.itemType === 'bowl'
            ? `from $${displayPrice}`
            : `$${Number(displayPrice).toFixed(2)}`}
        </p>
      </div>

      {/* ── Add button ── */}
      {flyPos && thumb && !imgHidden && (
        <FlyingThumb
          src={thumb}
          startX={flyPos.x}
          startY={flyPos.y}
          onDone={() => setFlyPos(null)}
        />
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          if (thumbRef.current) {
            const r = thumbRef.current.getBoundingClientRect();
            setFlyPos({ x: r.left, y: r.top });
          }
          onAdd(item);
        }}
        className="flex-shrink-0 flex items-center justify-center rounded-full hover:scale-110 active:scale-90 transition-transform"
        style={{
          width: '36px',
          height: '36px',
          background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
          boxShadow: '0 2px 10px rgba(245,158,11,0.35)',
        }}
      >
        <Plus size={15} strokeWidth={3} style={{ color: '#060400' }} />
      </button>

      {/* ── 3D tilt thumbnail ── */}
      {thumb && !imgHidden && (
        <motion.div
          ref={thumbRef}
          className="flex-shrink-0 rounded-xl overflow-hidden relative"
          style={{
            width: '88px',
            height: '88px',
            border: '1px solid rgba(50,25,0,0.9)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.65), 0 0 0 1px rgba(245,158,11,0.10)',
            perspective: 500,
            transformStyle: 'preserve-3d',
          }}
          animate={{ rotateX: tilt.x, rotateY: tilt.y }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          whileHover={{ scale: 1.10, boxShadow: '0 8px 28px rgba(0,0,0,0.6), 0 0 0 1px rgba(245,158,11,0.30)' }}
        >
          <img
            src={thumb}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
            style={{ filter: 'saturate(1.25) contrast(1.06) brightness(0.88)' }}
            onError={() => setImgHidden(true)}
          />

          {/* Warm overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, transparent 60%)' }}
          />

          {/* Mouse-tracking shine */}
          <div
            className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: `radial-gradient(circle at ${shine.x}% ${shine.y}%, rgba(255,255,255,0.18) 0%, transparent 65%)` }}
          />
        </motion.div>
      )}
    </motion.div>
  );
}
