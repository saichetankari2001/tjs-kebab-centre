# TJ's Kebab Centre — Plan 1: Frontend Ordering Experience

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the customer-facing website into a professional Uber Eats–style ordering experience — sticky nav, Unsplash category photos, smooth Framer Motion animations, full customisation modal, cart, checkout (pickup only), and order confirmation with loyalty stamp counter.

**Architecture:** React 18 + Tailwind CSS + Framer Motion. Menu data from Firebase Firestore (real-time onSnapshot). Category hero photos via Unsplash embed URLs (no API key). Item customisation in Radix UI bottom-sheet modal. CartContext (existing) keeps cart state. Pickup only — zero delivery logic.

**Tech Stack:** React 18, Tailwind CSS v3, Framer Motion, @radix-ui/react-dialog (existing), lucide-react (existing), Firebase Firestore (existing), react-router-dom v6 (existing)

## Global Constraints
- React 18 hooks only — no class components
- Tailwind for all styling — no inline style objects, no plain CSS except global.css keyframes
- Pickup only — no delivery fee, no delivery address, no delivery toggle
- Sauces: first one FREE, each additional sauce costs $2
- Extra meat add-on: $2 standard
- All item prices come from Firestore — seed from seedData.js in Task 2
- Category photos via Unsplash (`?auto=format&fit=crop&w=800&q=80` suffix)
- Max-width 960px centred on desktop, full-width mobile
- framer-motion must be installed before any animation code is written
- No emoji/sticker images — real Unsplash photos only

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Modify | `tailwind.config.js` | brand colours, font families, keyframes |
| Modify | `src/styles/global.css` | scrollbar, font smoothing, keyframes |
| Modify | `public/index.html` | Google Fonts preconnect |
| Create | `src/data/menu.js` | category list, photo URLs, category metadata |
| Modify | `src/data/options.js` | add chipotle sauce, update all sauce prices |
| Modify | `src/data/seedData.js` | full TJ's menu seed (all items from spec) |
| Modify | `src/lib/itemTypes.js` | add bowl/dip types, fix HSP/skewer/chips pricing |
| Modify | `src/hooks/useMenu.js` | pull categories + items from Firestore |
| Modify | `src/components/Navbar.js` | full rewrite — sticky, logo, cart badge |
| Modify | `src/components/HeroSection.js` | full rewrite — Unsplash photo, motion, CTA |
| Modify | `src/components/CategoryNav.js` | full rewrite — Uber Eats sticky pills |
| Create | `src/components/MenuSection.js` | one category block with header photo + rows |
| Create | `src/components/MenuItemRow.js` | text-only item row (name/desc/price/ADD) |
| Modify | `src/components/ItemModal.js` | full rewrite — all item types handled |
| Modify | `src/components/CartBar.js` | enhance — amber sticky bar |
| Create | `src/components/PromoSignupBanner.js` | dismissible signup strip |
| Modify | `src/pages/HomePage.js` | orchestrate new layout |
| Modify | `src/pages/CartPage.js` | full Tailwind rewrite, pickup only |
| Modify | `src/pages/CheckoutPage.js` | full Tailwind rewrite + promo widget |
| Modify | `src/pages/OrderConfirmationPage.js` | status tracker + stamp counter |
| Modify | `src/App.js` | add /account, /login, /signup stubs |

---

### Task 1: Dependencies, Tailwind config, global CSS, fonts

**Files:**
- Modify: `tailwind.config.js`
- Modify: `src/styles/global.css`
- Modify: `public/index.html`

**Interfaces:**
- Produces: `animate-fadeIn`, `animate-slideUp`, `animate-stamp` CSS classes; custom colour tokens `brand`, `surface`, `card`, `card2`, `border`; Inter + Bebas Neue fonts available globally

- [ ] **Step 1: Install framer-motion**
```bash
npm install framer-motion
```
Expected: package added, no peer-dep errors.

