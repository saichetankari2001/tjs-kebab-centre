import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, AlertCircle, ChevronRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const AUTH_ERRORS = {
  'auth/user-not-found':    'No account found with this email.',
  'auth/wrong-password':    'Incorrect password.',
  'auth/invalid-email':     'Invalid email address.',
  'auth/too-many-requests': 'Too many attempts. Try again later.',
  'auth/invalid-credential':'Incorrect email or password.',
};

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const fadeUp  = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16,1,0.3,1] } } };

export default function LoginPage() {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  if (user) { navigate('/account'); return null; }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/account');
    } catch (err) {
      setError(AUTH_ERRORS[err.code] ?? 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4">

      {/* ── Cinematic background ── */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, #1e0e00 0%, #120800 40%, #0d0600 100%)' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 70% at 15% 30%, rgba(245,158,11,0.18) 0%, transparent 55%)' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 60% at 85% 70%, rgba(234,88,12,0.12) 0%, transparent 50%)' }} />

      {/* Food photo - left side desktop */}
      <div className="absolute left-0 top-0 bottom-0 w-1/2 hidden xl:block overflow-hidden">
        <motion.img
          src="/images/chicken-doner-kebab.jpg"
          alt="TJ's Food"
          className="w-full h-full object-cover"
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1.02, opacity: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{ filter: 'brightness(0.55)' }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, transparent 50%, rgba(13,6,0,1) 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(13,6,0,0.8) 0%, transparent 40%)' }} />
        <div className="absolute bottom-12 left-10">
          <span className="font-display text-5xl text-white block leading-none">TJ'S</span>
          <span className="font-display text-6xl leading-none" style={{ background: 'linear-gradient(135deg,#fbbf24,#ea580c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>KEBAB</span>
          <span className="font-display text-3xl text-white/80 block">CENTRE</span>
        </div>
      </div>

      {/* ── Login card ── */}
      <motion.div
        initial={{ opacity: 0, x: 40, rotateY: -8 }}
        animate={{ opacity: 1, x: 0, rotateY: 0 }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-sm xl:ml-auto xl:mr-24"
        style={{ perspective: 900 }}
      >
        <div
          className="rounded-2xl p-8 border"
          style={{
            background: 'linear-gradient(145deg, rgba(28,14,0,0.97) 0%, rgba(16,8,0,0.99) 100%)',
            borderColor: 'rgba(245,158,11,0.18)',
            boxShadow: '0 0 0 1px rgba(245,158,11,0.06), 0 40px 100px rgba(0,0,0,0.8), 0 0 80px rgba(245,158,11,0.07)',
          }}
        >
          {/* Top amber glow line */}
          <div className="absolute top-0 left-8 right-8 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.6), transparent)' }} />

          {/* Logo + title */}
          <motion.div
            variants={stagger} initial="hidden" animate="visible"
            className="text-center mb-8"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(234,88,12,0.1))', border: '1px solid rgba(245,158,11,0.25)' }}>
              <span className="text-3xl">🥙</span>
            </motion.div>
            <motion.h1 variants={fadeUp} className="font-display text-3xl text-white tracking-wide mb-1">WELCOME BACK</motion.h1>
            <motion.p variants={fadeUp} className="text-muted text-xs">Sign in to earn loyalty stamps &amp; track orders</motion.p>
          </motion.div>

          <motion.form
            variants={stagger} initial="hidden" animate="visible"
            onSubmit={handleSubmit}
            className="space-y-3"
          >
            <motion.div variants={fadeUp} className="relative">
              <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address" required
                className="w-full rounded-xl pl-10 pr-4 py-3.5 text-sm text-white placeholder-muted/60 outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(58,32,0,0.8)' }}
                onFocus={e => e.target.style.borderColor='rgba(245,158,11,0.45)'}
                onBlur={e  => e.target.style.borderColor='rgba(58,32,0,0.8)'}
              />
            </motion.div>

            <motion.div variants={fadeUp} className="relative">
              <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Password" required
                className="w-full rounded-xl pl-10 pr-4 py-3.5 text-sm text-white placeholder-muted/60 outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(58,32,0,0.8)' }}
                onFocus={e => e.target.style.borderColor='rgba(245,158,11,0.45)'}
                onBlur={e  => e.target.style.borderColor='rgba(58,32,0,0.8)'}
              />
            </motion.div>

            {error && (
              <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} className="flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)' }}>
                <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-xs">{error}</p>
              </motion.div>
            )}

            <motion.button
              variants={fadeUp}
              type="submit" disabled={loading}
              whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(245,158,11,0.45)' }}
              whileTap={{ scale: 0.97 }}
              className="relative w-full overflow-hidden font-black text-sm tracking-widest uppercase py-4 rounded-xl disabled:opacity-60 mt-2 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg,#fbbf24,#f59e0b,#ea580c)', color: '#060400' }}
            >
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)' }}
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
              />
              {loading ? 'Signing in...' : <><span>SIGN IN</span><ChevronRight size={14} /></>}
            </motion.button>
          </motion.form>

          <p className="text-center text-muted text-xs mt-6">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="text-brand font-semibold hover:text-brand-lit transition-colors">Create one →</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
