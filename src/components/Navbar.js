import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { itemCount, total } = useCart();
  const navigate = useNavigate();
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 999,
      background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)',
      padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64,
      boxShadow: '0 2px 12px rgba(26,122,74,0.08)',
    }}>
      <div onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, var(--brand), var(--brand-light))', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff', boxShadow: '0 3px 12px rgba(26,122,74,0.3)' }}>TJ</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', lineHeight: 1.1 }}>TJ's Kebab</div>
          <div style={{ fontSize: 10, color: 'var(--brand)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>Bundoora · Halal</div>
        </div>
      </div>
      <button onClick={() => navigate('/cart')} style={{
        background: itemCount > 0 ? 'var(--brand)' : 'var(--card2)',
        color: itemCount > 0 ? '#fff' : 'var(--text2)',
        border: `1px solid ${itemCount > 0 ? 'var(--brand)' : 'var(--border)'}`,
        padding: '9px 18px', borderRadius: 'var(--radius-sm)',
        fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8,
        transition: 'all 0.2s',
        boxShadow: itemCount > 0 ? '0 3px 16px rgba(26,122,74,0.3)' : 'none',
      }}>
        🛒
        {itemCount > 0 ? (
          <><span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 6, padding: '1px 8px', fontSize: 12 }}>{itemCount}</span><span>${total.toFixed(2)}</span></>
        ) : <span>Cart</span>}
      </button>
    </nav>
  );
}
