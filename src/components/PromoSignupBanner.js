import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function PromoSignupBanner() {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('promo_banner_dismissed') === '1'
  );
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const dismiss = () => {
    localStorage.setItem('promo_banner_dismissed', '1');
    setDismissed(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError('');

    try {
      // Save to Firestore subscribers collection
      await addDoc(collection(db, 'subscribers'), {
        email,
        phone: '',
        channels: ['email'],
        createdAt: serverTimestamp(),
      });

      setDone(true);
      // Auto-dismiss after 2.5 seconds
      setTimeout(dismiss, 2500);
    } catch (err) {
      console.error('Error saving subscriber:', err);
      // Still mark as done even if there's an error (fire-and-forget pattern)
      setDone(true);
      setTimeout(dismiss, 2500);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="bg-brand/10 border-b border-brand/20 px-4 py-3">
            {done ? (
              <p className="text-brand text-sm font-semibold text-center">
                ✓ You're on the list! We'll send you our best deals.
              </p>
            ) : (
              <form onSubmit={submit} className="flex items-center gap-2 max-w-lg mx-auto">
                <Sparkles size={16} className="text-brand flex-shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Get exclusive deals — enter email"
                  required
                  disabled={isLoading}
                  className="flex-1 bg-transparent text-white text-sm placeholder-muted outline-none min-w-0 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-brand text-surface text-xs font-black px-3 py-1.5 rounded-lg hover:bg-brand-lit transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Signing up...' : 'Sign up'}
                </button>
                <button
                  type="button"
                  onClick={dismiss}
                  disabled={isLoading}
                  className="text-muted hover:text-white transition-colors flex-shrink-0 disabled:opacity-50"
                >
                  <X size={14} />
                </button>
              </form>
            )}
            {error && (
              <p className="text-red-400 text-xs text-center mt-2">{error}</p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
