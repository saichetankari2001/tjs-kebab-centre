import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export default function MenuCardPage() {
  const [items, setItems] = useState([]);
  const [drinks, setDrinks] = useState([]);

  useEffect(() => {
    const u1 = onSnapshot(query(collection(db, 'menuItems'), orderBy('category')), snap =>
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(i => i.available !== false))
    );
    const u2 = onSnapshot(query(collection(db, 'drinks'), orderBy('name')), snap =>
      setDrinks(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(d => d.available !== false))
    );
    return () => { u1(); u2(); };
  }, []);

  const byCategory = items.reduce((acc, item) => {
    const cat = item.category || 'Other';
    if (!acc[cat]) acc[cat] = { name: cat, items: [] };
    acc[cat].items.push(item);
    return acc;
  }, {});

  const formatPrice = (item) => {
    if (item.sizePrices) {
      const entries = Object.entries(item.sizePrices);
      if (entries.length) return entries.map(([s, p]) => `${s} $${Number(p).toFixed(0)}`).join(' · ');
    }
    if (item.itemType === 'bowl') {
      const prices = [item.saladPrice, item.ricePrice].filter(Boolean);
      if (prices.length === 2) return `Salad $${Number(item.saladPrice).toFixed(0)} · Rice $${Number(item.ricePrice).toFixed(0)}`;
    }
    return item.price ? `$${Number(item.price).toFixed(0)}` : '';
  };

  return (
    <>
      {/* ── Screen styles — hidden during print ── */}
      <style>{`
        @media screen {
          .menu-card-page { background: #0e0b07; min-height: 100vh; padding: 24px; }
          .print-sheet    { background: #fff; max-width: 297mm; margin: 0 auto; padding: 16mm; border-radius: 8px; box-shadow: 0 0 40px rgba(0,0,0,0.6); }
          .print-btn      { display: block; }
        }
        @media print {
          .menu-card-page { background: #fff; padding: 0; }
          .print-sheet    { padding: 10mm; }
          .print-btn      { display: none !important; }
          @page { size: A4 landscape; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="menu-card-page">
        {/* Print button — hidden on print */}
        <div className="print-btn" style={{ textAlign: 'center', marginBottom: 16 }}>
          <button
            onClick={() => window.print()}
            style={{ background: '#f59e0b', color: '#000', border: 'none', padding: '10px 28px', borderRadius: 8, fontWeight: 800, fontSize: 14, cursor: 'pointer', letterSpacing: 1 }}
          >
            🖨️ PRINT MENU CARD (A4 Landscape)
          </button>
        </div>

        <div className="print-sheet">
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 18, borderBottom: '3px solid #c97d16', paddingBottom: 12 }}>
            <div style={{ fontFamily: 'Arial Black, Arial', fontWeight: 900, fontSize: 32, color: '#111', letterSpacing: 4, lineHeight: 1 }}>
              TJ'S KEBAB CENTRE
            </div>
            <div style={{ fontFamily: 'Arial', fontSize: 12, color: '#888', letterSpacing: 2, marginTop: 4 }}>
              REAL FLAVOUR · REAL GOOD · ORDER ONLINE OR IN-STORE
            </div>
          </div>

          {/* Two-column grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 28px' }}>
            {Object.values(byCategory).map(({ name, items: catItems }) => (
              <div key={name} style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: 'Arial Black, Arial', fontWeight: 900, fontSize: 11, color: '#c97d16', textTransform: 'uppercase', letterSpacing: 2, borderBottom: '1px solid #e5e0d0', paddingBottom: 3, marginBottom: 6 }}>
                  {name}
                </div>
                {catItems.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4, gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontFamily: 'Arial', fontWeight: 700, fontSize: 11, color: '#111' }}>{item.name}</span>
                      {item.description && (
                        <div style={{ fontFamily: 'Arial', fontSize: 9, color: '#777', lineHeight: 1.3, marginTop: 1 }}>
                          {item.description.slice(0, 80)}
                        </div>
                      )}
                    </div>
                    <span style={{ fontFamily: 'Arial', fontWeight: 800, fontSize: 11, color: '#111', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {formatPrice(item)}
                    </span>
                  </div>
                ))}
              </div>
            ))}

            {/* Drinks column */}
            {drinks.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: 'Arial Black, Arial', fontWeight: 900, fontSize: 11, color: '#c97d16', textTransform: 'uppercase', letterSpacing: 2, borderBottom: '1px solid #e5e0d0', paddingBottom: 3, marginBottom: 6 }}>
                  Drinks
                </div>
                {drinks.map(d => (
                  <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontFamily: 'Arial', fontWeight: 700, fontSize: 11, color: '#111' }}>{d.name}</span>
                    <span style={{ fontFamily: 'Arial', fontWeight: 800, fontSize: 11, color: '#111' }}>{d.price ? `$${Number(d.price).toFixed(0)}` : ''}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ borderTop: '2px solid #c97d16', marginTop: 10, paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: 'Arial', fontSize: 9, color: '#888' }}>Prices in AUD · Menu subject to change without notice</div>
            <div style={{ fontFamily: 'Arial Black, Arial', fontWeight: 900, fontSize: 10, color: '#c97d16', letterSpacing: 1 }}>TJ'S KEBAB CENTRE</div>
          </div>
        </div>
      </div>
    </>
  );
}
