# TJ's Kebab Centre — Plan 5: Printable Menu Card + QR Code

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a `/menu-card` React page that renders a print-ready A4 landscape menu card matching the TJ's in-store aesthetic (dark background, amber headings), and enhance the existing QR code in admin to link directly to the ordering website.

**Architecture:** Single React page at `/menu-card` — reads live prices from Firestore then renders a styled layout. Browser Print (Ctrl+P / Cmd+P) → PDF. QR code in admin already exists — just verify it points to the correct production URL and add a print button.

**Tech Stack:** React 18, Tailwind CSS (for menu card page), `react-qr-code` (check if installed or use existing QR solution)

## Global Constraints
- Menu card must print correctly at A4 landscape (297mm × 210mm)
- Print CSS: hide Navbar, hide browser chrome, show only the card
- Prices on menu card come from Firestore (live) — not hardcoded
- QR code URL: `https://tjs-kebab-centre.netlify.app` (configurable in admin)
- Plan 1 must be complete (menu data in Firestore)

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Create | `src/pages/MenuCardPage.js` | A4 printable menu card |
| Modify | `src/App.js` | add `/menu-card` route |
| Modify | `src/styles/global.css` | add `@media print` styles |
| Modify | `src/admin/AdminDashboard.js` | QR tab: add print button, verify URL |

---

### Task 1: Print CSS in global.css

**Files:**
- Modify: `src/styles/global.css`

- [ ] **Step 1: Add print media query to src/styles/global.css**

Append to the end of the file:
```css
@media print {
  /* Hide everything except the menu card */
  body > *:not(#root) { display: none !important; }
  nav, header, .no-print { display: none !important; }

  body { background: #111 !important; margin: 0; padding: 0; }

  @page {
    size: A4 landscape;
    margin: 8mm;
  }

  .print-card {
    width: 100%;
    page-break-inside: avoid;
  }
}
```

- [ ] **Step 2: Commit**
```bash
git add src/styles/global.css
git commit -m "feat: add print media query for A4 landscape menu card"
```

---

### Task 2: MenuCardPage

**Files:**
- Create: `src/pages/MenuCardPage.js`

**Interfaces:**
- Reads Firestore `menuItems` and `drinks` (same as menu page)
- Renders a 2-column A4 landscape layout in TJ's brand style
- "Print Menu Card" button triggers `window.print()`

