import React from 'react';
import { cn } from '../lib/utils';

export default function HeroSection({ onCtaClick }) {
  return (
    <div className="relative h-[420px] md:h-[480px] overflow-hidden flex items-center justify-center text-center">
      {/* Ken-burns background image */}
      <div
        className="absolute inset-0 bg-cover bg-center animate-kenburns"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=1600&auto=format&q=80')`,
        }}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-[#111111]" />

      {/* Content */}
      <div className="relative z-10 px-6 py-16 max-w-2xl mx-auto">
        {/* Badge */}
        <div className="inline-block mb-5 px-5 py-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 text-amber-400 text-xs font-bold tracking-widest uppercase">
          Bundoora's Finest · Halal Certified
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight mb-3">
          TJ's Kebab<br />
          <span className="text-amber-400">Centre</span>
        </h1>

        <p className="text-white/80 text-base mb-8 leading-relaxed">
          Real Flavour. Real Food.<br />
          Fresh Chargrilled Halal Kebabs.
        </p>

        {/* Badges row */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {['Halal Certified', 'Bundoora VIC', 'Fresh Daily', 'Pickup Ready'].map(b => (
            <span key={b} className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-semibold">
              {b}
            </span>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={onCtaClick}
          className="px-10 py-4 bg-amber-500 hover:bg-amber-400 text-charcoal-900 font-extrabold text-base rounded-xl shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
          style={{ color: '#111111' }}
        >
          ORDER NOW →
        </button>
      </div>
    </div>
  );
}
