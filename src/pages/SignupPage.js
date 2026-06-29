import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const AUTH_ERRORS = {
  'auth/email-already-in-use': 'This email is already registered. Try signing in.',
  'auth/weak-password':        'Password must be at least 6 characters.',
  'auth/invalid-email':        'Invalid email address.',
};

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
const fadeUp  = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16,1,0.3,1] } } };

export default function SignupPage() {
  const { signUp, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', confirm: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  if (user) { navigate('/account'); return null; }

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6)       { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await signUp(form.firstName.trim(), form.lastName.trim(), form.email.trim(), form.password, form.phone.trim());
      navigate('/account');
    } catch (err) {
      setError(AUTH_ERRORS[err.code] ?? 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(58,32,0,0.8)',
  };

  const inp = 'w-full rounded-xl px-4 py-3.5 text-sm text-white placeholder-muted/60 outline-none transition-all';

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-10">

      {/* ── Cinematic background ── */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, #1e0e00 0%, #120800 40%, #0d0600 100%)' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 70% at 85% 30%, rgba(245,158,11,0.16) 0%, transparent 55%)' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 60% at 15% 70%, rgba(234,88,12,0.10) 0%, transparent 50%)' }} />

      {/* Food photo - right side desktop */}
      <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden xl:block overflow-hidden">
        <motion.img
          src="/images/hsp-box.jpg"
          alt="TJ's Food"
          className="w-full h-full object-cover"
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1.02, opacity: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{ filter: 'brightness(0.5)' }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to left, transparent 50%, rgba(13,6,0,1) 100%)' }} />
        <div className="absolute bottom-12 right-10 text-right">
          <p className="text-brand text-sm font-bold tracking-widest uppercase mb-1">Loyalty Programme</p>
          <p className="text-white/70 text-xs max-w-xs">Every 5th order FREE — sign up now to start earning stamps!</p>
        </div>
      </div>

      {/* ── Signup card ── */}
      <motion.div
        initial={{ opacity: 0, x: -40, rotateY: 8 }}
        animate={{ opacity: 1, x: 0, rotateY: 0 }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-sm xl:mr-auto xl:ml-24"
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
          <div className="absolute top-0 left-8 right-8 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.6), transparent)' }} />

          <motion.div variants={stagger} initial="hidden" animate="visible" className="text-center mb-7">
            <motion.div variants={fadeUp} className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(234,88,12,0.1))', border: '1px solid rgba(245,158,11,0.25)' }}>
              <span className="text-3xl">🎉</span>
            </motion.div>
            <motion.h1 variants={fadeUp} className="font-display text-3xl text-white tracking-wide mb-1">JOIN TJ'S</motion.h1>
            <motion.p variants={fadeUp} className="text-muted text-xs">Create an account · Earn stamps · Get FREE kebabs</motion.p>
          </motion.div>

          <motion.form variants={stagger} initial="hidden" animate="visible" onSubmit={handleSubmit} className="space-y-3">
            <motion.div variants={fadeUp} className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="First name" value={form.firstName} onChange={set('firstName')} required
                className={inp} style={inputStyle}
                onFocus={e=>e.target.style.borderColor='rgba(245,158,11,0.45)'}
                onBlur={e =>e.target.style.borderColor='rgba(58,32,0,0.8)'} />
              <input type="text" placeholder="Last name" value={form.lastName} onChange={set('lastName')} required
                className={inp} style={inputStyle}
                onFocus={e=>e.target.style.borderColor='rgba(245,158,11,0.45)'}
                onBlur={e =>e.target.style.borderColor='rgba(58,32,0,0.8)'} />
            </motion.div>

            <motion.div variants={fadeUp}>
              <input type="email" placeholder="Email address" value={form.email} onChange={set('email')} required
                className={`${inp} w-full`} style={inputStyle}
                onFocus={e=>e.target.style.borderColor='rgba(245,158,11,0.45)'}
                onBlur={e =>e.target.style.borderColor='rgba(58,32,0,0.8)'} />
            </motion.div>

            <motion.div variants={fadeUp}>
              <input type="tel" placeholder="Phone number (optional)" value={form.phone} onChange={set('phone')}
                className={`${inp} w-full`} style={inputStyle}
                onFocus={e=>e.target.style.borderColor='rgba(245,158,11,0.45)'}
                onBlur={e =>e.target.style.borderColor='rgba(58,32,0,0.8)'} />
            </motion.div>

            <motion.div variants={fadeUp}>
              <input type="password" placeholder="Password (min 6 chars)" value={form.password} onChange={set('password')} required
                className={`${inp} w-full`} style={inputStyle}
                onFocus={e=>e.target.style.borderColor='rgba(245,158,11,0.45)'}
                onBlur={e =>e.target.style.borderColor='rgba(58,32,0,0.8)'} />
            </motion.div>

            <motion.div variants={fadeUp}>
              <input type="password" placeholder="Confirm password" value={form.confirm} onChange={set('confirm')} required
                className={`${inp} w-full`} style={inputStyle}
                onFocus={e=>e.target.style.borderColor='rgba(245,158,11,0.45)'}
                onBlur={e =>e.target.style.borderColor='rgba(58,32,0,0.8)'} />
            </motion.div>

            {error && (
              <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} className="flex items-center gap-2 rounded-xl px-4 py-3" style={{ background:'rgba(239,68,68,0.10)', border:'1px solid rgba(239,68,68,0.20)' }}>
                <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-xs">{error}</p>
              </motion.div>
            )}

            {/* Loyalty benefit badge */}
            <motion.div variants={fadeUp} className="flex items-center gap-2 rounded-xl px-4 py-3" style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.18)' }}>
              <span>🎉</span>
              <p className="text-brand/90 text-xs font-semibold">Every 5th order is FREE — loyalty starts at signup!</p>
            </motion.div>

            <motion.button
              variants={fadeUp}
              type="submit" disabled={loading}
              whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(245,158,11,0.45)' }}
              whileTap={{ scale: 0.97 }}
              className="relative w-full overflow-hidden font-black text-sm tracking-widest uppercase py-4 rounded-xl disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg,#fbbf24,#f59e0b,#ea580c)', color: '#060400' }}
            >
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)' }}
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
              />
              {loading ? 'Creating account...' : <><span>CREATE ACCOUNT</span><ChevronRight size={14} /></>}
            </motion.button>
          </motion.form>

          <p className="text-center text-muted text-xs mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand font-semibold hover:text-brand-lit transition-colors">Sign in →</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