- [ ] **Step 1: Write src/pages/MenuCardPage.js**
```jsx
import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export default function MenuCardPage() {
  const [items,  setItems]  = useState([]);
  const [drinks, setDrinks] = useState([]);
  const [loading,setLoading]= useState(true);

  useEffect(() => {
    Promise.all([
      getDocs(query(collection(db, 'menuItems'), orderBy('categoryOrder'), orderBy('order'))),
      getDocs(query(collection(db, 'drinks'), orderBy('order'))),
    ]).then(([menuSnap, drinksSnap]) => {
      setItems(menuSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(i => i.available !== false));
      setDrinks(drinksSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(d => d.available !== false));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ background: '#111', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', fontFamily: 'Inter', fontSize: 18 }}>Loading menu...</div>;
  }

  // Group items by category
  const categories = {};
  items.forEach(item => {
    const cat = item.category ?? 'Other';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(item);
  });

  const priceStr = (item) => {
    if (item.itemType === 'bowl')    return `Salad $${item.saladPrice ?? item.price} / Rice $${item.ricePrice ?? item.price + 1}`;
    if (item.sizePrices) {
      const sizes = Object.entries(item.sizePrices).map(([s, p]) => `${s} $${p}`).join(' · ');
      return sizes;
    }
    return `$${item.price.toFixed(2)}`;
  };

  const S = {
    page:    { background: '#111', minHeight: '100vh', fontFamily: '"Inter", Arial, sans-serif', color: '#f5f5f5', padding: 24 },
    card:    { background: '#111', maxWidth: 1060, margin: '0 auto', border: '1px solid #2a2a2a', borderRadius: 12, overflow: 'hidden' },
    header:  { background: '#f59e0b', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    logoTxt: { fontSize: 32, fontWeight: 900, color: '#111', letterSpacing: 3 },
    tagline: { fontSize: 11, color: '#111', fontWeight: 700, letterSpacing: 2, opacity: 0.8 },
    body:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 },
    col:     { padding: '20px 24px' },
    catHdr:  { background: '#f59e0b', color: '#111', fontSize: 12, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', padding: '4px 10px', borderRadius: 4, display: 'inline-block', marginBottom: 8, marginTop: 14 },
    row:     { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '3px 0', borderBottom: '1px solid #1f1f1f' },
    name:    { color: '#f5f5f5', fontSize: 12, fontWeight: 600 },
    price:   { color: '#f59e0b', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', marginLeft: 8 },
    divider: { width: 1, background: '#2a2a2a' },
    footer:  { background: '#0f0f0f', borderTop: '1px solid #2a2a2a', padding: '10px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    note:    { color: '#9ca3af', fontSize: 10, fontWeight: 500 },
    sauces:  { color: '#9ca3af', fontSize: 10 },
  };

  const SAUCE_LIST = 'Garlic ⭐ · Tomato · Chilli · Sweet Chilli · Mayo · Chipotle · BBQ';
  const SALAD_LIST = 'Lettuce · Tomato · Onion · Cheese · Tabouli · Salad Mix';

  // Split categories into 2 columns
  const catEntries = Object.entries(categories);
  const mid = Math.ceil(catEntries.length / 2);
  const leftCats  = catEntries.slice(0, mid);
  const rightCats = catEntries.slice(mid);

  const renderCategory = ([catName, catItems]) => (
    <div key={catName}>
      <div style={S.catHdr}>{catName}</div>
      {catItems.map(item => (
        <div key={item.id} style={S.row}>
          <span style={S.name}>{item.name}</span>
          <span style={S.price}>{priceStr(item)}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div style={S.page}>
      {/* Print button (hidden on print) */}
      <div className="no-print" style={{ textAlign: 'center', marginBottom: 20 }}>
        <button
          onClick={() => window.print()}
          style={{ background: '#f59e0b', color: '#111', border: 'none', padding: '12px 32px', borderRadius: 10, fontWeight: 800, fontSize: 15, cursor: 'pointer', marginRight: 12 }}
        >
          🖨️ Print Menu Card (A4 Landscape)
        </button>
        <button
          onClick={() => window.history.back()}
          style={{ background: '#222', color: '#9ca3af', border: '1px solid #333', padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
        >
          ← Back
        </button>
      </div>

      {/* The actual print card */}
      <div className="print-card" style={S.card}>
        {/* Header */}
        <div style={S.header}>
          <div>
            <div style={S.logoTxt}>TJ'S KEBAB CENTRE</div>
            <div style={S.tagline}>REAL FLAVOUR · REAL GOOD</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#111', fontWeight: 700 }}>PICKUP ONLY</div>
            <div style={{ fontSize: 10, color: '#111', opacity: 0.7 }}>1 free sauce with every order</div>
            <div style={{ fontSize: 10, color: '#111', opacity: 0.7 }}>Extra sauce +$2 · Extra meat +$2</div>
          </div>
        </div>

        {/* 2-column body */}
        <div style={S.body}>
          <div style={S.col}>
            {leftCats.map(renderCategory)}
          </div>
          <div style={{ ...S.divider }} />
          <div style={S.col}>
            {rightCats.map(renderCategory)}
            {/* Drinks */}
            {drinks.length > 0 && (
              <div>
                <div style={S.catHdr}>Drinks</div>
                {drinks.map(d => (
                  <div key={d.id} style={S.row}>
                    <span style={S.name}>{d.name}</span>
                    <span style={S.price}>${d.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={S.footer}>
          <div style={S.sauces}>Sauces: {SAUCE_LIST}</div>
          <div style={S.sauces}>Salad Bar: {SALAD_LIST}</div>
          <div style={S.note}>Scan QR to order online →</div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add /menu-card route to App.js**

In `src/App.js`:
```js
import MenuCardPage from './pages/MenuCardPage';
```

Add route:
```jsx
<Route path="/menu-card" element={<MenuCardPage />} />
```

- [ ] **Step 3: Verify**

Navigate to `http://localhost:3000/menu-card`. Menu card appears in TJ's dark brand style. Click "Print Menu Card" — browser print dialog opens with A4 landscape layout. All categories and prices visible.

- [ ] **Step 4: Commit**
```bash
git add src/pages/MenuCardPage.js src/App.js
git commit -m "feat: add /menu-card — printable A4 landscape menu in TJ's brand style"
```

---

### Task 3: Enhance QR Code in Admin

**Files:**
- Modify: `src/admin/AdminDashboard.js`

**Goal:** QR tab shows large QR code linking to the website, with a print button and a URL field the admin can update.

