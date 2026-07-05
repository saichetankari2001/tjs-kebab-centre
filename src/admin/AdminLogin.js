import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import TileGridScene from '../components/TileGridScene';

export default function AdminLogin() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [focused, setFocused]   = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      setError('Invalid credentials. Please try again.');
    }
    setLoading(false);
  };

  const fieldStyle = (field) => ({
    width: '100%',
    boxSizing: 'border-box',
    background: focused === field ? 'rgba(245,158,11,0.05)' : 'rgba(255,255,255,0.04)',
    border: `1.5px solid ${focused === field ? 'rgba(245,158,11,0.7)' : 'rgba(255,255,255,0.12)'}`,
    borderRadius: 10,
    color: '#f1f5f9',
    padding: '13px 16px',
    fontSize: 14,
    outline: 'none',
    fontFamily: 'Inter, sans-serif',
    letterSpacing: 0.3,
    transition: 'all 0.2s',
    boxShadow: focused === field ? '0 0 0 3px rgba(245,158,11,0.1)' : 'none',
  });

  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      background: '#0d1117',
    }}>
      {/* 3D tile grid — fills the whole background */}
      <TileGridScene />

      {/* Subtle gradient overlay so card sits cleanly on top */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 70% at 50% 50%, rgba(13,17,23,0.22) 0%, rgba(13,17,23,0.52) 100%)',
      }} />

      {/* Screen corner brackets */}
      {[
        { top: 24, left: 24, v: 'top',    h: 'left'  },
        { top: 24, right: 24, v: 'top',   h: 'right' },
        { bottom: 24, left: 24, v: 'bottom', h: 'left'  },
        { bottom: 24, right: 24, v: 'bottom', h: 'right' },
      ].map(({ v, h, ...pos }, i) => (
        <div key={i} style={{ position: 'fixed', width: 36, height: 36, zIndex: 20, pointerEvents: 'none', ...pos }}>
          <div style={{ position: 'absolute', [v]: 0, [h]: 0, width: 22, height: 2, background: '#f59e0b', opacity: 0.7 }} />
          <div style={{ position: 'absolute', [v]: 0, [h]: 0, width: 2, height: 22, background: '#f59e0b', opacity: 0.7 }} />
        </div>
      ))}

      {/* ── Login card ── */}
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1.4, delay: 2.2, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: 420,
          background: 'rgba(15, 23, 42, 0.82)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20,
          padding: '44px 40px 40px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(245,158,11,0.08), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        {/* Top amber glow edge */}
        <div style={{
          position: 'absolute', top: 0, left: '20%', right: '20%', height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.6), transparent)',
          borderRadius: 1,
        }} />

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.9, delay: 2.8, type: 'spring', stiffness: 120, damping: 14 }}
            style={{ display: 'inline-block', marginBottom: 18 }}
          >
            <div style={{
              width: 68, height: 68, margin: '0 auto',
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 60%, #d97706 100%)',
              borderRadius: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, fontWeight: 900, color: '#0d0600',
              fontFamily: '"Playfair Display", Georgia, serif',
              boxShadow: '0 0 40px rgba(245,158,11,0.35), 0 8px 24px rgba(0,0,0,0.4)',
            }}>TJ</div>
          </motion.div>

          <h1 style={{
            fontSize: 22, fontWeight: 700, color: '#f1f5f9',
            margin: 0, marginBottom: 6,
            fontFamily: 'Inter, sans-serif', letterSpacing: -0.3,
          }}>
            Management Console
          </h1>
          <p style={{
            fontSize: 13, color: 'rgba(148,163,184,0.8)',
            margin: 0, fontFamily: 'Inter, sans-serif',
          }}>
            TJ's Kebab Centre · Admin Portal
          </p>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 28 }} />

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          <div>
            <label style={{
              display: 'block', fontSize: 12, fontWeight: 600,
              color: '#94a3b8', marginBottom: 8,
              fontFamily: 'Inter, sans-serif', letterSpacing: 0.3,
            }}>
              Email Address
            </label>
            <input
              type="email" value={email}
              onChange={e => setEmail(e.target.value)} required
              onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
              placeholder="admin@tjskebab.com"
              style={fieldStyle('email')}
            />
          </div>

          <div>
            <label style={{
              display: 'block', fontSize: 12, fontWeight: 600,
              color: '#94a3b8', marginBottom: 8,
              fontFamily: 'Inter, sans-serif', letterSpacing: 0.3,
            }}>
              Password
            </label>
            <input
              type="password" value={password}
              onChange={e => setPassword(e.target.value)} required
              onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
              placeholder="••••••••••"
              style={fieldStyle('password')}
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                key="err"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: 10, padding: '11px 14px',
                  fontSize: 13, color: '#fca5a5',
                  fontFamily: 'Inter, sans-serif',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                <span style={{ fontSize: 15 }}>⚠</span> {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.015 }}
            whileTap={{ scale: loading ? 1 : 0.985 }}
            style={{
              width: '100%', marginTop: 4,
              padding: '14px', borderRadius: 12, border: 'none',
              background: loading
                ? 'rgba(245,158,11,0.35)'
                : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
              color: '#0d0600',
              fontWeight: 700, fontSize: 15,
              fontFamily: 'Inter, sans-serif', letterSpacing: 0.2,
              boxShadow: loading ? 'none' : '0 4px 24px rgba(245,158,11,0.3), 0 8px 32px rgba(0,0,0,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              transition: 'all 0.25s',
            }}
          >
            {loading ? (
              <>
                <div style={{ width: 18, height: 18, border: '2.5px solid rgba(13,6,0,0.2)', borderTopColor: '#0d0600', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </motion.button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: 'rgba(148,163,184,0.4)', fontFamily: 'Inter, sans-serif' }}>
          Authorized personnel only
        </div>
      </motion.div>
    </div>
  );
}