- [ ] **Step 2: Write tailwind.config.js**
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand:       '#f59e0b',
        'brand-lit': '#fbbf24',
        surface:     '#0f0f0f',
        card:        '#1a1a1a',
        card2:       '#222222',
        border:      '#2a2a2a',
        muted:       '#9ca3af',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Bebas Neue"', 'Impact', 'sans-serif'],
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:   { from: { transform: 'translateY(40px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        stampFill: { from: { transform: 'scale(0) rotate(-15deg)', opacity: '0' }, to: { transform: 'scale(1) rotate(0deg)', opacity: '1' } },
        shimmer:   { '0%': { backgroundPosition: '-400px 0' }, '100%': { backgroundPosition: '400px 0' } },
      },
      animation: {
        fadeIn:    'fadeIn 0.3s ease both',
        slideUp:   'slideUp 0.35s ease both',
        stamp:     'stampFill 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
        shimmer:   'shimmer 1.4s linear infinite',
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 3: Write src/styles/global.css**
```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Inter', system-ui, sans-serif;
  background: #0f0f0f;
  color: #f5f5f5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: #1a1a1a; }
::-webkit-scrollbar-thumb { background: #f59e0b; border-radius: 2px; }

.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

@keyframes fadeIn  { from { opacity: 0 }               to { opacity: 1 } }
@keyframes slideUp { from { transform: translateY(40px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
@keyframes stampFill {
  from { transform: scale(0) rotate(-15deg); opacity: 0 }
  to   { transform: scale(1) rotate(0deg);  opacity: 1 }
}
@keyframes shimmer {
  0%   { background-position: -400px 0 }
  100% { background-position:  400px 0 }
}

.animate-fadeIn  { animation: fadeIn  0.3s  ease both; }
.animate-slideUp { animation: slideUp 0.35s ease both; }
.animate-stamp   { animation: stampFill 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }
.animate-shimmer { animation: shimmer 1.4s linear infinite; }
```

- [ ] **Step 4: Add Google Fonts to public/index.html**

Open `public/index.html`. Inside `<head>`, before `<title>`, add:
```html
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
```

- [ ] **Step 5: Start dev server, verify**
```bash
npm start
```
Open `http://localhost:3000`. In DevTools → Network → Fonts, confirm `Bebas+Neue` and `Inter` load. Body background is `#0f0f0f`. No console errors.

- [ ] **Step 6: Commit**
```bash
git add tailwind.config.js src/styles/global.css public/index.html package.json package-lock.json
git commit -m "feat: install framer-motion, configure tailwind tokens, load fonts"
```

---

### Task 2: Data layer — menu.js, options.js, itemTypes.js, seedData.js

**Files:**
- Create: `src/data/menu.js`
- Modify: `src/data/options.js`
- Modify: `src/lib/itemTypes.js`
- Modify: `src/data/seedData.js`

**Interfaces:**
- Produces:
  - `CATEGORIES` — ordered array `{ id, name, emoji, photo }`
  - `HERO_PHOTO` — string URL
  - `SAUCE_OPTIONS` — array `{ id, name, price }`
  - `SALAD_OPTIONS` — array `{ id, name }`
  - `ITEM_TYPE_CONFIG` — map of type → `{ hasSize, hasMeat, hasSauces, hasSalad, hasBowlType, hasSkewBase }`
  - `getItemTypeConfig(itemType)` — returns config or no-customisation fallback
  - `calculateItemPrice(basePrice, options)` — returns `number`
  - `SEED_MENU_V2`, `SEED_DRINKS_V2` — arrays used in AdminDashboard seed function

- [ ] **Step 1: Create src/data/menu.js**
```js
// Category metadata and stock photo URLs (Unsplash — no API key required)
export const HERO_PHOTO =
  'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=1400&q=80';

export const CATEGORIES = [
  {
    id: 'wraps',
    name: 'Kebab Wraps',
    emoji: '🌯',
    photo: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'bowls',
    name: 'Signature Bowls',
    emoji: '🥗',
    photo: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'hsp',
    name: 'HSP',
    emoji: '🍟',
    photo: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'skewers',
    name: 'Skewers',
    emoji: '🍢',
    photo: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'chips',
    name: 'Chips',
    emoji: '🍟',
    photo: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'snacks',
    name: 'Snacks',
    emoji: '🍗',
    photo: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'loaded',
    name: 'Loaded Upgrade',
    emoji: '⚡',
    photo: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'dips',
    name: 'Homemade Dips',
    emoji: '🫙',
    photo: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'drinks',
    name: 'Drinks',
    emoji: '🥤',
    photo: 'https://images.unsplash.com/photo-1527960471264-932f39eb5846?auto=format&fit=crop&w=800&q=80',
  },
];
```

- [ ] **Step 2: Rewrite src/data/options.js**
```js
export const SALAD_OPTIONS = [
  { id: 'lettuce',    name: 'Lettuce' },
  { id: 'tomato',     name: 'Tomato' },
  { id: 'onion',      name: 'Onion' },
  { id: 'cheese',     name: 'Cheese' },
  { id: 'tabouli',    name: 'Tabouli' },
  { id: 'salad-mix',  name: 'Salad Mix' },
];

// Default salad for wraps (pre-selected)
export const DEFAULT_WRAP_SALADS = ['lettuce', 'tomato', 'onion'];

// First sauce FREE — additional sauces $2 each (see calculateItemPrice)
export const SAUCE_OPTIONS = [
  { id: 'garlic',       name: 'Garlic',       price: 0, popular: true, note: 'House-made ⭐' },
  { id: 'tomato',       name: 'Tomato',        price: 0 },
  { id: 'chilli',       name: 'Chilli',        price: 0 },
  { id: 'sweet-chilli', name: 'Sweet Chilli',  price: 0 },
  { id: 'mayo',         name: 'Mayo',          price: 0 },
  { id: 'chipotle',     name: 'Chipotle',      price: 0 },
  { id: 'bbq',          name: 'BBQ',           price: 0 },
];

export const EXTRA_MEAT_OPTIONS = [
  { id: 'chicken', name: 'Extra Chicken', price: 2 },
  { id: 'lamb',    name: 'Extra Lamb',    price: 2 },
];
```

- [ ] **Step 3: Rewrite src/lib/itemTypes.js**
```js
export const ITEM_TYPE_CONFIG = {
  // Kebab wraps — sauce + salad (default lettuce/tomato/onion) + extra meat
  wrap: {
    hasSize: false, hasMeat: true, hasSauces: true, hasSalad: true,
    hasBowlType: false, hasSkewBase: false,
  },
  // Signature bowls — rice or salad bowl choice + sauce
  bowl: {
    hasSize: false, hasMeat: false, hasSauces: true, hasSalad: false,
    hasBowlType: true, hasSkewBase: false,
  },
  // HSP — size (uses item.sizePrices) + extra meat + sauce + salad
  hsp: {
    hasSize: true, hasMeat: true, hasSauces: true, hasSalad: true,
    hasBowlType: false, hasSkewBase: false,
  },
  // Skewers — rice or salad base + sauce
  skewer: {
    hasSize: false, hasMeat: false, hasSauces: true, hasSalad: false,
    hasBowlType: false, hasSkewBase: true,
  },
  // Chips — size (uses item.sizePrices, isChips: true)
  chips: {
    hasSize: true, hasMeat: false, hasSauces: false, hasSalad: false,
    hasBowlType: false, hasSkewBase: false, isChips: true,
  },
  // Snacks (nuggets, tenders, combos) — no customisation
  snack: {
    hasSize: false, hasMeat: false, hasSauces: false, hasSalad: false,
    hasBowlType: false, hasSkewBase: false,
  },
  // Loaded upgrade — reg or large size (item.sizePrices)
  loaded: {
    hasSize: true, hasMeat: false, hasSauces: false, hasSalad: false,
    hasBowlType: false, hasSkewBase: false,
  },
  // Dips — no customisation
  dip: {
    hasSize: false, hasMeat: false, hasSauces: false, hasSalad: false,
    hasBowlType: false, hasSkewBase: false,
  },
  // Drinks — no customisation
  drink: {
    hasSize: false, hasMeat: false, hasSauces: false, hasSalad: false,
    hasBowlType: false, hasSkewBase: false,
  },
};

export function getItemTypeConfig(itemType) {
  return ITEM_TYPE_CONFIG[itemType] ?? {
    hasSize: false, hasMeat: false, hasSauces: false, hasSalad: false,
    hasBowlType: false, hasSkewBase: false,
  };
}

// EXTRA_SAUCE_PRICE: charged per sauce beyond the first free one
export const EXTRA_SAUCE_PRICE = 2;
export const EXTRA_MEAT_PRICE  = 2;

/**
 * Calculate final unit price for an item.
 * @param {number} basePrice - item.price from Firestore
 * @param {{
 *   itemType: string,
 *   item: object,           // full Firestore item (for sizePrices, saladPrice, ricePrice)
 *   selectedSize: string,   // 'S'|'M'|'L'|'XL'|'Reg'|'Large' etc.
 *   bowlType: string,       // 'salad'|'rice'
 *   hasExtraMeat: boolean,
 *   selectedSauces: string[],
 * }} opts
 * @returns {number}
 */
export function calculateItemPrice(basePrice, opts = {}) {
  const { itemType, item = {}, selectedSize, bowlType, hasExtraMeat, selectedSauces = [] } = opts;
  let price = basePrice;

  // HSP: absolute price from sizePrices object
  if (itemType === 'hsp' && selectedSize && item.sizePrices) {
    price = item.sizePrices[selectedSize] ?? basePrice;
  }

  // Bowl: price depends on salad vs rice choice
  if (itemType === 'bowl') {
    price = bowlType === 'rice'
      ? (item.ricePrice ?? basePrice)
      : (item.saladPrice ?? basePrice);
  }

  // Chips: absolute price from sizePrices
  if (itemType === 'chips' && selectedSize && item.sizePrices) {
    price = item.sizePrices[selectedSize] ?? basePrice;
  }

  // Loaded upgrade: absolute price from sizePrices
  if (itemType === 'loaded' && selectedSize && item.sizePrices) {
    price = item.sizePrices[selectedSize] ?? basePrice;
  }

  // Extra meat
  if (hasExtraMeat) price += EXTRA_MEAT_PRICE;

  // Sauces: first is FREE, each additional costs EXTRA_SAUCE_PRICE ($2)
  const paidSauces = Math.max(0, selectedSauces.length - 1);
  price += paidSauces * EXTRA_SAUCE_PRICE;

  return price;
}
```

- [ ] **Step 4: Run existing itemTypes test to verify calculateItemPrice still passes**
```bash
npm test -- --testPathPattern=itemTypes --watchAll=false
```
Expected: all tests pass. If tests use old HSP_SIZE_PRICES, update those test assertions to match new logic.

- [ ] **Step 5: Rewrite src/data/seedData.js**
```js
// Full TJ's Kebab Centre menu — use via AdminDashboard "Seed Database" button
// Each item needs: name, description, price, category, categoryId, categoryOrder, order, available, itemType
// Bowl items also need: saladPrice, ricePrice
// HSP items need: sizePrices { S, M, L, XL }
// Chips need: sizePrices { S, M, L, XL }, isChips: true, itemType: 'chips'
// Loaded upgrade needs: sizePrices { Reg, Large }, itemType: 'loaded'

export const SEED_MENU_V2 = [
  // ─── KEBAB WRAPS (categoryOrder: 1) ───
  { name: 'Original Kebab — Chicken', description: 'Tender chicken, fresh salad (lettuce, tomato, onion), your choice of sauce. Rolled in Turkish bread.', price: 16, category: 'Kebab Wraps', categoryId: 'wraps', categoryOrder: 1, order: 1, available: true, itemType: 'wrap' },
  { name: 'Original Kebab — Lamb',    description: 'Seasoned lamb, fresh salad, your choice of sauce. Rolled in Turkish bread.',                           price: 18, category: 'Kebab Wraps', categoryId: 'wraps', categoryOrder: 1, order: 2, available: true, itemType: 'wrap' },
  { name: 'Original Kebab — Mix',     description: 'Chicken and lamb mix, fresh salad, your choice of sauce. Rolled in Turkish bread.',                    price: 18, category: 'Kebab Wraps', categoryId: 'wraps', categoryOrder: 1, order: 3, available: true, itemType: 'wrap' },
  { name: 'Chargrilled Kebab — Chicken', description: 'Chargrilled chicken skewer meat, fresh salad, your choice of sauce. Rolled in Turkish bread.',      price: 18, category: 'Kebab Wraps', categoryId: 'wraps', categoryOrder: 1, order: 4, available: true, itemType: 'wrap' },
  { name: 'Chargrilled Kebab — Lamb',    description: 'Chargrilled lamb skewer meat, fresh salad, your choice of sauce. Rolled in Turkish bread.',         price: 20, category: 'Kebab Wraps', categoryId: 'wraps', categoryOrder: 1, order: 5, available: true, itemType: 'wrap' },
  { name: 'Chargrilled Kebab — Mix',     description: 'Chargrilled chicken and lamb mix, fresh salad, your choice of sauce. Rolled in Turkish bread.',     price: 20, category: 'Kebab Wraps', categoryId: 'wraps', categoryOrder: 1, order: 6, available: true, itemType: 'wrap' },
  { name: 'Falafel OG Wrap',   description: 'Crispy homemade falafel, fresh salad, tahini and your choice of sauce in Turkish bread.',                     price: 16, category: 'Kebab Wraps', categoryId: 'wraps', categoryOrder: 1, order: 7, available: true, itemType: 'wrap' },
  { name: 'Falafel Garden',    description: 'Loaded falafel wrap with garden salad, hummus, tabouli and house garlic sauce.',                              price: 18, category: 'Kebab Wraps', categoryId: 'wraps', categoryOrder: 1, order: 8, available: true, itemType: 'wrap' },

  // ─── SIGNATURE BOWLS (categoryOrder: 2) ───
  // price = saladPrice (displayed base), ricePrice = salad + $1
  { name: 'Chicken Bowl',            description: 'Seasoned chicken over your choice of salad or rice.',                   price: 15, saladPrice: 15, ricePrice: 16, category: 'Signature Bowls', categoryId: 'bowls', categoryOrder: 2, order: 1, available: true, itemType: 'bowl' },
  { name: 'Lamb Bowl',               description: 'Seasoned lamb over your choice of salad or rice.',                     price: 16, saladPrice: 16, ricePrice: 17, category: 'Signature Bowls', categoryId: 'bowls', categoryOrder: 2, order: 2, available: true, itemType: 'bowl' },
  { name: 'Mix Bowl',                description: 'Chicken and lamb mix over your choice of salad or rice.',               price: 16, saladPrice: 16, ricePrice: 17, category: 'Signature Bowls', categoryId: 'bowls', categoryOrder: 2, order: 3, available: true, itemType: 'bowl' },
  { name: 'Chargrilled Chicken Bowl',description: 'Chargrilled chicken skewer over your choice of salad or rice.',        price: 16, saladPrice: 16, ricePrice: 17, category: 'Signature Bowls', categoryId: 'bowls', categoryOrder: 2, order: 4, available: true, itemType: 'bowl' },
  { name: 'Chargrilled Lamb Bowl',   description: 'Chargrilled lamb skewer over your choice of salad or rice.',           price: 17, saladPrice: 17, ricePrice: 18, category: 'Signature Bowls', categoryId: 'bowls', categoryOrder: 2, order: 5, available: true, itemType: 'bowl' },
  { name: 'The Special Bowl',        description: 'Our chef\'s special selection — chargrilled mix over salad or rice.',  price: 23, saladPrice: 23, ricePrice: 24, category: 'Signature Bowls', categoryId: 'bowls', categoryOrder: 2, order: 6, available: true, itemType: 'bowl' },

  // ─── HSP (categoryOrder: 3) ───
  // sizePrices are absolute prices per size
  { name: 'Chicken HSP', description: 'Halal snack pack — chips, chicken doner, cheese, garlic sauce and chilli. Choose your size.', price: 15, sizePrices: { S: 15, M: 20, L: 24, XL: 35 }, category: 'HSP', categoryId: 'hsp', categoryOrder: 3, order: 1, available: true, itemType: 'hsp' },
  { name: 'Lamb HSP',    description: 'Halal snack pack — chips, lamb doner, cheese, garlic sauce and chilli. Choose your size.',   price: 16, sizePrices: { S: 16, M: 22, L: 27, XL: 40 }, category: 'HSP', categoryId: 'hsp', categoryOrder: 3, order: 2, available: true, itemType: 'hsp' },
  { name: 'Mixed HSP',   description: 'Halal snack pack — chips, chicken and lamb mix, cheese, garlic sauce and chilli.',          price: 16, sizePrices: { S: 16, M: 22, L: 27, XL: 40 }, category: 'HSP', categoryId: 'hsp', categoryOrder: 3, order: 3, available: true, itemType: 'hsp' },

  // ─── SKEWERS (categoryOrder: 4) ───
  { name: 'Chargrilled Chicken Skewer', description: 'Chargrilled chicken skewer served with your choice of rice or salad.', price: 10, category: 'Skewers', categoryId: 'skewers', categoryOrder: 4, order: 1, available: true, itemType: 'skewer' },
  { name: 'Lamb Skewer',                description: 'Chargrilled lamb skewer served with your choice of rice or salad.',    price: 12, category: 'Skewers', categoryId: 'skewers', categoryOrder: 4, order: 2, available: true, itemType: 'skewer' },

  // ─── CHIPS (categoryOrder: 5) ───
  { name: 'Chips', description: 'Golden hot chips. Choose your size.', price: 5, sizePrices: { S: 5, M: 7, L: 9, XL: 12 }, isChips: true, category: 'Chips', categoryId: 'chips', categoryOrder: 5, order: 1, available: true, itemType: 'chips' },

  // ─── SNACKS (categoryOrder: 6) ───
  { name: 'Nuggets',                 description: '8 piece crispy chicken nuggets.',                              price: 8,  category: 'Snacks', categoryId: 'snacks', categoryOrder: 6, order: 1, available: true, itemType: 'snack' },
  { name: 'Chicken Tenders',         description: '4 piece crispy chicken tenders.',                             price: 8,  category: 'Snacks', categoryId: 'snacks', categoryOrder: 6, order: 2, available: true, itemType: 'snack' },
  { name: 'Chips & Nuggets',         description: 'Large chips plus 8 piece nuggets. Great value combo.',        price: 15, category: 'Snacks', categoryId: 'snacks', categoryOrder: 6, order: 3, available: true, itemType: 'snack' },
  { name: 'Chips & Chicken Tenders', description: 'Large chips plus 4 piece chicken tenders. Great value combo.',price: 15, category: 'Snacks', categoryId: 'snacks', categoryOrder: 6, order: 4, available: true, itemType: 'snack' },

  // ─── LOADED UPGRADE (categoryOrder: 7) ───
  { name: 'The Loaded Upgrade', description: 'Hot, crunchy golden chips and a can drink. Regular or large size.', price: 7, sizePrices: { Reg: 7, Large: 9 }, category: 'Loaded Upgrade', categoryId: 'loaded', categoryOrder: 7, order: 1, available: true, itemType: 'loaded' },

  // ─── HOMEMADE DIPS (categoryOrder: 8) ───
  { name: 'Chilli Dip',   description: 'House-made spicy chilli dip.',  price: 2, category: 'Homemade Dips', categoryId: 'dips', categoryOrder: 8, order: 1, available: true, itemType: 'dip' },
  { name: 'Tzatziki Dip', description: 'Classic creamy tzatziki dip.', price: 2, category: 'Homemade Dips', categoryId: 'dips', categoryOrder: 8, order: 2, available: true, itemType: 'dip' },
];

export const SEED_DRINKS_V2 = [
  { name: 'Can',            description: '375ml soft drink can.',    price: 3, order: 1, available: true },
  { name: 'Regular Bottle', description: '600ml bottle.',            price: 5, order: 2, available: true },
  { name: 'Large Bottle',   description: '1.25L bottle.',            price: 7, order: 3, available: true },
];

// Keep old exports as aliases so AdminDashboard doesn't break until Plan 4 updates it
export const SEED_MENU   = SEED_MENU_V2;
export const SEED_DRINKS = SEED_DRINKS_V2;
```

- [ ] **Step 6: Commit**
```bash
git add src/data/menu.js src/data/options.js src/lib/itemTypes.js src/data/seedData.js
git commit -m "feat: update data layer — full menu, bowl/hsp/chips/skewer types, sauce logic"
```

---

### Task 3: Navbar

**Files:**
- Modify: `src/components/Navbar.js`

**Interfaces:**
- Consumes: `useCart()` → `{ itemCount }`; `react-router-dom` → `useNavigate`
- Produces: sticky 64px header with TJ's logo, cart badge; exported as default

- [ ] **Step 1: Write src/components/Navbar.js**
```jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { itemCount } = useCart();
  const navigate = useNavigate();

  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-50 h-16 bg-card border-b border-border flex items-center justify-between px-5 md:px-8"
    >
      {/* Logo */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 focus:outline-none"
      >
        <span className="font-display text-2xl tracking-wide text-white leading-none">
          TJ'S <span className="text-brand">KEBAB</span>
        </span>
        <span className="hidden sm:block text-[10px] text-muted tracking-widest uppercase mt-0.5 font-medium">
          Centre
        </span>
      </button>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/cart')}
          className="relative flex items-center gap-2 bg-brand text-surface px-4 py-2 rounded-lg font-bold text-sm hover:bg-brand-lit transition-colors active:scale-95"
        >
          <ShoppingBag size={16} strokeWidth={2.5} />
          <span className="hidden sm:inline">Order</span>
          {itemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-white text-surface text-xs font-black w-5 h-5 rounded-full flex items-center justify-center shadow">
              {itemCount > 9 ? '9+' : itemCount}
            </span>
          )}
        </button>
      </div>
    </motion.header>
  );
}
```

- [ ] **Step 2: Verify**

Run `npm start`. Visit `http://localhost:3000`. Navbar should be dark, show "TJ'S KEBAB Centre", have a gold ORDER button. Cart badge visible when items in cart.

- [ ] **Step 3: Commit**
```bash
git add src/components/Navbar.js
git commit -m "feat: redesign Navbar — sticky, TJ's logo, cart badge"
```

---

### Task 4: HeroSection

**Files:**
- Modify: `src/components/HeroSection.js`

**Interfaces:**
- Consumes: `HERO_PHOTO` from `../data/menu`; prop `onCtaClick: () => void`
- Produces: full-width hero banner with photo overlay, title, tagline, CTA button

- [ ] **Step 1: Write src/components/HeroSection.js**
```jsx
import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { HERO_PHOTO } from '../data/menu';

export default function HeroSection({ onCtaClick }) {
  return (
    <section className="relative w-full h-[56vw] max-h-[520px] min-h-[280px] overflow-hidden">
      {/* Background photo */}
      <img
        src={HERO_PHOTO}
        alt="TJ's Kebab Centre"
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
      />

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-surface/70 via-surface/50 to-surface" />
      <div className="absolute inset-0 bg-gradient-to-r from-surface/60 to-transparent" />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-center px-6 md:px-12 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <span className="inline-block text-brand font-bold text-xs tracking-[3px] uppercase mb-3 border border-brand/40 px-3 py-1 rounded-full">
            Real Flavour · Real Good
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="font-display text-5xl sm:text-7xl md:text-8xl text-white leading-none tracking-wide mb-4"
        >
          TJ'S<br />
          <span className="text-brand">KEBAB</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-muted text-sm sm:text-base mb-6 max-w-sm leading-relaxed"
        >
          Chargrilled meats, homemade sauces &amp; fresh salads — made to order. Pickup only.
        </motion.p>

        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          onClick={onCtaClick}
          className="flex items-center gap-2 bg-brand text-surface font-black text-sm tracking-wide px-6 py-3 rounded-xl w-fit hover:bg-brand-lit transition-all active:scale-95 shadow-lg shadow-brand/20"
        >
          ORDER NOW
          <ChevronDown size={16} strokeWidth={3} />
        </motion.button>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-surface to-transparent" />
    </section>
  );
}
```

- [ ] **Step 2: Verify**

Refresh `http://localhost:3000`. Full-width hero photo with dark overlay, "TJ'S KEBAB" heading, gold ORDER NOW button visible. Photo loads (check Network tab).

- [ ] **Step 3: Commit**
```bash
git add src/components/HeroSection.js
git commit -m "feat: redesign HeroSection — Unsplash photo, Framer Motion, gold CTA"
```

---

### Task 5: CategoryNav

**Files:**
- Modify: `src/components/CategoryNav.js`

**Interfaces:**
- Consumes: `categories: Array<{id, name, emoji}>`, `activeCatId: string`, `onCategoryClick: (id) => void`
- Produces: sticky horizontal scroll pill nav below Navbar (top-16 = 64px)

- [ ] **Step 1: Write src/components/CategoryNav.js**
```jsx
import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function CategoryNav({ categories, activeCatId, onCategoryClick }) {
  const scrollRef = useRef(null);
  const pillRefs  = useRef({});

  // Auto-scroll active pill into view when activeCatId changes
  useEffect(() => {
    const pill = pillRefs.current[activeCatId];
    const bar  = scrollRef.current;
    if (!pill || !bar) return;
    const pillLeft = pill.offsetLeft;
    const barW     = bar.offsetWidth;
    const pillW    = pill.offsetWidth;
    bar.scrollTo({ left: pillLeft - barW / 2 + pillW / 2, behavior: 'smooth' });
  }, [activeCatId]);

  return (
    <nav
      ref={scrollRef}
      className="sticky top-16 z-40 bg-surface/95 backdrop-blur border-b border-border flex items-center gap-1 overflow-x-auto scrollbar-hide px-3 h-12"
    >
      {categories.map((cat) => {
        const active = cat.id === activeCatId;
        return (
          <button
            key={cat.id}
            ref={(el) => { pillRefs.current[cat.id] = el; }}
            onClick={() => onCategoryClick(cat.id)}
            className={[
              'flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all whitespace-nowrap',
              active
                ? 'bg-brand text-surface shadow shadow-brand/30'
                : 'text-muted hover:text-white hover:bg-card2',
            ].join(' ')}
          >
            {cat.emoji} {cat.name}
          </button>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 2: Verify**

Reload page. Below Navbar, the category pills should appear. On scroll they should highlight. Pills should be horizontally scrollable on mobile.

- [ ] **Step 3: Commit**
```bash
git add src/components/CategoryNav.js
git commit -m "feat: redesign CategoryNav — sticky Uber Eats style pills, auto-scroll active"
```

---

### Task 6: MenuItemRow + MenuSection

**Files:**
- Create: `src/components/MenuItemRow.js`
- Create: `src/components/MenuSection.js`

**Interfaces:**
- `MenuItemRow` consumes: `item: object`, `onAdd: (item) => void`
- `MenuSection` consumes: `category: {id, name, emoji, photo}`, `items: object[]`, `sectionRef: React.Ref`, `onAdd: (item) => void`
- Both exported as default from their files

- [ ] **Step 1: Write src/components/MenuItemRow.js**
```jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

export default function MenuItemRow({ item, onAdd }) {
  const displayPrice = item.saladPrice ?? item.price;

  return (
    <motion.div
      whileHover={{ x: 2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="flex items-center gap-4 py-4 px-4 border-b border-border last:border-0 cursor-pointer hover:bg-card2/40 transition-colors group"
      onClick={() => onAdd(item)}
    >
      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-semibold text-white text-sm leading-snug">{item.name}</span>
          {item.popular && (
            <span className="text-[9px] font-black tracking-wider bg-brand text-surface px-1.5 py-0.5 rounded uppercase">
              Popular
            </span>
          )}
        </div>
        {item.description && (
          <p className="text-muted text-xs leading-relaxed line-clamp-2">{item.description}</p>
        )}
        {/* Bowl hint */}
        {item.itemType === 'bowl' && (
          <p className="text-brand/70 text-[10px] mt-1 font-medium">
            Salad Bowl ${item.saladPrice} · Rice Bowl ${item.ricePrice}
          </p>
        )}
        {/* HSP hint */}
        {item.itemType === 'hsp' && item.sizePrices && (
          <p className="text-brand/70 text-[10px] mt-1 font-medium">
            S ${item.sizePrices.S} · M ${item.sizePrices.M} · L ${item.sizePrices.L} · XL ${item.sizePrices.XL}
          </p>
        )}
        {/* Chips hint */}
        {item.itemType === 'chips' && item.sizePrices && (
          <p className="text-brand/70 text-[10px] mt-1 font-medium">
            S ${item.sizePrices.S} · M ${item.sizePrices.M} · L ${item.sizePrices.L} · XL ${item.sizePrices.XL}
          </p>
        )}
      </div>

      {/* Price + Add */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <span className="text-brand font-bold text-base">
          {item.itemType === 'bowl' ? `from $${displayPrice}` : `$${displayPrice.toFixed(2)}`}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onAdd(item); }}
          className="w-8 h-8 rounded-full bg-brand text-surface flex items-center justify-center hover:bg-brand-lit transition-colors active:scale-90 shadow shadow-brand/20"
        >
          <Plus size={16} strokeWidth={3} />
        </button>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Write src/components/MenuSection.js**
```jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import MenuItemRow from './MenuItemRow';
import ItemModal from './ItemModal';

export default function MenuSection({ category, items, sectionRef, onAdd }) {
  const [modalItem, setModalItem] = useState(null);

  const handleAdd = (item) => {
    // Items with no customisation (snack, dip, drink) go straight to cart
    const noModal = ['snack', 'dip', 'drink'].includes(item.itemType) && !item.sizePrices;
    if (noModal) {
      onAdd(item);
    } else {
      setModalItem(item);
    }
  };

  return (
    <section ref={sectionRef} className="mb-6">
      {/* Category header with photo banner */}
      <div className="relative h-28 overflow-hidden">
        <img
          src={category.photo}
          alt={category.name}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-surface/90 via-surface/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-surface/80 to-transparent" />
        <div className="relative h-full flex items-end px-5 pb-3">
          <div>
            <h2 className="font-display text-3xl text-white tracking-wide leading-none">
              {category.emoji} {category.name}
            </h2>
            <p className="text-muted text-xs mt-0.5 font-medium">{items.length} items</p>
          </div>
        </div>
      </div>

      {/* Items list */}
      <div className="bg-card border-x border-b border-border rounded-b-xl overflow-hidden">
        {items.length === 0 ? (
          <p className="text-muted text-sm text-center py-8">No items available right now.</p>
        ) : (
          items.map((item) => (
            <MenuItemRow key={item.id} item={item} onAdd={handleAdd} />
          ))
        )}
      </div>

      {/* Item customisation modal */}
      {modalItem && (
        <ItemModal
          item={modalItem}
          isOpen={!!modalItem}
          onClose={() => setModalItem(null)}
        />
      )}
    </section>
  );
}
```

- [ ] **Step 3: Commit**
```bash
git add src/components/MenuItemRow.js src/components/MenuSection.js
git commit -m "feat: add MenuItemRow and MenuSection components — text-only, category photo banner"
```

---

### Task 7: ItemModal — complete rewrite (all item types)

**Files:**
- Modify: `src/components/ItemModal.js`

**Interfaces:**
- Consumes: `item: object` (full Firestore item), `isOpen: bool`, `onClose: () => void`
- Consumes: `useCart()` → `{ addItem }`
- Consumes: `getItemTypeConfig`, `calculateItemPrice` from `../lib/itemTypes`
- Consumes: `SAUCE_OPTIONS`, `SALAD_OPTIONS`, `DEFAULT_WRAP_SALADS`, `EXTRA_MEAT_OPTIONS` from `../data/options`
- Produces: Radix Dialog bottom-sheet modal, calls `addItem` on confirm

- [ ] **Step 1: Write src/components/ItemModal.js**
```jsx
import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Plus, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { useCart } from '../context/CartContext';
import { getItemTypeConfig, calculateItemPrice } from '../lib/itemTypes';
import { SAUCE_OPTIONS, SALAD_OPTIONS, DEFAULT_WRAP_SALADS, EXTRA_MEAT_OPTIONS } from '../data/options';

const HSP_SIZE_LABELS  = { S: 'Small', M: 'Medium', L: 'Large', XL: 'X-Large' };
const SKEW_BASE_LABELS = { rice: 'With Rice', salad: 'With Salad' };
const LOADED_LABELS    = { Reg: 'Regular', Large: 'Large' };

export default function ItemModal({ item, isOpen, onClose }) {
  const { addItem } = useCart();
  const cfg = item ? getItemTypeConfig(item.itemType) : {};

  // ── State ──────────────────────────────────────────────
  const [qty,           setQty]           = useState(1);
  const [selectedSize,  setSelectedSize]  = useState(null);
  const [bowlType,      setBowlType]      = useState('salad');   // 'salad' | 'rice'
  const [skewBase,      setSkewBase]      = useState('rice');    // 'rice'  | 'salad'
  const [hasExtraMeat,  setHasExtraMeat]  = useState(false);
  const [extraMeatType, setExtraMeatType] = useState('chicken');
  const [selectedSauces,setSelectedSauces]= useState([]);
  const [selectedSalads,setSelectedSalads]= useState([]);
  const [note,          setNote]          = useState('');

  // Reset on open / item change
  useEffect(() => {
    if (!isOpen || !item) return;
    setQty(1);
    setHasExtraMeat(false);
    setExtraMeatType('chicken');
    setSelectedSauces([]);
    setNote('');
    setBowlType('salad');
    setSkewBase('rice');
    // Default salad selection
    if (cfg.hasSalad) {
      setSelectedSalads(DEFAULT_WRAP_SALADS.slice());
    } else {
      setSelectedSalads([]);
    }
    // Default size
    if (cfg.hasSize) {
      if (item.itemType === 'hsp')     setSelectedSize('S');
      else if (item.itemType === 'chips')  setSelectedSize('S');
      else if (item.itemType === 'loaded') setSelectedSize('Reg');
      else setSelectedSize(null);
    } else {
      setSelectedSize(null);
    }
  }, [isOpen, item?.id]);

  if (!item) return null;

  // ── Price calculation ──────────────────────────────────
  const unitPrice = calculateItemPrice(item.price, {
    itemType: item.itemType,
    item,
    selectedSize,
    bowlType,
    hasExtraMeat,
    selectedSauces,
  });
  const totalPrice = unitPrice * qty;

  // ── Helpers ────────────────────────────────────────────
  const toggleSauce = (id) =>
    setSelectedSauces((p) => p.includes(id) ? p.filter((s) => s !== id) : [...p, id]);

  const toggleSalad = (id) =>
    setSelectedSalads((p) => p.includes(id) ? p.filter((s) => s !== id) : [...p, id]);

  const sauceLabel = () => {
    if (selectedSauces.length === 0) return 'First sauce free';
    if (selectedSauces.length === 1) return '1 sauce (free)';
    return `${selectedSauces.length} sauces (1 free + ${selectedSauces.length - 1} × $2)`;
  };

  const handleAdd = () => {
    const saladName = (id) => SALAD_OPTIONS.find((s) => s.id === id)?.name ?? id;
    const sauceName = (id) => SAUCE_OPTIONS.find((s) => s.id === id)?.name ?? id;
    const meatName  = (id) => EXTRA_MEAT_OPTIONS.find((m) => m.id === id)?.name ?? id;

    const cartItem = {
      ...item,
      baseId:  item.id,
      price:   unitPrice,
      displayName: item.name,
      customisations: {
        size:      selectedSize  ?? null,
        bowlType:  cfg.hasBowlType  ? (bowlType === 'rice' ? 'Rice Bowl' : 'Salad Bowl') : null,
        skewBase:  cfg.hasSkewBase  ? SKEW_BASE_LABELS[skewBase] : null,
        extraMeat: hasExtraMeat     ? meatName(extraMeatType)     : null,
        sauces:    cfg.hasSauces    ? selectedSauces.map(sauceName) : [],
        salads:    cfg.hasSalad     ? selectedSalads.map(saladName) : [],
        note:      note.trim().slice(0, 300) || null,
      },
    };

    for (let i = 0; i < qty; i++) addItem(cartItem);
    onClose();
  };

  // ── Size options for HSP / chips / loaded ──────────────
  const sizeKeys = item.sizePrices ? Object.keys(item.sizePrices) : [];

  return (
    <Dialog.Root open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm animate-fadeIn" />
        <Dialog.Content
          className="fixed bottom-0 left-0 right-0 z-[101] bg-card rounded-t-2xl max-h-[92vh] overflow-y-auto focus:outline-none max-w-[640px] mx-auto animate-slideUp"
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-border" />
          </div>

          <div className="px-5 pb-10 pt-2">
            {/* Header */}
            <div className="flex items-start justify-between mb-1">
              <div className="flex-1 pr-3">
                <Dialog.Title className="text-white font-bold text-xl leading-snug">
                  {item.name}
                </Dialog.Title>
                {item.description && (
                  <p className="text-muted text-sm mt-1 leading-relaxed">{item.description}</p>
                )}
              </div>
              <Dialog.Close asChild>
                <button className="w-8 h-8 rounded-full bg-card2 flex items-center justify-center text-muted hover:text-white transition-colors flex-shrink-0 mt-0.5">
                  <X size={15} />
                </button>
              </Dialog.Close>
            </div>
            <p className="text-brand font-bold text-xl mb-4">
              ${unitPrice.toFixed(2)}
            </p>

            {/* ── Bowl type ── */}
            {cfg.hasBowlType && (
              <Section title="Bowl Type">
                <div className="grid grid-cols-2 gap-2">
                  {['salad', 'rice'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setBowlType(t)}
                      className={cn(
                        'py-3 rounded-xl border text-sm font-semibold transition-all',
                        bowlType === t
                          ? 'bg-brand border-brand text-surface'
                          : 'bg-card2 border-border text-white hover:border-brand/40'
                      )}
                    >
                      {t === 'salad' ? '🥗 Salad Bowl' : '🍚 Rice Bowl'}
                    </button>
                  ))}
                </div>
              </Section>
            )}

            {/* ── Skewer base ── */}
            {cfg.hasSkewBase && (
              <Section title="Served With">
                <div className="grid grid-cols-2 gap-2">
                  {['rice', 'salad'].map((b) => (
                    <button
                      key={b}
                      onClick={() => setSkewBase(b)}
                      className={cn(
                        'py-3 rounded-xl border text-sm font-semibold transition-all',
                        skewBase === b
                          ? 'bg-brand border-brand text-surface'
                          : 'bg-card2 border-border text-white hover:border-brand/40'
                      )}
                    >
                      {SKEW_BASE_LABELS[b]}
                    </button>
                  ))}
                </div>
              </Section>
            )}

            {/* ── Size (HSP / chips / loaded) ── */}
            {cfg.hasSize && sizeKeys.length > 0 && (
              <Section title="Size">
                <div className="grid grid-cols-4 gap-2">
                  {sizeKeys.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        'py-2.5 rounded-xl text-xs font-semibold border transition-all flex flex-col items-center gap-0.5',
                        selectedSize === size
                          ? 'bg-brand border-brand text-surface'
                          : 'bg-card2 border-border text-white hover:border-brand/40'
                      )}
                    >
                      <span>{HSP_SIZE_LABELS[size] ?? LOADED_LABELS[size] ?? size}</span>
                      <span className="opacity-75 font-bold">${item.sizePrices[size]}</span>
                    </button>
                  ))}
                </div>
              </Section>
            )}

            {/* ── Extra meat ── */}
            {cfg.hasMeat && (
              <Section title="Extra Meat">
                <button
                  onClick={() => setHasExtraMeat((p) => !p)}
                  className={cn(
                    'w-full py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-between transition-all',
                    hasExtraMeat
                      ? 'bg-brand/10 border-brand text-brand'
                      : 'bg-card2 border-border text-white hover:border-brand/40'
                  )}
                >
                  <span>Add Extra Meat</span>
                  <span className="text-xs opacity-70">+$2.00</span>
                </button>
                {hasExtraMeat && (
                  <div className="flex gap-2 mt-2">
                    {EXTRA_MEAT_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setExtraMeatType(opt.id)}
                        className={cn(
                          'flex-1 py-2 rounded-lg border text-sm font-semibold transition-all',
                          extraMeatType === opt.id
                            ? 'bg-brand border-brand text-surface'
                            : 'bg-card2 border-border text-white'
                        )}
                      >
                        {opt.name.replace('Extra ', '')}
                      </button>
                    ))}
                  </div>
                )}
              </Section>
            )}

            {/* ── Sauces ── */}
            {cfg.hasSauces && (
              <Section title="Sauces" note={sauceLabel()}>
                <div className="flex flex-wrap gap-2">
                  {SAUCE_OPTIONS.map((sauce) => {
                    const active = selectedSauces.includes(sauce.id);
                    return (
                      <button
                        key={sauce.id}
                        onClick={() => toggleSauce(sauce.id)}
                        className={cn(
                          'px-3 py-2 rounded-full text-xs font-semibold border transition-all flex items-center gap-1',
                          active
                            ? 'bg-brand border-brand text-surface'
                            : 'bg-card2 border-border text-white hover:border-brand/40'
                        )}
                      >
                        {sauce.name}
                        {sauce.popular && <span>⭐</span>}
                        {selectedSauces.length > 0 && selectedSauces[0] !== sauce.id && active && (
                          <span className="opacity-70">+$2</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* ── Salad (wraps / HSP) ── */}
            {cfg.hasSalad && (
              <Section title="Salad" note="All included by default — tap to remove">
                <div className="flex flex-wrap gap-2">
                  {SALAD_OPTIONS.map((s) => {
                    const active = selectedSalads.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        onClick={() => toggleSalad(s.id)}
                        className={cn(
                          'px-3 py-2 rounded-full text-xs font-semibold border transition-all',
                          active
                            ? 'border-border bg-card2 text-white'
                            : 'border-transparent bg-transparent text-muted line-through'
                        )}
                      >
                        {active && '✓ '}{s.name}
                      </button>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* ── Special instructions ── */}
            <Section title="Special Instructions">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 300))}
                placeholder="e.g. extra crispy, no onion, allergy info..."
                rows={2}
                className="w-full bg-card2 border border-border rounded-xl px-4 py-3 text-sm text-white placeholder-muted resize-none focus:outline-none focus:border-brand/50 transition-colors"
              />
              <p className="text-muted text-xs mt-1 text-right">{note.length}/300</p>
            </Section>

            {/* ── Qty + Add ── */}
            <div className="flex items-center gap-3 mt-5">
              <div className="flex items-center gap-3 bg-card2 rounded-xl px-3 py-2">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-7 h-7 flex items-center justify-center text-white hover:text-brand transition-colors"
                >
                  <Minus size={15} />
                </button>
                <span className="text-white font-bold text-base w-6 text-center">{qty}</span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="w-7 h-7 flex items-center justify-center text-white hover:text-brand transition-colors"
                >
                  <Plus size={15} />
                </button>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleAdd}
                className="flex-1 py-3.5 bg-brand hover:bg-brand-lit rounded-xl font-extrabold text-sm flex items-center justify-between px-5 transition-colors shadow shadow-brand/20"
                style={{ color: '#0f0f0f' }}
              >
                <span>Add to Order</span>
                <span>${totalPrice.toFixed(2)}</span>
              </motion.button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Section({ title, note, children }) {
  return (
    <div className="mt-5 pt-5 border-t border-border">
      <div className="flex items-baseline gap-2 mb-3">
        <h3 className="text-white font-bold text-sm">{title}</h3>
        {note && <span className="text-muted text-xs">{note}</span>}
      </div>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Click any menu item on `http://localhost:3000`. Modal slides up from bottom. For a wrap: sauce pills + salad toggles appear. For HSP: size selector with prices. Qty stepper works. "Add to Order" updates total correctly. Closing modal works.

- [ ] **Step 3: Commit**
```bash
git add src/components/ItemModal.js
git commit -m "feat: rewrite ItemModal — all types (wrap/bowl/hsp/skewer/chips/loaded/dip/snack)"
```

---

### Task 8: CartBar

**Files:**
- Modify: `src/components/CartBar.js`

**Interfaces:**
- Consumes: `useCart()` → `{ itemCount, total }`; `useNavigate`
- Produces: fixed bottom bar, hidden when cart is empty

- [ ] **Step 1: Write src/components/CartBar.js**
```jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function CartBar() {
  const { itemCount, total } = useCart();
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {itemCount > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2 pointer-events-none"
        >
          <button
            onClick={() => navigate('/cart')}
            className="pointer-events-auto w-full max-w-lg mx-auto flex items-center justify-between bg-brand text-surface font-extrabold text-sm px-5 py-4 rounded-2xl shadow-2xl shadow-brand/30 hover:bg-brand-lit transition-colors active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <span className="bg-surface/20 text-surface rounded-lg w-7 h-7 flex items-center justify-center font-black text-xs">
                {itemCount}
              </span>
              <span>View Order</span>
            </div>
            <div className="flex items-center gap-1">
              <span>${total.toFixed(2)}</span>
              <ChevronRight size={16} strokeWidth={3} />
            </div>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Verify**

Add any item to cart. CartBar should animate up from the bottom with item count and total. Remove all items — it should animate away.

- [ ] **Step 3: Commit**
```bash
git add src/components/CartBar.js
git commit -m "feat: redesign CartBar — spring animation, amber, AnimatePresence"
```

---

### Task 9: PromoSignupBanner

**Files:**
- Create: `src/components/PromoSignupBanner.js`

**Interfaces:**
- Produces: dismissible amber strip; saves email to localStorage to suppress on next visit; exported as default

- [ ] **Step 1: Write src/components/PromoSignupBanner.js**
```jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';

export default function PromoSignupBanner() {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('promo_banner_dismissed') === '1'
  );
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  const dismiss = () => {
    localStorage.setItem('promo_banner_dismissed', '1');
    setDismissed(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!email) return;
    // Fire-and-forget — full backend in Plan 3
    try {
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, channels: ['email'] }),
      });
    } catch { /* offline — store locally for Plan 3 */ }
    setDone(true);
    setTimeout(dismiss, 2500);
  };

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="bg-brand/10 border-b border-brand/20 px-4 py-3">
            {done ? (
              <p className="text-brand text-sm font-semibold text-center">
                ✓ You're on the list! We'll send you our best deals.
              </p>
            ) : (
              <form onSubmit={submit} className="flex items-center gap-2 max-w-lg mx-auto">
                <Sparkles size={16} className="text-brand flex-shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Get exclusive deals — enter email"
                  required
                  className="flex-1 bg-transparent text-white text-sm placeholder-muted outline-none min-w-0"
                />
                <button
                  type="submit"
                  className="bg-brand text-surface text-xs font-black px-3 py-1.5 rounded-lg hover:bg-brand-lit transition-colors flex-shrink-0"
                >
                  Sign up
                </button>
                <button type="button" onClick={dismiss} className="text-muted hover:text-white transition-colors flex-shrink-0">
                  <X size={14} />
                </button>
              </form>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Commit**
```bash
git add src/components/PromoSignupBanner.js
git commit -m "feat: add PromoSignupBanner — dismissible email capture strip"
```

---

### Task 10: HomePage — orchestrate full Uber Eats layout

**Files:**
- Modify: `src/pages/HomePage.js`
- Modify: `src/hooks/useMenu.js`

**Interfaces:**
- Consumes: `useMenu()` → `{ categories, items, drinks, loading }`
- `categories` maps CATEGORIES array merged with Firestore live data
- Produces: full single-page menu experience

- [ ] **Step 1: Update src/hooks/useMenu.js**
```js
import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { CATEGORIES } from '../data/menu';

export function useMenu() {
  const [menuItems, setMenuItems] = useState([]);
  const [drinks,    setDrinks]    = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    const unsubs = [
      onSnapshot(
        query(collection(db, 'menuItems'), orderBy('categoryOrder'), orderBy('order')),
        (snap) => {
          setMenuItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((i) => i.available !== false));
          setLoading(false);
        }
      ),
      onSnapshot(
        query(collection(db, 'drinks'), orderBy('order')),
        (snap) => setDrinks(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((d) => d.available !== false))
      ),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  // Build ordered category list with items attached
  const categories = CATEGORIES.map((cat) => ({
    ...cat,
    items: cat.id === 'drinks'
      ? drinks
      : menuItems.filter((item) => item.categoryId === cat.id),
  })).filter((cat) => cat.items.length > 0);

  return { categories, loading };
}
```

- [ ] **Step 2: Rewrite src/pages/HomePage.js**
```jsx
import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useMenu } from '../hooks/useMenu';
import { useCart } from '../context/CartContext';
import HeroSection from '../components/HeroSection';
import CategoryNav from '../components/CategoryNav';
import MenuSection from '../components/MenuSection';
import CartBar from '../components/CartBar';
import PromoSignupBanner from '../components/PromoSignupBanner';

export default function HomePage() {
  const { categories, loading } = useMenu();
  const { addItem } = useCart();
  const [activeCatId,  setActiveCatId]  = useState(null);
  const sectionRefs  = useRef({});
  const scrollingRef = useRef(false);

  // IntersectionObserver — highlight active category pill while scrolling
  useEffect(() => {
    if (!categories.length) return;
    const observers = [];
    categories.forEach(({ id }) => {
      const el = sectionRefs.current[id];
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !scrollingRef.current) setActiveCatId(id);
        },
        { rootMargin: '-112px 0px -55% 0px', threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [categories]);

  const scrollToCategory = (catId) => {
    setActiveCatId(catId);
    const el = sectionRefs.current[catId];
    if (!el) return;
    scrollingRef.current = true;
    const OFFSET = 64 + 48 + 16; // navbar + catNav + padding
    const top = el.getBoundingClientRect().top + window.scrollY - OFFSET;
    window.scrollTo({ top, behavior: 'smooth' });
    setTimeout(() => { scrollingRef.current = false; }, 900);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-brand font-display text-2xl tracking-wider"
        >
          LOADING MENU...
        </motion.div>
      </div>
    );
  }

  const activeId = activeCatId || categories[0]?.id;

  return (
    <div className="bg-surface min-h-screen pb-24">
      <PromoSignupBanner />
      <HeroSection onCtaClick={() => scrollToCategory(categories[0]?.id)} />
      <CategoryNav
        categories={categories}
        activeCatId={activeId}
        onCategoryClick={scrollToCategory}
      />

      <div className="max-w-3xl mx-auto px-3 pt-4">
        {categories.map((cat) => (
          <MenuSection
            key={cat.id}
            category={cat}
            items={cat.items}
            sectionRef={(el) => { sectionRefs.current[cat.id] = el; }}
            onAdd={addItem}
          />
        ))}
      </div>

      <CartBar />
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Visit `http://localhost:3000`. Expect:
- Promo banner at top (dismissible)
- Hero photo with TJ's heading
- Category pills (sticky)
- Each category section with photo banner + item rows
- Clicking category pill scrolls to that section
- Pill highlights as user scrolls
- CartBar appears after adding an item

If Firestore has no data yet, all categories will be empty — seed in Task 15.

- [ ] **Step 4: Commit**
```bash
git add src/pages/HomePage.js src/hooks/useMenu.js
git commit -m "feat: rebuild HomePage — Uber Eats layout, IntersectionObserver, category sections"
```

---

### Task 11: CartPage

**Files:**
- Modify: `src/pages/CartPage.js`

**Interfaces:**
- Consumes: `useCart()` → `{ cart, addItem, removeItem, deleteItem, total, itemCount }`
- Consumes: Firestore `drinks` collection for upsell row
- Produces: cart page, pickup only, promo code input, CTA to checkout

- [ ] **Step 1: Write src/pages/CartPage.js**
```jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Minus, Trash2, Tag } from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useCart } from '../context/CartContext';

export default function CartPage() {
  const { cart, addItem, removeItem, deleteItem, total, itemCount } = useCart();
  const navigate = useNavigate();
  const [drinks,     setDrinks]     = useState([]);
  const [promoCode,  setPromoCode]  = useState('');
  const [promoError, setPromoError] = useState('');

  useEffect(() => {
    getDocs(query(collection(db, 'drinks'), orderBy('order')))
      .then((snap) => setDrinks(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((d) => d.available !== false)))
      .catch(() => {});
  }, []);

  const handlePromo = () => setPromoError('Invalid or expired promo code.');

  if (itemCount === 0) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="text-6xl">🥙</span>
        <h2 className="font-display text-4xl text-white tracking-wide">Your order is empty</h2>
        <p className="text-muted text-sm">Add some delicious items from our menu!</p>
        <button
          onClick={() => navigate('/')}
          className="mt-2 bg-brand text-surface font-black text-sm px-8 py-3 rounded-xl hover:bg-brand-lit transition-colors"
        >
          BROWSE MENU
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-32">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur border-b border-border flex items-center gap-3 px-4 h-14">
        <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-card2 flex items-center justify-center text-muted hover:text-white transition-colors">
          <ArrowLeft size={16} />
        </button>
        <span className="font-bold text-white text-base flex-1">Your Order</span>
        <span className="text-muted text-sm">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
      </div>

      {/* Pickup notice */}
      <div className="mx-4 mt-4 bg-brand/10 border border-brand/20 rounded-xl px-4 py-3 flex items-center gap-3">
        <span className="text-xl">🏃</span>
        <div>
          <p className="text-white font-semibold text-sm">Pickup Only</p>
          <p className="text-muted text-xs">Come grab your order from our store — no delivery.</p>
        </div>
      </div>

      {/* Cart items */}
      <div className="mx-4 mt-4 bg-card border border-border rounded-xl overflow-hidden">
        <AnimatePresence initial={false}>
          {cart.map((item, idx) => (
            <motion.div
              key={item.cartId ?? idx}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0"
            >
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{item.displayName ?? item.name}</p>
                {item.customisations && (
                  <p className="text-muted text-xs mt-0.5 leading-snug line-clamp-2">
                    {[
                      item.customisations.bowlType,
                      item.customisations.skewBase,
                      item.customisations.size && `Size: ${item.customisations.size}`,
                      item.customisations.extraMeat && `+${item.customisations.extraMeat}`,
                      item.customisations.sauces?.length && `Sauces: ${item.customisations.sauces.join(', ')}`,
                      item.customisations.note,
                    ].filter(Boolean).join(' · ')}
                  </p>
                )}
                <p className="text-brand font-bold text-sm mt-1">${(item.price * item.qty).toFixed(2)}</p>
              </div>

              {/* Qty controls */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => removeItem(item)}
                  className="w-7 h-7 rounded-full bg-card2 flex items-center justify-center text-muted hover:text-white hover:bg-brand transition-colors"
                >
                  <Minus size={12} />
                </button>
                <span className="text-white font-bold text-sm w-5 text-center">{item.qty}</span>
                <button
                  onClick={() => addItem(item)}
                  className="w-7 h-7 rounded-full bg-card2 flex items-center justify-center text-muted hover:text-white hover:bg-brand transition-colors"
                >
                  <Plus size={12} />
                </button>
                <button
                  onClick={() => deleteItem(item)}
                  className="w-7 h-7 rounded-full bg-card2 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors ml-1"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Drinks upsell */}
      {drinks.length > 0 && (
        <div className="mx-4 mt-4">
          <p className="text-muted text-xs font-bold tracking-wider uppercase mb-2 px-1">Add a drink?</p>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {drinks.map((drink) => (
              <button
                key={drink.id}
                onClick={() => addItem({ ...drink, itemType: 'drink', displayName: drink.name })}
                className="flex-shrink-0 bg-card border border-border rounded-xl px-4 py-3 text-left hover:border-brand/40 transition-colors"
              >
                <p className="text-white text-sm font-semibold whitespace-nowrap">{drink.name}</p>
                <p className="text-brand text-xs font-bold mt-0.5">${drink.price.toFixed(2)}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Promo code */}
      <div className="mx-4 mt-4">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2.5">
            <Tag size={14} className="text-muted flex-shrink-0" />
            <input
              type="text"
              value={promoCode}
              onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(''); }}
              placeholder="Promo code"
              className="flex-1 bg-transparent text-white text-sm placeholder-muted outline-none"
            />
          </div>
          <button
            onClick={handlePromo}
            className="bg-card border border-border text-muted text-sm font-semibold px-4 rounded-xl hover:border-brand/40 hover:text-white transition-colors"
          >
            Apply
          </button>
        </div>
        {promoError && <p className="text-red-400 text-xs mt-1 px-1">{promoError}</p>}
      </div>

      {/* Order summary */}
      <div className="mx-4 mt-4 bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex justify-between px-4 py-3 border-b border-border text-sm">
          <span className="text-muted">Subtotal</span>
          <span className="text-white font-semibold">${total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between px-4 py-3 border-b border-border text-sm">
          <span className="text-muted">Delivery</span>
          <span className="text-green-400 font-semibold">Pickup — Free</span>
        </div>
        <div className="flex justify-between px-4 py-4 text-base font-black">
          <span className="text-white">Total</span>
          <span className="text-brand">${total.toFixed(2)}</span>
        </div>
      </div>

      {/* CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-5 pt-3 bg-surface/95 backdrop-blur border-t border-border">
        <button
          onClick={() => navigate('/checkout')}
          className="w-full bg-brand text-surface font-black text-sm py-4 rounded-xl flex items-center justify-between px-6 hover:bg-brand-lit transition-colors active:scale-[0.98] shadow shadow-brand/20"
        >
          <span>Proceed to Checkout</span>
          <span>${total.toFixed(2)} →</span>
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Add items, navigate to `/cart`. Pickup notice shown. Items list with qty +/−/delete. Drinks upsell row. Total reflects changes. CTA navigates to `/checkout`.

- [ ] **Step 3: Commit**
```bash
git add src/pages/CartPage.js
git commit -m "feat: rewrite CartPage — pickup only, Tailwind, drinks upsell, promo input"
```

---

### Task 12: CheckoutPage

**Files:**
- Modify: `src/pages/CheckoutPage.js`

**Interfaces:**
- Consumes: `useCart()` → `{ cart, total, itemCount, clearCart }`
- Produces: customer details form, promo signup widget, payment selection, submits order to Firestore

- [ ] **Step 1: Write src/pages/CheckoutPage.js**
```jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Mail, MessageSquare, Sparkles } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useCart } from '../context/CartContext';

const PAYMENT_OPTIONS = [
  { id: 'cash',  label: 'Cash at Counter',   icon: '💵', sub: 'Pay when you pick up your order' },
  { id: 'card',  label: 'Card at Counter',    icon: '💳', sub: 'Tap or swipe when you arrive'    },
  { id: 'online',label: 'Pay Online',         icon: '📱', sub: 'Stripe payment — coming soon',  disabled: true },
];

export default function CheckoutPage() {
  const { cart, total, itemCount, clearCart } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '', note: '' });
  const [payment,   setPayment]   = useState('cash');
  const [promoEmail, setPromoEmail] = useState('');
  const [promoSMS,  setPromoSMS]  = useState('');
  const [optEmail,  setOptEmail]  = useState(false);
  const [optSMS,    setOptSMS]    = useState(false);
  const [optPush,   setOptPush]   = useState(false);
  const [submitting,setSubmitting]= useState(false);
  const [errors,    setErrors]    = useState({});

  const set = (k) => (e) => { setForm((p) => ({ ...p, [k]: e.target.value })); setErrors((p) => ({ ...p, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'Required';
    if (!form.lastName.trim())  e.lastName  = 'Required';
    if (!form.phone.trim())     e.phone     = 'Required';
    if (!form.email.trim())     e.email     = 'Required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      const orderRef = await addDoc(collection(db, 'orders'), {
        customer: {
          firstName: form.firstName.trim(),
          lastName:  form.lastName.trim(),
          phone:     form.phone.trim(),
          email:     form.email.trim(),
        },
        items: cart.map((item) => ({
          name:  item.displayName ?? item.name,
          price: item.price,
          qty:   item.qty,
          customisations: item.customisations ?? {},
        })),
        total,
        itemCount,
        payment,
        specialNote: form.note.trim() || null,
        status: 'pending',
        orderType: 'pickup',
        createdAt: serverTimestamp(),
        promoConsent: { email: optEmail, sms: optSMS, push: optPush },
        promoContact: { email: optEmail ? (promoEmail || form.email) : null, phone: optSMS ? promoSMS : null },
      });
      clearCart();
      navigate('/order-confirmation', { state: { orderId: orderRef.id, customerName: form.firstName, total } });
    } catch (err) {
      console.error('Order failed:', err);
      alert('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (itemCount === 0) {
    navigate('/');
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="min-h-screen bg-surface pb-32">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur border-b border-border flex items-center gap-3 px-4 h-14">
        <button type="button" onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-card2 flex items-center justify-center text-muted hover:text-white transition-colors">
          <ArrowLeft size={16} />
        </button>
        <span className="font-bold text-white text-base">Checkout</span>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 space-y-5">

        {/* Customer details */}
        <section>
          <SectionTitle icon={<User size={14}/>} title="Your Details" />
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Field label="First Name" error={errors.firstName}>
                <input value={form.firstName} onChange={set('firstName')} placeholder="John" className={inputCls(errors.firstName)} />
              </Field>
              <Field label="Last Name" error={errors.lastName}>
                <input value={form.lastName} onChange={set('lastName')} placeholder="Smith" className={inputCls(errors.lastName)} />
              </Field>
            </div>
            <Field label="Phone" error={errors.phone} icon={<Phone size={13} className="text-muted"/>}>
              <input value={form.phone} onChange={set('phone')} placeholder="+61 4xx xxx xxx" type="tel" className={inputCls(errors.phone)} />
            </Field>
            <Field label="Email" error={errors.email} icon={<Mail size={13} className="text-muted"/>}>
              <input value={form.email} onChange={set('email')} placeholder="you@email.com" type="email" className={inputCls(errors.email)} />
            </Field>
            <Field label="Special Instructions" icon={<MessageSquare size={13} className="text-muted"/>}>
              <textarea value={form.note} onChange={set('note')} placeholder="Allergies, extra requests..." rows={2} className={inputCls() + ' resize-none'} />
            </Field>
          </div>
        </section>

        {/* Promo signup */}
        <section className="bg-brand/8 border border-brand/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-brand" />
            <div>
              <p className="text-white font-bold text-sm">Get exclusive deals &amp; promo codes</p>
              <p className="text-muted text-xs">Sign up to receive TJ's specials, discounts &amp; new menu alerts</p>
            </div>
          </div>
          <div className="flex gap-3 mb-3 flex-wrap">
            {[['email','📧','Email', optEmail, setOptEmail], ['sms','💬','SMS', optSMS, setOptSMS], ['push','🔔','Push alerts', optPush, setOptPush]].map(([id, ic, label, val, set]) => (
              <label key={id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-xs font-semibold transition-all ${val ? 'border-brand text-brand bg-brand/10' : 'border-border text-muted hover:border-brand/40'}`}>
                <input type="checkbox" className="hidden" checked={val} onChange={(e) => set(e.target.checked)} />
                {ic} {label}
              </label>
            ))}
          </div>
          {(optEmail || optSMS) && (
            <div className="space-y-2">
              {optEmail && (
                <input
                  type="email"
                  value={promoEmail}
                  onChange={(e) => setPromoEmail(e.target.value)}
                  placeholder={`Email ${form.email ? `(using ${form.email})` : ''}`}
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-muted outline-none focus:border-brand/50 transition-colors"
                />
              )}
              {optSMS && (
                <input
                  type="tel"
                  value={promoSMS}
                  onChange={(e) => setPromoSMS(e.target.value)}
                  placeholder="+61 4xx xxx xxx"
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-muted outline-none focus:border-brand/50 transition-colors"
                />
              )}
            </div>
          )}
        </section>

        {/* Payment */}
        <section>
          <SectionTitle title="Payment Method" />
          <div className="space-y-2">
            {PAYMENT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                disabled={opt.disabled}
                onClick={() => !opt.disabled && setPayment(opt.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                  payment === opt.id ? 'border-brand bg-brand/8' : 'border-border bg-card'
                } ${opt.disabled ? 'opacity-40 cursor-not-allowed' : 'hover:border-brand/40'}`}
              >
                <span className="text-xl w-6 text-center">{opt.icon}</span>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">{opt.label}</p>
                  <p className="text-muted text-xs">{opt.sub}</p>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 transition-colors ${payment === opt.id ? 'border-brand bg-brand' : 'border-muted'}`} />
              </button>
            ))}
          </div>
        </section>

        {/* Order summary */}
        <section className="bg-card border border-border rounded-xl overflow-hidden">
          <p className="text-xs font-bold text-muted tracking-wider uppercase px-4 pt-3 pb-2 border-b border-border">Order Summary</p>
          {cart.map((item, i) => (
            <div key={i} className="flex justify-between px-4 py-2 text-sm border-b border-border last:border-0">
              <span className="text-white">{item.displayName ?? item.name} {item.qty > 1 && `×${item.qty}`}</span>
              <span className="text-muted">${(item.price * item.qty).toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between px-4 py-3 font-black">
            <span className="text-white">Total</span>
            <span className="text-brand text-lg">${total.toFixed(2)}</span>
          </div>
        </section>
      </div>

      {/* Submit CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-5 pt-3 bg-surface/95 backdrop-blur border-t border-border">
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand text-surface font-black text-sm py-4 rounded-xl flex items-center justify-between px-6 hover:bg-brand-lit transition-colors active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow shadow-brand/20"
        >
          <span>{submitting ? 'Placing Order...' : 'Place Order'}</span>
          {!submitting && <span>${total.toFixed(2)} →</span>}
        </button>
      </div>
    </form>
  );
}

const inputCls = (err) =>
  `w-full bg-card border ${err ? 'border-red-500' : 'border-border'} rounded-xl px-4 py-3 text-sm text-white placeholder-muted outline-none focus:border-brand/50 transition-colors`;

function SectionTitle({ title, icon }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {icon && <span className="text-muted">{icon}</span>}
      <h2 className="text-xs font-black text-muted tracking-widest uppercase">{title}</h2>
    </div>
  );
}

function Field({ label, error, icon, children }) {
  return (
    <div>
      {children}
      {error && <p className="text-red-400 text-xs mt-0.5 px-1">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Navigate to `/checkout`. All form fields shown. Promo signup with email/SMS/push toggles. Payment selector. Submit with empty fields shows validation errors. Filling form and submitting creates order in Firestore, clears cart, redirects to `/order-confirmation`.

- [ ] **Step 3: Commit**
```bash
git add src/pages/CheckoutPage.js
git commit -m "feat: rewrite CheckoutPage — customer details, promo signup, payment, Firestore order"
```

---

### Task 13: OrderConfirmationPage

**Files:**
- Modify: `src/pages/OrderConfirmationPage.js`

**Interfaces:**
- Consumes: `useLocation()` → `state: { orderId, customerName, total }`
- Produces: animated confirmation screen with order status tracker; "Order Again" navigates home

- [ ] **Step 1: Write src/pages/OrderConfirmationPage.js**
```jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const STATUS_STEPS = [
  { key: 'pending',   label: 'Received',  icon: '✓'   },
  { key: 'preparing', label: 'Preparing', icon: '👨‍🍳' },
  { key: 'ready',     label: 'Ready',     icon: '📦'  },
];

const STATUS_ORDER = ['pending', 'preparing', 'ready'];

export default function OrderConfirmationPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { orderId, customerName, total } = location.state ?? {};
  const [status, setStatus] = useState('pending');

  useEffect(() => {
    if (!orderId) return;
    const unsub = onSnapshot(doc(db, 'orders', orderId), (snap) => {
      if (snap.exists()) setStatus(snap.data().status ?? 'pending');
    });
    return unsub;
  }, [orderId]);

  const currentStep = STATUS_ORDER.indexOf(status);

  if (!orderId) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <button onClick={() => navigate('/')} className="text-brand font-bold">Back to Menu</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-5 py-12 gap-8 text-center">
      {/* Animated icon */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
        className="w-24 h-24 rounded-full bg-brand/10 border-2 border-brand/30 flex items-center justify-center text-5xl"
      >
        🥙
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-2"
      >
        <h1 className="font-display text-5xl text-white tracking-wide">ORDER PLACED!</h1>
        <p className="text-muted text-sm">
          {customerName ? `Thanks ${customerName}!` : 'Thank you!'} We'll have it ready for pickup soon.
        </p>
        <p className="text-muted text-xs">Order #{orderId.slice(-6).toUpperCase()}</p>
      </motion.div>

      {/* Status tracker */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-sm bg-card border border-border rounded-2xl p-5"
      >
        <p className="text-xs font-black text-muted tracking-widest uppercase mb-5">Order Status</p>
        <div className="flex items-center justify-between">
          {STATUS_STEPS.map((step, idx) => {
            const done    = idx <= currentStep;
            const current = idx === currentStep;
            return (
              <React.Fragment key={step.key}>
                {/* Step dot */}
                <div className="flex flex-col items-center gap-1.5">
                  <motion.div
                    animate={done ? { scale: [1, 1.2, 1], backgroundColor: '#f59e0b' } : {}}
                    transition={{ duration: 0.4 }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                      done
                        ? 'bg-brand border-brand text-surface'
                        : 'bg-card2 border-border text-muted'
                    } ${current ? 'ring-2 ring-brand/30 ring-offset-2 ring-offset-card' : ''}`}
                  >
                    {step.icon}
                  </motion.div>
                  <span className={`text-[10px] font-bold ${done ? 'text-brand' : 'text-muted'}`}>
                    {step.label}
                  </span>
                </div>
                {/* Connector */}
                {idx < STATUS_STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 mx-2 rounded">
                    <motion.div
                      className="h-full bg-brand rounded"
                      initial={{ width: '0%' }}
                      animate={{ width: idx < currentStep ? '100%' : '0%' }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    />
                    <div className="h-full bg-border rounded -mt-0.5" style={{ zIndex: -1 }} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </motion.div>

      {/* Total */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="bg-card border border-border rounded-xl px-6 py-4 text-center"
      >
        <p className="text-muted text-xs mb-1">Total paid</p>
        <p className="text-brand font-black text-3xl">${total?.toFixed(2) ?? '—'}</p>
        <p className="text-green-400 text-xs mt-1 font-medium">Pickup order · No delivery fee</p>
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        onClick={() => navigate('/')}
        className="bg-brand text-surface font-black text-sm px-8 py-3 rounded-xl hover:bg-brand-lit transition-colors active:scale-95"
      >
        ORDER AGAIN
      </motion.button>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Complete a checkout. Confirmation page shows with kebab icon animation, order number, status tracker at "Received". In AdminDashboard, change status to "preparing" — tracker should update live (real-time onSnapshot).

- [ ] **Step 3: Commit**
```bash
git add src/pages/OrderConfirmationPage.js
git commit -m "feat: rewrite OrderConfirmationPage — animations, real-time status tracker"
```

---

### Task 14: Update App.js routes

**Files:**
- Modify: `src/App.js`

**Interfaces:**
- Adds stubs for `/login`, `/signup`, `/account` (full implementation in Plan 2)

- [ ] **Step 1: Write src/App.js**
```jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import AdminApp from './admin/AdminApp';
import StaffPortal from './admin/staff/StaffPortal';
import './styles/global.css';

// Stubs — replaced in Plan 2
const LoginPage   = () => <div className="min-h-screen bg-surface flex items-center justify-center text-muted">Login — coming soon</div>;
const SignupPage  = () => <div className="min-h-screen bg-surface flex items-center justify-center text-muted">Signup — coming soon</div>;
const AccountPage = () => <div className="min-h-screen bg-surface flex items-center justify-center text-muted">My Account — coming soon</div>;

export default function App() {
  const path = window.location.pathname;
  if (path.startsWith('/admin'))  return <AdminApp />;
  if (path.startsWith('/staff'))  return <StaffPortal />;

  return (
    <CartProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/"                    element={<HomePage />} />
          <Route path="/cart"                element={<CartPage />} />
          <Route path="/checkout"            element={<CheckoutPage />} />
          <Route path="/order-confirmation"  element={<OrderConfirmationPage />} />
          <Route path="/login"               element={<LoginPage />} />
          <Route path="/signup"              element={<SignupPage />} />
          <Route path="/account"             element={<AccountPage />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}
```

- [ ] **Step 2: Verify**

`/`, `/cart`, `/checkout`, `/order-confirmation`, `/login`, `/signup`, `/account` all load without errors.

- [ ] **Step 3: Commit**
```bash
git add src/App.js
git commit -m "feat: update App.js routes — add login/signup/account stubs"
```

---

### Task 15: Seed the database with full TJ's menu

**Files:**
- No code changes — uses existing AdminDashboard seed function (updated to use SEED_MENU_V2)

**Interfaces:**
- After seeding: Firestore `menuItems` has all 30 items from SEED_MENU_V2; `drinks` has 3 drinks

- [ ] **Step 1: Verify AdminDashboard imports SEED_MENU_V2**

Open `src/admin/AdminDashboard.js`. The import line should be:
```js
import { SEED_MENU, SEED_DRINKS } from '../data/seedData';
```
Since `seedData.js` now exports `SEED_MENU = SEED_MENU_V2` as an alias, this import will automatically use the new full menu. No change needed.

- [ ] **Step 2: Open admin and clean existing data**

Navigate to `http://localhost:3000/admin`. Log in. Click "Clean Duplicates" button to remove any stale items. Then click "Seed Database" to add the full menu. Confirm dialog.

- [ ] **Step 3: Verify on homepage**

Navigate to `http://localhost:3000`. All 9 categories should appear with correct items and prices.

- [ ] **Step 4: Final build check**
```bash
npm run build
```
Expected: successful build, no TypeScript/lint errors.

- [ ] **Step 5: Final commit**
```bash
git add -A
git commit -m "feat: Plan 1 complete — full frontend ordering experience rebuilt"
```

---

## Plan 1 Complete

After all 15 tasks the site delivers:
- Uber Eats–style menu with Unsplash category photos
- All TJ's items: wraps, bowls, HSP, skewers, chips, snacks, loaded upgrade, dips, drinks
- Full customisation modal (sauces free/paid, salad, size, bowl type, skewer base, extra meat)
- Pickup-only cart with drinks upsell and promo code input
- Checkout with customer details, promo signup (email/SMS/push opt-in), payment selection
- Real-time order confirmation with status tracker
- Promo banner (email capture, fire-and-forget until Plan 3 backend is live)

**Next:** Plan 2 (Customer Auth + Loyalty Stamps), Plan 3 (Node.js backend), Plan 4 (Admin enhancements), Plan 5 (Printable menu card)
