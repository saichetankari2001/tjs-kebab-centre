import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Star } from 'lucide-react';
import { HERO_PHOTO } from '../data/menu';

export default function HeroSection({ onCtaClick }) {
  return (
    <section className="relative w-full h-[60vw] max-h-[560px] min-h-[300px] overflow-hidden">
      {/* Background photo */}
      <motion.img
        src={HERO_PHOTO}
        alt="TJ's Kebab Centre"
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
        initial={{ scale: 1.06 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
      />

      {/* Layered warm overlays — gives the food a golden lamp feel */}
      <div className="absolute inset-0 bg-gradient-to-b from-surface/60 via-surface/40 to-surface" />
      <div className="absolute inset-0 bg-gradient-to-r from-surface/80 via-surface/30 to-transparent" />
      {/* Warm amber glow in bottom-left corner */}
      <div className="absolute bottom-0 left-0 w-2/3 h-2/3 bg-gradient-to-tr from-brand/12 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-center px-6 md:px-12 max-w-3xl">

        {/* Tag line */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="flex items-center gap-2 mb-4"
        >
          <span className="flex items-center gap-1.5 text-brand font-bold text-xs tracking-[3px] uppercase border border-brand/30 bg-brand/8 px-3 py-1.5 rounded-full backdrop-blur-sm">
            <Star size={10} fill="currentColor" />
            Real Flavour · Real Good
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.55 }}
          className="font-display text-6xl sm:text-7xl md:text-8xl leading-none tracking-wide mb-4"
        >
          <span className="text-white">TJ'S</span><br />
          <span className="text-gradient-brand">KEBAB</span>
          <span className="text-white"> CENTRE</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.5 }}
          className="text-muted-warm text-sm sm:text-base mb-7 max-w-sm leading-relaxed"
        >
          Chargrilled meats, homemade sauces &amp; fresh salads — made to order.
          <span className="text-brand font-semibold"> Pickup only.</span>
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.38, duration: 0.4 }}
          className="flex items-center gap-3"
        >
          <motion.button
            onClick={onCtaClick}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-2 bg-brand text-surface font-black text-sm tracking-wide px-7 py-3.5 rounded-xl hover:bg-brand-lit transition-colors shadow-lg shadow-brand/30"
          >
            ORDER NOW
            <ChevronDown size={16} strokeWidth={3} />
          </motion.button>

          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-muted text-xs font-medium hidden sm:block"
          >
            🏃 Pickup ready in ~15 min
          </motion.span>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-surface to-transparent" />
    </section>
  );
}
