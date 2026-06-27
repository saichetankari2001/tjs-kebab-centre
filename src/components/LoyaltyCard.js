import React from 'react';
import { motion } from 'framer-motion';

const TOTAL_STAMPS = 5;

export default function LoyaltyCard({ stamps = 0, freeOrderEligible = false }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-bold text-sm">Loyalty Stamps</h3>
          <p className="text-muted text-xs mt-0.5">
            {freeOrderEligible
              ? '🎉 You earned a FREE kebab + can!'
              : `${TOTAL_STAMPS - stamps} more order${TOTAL_STAMPS - stamps !== 1 ? 's' : ''} to go`}
          </p>
        </div>
        <span className="text-brand font-black text-xl">{stamps}/{TOTAL_STAMPS}</span>
      </div>

      <div className="flex items-center gap-2">
        {Array.from({ length: TOTAL_STAMPS }).map((_, i) => {
          const filled = i < stamps;
          return (
            <motion.div
              key={i}
              initial={false}
              animate={filled ? { scale: [1.2, 1] } : {}}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className={`flex-1 aspect-square rounded-xl flex items-center justify-center text-lg border-2 transition-colors ${
                filled ? 'bg-brand border-brand' : 'bg-card2 border-border'
              }`}
            >
              {filled ? (
                <motion.span
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="text-surface text-xl"
                >
                  🥙
                </motion.span>
              ) : (
                <span className="text-border text-xs font-black">{i + 1}</span>
              )}
            </motion.div>
          );
        })}

        <div className={`flex-1 aspect-square rounded-xl flex items-center justify-center border-2 ${
          freeOrderEligible
            ? 'bg-green-500/20 border-green-500 animate-pulse'
            : 'bg-card2 border-dashed border-brand/30'
        }`}>
          {freeOrderEligible ? (
            <span className="text-xl">🎁</span>
          ) : (
            <span className="text-brand/50 text-xs font-black">FREE</span>
          )}
        </div>
      </div>

      <div className="mt-4 h-1.5 bg-card2 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-brand rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(stamps / TOTAL_STAMPS) * 100}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      {freeOrderEligible && (
        <p className="text-green-400 text-xs text-center mt-3 font-semibold">
          Show this screen at the counter to claim your free kebab + can!
        </p>
      )}
    </div>
  );
}
