import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      setError('Invalid email or password. Please try again.');
    }
    setLoading(false);
  };

  const inp = { width: '100%', background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', padding: '12px 14px', borderRadius: 10, fontSize: 15, outline: 'none' };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--warm-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, background: 'var(--brand)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, color: '#fff', fontFamily: 'Playfair Display', margin: '0 auto 16px', boxShadow: 'var(--shadow-glow)' }}>TJ</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>Admin Panel</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>TJ's Kebab Centre Management</p>
        </div>

        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '28px 24px' }}>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Email</label>
              <input style={inp} type="email" placeholder="admin@tjskebab.com" value={email} onChange={e => setEmail(e.target.value)} required onFocus={e => e.target.style.borderColor='var(--brand)'} onBlur={e => e.target.style.borderColor='var(--border)'} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Password</label>
              <input style={inp} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required onFocus={e => e.target.style.borderColor='var(--brand)'} onBlur={e => e.target.style.borderColor='var(--border)'} />
            </div>
            {error && <div style={{ background: 'rgba(226,75,74,0.1)', border: '1px solid rgba(226,75,74,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#FF6B6B' }}>{error}</div>}
            <button type="submit" disabled={loading} style={{ background: 'var(--brand)', color: '#fff', border: 'none', padding: '14px', borderRadius: 10, fontWeight: 700, fontSize: 16, marginTop: 4, boxShadow: 'var(--shadow-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading ? <span style={{ display: 'inline-block', width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> : '🔐 Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
