import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const AUTH_ERRORS = {
  'auth/user-not-found':    'No account found with this email.',
  'auth/wrong-password':    'Incorrect password.',
  'auth/invalid-email':     'Invalid email address.',
  'auth/too-many-requests': 'Too many attempts. Try again later.',
  'auth/invalid-credential':'Incorrect email or password.',
};

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
    <div className="min-h-[calc(100vh-64px)] bg-surface flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl text-white tracking-wide mb-1">WELCOME BACK</h1>
          <p className="text-muted text-sm">Sign in to track your loyalty stamps &amp; orders</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address" required
              className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3.5 text-sm text-white placeholder-muted outline-none focus:border-brand/50 transition-colors"
            />
          </div>
          <div className="relative">
            <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Password" required
              className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3.5 text-sm text-white placeholder-muted outline-none focus:border-brand/50 transition-colors"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full bg-brand text-surface font-black text-sm py-4 rounded-xl hover:bg-brand-lit transition-colors disabled:opacity-60 mt-2"
          >
            {loading ? 'Signing in...' : 'SIGN IN'}
          </button>
        </form>

        <p className="text-center text-muted text-sm mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="text-brand font-semibold hover:underline">Create one</Link>
        </p>
      </motion.div>
    </div>
  );
}
