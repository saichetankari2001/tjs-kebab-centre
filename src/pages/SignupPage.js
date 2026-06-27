import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const AUTH_ERRORS = {
  'auth/email-already-in-use': 'This email is already registered. Try signing in.',
  'auth/weak-password':        'Password must be at least 6 characters.',
  'auth/invalid-email':        'Invalid email address.',
};

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

  const inputCls = 'w-full bg-card border border-border rounded-xl px-4 py-3.5 text-sm text-white placeholder-muted outline-none focus:border-brand/50 transition-colors';

  return (
    <div className="min-h-[calc(100vh-64px)] bg-surface flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl text-white tracking-wide mb-1">CREATE ACCOUNT</h1>
          <p className="text-muted text-sm">Join TJ&apos;s loyalty programme — earn a free kebab!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <input value={form.firstName} onChange={set('firstName')} placeholder="First name" required className={inputCls} />
            <input value={form.lastName}  onChange={set('lastName')}  placeholder="Last name"  required className={inputCls} />
          </div>
          <input value={form.email}    onChange={set('email')}    placeholder="Email address"    type="email"    required className={inputCls} />
          <input value={form.phone}    onChange={set('phone')}    placeholder="Phone (optional)" type="tel"              className={inputCls} />
          <input value={form.password} onChange={set('password')} placeholder="Password (min 6)" type="password" required className={inputCls} />
          <input value={form.confirm}  onChange={set('confirm')}  placeholder="Confirm password" type="password" required className={inputCls} />

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}

          <div className="bg-brand/10 border border-brand/20 rounded-xl px-4 py-3 text-xs text-muted">
            🎁 Every 5 orders earns you a <span className="text-brand font-semibold">FREE kebab + can</span>. Loyalty stamps are tracked automatically when you&apos;re signed in.
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full bg-brand text-surface font-black text-sm py-4 rounded-xl hover:bg-brand-lit transition-colors disabled:opacity-60 mt-1"
          >
            {loading ? 'Creating account...' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <p className="text-center text-muted text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand font-semibold hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
