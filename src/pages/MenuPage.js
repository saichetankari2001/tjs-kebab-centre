import React from 'react';
import { useMenu } from '../hooks/useMenu';

export default function MenuPage() {
  const { categories, loading } = useMenu();

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{
        background: 'var(--brand)',
        padding: '32px 20px 24px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
          Full Menu
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 4 }}>TJ's Kebab Centre</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>10 Copernicus Crescent, Bundoora VIC 3083</p>
      </div>

      {/* Menu content */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 20px 48px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
            <div style={{ display: 'inline-block', width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', marginBottom: 12 }} />
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>Loading menu...</p>
          </div>
        ) : (
          categories.map((cat, ci) => (
            <div key={cat.id} style={{ marginBottom: ci < categories.length - 1 ? 36 : 0 }}>
              {/* Category header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                paddingBottom: 10,
                borderBottom: '2px solid var(--brand)',
                marginBottom: 12,
              }}>
                <span style={{ fontSize: 18 }}>{cat.emoji}</span>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: 0.8 }}>{cat.name}</h2>
              </div>

              {/* Items */}
              {cat.items?.map((item, i) => (
                <div key={item.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '11px 0',
                  borderBottom: i < cat.items.length - 1 ? '1px solid #f0f0f0' : 'none',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{item.name}</span>
                      {item.popular && (
                        <span style={{ fontSize: 9, fontWeight: 800, color: '#92400E', background: '#FEF3C7', borderRadius: 4, padding: '2px 6px', letterSpacing: 0.5 }}>POPULAR</span>
                      )}
                    </div>
                    {item.description && (
                      <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, lineHeight: 1.5 }}>{item.description}</p>
                    )}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand)', flexShrink: 0 }}>
                    ${item.price.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ))
        )}

        {/* QR Code section */}
        {!loading && (
          <div style={{ marginTop: 40, paddingTop: 28, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>Scan to view our menu</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>Share this QR code with customers</div>
            <div style={{ display: 'inline-block', background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: 16, boxShadow: 'var(--shadow)' }}>
              <img
                src={`https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(window.location.origin+'/menu')}&choe=UTF-8`}
                alt="QR code for TJ's Kebab menu"
                width={200}
                height={200}
                style={{ display: 'block', borderRadius: 8 }}
              />
            </div>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 12 }}>{window.location.origin}/menu</p>
          </div>
        )}

        {/* Footer note */}
        {!loading && (
          <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.7 }}>
              Prices may vary. Menu is subject to change without notice.<br />
              All items are Halal certified.
            </p>
            <a href="/" style={{ display:'inline-block', marginTop:16, background:'var(--brand)', color:'#fff', padding:'12px 32px', borderRadius:10, fontWeight:700, fontSize:14, boxShadow:'0 4px 12px rgba(26,122,74,0.3)' }}>
              Order Online →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