- [ ] **Step 1: Verify react-qr-code or QR solution is installed**
```bash
npm list react-qr-code 2>/dev/null || npm install react-qr-code
```

If `react-qr-code` not installed: `npm install react-qr-code`

- [ ] **Step 2: Update QR tab in AdminDashboard**

Find the QR tab section (currently `tab === 6`). Replace its content with:
```jsx
{tab === 6 && (() => {
  // Import at top of file: import QRCode from 'react-qr-code';
  const QRCode = require('react-qr-code').default;
  return (
    <div style={{ padding: 24, maxWidth: 500 }}>
      <h3 style={{ color: '#f59e0b', marginBottom: 16 }}>📱 QR Code</h3>

      <div style={{ marginBottom: 16 }}>
        <label style={{ color: '#9ca3af', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>Order URL</label>
        <input
          value={qrUrl}
          onChange={e => setQrUrl(e.target.value)}
          style={{ background: '#222', border: '1px solid #333', color: '#fff', padding: '10px 14px', borderRadius: 8, fontSize: 14, width: '100%', outline: 'none' }}
        />
      </div>

      {/* QR code */}
      <div id="qr-print-area" style={{ background: '#fff', padding: 24, borderRadius: 12, display: 'inline-block', marginBottom: 16 }}>
        <QRCode value={qrUrl} size={200} />
        <p style={{ textAlign: 'center', fontFamily: 'Arial', fontWeight: 800, fontSize: 14, color: '#111', marginTop: 12 }}>
          TJ'S KEBAB CENTRE
        </p>
        <p style={{ textAlign: 'center', fontFamily: 'Arial', fontSize: 11, color: '#555', marginTop: 2 }}>
          Scan to order online
        </p>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={() => {
            const el = document.getElementById('qr-print-area');
            const w  = window.open('', '_blank', 'width=400,height=400');
            w.document.write(`<html><body style="margin:0;background:#fff">${el.outerHTML}</body></html>`);
            w.document.close();
            w.print();
          }}
          style={{ background: '#f59e0b', color: '#000', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
        >
          🖨️ Print QR Code
        </button>
        <a
          href="/menu-card"
          target="_blank"
          style={{ background: '#222', color: '#9ca3af', border: '1px solid #333', padding: '10px 20px', borderRadius: 8, fontWeight: 600, fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center' }}
        >
          📄 Print Menu Card
        </a>
      </div>

      <p style={{ color: '#9ca3af', fontSize: 12, marginTop: 16 }}>
        Print this QR code and display it at the counter. Customers scan it to open the ordering website on their phone.
      </p>
    </div>
  );
})()}
```

Add import at top of AdminDashboard.js:
```js
import QRCode from 'react-qr-code';
```

- [ ] **Step 3: Verify**

In admin, click QR Code tab. Large QR renders. Scan with phone — opens website. Print QR button opens print dialog. "Print Menu Card" link opens menu card page.

- [ ] **Step 4: Final build check**
```bash
npm run build
```
Expected: successful build.

- [ ] **Step 5: Final commit**
```bash
git add src/admin/AdminDashboard.js package.json package-lock.json
git commit -m "feat: enhance admin QR tab — printable QR code, link to menu card"
git commit -m "feat: Plan 5 complete — printable menu card, enhanced QR code"
```

---

## Plan 5 Complete

After all tasks:
- `/menu-card` page shows a live, printable A4 landscape menu with all items and current prices
- Browser Cmd+P → PDF → print and stick in shop
- Admin QR tab: large scannable QR, print button, URL configurable
- Admin QR tab links to printable menu card

---

## All Plans Complete — Full Application

| Plan | Status | What it delivers |
|------|--------|-----------------|
| Plan 1 | Frontend | Uber Eats menu, cart, checkout, confirmation |
| Plan 2 | Auth + Loyalty | Login, stamps, account page |
| Plan 3 | Backend | Email/SMS/push, promo blast |
| Plan 4 | Admin + Staff | Live price editing, subscriber list, staff hours |
| Plan 5 | Print | Menu card, QR code |

**Launch checklist:**
- [ ] Seed Firestore with full menu (Admin → Seed Database)
- [ ] Set `REACT_APP_API_URL` in Netlify env vars to Railway backend URL
- [ ] Set all `server/.env` vars in Railway
- [ ] `npm run build` → deploy to Netlify
- [ ] Test end-to-end: order → email received → admin sees order → mark ready → customer notified
