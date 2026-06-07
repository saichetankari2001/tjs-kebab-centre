import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import CustomiseModal from './CustomiseModal';

export default function MenuItemCard({ item, category }) {
  const { cart, removeItem } = useCart();
  const [showModal, setShowModal] = useState(false);
  const qty = cart.filter(c => c.baseId === item.id).reduce((s,c)=>s+c.qty,0);
  const hasCustom = category?.hasSalad || category?.hasSauce || category?.hasExtras;

  return (
    <>
      <div onClick={() => hasCustom && setShowModal(true)} style={{
        background: '#fff', border: `1.5px solid ${qty > 0 ? 'var(--brand)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)', padding: '14px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
        transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
        cursor: hasCustom ? 'pointer' : 'default',
        boxShadow: qty > 0 ? '0 4px 16px rgba(26,122,74,0.15)' : 'var(--shadow)',
      }}>
        {item.popular && (
          <div style={{ position: 'absolute', top: 0, right: 0, background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', color: '#92400E', fontSize: 9, fontWeight: 800, padding: '3px 12px', borderBottomLeftRadius: 8, letterSpacing: 1 }}>★ POPULAR</div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4, paddingRight: item.popular ? 60 : 0 }}>{item.name}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 8 }}>{item.description}</div>
          {hasCustom && <div style={{ fontSize: 11, color: 'var(--brand)', fontWeight: 600, marginBottom: 6 }}>✏️ Tap to customise</div>}
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--brand)' }}>${item.price.toFixed(2)}</div>
        </div>
        <div onClick={e => e.stopPropagation()} style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          {qty === 0 ? (
            <button onClick={() => setShowModal(true)} style={{ background: 'var(--brand)', color: '#fff', border: 'none', width: 36, height: 36, borderRadius: 10, fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 12px rgba(26,122,74,0.3)' }}>+</button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => { const last = cart.filter(c=>c.baseId===item.id).slice(-1)[0]; if(last) removeItem(last.cartId); }} style={{ background: 'var(--card2)', color: 'var(--text)', border: '1px solid var(--border)', width: 32, height: 32, borderRadius: 8, fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
              <span style={{ fontSize: 16, fontWeight: 700, minWidth: 20, textAlign: 'center', color: 'var(--brand)' }}>{qty}</span>
              <button onClick={() => setShowModal(true)} style={{ background: 'var(--brand)', color: '#fff', border: 'none', width: 32, height: 32, borderRadius: 8, fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            </div>
          )}
        </div>
      </div>
      {showModal && <CustomiseModal item={item} category={category} onClose={() => setShowModal(false)} />}
    </>
  );
}
