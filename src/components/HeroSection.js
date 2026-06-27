import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { HERO_PHOTO } from '../data/menu';

export default function HeroSection({ onCtaClick }) {
  return (
    <section className="relative w-full h-[56vw] max-h-[520px] min-h-[280px] overflow-hidden">
      {/* Background photo */}
      <img
        src={HERO_PHOTO}
        alt="TJ's Kebab Centre"
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
      />

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-surface/70 via-surface/50 to-surface" />
      <div className="absolute inset-0 bg-gradient-to-r from-surface/60 to-transparent" />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-center px-6 md:px-12 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <span className="inline-block text-brand font-bold text-xs tracking-[3px] uppercase mb-3 border border-brand/40 px-3 py-1 rounded-full">
            Real Flavour · Real Good
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="font-display text-5xl sm:text-7xl md:text-8xl text-white leading-none tracking-wide mb-4"
        >
          TJ'S<br />
          <span className="text-brand">KEBAB</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-muted text-sm sm:text-base mb-6 max-w-sm leading-relaxed"
        >
          Chargrilled meats, homemade sauces &amp; fresh salads — made to order. Pickup only.
        </motion.p>

        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          onClick={onCtaClick}
          className="flex items-center gap-2 bg-brand text-surface font-black text-sm tracking-wide px-6 py-3 rounded-xl w-fit hover:bg-brand-lit transition-all active:scale-95 shadow-lg shadow-brand/20"
        >
          ORDER NOW
          <ChevronDown size={16} strokeWidth={3} />
        </motion.button>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-surface to-transparent" />
    </section>
  );
}
