import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';

export default function AdminApp() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { setUser(null); setLoading(false); return; }
      try {
        // Force-refresh so a claim granted after this session started is picked up immediately.
        const { claims } = await u.getIdTokenResult(true);
        if (claims.admin === true) {
          setUser(u);
        } else {
          await signOut(auth);
          setUser(null);
          setNotice('This account is not authorized for admin access.');
        }
      } catch {
        await signOut(auth);
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes adminPulse { 0% { opacity: 0.8; transform: scale(1); } 100% { opacity: 0; transform: scale(1.55); } }

        /* HUD scan line — sweeps from top to bottom of its container */
        @keyframes hudScanLine {
          0%   { top: -2px; opacity: 0; }
          4%   { opacity: 1; }
          92%  { opacity: 0.85; }
          100% { top: calc(100% + 2px); opacity: 0; }
        }

        /* Sidebar vertical scan */
        @keyframes sidebarScan {
          0%   { top: 0%; opacity: 0; }
          4%   { opacity: 0.55; }
          92%  { opacity: 0.35; }
          100% { top: 100%; opacity: 0; }
        }

        /* HUD text pulse */
        @keyframes hudPulse {
          0%,100% { opacity: 0.22; }
          50%     { opacity: 0.55; }
        }

        /* Concentric ambient rings expanding outward */
        @keyframes ringPulse {
          0%   { transform: scale(0.85); opacity: 0.45; }
          100% { transform: scale(1.9); opacity: 0; }
        }

        /* Horizontal data stream lines scrolling across */
        @keyframes dataStream {
          0%   { transform: translateX(-120%); opacity: 0; }
          6%   { opacity: 1; }
          88%  { opacity: 0.65; }
          100% { transform: translateX(130vw); opacity: 0; }
        }

        @keyframes holoshimmerAdmin {
          from { background-position: 0% center; }
          to   { background-position: 200% center; }
        }
        .admin-holo {
          background: linear-gradient(90deg, #fbbf24 0%, #f97316 20%, #ec4899 40%, #8b5cf6 60%, #06b6d4 80%, #fbbf24 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: holoshimmerAdmin 4s linear infinite;
        }
      `}</style>
      {loading ? (
        <div style={{ minHeight: '100vh', background: '#060300', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
          <div style={{ width: 44, height: 44, border: '3px solid rgba(245,158,11,0.15)', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(245,158,11,0.5)', fontFamily: 'Inter, sans-serif' }}>Authenticating</div>
        </div>
      ) : user ? <AdminDashboard /> : <AdminLogin notice={notice} />}
    </>
  );
}
