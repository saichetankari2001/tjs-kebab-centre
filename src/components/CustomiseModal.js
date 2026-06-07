import React, { useState } from 'react';
import { SALAD_OPTIONS, SAUCE_OPTIONS, EXTRAS_OPTIONS } from '../data/options';
import { useCart } from '../context/CartContext';

export default function CustomiseModal({ item, category, onClose }) {
  const { addItem } = useCart();
  const [selectedSalads, setSelectedSalads] = useState(
    SALAD_OPTIONS.reduce((acc, s) => ({ ...acc, [s.id]: true }), {})
  );
  const [selectedSauces, setSelectedSauces] = useState({});
  const [selectedExtras, setSelectedExtras] = useState({});

  const saucesTotal = Object.entries(selectedSauces).filter(([,v])=>v).reduce((s,[id])=>s+(SAUCE_OPTIONS.find(x=>x.id===id)?.price||0),0);
  const extrasTotal = Object.entries(selectedExtras).filter(([,v])=>v).reduce((s,[id])=>s+(EXTRAS_OPTIONS.find(x=>x.id===id)?.price||0),0);
  const totalPrice = item.price + saucesTotal + extrasTotal;

  const handleAdd = () => {
    addItem({
      ...item,
      baseId: item.id,
      price: totalPrice,
      displayName: item.name,
      customisations: {
        salads: category.hasSalad ? Object.entries(selectedSalads).filter(([,v])=>v).map(([id])=>SALAD_OPTIONS.find(s=>s.id===id)?.name).filter(Boolean) : [],
        sauces: category.hasSauce ? Object.entries(selectedSauces).filter(([,v])=>v).map(([id])=>SAUCE_OPTIONS.find(s=>s.id===id)?.name).filter(Boolean) : [],
        extras: category.hasExtras ? Object.entries(selectedExtras).filter(([,v])=>v).map(([id])=>EXTRAS_OPTIONS.find(e=>e.id===id)?.name).filter(Boolean) : [],
      }
    });
    onClose();
  };

  const Pill = ({ label, selected, onClick, price }) => (
    <button onClick={onClick} style={{
      background: selected ? 'var(--brand)' : 'var(--card2)',
      border: `1px solid ${selected ? 'var(--brand)' : 'var(--border)'}`,
      color: selected ? '#fff' : 'var(--text2)',
      padding: '8px 14px', borderRadius: 20,
      fontSize: 13, fontWeight: 600,
      display: 'flex', alignItems: 'center', gap: 5,
      transition: 'all 0.15s',
    }}>
      {selected && '✓ '}{label}
      {price !== undefined && <span style={{ fontSize: 11, opacity: 0.75 }}>+${price}</span>}
    </button>
  );

  const Section = ({ title, emoji, note, children }) => (
    <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 18 }}>{emoji}</span>
        <span style={{ fontFamily: 'Playfair Display', fontSize: 15, fontWeight: 700, color: 'var(--gold)' }}>{title}</span>
      </div>
      {note && <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>{note}</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{children}</div>
    </div>
  );

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--surface)', borderRadius: '20px 20px 0 0',
        width: '100%', maxWidth: 600, maxHeight: '88vh', overflowY: 'auto',
        padding: '24px 20px 32px',
        animation: 'slideUp 0.3s ease',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, flex: 1, paddingRight: 12, color: 'var(--text)' }}>{item.name}</h2>
          <button onClick={onClose} style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text2)', width: 32, height: 32, borderRadius: '50%', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
        </div>
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 6 }}>{item.description}</p>
        <p style={{ fontFamily: 'Playfair Display', fontSize: 22, color: 'var(--brand)', fontWeight: 700 }}>${item.price.toFixed(2)}</p>

        {category.hasSalad && (
          <Section title="Salad Choices" emoji="🥗" note="All included by default — tap to remove">
            {SALAD_OPTIONS.map(s => <Pill key={s.id} label={s.name} selected={selectedSalads[s.id]} onClick={()=>setSelectedSalads(p=>({...p,[s.id]:!p[s.id]}))} />)}
          </Section>
        )}
        {category.hasSauce && (
          <Section title="Sauce Choices" emoji="🫙" note="Garlic & Chilli +$3 · All others +$1">
            {SAUCE_OPTIONS.map(s => <Pill key={s.id} label={s.name} selected={selectedSauces[s.id]||false} onClick={()=>setSelectedSauces(p=>({...p,[s.id]:!p[s.id]}))} price={s.price} />)}
          </Section>
        )}
        {category.hasExtras && (
          <Section title="Extras" emoji="➕" note="Optional add-ons">
            {EXTRAS_OPTIONS.map(e => <Pill key={e.id} label={e.name} selected={selectedExtras[e.id]||false} onClick={()=>setSelectedExtras(p=>({...p,[e.id]:!p[e.id]}))} price={e.price} />)}
          </Section>
        )}

        <div style={{ marginTop: 24 }}>
          {(saucesTotal + extrasTotal) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text2)', marginBottom: 10, padding: '8px 12px', background: 'var(--card)', borderRadius: 8 }}>
              <span>Base price + extras</span>
              <span>${item.price.toFixed(2)} + ${(saucesTotal+extrasTotal).toFixed(2)}</span>
            </div>
          )}
          <button onClick={handleAdd} style={{
            width: '100%', background: 'var(--brand)', color: '#fff', border: 'none',
            padding: '15px', borderRadius: 'var(--radius)',
            fontWeight: 700, fontSize: 17,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            boxShadow: 'var(--shadow-glow)',
          }}>
            <span>ADD TO ORDER</span>
            <span>${totalPrice.toFixed(2)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
