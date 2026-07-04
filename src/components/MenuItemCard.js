import React, { useState, useRef, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import { useCart } from '../context/CartContext';
import ItemModal from './ItemModal';

export default function MenuItemCard({ item, index = 0 }) {
  const { cart } = useCart();
  const [modalOpen, setModalOpen] = useState(false);
  const qty = cart.filter(c => c.baseId === item.id).reduce((s, c) => s + c.qty, 0);

  // 3D magnetic tilt — tracks mouse relative to card centre
  const cardRef = useRef(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springCfg = { stiffness: 280, damping: 30, mass: 0.6 };
  const rotateX = useSpring(useTransform(rawY, [-0.5, 0.5], [10, -10]), springCfg);
  const rotateY = useSpring(useTransform(rawX, [-0.5, 0.5], [-10, 10]), springCfg);
  const glowX   = useSpring(useTransform(rawX, [-0.5, 0.5], [0, 100]), springCfg);
  const glowY   = useSpring(useTransform(rawY, [-0.5, 0.5], [0, 100]), springCfg);

  const handleMouseMove = useCallback((e) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    rawX.set((e.clientX - rect.left) / rect.width - 0.5);
    rawY.set((e.clientY - rect.top)  / rect.height - 0.5);
  }, [rawX, rawY]);

  const handleMouseLeave = useCallback(() => {
    rawX.set(0);
    rawY.set(0);
  }, [rawX, rawY]);

  return (
    <>
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.4, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={() => setModalOpen(true)}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          perspective: 800,
        }}
        className={cn(
          'relative bg-card rounded-2xl overflow-hidden cursor-pointer group card-glow',
          'border transition-colors duration-200',
          qty > 0 ? 'border-brand/50' : 'border-border hover:border-brand/40'
        )}
        whileTap={{ scale: 0.97 }}
      >
        {/* Dynamic specular highlight that follows cursor */}
        <motion.div
          className="absolute inset-0 pointer-events-none z-10 rounded-2xl"
          style={{
            background: useTransform(
              [glowX, glowY],
              ([gx, gy]) =>
                `radial-gradient(circle at ${gx}% ${gy}%, rgba(245,158,11,0.18) 0%, rgba(234,88,12,0.08) 30%, transparent 65%)`
            ),
          }}
        />

        {/* Food photo */}
        {item.image ? (
          <div className="w-full aspect-video overflow-hidden">
            <motion.img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover"
              style={{ scale: useSpring(useTransform(rawY, [-0.5, 0.5], [1.06, 1.0]), springCfg) }}
            />
          </div>
        ) : (
          <div className="w-full aspect-video bg-card2 flex items-center justify-center overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-brand/5 via-transparent to-brand-deep/5" />
            <span className="text-5xl opacity-20 group-hover:opacity-30 transition-opacity">🥙</span>
          </div>
        )}

        {/* Popular badge */}
        {item.popular && (
          <div
            className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-black text-surface tracking-wide"
            style={{ background: 'linear-gradient(135deg,#fbbf24,#ea580c)', boxShadow: '0 2px 12px rgba(245,158,11,0.4)' }}
          >
            ★ POPULAR
          </div>
        )}

        {/* Qty badge */}
        {qty > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-2 right-2 w-6 h-6 bg-brand rounded-full flex items-center justify-center text-xs font-black text-surface shadow shadow-brand/40"
          >
            {qty}
          </motion.div>
        )}

        {/* Bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none bg-gradient-to-t from-card via-card/60 to-transparent" />

        {/* Card body — lifted in Z for depth feel */}
        <div className="relative p-4" style={{ transform: 'translateZ(8px)' }}>
          <h3 className="text-white font-semibold text-sm leading-snug mb-1">{item.name}</h3>
          {item.description && (
            <p className="text-muted text-xs leading-relaxed line-clamp-2 mb-3">{item.description}</p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-brand font-bold text-base">${item.price.toFixed(2)}</span>
            <motion.div
              whileTap={{ scale: 0.88 }}
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow',
                qty > 0
                  ? 'bg-brand shadow-brand/30'
                  : 'bg-card2 group-hover:bg-brand/20'
              )}
            >
              <Plus size={16} className={qty > 0 ? 'text-surface' : 'text-brand'} />
            </motion.div>
          </div>
        </div>
      </motion.div>

      <ItemModal item={item} isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
