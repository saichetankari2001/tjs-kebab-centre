import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useMenu } from '../hooks/useMenu';
import MenuItemCard from '../components/MenuItemCard';

export default function HomePage() {
  const { orderMode, setOrderMode, itemCount, total } = useCart();
  const { categories, promotions, loading } = useMenu();
  const [activeCategory, setActiveCategory] = useState(null);
  const [catNavStuck, setCatNavStuck] = useState(false);
  const navigate = useNavigate();
  const categoryRefs = useRef({});
  const catNavRef = useRef(null);
  const heroRef = useRef(null);
  const scrollingRef = useRef(false);

  const activeCatId = activeCategory || categories[0]?.id;

  // Detect when hero leaves viewport to show sticky shadow on cat nav
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => setCatNavStuck(!e.isIntersecting),
      { threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // IntersectionObserver to highlight active category as user scrolls
  useEffect(() => {
    if (!categories.length) return;
    const observers = [];
    categories.forEach(cat => {
      const el = categoryRefs.current[cat.id];
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !scrollingRef.current) {
            setActiveCategory(cat.id);
          }
        },
        { rootMargin: '-80px 0px -55% 0px', threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, [categories]);

  // Scroll active category pill into view in the nav
  useEffect(() => {
    if (!activeCatId || !catNavRef.current) return;
    const btn = catNavRef.current.querySelector(`[data-cat="${activeCatId}"]`);
    if (btn) btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeCatId]);

  const scrollToCategory = (catId) => {
    setActiveCategory(catId);
    const el = categoryRefs.current[catId];
    if (!el) return;
    scrollingRef.current = true;
    const offset = 64 + 56; // navbar + cat nav
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
    setTimeout(() => { scrollingRef.current = false; }, 900);
  };

  return (
    <div style={{ background: 'var(--bg)' }}>

      {/* ── Hero ── */}
      <div ref={heroRef} style={{ position: 'relative', minHeight: 440, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', textAlign: 'center' }}>
        {/* Real food photo background */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url('https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=1600&auto=format&q=80')`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'brightness(0.42)',
          backgroundColor: '#0D2E18',
        }} />
        {/* Subtle vignette overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(5,20,10,0.55) 0%, rgba(5,20,10,0.1) 60%, var(--bg) 100%)',
        }} />

        <div style={{ position: 'relative', padding: '64px 24px 88px' }}>
          {/* New badge — no leaf emoji */}
          <div style={{
            display: 'inline-block',
            background: 'rgba(252,211,77,0.12)',
            border: '1px solid rgba(252,211,77,0.45)',
            borderRadius: 20, padding: '6px 20px',
            fontSize: 11, color: '#FCD34D',
            fontWeight: 700, marginBottom: 18,
            letterSpacing: 1.5, textTransform: 'uppercase',
          }}>
            Bundoora's Finest · Halal Certified
          </div>

          <h1 style={{ fontSize: 'clamp(36px,8vw,60px)', fontWeight: 800, lineHeight: 1.05, marginBottom: 12, color: '#fff' }}>
            TJ's Kebab<br /><span style={{ color: '#FCD34D' }}>Centre</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: 15, marginBottom: 28, lineHeight: 1.7 }}>
            Real Flavour. Real Food.<br />Bundoora's Finest Halal Kebabs.
          </p>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
            {['Halal Certified', 'Bundoora VIC', 'Delivery after 5:30pm', 'Fresh Daily'].map(b => (
              <span key={b} style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 20, padding: '5px 14px',
                fontSize: 12, fontWeight: 600, color: '#fff',
              }}>{b}</span>
            ))}
          </div>

          <button
            onClick={() => scrollToCategory(categories[0]?.id)}
            style={{
              background: '#fff', color: 'var(--brand)', border: 'none',
              padding: '14px 40px', borderRadius: 12,
              fontSize: 16, fontWeight: 800,
              boxShadow: '0 8px 32px rgba(0,0,0,0.35)', letterSpacing: 0.3,
            }}
          >
            ORDER NOW →
          </button>
        </div>
      </div>

      {/* ── Promotions ── */}
      {promotions.length > 0 && (
        <div style={{ padding: '20px 20px 0' }}>
          {promotions.map(promo => (
            <div key={promo.id} style={{ background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)', border: '1px solid #F59E0B', borderRadius: 'var(--radius)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <span style={{ fontSize: 28 }}>{promo.emoji || '🎉'}</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#92400E' }}>{promo.title}</div>
                <div style={{ fontSize: 13, color: '#B45309', marginTop: 2 }}>{promo.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Menu ── (shown first so customers can browse straight away) */}
      <div id="menu-section" style={{ paddingTop: 32 }}>
        <div style={{ padding: '0 20px 4px' }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>Our Menu</h2>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>Fresh, made-to-order — every single time</p>
        </div>

        {/* Sticky category nav — Uber Eats style */}
        <div ref={catNavRef} style={{
          position: 'sticky', top: 63, zIndex: 100,
          background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(14px)',
          borderBottom: `1px solid ${catNavStuck ? 'var(--border)' : 'transparent'}`,
          boxShadow: catNavStuck ? '0 3px 16px rgba(0,0,0,0.07)' : 'none',
          padding: '10px 20px 10px',
          transition: 'box-shadow 0.25s, border-color 0.25s',
        }}>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitScrollbarWidth: 'none' }}>
            {categories.map(cat => {
              const isActive = activeCatId === cat.id;
              return (
                <button
                  key={cat.id}
                  data-cat={cat.id}
                  onClick={() => scrollToCategory(cat.id)}
                  style={{
                    background: isActive ? 'var(--brand)' : '#fff',
                    border: `1.5px solid ${isActive ? 'var(--brand)' : 'var(--border)'}`,
                    color: isActive ? '#fff' : 'var(--text2)',
                    padding: '7px 16px', borderRadius: 20,
                    fontSize: 13, fontWeight: 700,
                    whiteSpace: 'nowrap', transition: 'all 0.18s', flexShrink: 0,
                    boxShadow: isActive ? '0 3px 10px rgba(26,122,74,0.28)' : 'none',
                  }}
                >
                  {cat.emoji} {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* All category sections */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
            <div style={{ display: 'inline-block', width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', marginBottom: 12 }} />
            <p>Loading menu...</p>
          </div>
        ) : (
          <div style={{ padding: '0 20px' }}>
            {categories.map((cat, i) => (
              <div
                key={cat.id}
                ref={el => { categoryRefs.current[cat.id] = el; }}
                style={{ paddingTop: i === 0 ? 20 : 32, paddingBottom: 8 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 22 }}>{cat.emoji}</span>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>{cat.name}</h3>
                </div>
                <div style={{ height: 3, width: 36, background: 'var(--brand)', borderRadius: 2, marginBottom: 16 }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                  {cat.items?.map(item => <MenuItemCard key={item.id} item={item} category={cat} />)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Order Mode ── */}
      <div style={{ padding: '32px 20px 0' }}>
        <p style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, marginBottom: 10 }}>How would you like your order?</p>
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 6, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, boxShadow: 'var(--shadow)' }}>
          {[
            { mode: 'delivery', icon: '🛵', title: 'Delivery', sub: 'After 5:30pm · 15km' },
            { mode: 'pickup', icon: '🏪', title: 'Pickup', sub: '15–20 mins' },
            { mode: 'dinein', icon: '🍽️', title: 'Dine In', sub: 'Eat here' },
          ].map(opt => (
            <button key={opt.mode} onClick={() => setOrderMode(opt.mode)} style={{
              background: orderMode === opt.mode ? 'var(--brand)' : 'transparent',
              border: `1px solid ${orderMode === opt.mode ? 'var(--brand)' : 'var(--border)'}`,
              borderRadius: 10, padding: '12px 8px',
              color: orderMode === opt.mode ? '#fff' : 'var(--text2)',
              textAlign: 'center', transition: 'all 0.2s',
              boxShadow: orderMode === opt.mode ? '0 4px 16px rgba(26,122,74,0.3)' : 'none',
            }}>
              <div style={{ fontSize: 22, marginBottom: 3 }}>{opt.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 1 }}>{opt.title}</div>
              <div style={{ fontSize: 10, opacity: 0.8 }}>{opt.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Find Us ── */}
      <div style={{ padding: '40px 20px 0' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Find Us</h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>10 Copernicus Crescent, Bundoora VIC 3083</p>
        <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
          <iframe
            title="TJ's Kebab Centre Location"
            width="100%" height="260" style={{ border: 0, display: 'block' }}
            src="https://maps.google.com/maps?q=10+Copernicus+Crescent+Bundoora+VIC+3083&output=embed&zoom=15"
            allowFullScreen loading="lazy"
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
          <a href="https://maps.google.com/?q=10+Copernicus+Crescent+Bundoora+VIC+3083" target="_blank" rel="noreferrer" style={{ background: 'var(--brand)', color: '#fff', padding: '12px', borderRadius: 10, textAlign: 'center', fontWeight: 700, fontSize: 14, display: 'block', boxShadow: '0 4px 12px rgba(26,122,74,0.3)' }}>
            Get Directions
          </a>
          <a href="tel:+61391234567" style={{ background: '#fff', color: 'var(--brand)', padding: '12px', borderRadius: 10, textAlign: 'center', fontWeight: 700, fontSize: 14, display: 'block', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
            Call Us
          </a>
        </div>
      </div>

      {/* ── Info Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, padding: '24px 20px' }}>
        {[
          { icon: '📍', title: 'Location', value: '10 Copernicus Cres, Bundoora VIC 3083' },
          { icon: '🕐', title: 'Hours', value: 'Sun–Thu: 11:30am–10pm\nFri–Sat: 11:30am–12am' },
          { icon: '🚚', title: 'Delivery', value: 'After 5:30pm · 15km radius' },
          { icon: '💳', title: 'Payment', value: 'Card · Cash' },
        ].map(card => (
          <div key={card.title} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px', textAlign: 'center', boxShadow: 'var(--shadow)' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{card.icon}</div>
            <div style={{ fontSize: 11, color: 'var(--brand)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{card.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* ── Floating Cart ── */}
      {itemCount > 0 && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 998, width: 'calc(100% - 40px)', maxWidth: 480, animation: 'fadeUp 0.3s ease' }}>
          <button onClick={() => navigate('/cart')} style={{
            width: '100%', background: 'var(--brand)', color: '#fff', border: 'none',
            padding: '16px 24px', borderRadius: 'var(--radius)',
            fontWeight: 800, fontSize: 17,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            boxShadow: '0 8px 32px rgba(26,122,74,0.4)',
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: '2px 10px', fontSize: 13 }}>{itemCount} item{itemCount > 1 ? 's' : ''}</span>
            <span>VIEW CART</span>
            <span>${total.toFixed(2)}</span>
          </button>
        </div>
      )}
      <div style={{ height: itemCount > 0 ? 100 : 32 }} />
    </div>
  );
}
