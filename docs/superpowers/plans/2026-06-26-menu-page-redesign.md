# Menu Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the TJ's Kebab Centre menu page into a dark charcoal + amber, Domino's-style pickup ordering experience with full item customization using Tailwind CSS.

**Architecture:** Add Tailwind CSS to the existing CRA project without touching the old pages (CartPage, CheckoutPage, OrderConfirmation stay unchanged). New components use Tailwind + Radix UI Dialog for the item modal. Existing `useMenu()` hook and `CartContext` are reused as-is — no backend changes needed except adding `itemType` to Firestore documents (handled by a one-time admin helper).

**Tech Stack:** React 18, Firebase 10, Tailwind CSS 3, @radix-ui/react-dialog, clsx, tailwind-merge, lucide-react (already installed)

## Global Constraints

- CRA project (`react-scripts 5`) — no ejecting, no CRACO, no path aliases
- Keep `src/styles/global.css` CSS variables intact — CartPage/CheckoutPage depend on them
- All new component files use `.js` extension to match existing codebase
- Tailwind classes only in new components — old components keep inline styles
- Dark theme colours: bg `#111111`, card `#1C1C1E`, border `#2A2A2A`, amber `#F59E0B`, text white `#FFFFFF`, muted `#9CA3AF`
- Never commit `.env` or any Firebase credentials
- Special instructions field: max 500 characters, trimmed before saving to cart

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `tailwind.config.js` | Create | Tailwind config with content paths and custom colours |
| `postcss.config.js` | Create | PostCSS config for Tailwind |
| `src/lib/utils.js` | Create | `cn()` className merge utility |
| `src/lib/itemTypes.js` | Create | Item type config + price calculation logic |
| `src/data/options.js` | Modify | Add `EXTRA_MEAT_OPTIONS` array |
| `src/styles/global.css` | Modify | Add Tailwind directives + `@keyframes kenburns` |
| `src/components/HeroSection.js` | Create | Animated hero with ken-burns effect |
| `src/components/CategoryNav.js` | Create | Sticky horizontal category pill nav |
| `src/components/ItemModal.js` | Create | Full customisation modal (Radix Dialog, slides up) |
| `src/components/MenuItemCard.js` | Modify | Redesign with Tailwind dark card + food photo |
| `src/components/CartBar.js` | Create | Fixed bottom amber cart bar |
| `src/components/MenuGrid.js` | Create | Category sections + item grid |
| `src/pages/HomePage.js` | Modify | Compose all new components, remove old inline hero |

---

## Task 1: Install Tailwind CSS + Radix UI

**Files:**
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Modify: `package.json` (via npm install)
- Modify: `src/styles/global.css`

**Interfaces:**
- Produces: `cn()` utility available from `../lib/utils`, Tailwind classes available in all new components

- [ ] **Step 1: Install dependencies**

```bash
cd /Users/saichetankari/Downloads/tjs-v6
npm install -D tailwindcss@3 postcss autoprefixer
npm install @radix-ui/react-dialog clsx tailwind-merge
```

Expected output: `added N packages` with no errors.

- [ ] **Step 2: Create tailwind.config.js**

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        charcoal: {
          900: '#111111',
          800: '#1C1C1E',
          700: '#2A2A2A',
          600: '#3A3A3A',
        },
        amber: {
          400: '#FCD34D',
          500: '#F59E0B',
          600: '#D97706',
        },
      },
      keyframes: {
        kenburns: {
          '0%':   { transform: 'scale(1.0)' },
          '100%': { transform: 'scale(1.08)' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        kenburns: 'kenburns 8s ease-in-out infinite alternate',
        slideUp:  'slideUp 0.3s ease-out',
        fadeIn:   'fadeIn 0.2s ease-out',
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 3: Create postcss.config.js**

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 4: Add Tailwind directives to global.css**

Open `src/styles/global.css`. Add these three lines at the very top (before all existing content):

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

```

Leave all existing `:root` CSS variables and rules unchanged below.

- [ ] **Step 5: Create src/lib/utils.js**

```js
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 6: Verify Tailwind is working**

```bash
npm start
```

Open the browser. In the browser console run:
```js
document.querySelector('body').classList.add('bg-red-500')
```
If the body turns red, Tailwind is working. Remove it and continue.

- [ ] **Step 7: Commit**

```bash
git add tailwind.config.js postcss.config.js src/lib/utils.js src/styles/global.css package.json package-lock.json
git commit -m "feat: add Tailwind CSS 3 + Radix UI Dialog + cn() utility"
```

---

## Task 2: Pricing Logic & Item Type Config

**Files:**
- Create: `src/lib/itemTypes.js`
- Modify: `src/data/options.js`
- Create: `src/lib/itemTypes.test.js`

**Interfaces:**
- Produces:
  - `ITEM_TYPE_CONFIG` — object keyed by itemType string
  - `getItemTypeConfig(itemType)` — returns config for an item type
  - `calculateItemPrice(basePrice, options)` — returns final number price
  - `EXTRA_MEAT_OPTIONS` from `src/data/options.js`

- [ ] **Step 1: Update src/data/options.js — add EXTRA_MEAT_OPTIONS**

Open `src/data/options.js`. Add this export at the bottom:

```js
export const EXTRA_MEAT_OPTIONS = [
  { id: 'lamb', name: 'Extra Lamb', price: 2 },
  { id: 'chicken', name: 'Extra Chicken', price: 2 },
];
```

- [ ] **Step 2: Create src/lib/itemTypes.js**

```js
// Controls which customisation sections appear in ItemModal per item type
export const ITEM_TYPE_CONFIG = {
  wrap:        { hasSize: false, hasMeat: true,  hasSauces: true,  hasSalad: true  },
  hsp:         { hasSize: true,  hasMeat: true,  hasSauces: true,  hasSalad: true  },
  ricebowl:    { hasSize: false, hasMeat: true,  hasSauces: true,  hasSalad: true  },
  salad:       { hasSize: false, hasMeat: true,  hasSauces: true,  hasSalad: true  },
  chargrilled: { hasSize: false, hasMeat: false, hasSauces: false, hasSalad: false },
  skewer:      { hasSize: false, hasMeat: false, hasSauces: false, hasSalad: false },
  snack:       { hasSize: true,  hasMeat: false, hasSauces: false, hasSalad: false },
  drink:       { hasSize: false, hasMeat: false, hasSauces: false, hasSalad: false },
};

// HSP size price overrides (base price from Firestore is the Small price)
export const HSP_SIZE_PRICES = {
  S: 0, M: 2, L: 4, XL: 6,
};

// Chips size prices (absolute, not relative)
export const CHIPS_SIZE_PRICES = {
  S: 5, M: 7, L: 9, XL: 12,
};

export const SAUCE_PRICES = {
  garlic: 3, chilli: 3,
  mayo: 1, 'tomato-sauce': 1, 'sweet-chilli': 1, bbq: 1, tzaziki: 1,
};

export const EXTRA_MEAT_PRICE = 2;

/**
 * Returns the ITEM_TYPE_CONFIG entry for a given itemType.
 * Falls back to no-customisation config if unknown.
 */
export function getItemTypeConfig(itemType) {
  return ITEM_TYPE_CONFIG[itemType] ?? {
    hasSize: false, hasMeat: false, hasSauces: false, hasSalad: false,
  };
}

/**
 * Calculates the final price for an item given its base price and selections.
 *
 * @param {number} basePrice - Item's base price from Firestore
 * @param {{
 *   itemType: string,
 *   selectedSize: string|null,      // 'S'|'M'|'L'|'XL'|null
 *   hasExtraMeat: boolean,
 *   selectedSauces: string[],       // array of sauce ids
 * }} options
 * @returns {number} final price
 */
export function calculateItemPrice(basePrice, options) {
  const { itemType, selectedSize, hasExtraMeat, selectedSauces = [] } = options;

  let price = basePrice;

  if (itemType === 'hsp' && selectedSize) {
    price += HSP_SIZE_PRICES[selectedSize] ?? 0;
  }

  if (itemType === 'snack' && selectedSize && options.isChips) {
    price = CHIPS_SIZE_PRICES[selectedSize] ?? basePrice;
  }

  if (hasExtraMeat) {
    price += EXTRA_MEAT_PRICE;
  }

  for (const sauceId of selectedSauces) {
    price += SAUCE_PRICES[sauceId] ?? 1;
  }

  return price;
}
```

- [ ] **Step 3: Write the failing tests**

Create `src/lib/itemTypes.test.js`:

```js
import { calculateItemPrice, getItemTypeConfig } from './itemTypes';

describe('getItemTypeConfig', () => {
  test('returns correct config for hsp', () => {
    const config = getItemTypeConfig('hsp');
    expect(config.hasSize).toBe(true);
    expect(config.hasMeat).toBe(true);
    expect(config.hasSauces).toBe(true);
    expect(config.hasSalad).toBe(true);
  });

  test('returns correct config for skewer (no customisation)', () => {
    const config = getItemTypeConfig('skewer');
    expect(config.hasSize).toBe(false);
    expect(config.hasMeat).toBe(false);
    expect(config.hasSauces).toBe(false);
    expect(config.hasSalad).toBe(false);
  });

  test('returns no-customisation fallback for unknown type', () => {
    const config = getItemTypeConfig('unknown');
    expect(config.hasSize).toBe(false);
  });
});

describe('calculateItemPrice', () => {
  test('wrap with no extras returns base price', () => {
    expect(calculateItemPrice(12, {
      itemType: 'wrap', selectedSize: null, hasExtraMeat: false, selectedSauces: [],
    })).toBe(12);
  });

  test('wrap with extra meat adds $2', () => {
    expect(calculateItemPrice(12, {
      itemType: 'wrap', selectedSize: null, hasExtraMeat: true, selectedSauces: [],
    })).toBe(14);
  });

  test('wrap with garlic sauce adds $3', () => {
    expect(calculateItemPrice(12, {
      itemType: 'wrap', selectedSize: null, hasExtraMeat: false, selectedSauces: ['garlic'],
    })).toBe(15);
  });

  test('wrap with mayo adds $1', () => {
    expect(calculateItemPrice(12, {
      itemType: 'wrap', selectedSize: null, hasExtraMeat: false, selectedSauces: ['mayo'],
    })).toBe(13);
  });

  test('wrap with garlic + chilli + extra meat = base + 3 + 3 + 2', () => {
    expect(calculateItemPrice(12, {
      itemType: 'wrap', selectedSize: null, hasExtraMeat: true, selectedSauces: ['garlic', 'chilli'],
    })).toBe(20);
  });

  test('hsp medium adds $2 to base', () => {
    expect(calculateItemPrice(10, {
      itemType: 'hsp', selectedSize: 'M', hasExtraMeat: false, selectedSauces: [],
    })).toBe(12);
  });

  test('hsp xl adds $6 to base', () => {
    expect(calculateItemPrice(10, {
      itemType: 'hsp', selectedSize: 'XL', hasExtraMeat: false, selectedSauces: [],
    })).toBe(16);
  });

  test('chips small returns $5', () => {
    expect(calculateItemPrice(5, {
      itemType: 'snack', selectedSize: 'S', hasExtraMeat: false, selectedSauces: [], isChips: true,
    })).toBe(5);
  });

  test('chips large returns $9', () => {
    expect(calculateItemPrice(5, {
      itemType: 'snack', selectedSize: 'L', hasExtraMeat: false, selectedSauces: [], isChips: true,
    })).toBe(9);
  });

  test('skewer has no extras regardless of options passed', () => {
    expect(calculateItemPrice(10, {
      itemType: 'skewer', selectedSize: null, hasExtraMeat: false, selectedSauces: [],
    })).toBe(10);
  });
});
```

- [ ] **Step 4: Run tests to verify they fail**

```bash
npm test -- --testPathPattern=itemTypes --watchAll=false
```

Expected: Tests fail with "Cannot find module './itemTypes'" or similar.

- [ ] **Step 5: Run tests again now that the file exists**

```bash
npm test -- --testPathPattern=itemTypes --watchAll=false
```

Expected: All 11 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/itemTypes.js src/lib/itemTypes.test.js src/data/options.js
git commit -m "feat: add item type config and price calculation logic with tests"
```

---

## Task 3: HeroSection Component

**Files:**
- Create: `src/components/HeroSection.js`

**Interfaces:**
- Consumes: `onCtaClick: () => void` prop — called when "Order Now" button is clicked
- Produces: `<HeroSection onCtaClick={fn} />` React component

- [ ] **Step 1: Create src/components/HeroSection.js**

```js
import React from 'react';
import { cn } from '../lib/utils';

export default function HeroSection({ onCtaClick }) {
  return (
    <div className="relative h-[420px] md:h-[480px] overflow-hidden flex items-center justify-center text-center">
      {/* Ken-burns background image */}
      <div
        className="absolute inset-0 bg-cover bg-center animate-kenburns"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=1600&auto=format&q=80')`,
        }}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-[#111111]" />

      {/* Content */}
      <div className="relative z-10 px-6 py-16 max-w-2xl mx-auto">
        {/* Badge */}
        <div className="inline-block mb-5 px-5 py-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 text-amber-400 text-xs font-bold tracking-widest uppercase">
          Bundoora's Finest · Halal Certified
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight mb-3">
          TJ's Kebab<br />
          <span className="text-amber-400">Centre</span>
        </h1>

        <p className="text-white/80 text-base mb-8 leading-relaxed">
          Real Flavour. Real Food.<br />
          Fresh Chargrilled Halal Kebabs.
        </p>

        {/* Badges row */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {['Halal Certified', 'Bundoora VIC', 'Fresh Daily', 'Pickup Ready'].map(b => (
            <span key={b} className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-semibold">
              {b}
            </span>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={onCtaClick}
          className="px-10 py-4 bg-amber-500 hover:bg-amber-400 text-charcoal-900 font-extrabold text-base rounded-xl shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
          style={{ color: '#111111' }}
        >
          ORDER NOW →
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the component renders**

```bash
npm start
```

Temporarily import and render HeroSection in `src/App.js` above the Router to see it. Confirm the food photo appears with a dark overlay and the amber headline shows. Confirm the image slowly zooms (ken-burns). Remove the temporary import.

- [ ] **Step 3: Commit**

```bash
git add src/components/HeroSection.js
git commit -m "feat: add HeroSection with ken-burns animation and amber CTA"
```

---

## Task 4: CategoryNav Component

**Files:**
- Create: `src/components/CategoryNav.js`

**Interfaces:**
- Consumes:
  - `categories: Array<{ id: string, name: string, emoji: string }>` — from `useMenu()`
  - `activeCatId: string` — currently visible category id
  - `onCategoryClick: (id: string) => void`
- Produces: `<CategoryNav categories={[]} activeCatId="" onCategoryClick={fn} />` sticky nav bar

- [ ] **Step 1: Create src/components/CategoryNav.js**

```js
import React, { useRef, useEffect } from 'react';
import { cn } from '../lib/utils';

export default function CategoryNav({ categories, activeCatId, onCategoryClick }) {
  const navRef = useRef(null);

  // Auto-scroll active pill into view
  useEffect(() => {
    if (!navRef.current || !activeCatId) return;
    const btn = navRef.current.querySelector(`[data-cat="${activeCatId}"]`);
    if (btn) btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeCatId]);

  return (
    <div
      ref={navRef}
      className="sticky top-0 z-50 bg-[#111111] border-b border-[#2A2A2A]"
    >
      <div
        className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categories.map(cat => {
          const isActive = cat.id === activeCatId;
          return (
            <button
              key={cat.id}
              data-cat={cat.id}
              onClick={() => onCategoryClick(cat.id)}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 whitespace-nowrap',
                isActive
                  ? 'bg-amber-500 text-[#111111]'
                  : 'bg-transparent border border-[#3A3A3A] text-white hover:border-amber-500/50 hover:text-amber-400'
              )}
            >
              {cat.emoji && <span className="mr-1.5">{cat.emoji}</span>}
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/CategoryNav.js
git commit -m "feat: add sticky CategoryNav with amber active state"
```

---

## Task 5: ItemModal Component

**Files:**
- Create: `src/components/ItemModal.js`

**Interfaces:**
- Consumes:
  - `item: { id, name, description, price, image, itemType, isChips: bool }` — from Firestore via `useMenu()`
  - `isOpen: boolean`
  - `onClose: () => void`
- Produces: `<ItemModal item={item} isOpen={bool} onClose={fn} />` — adds item to cart on confirm

- [ ] **Step 1: Create src/components/ItemModal.js**

```js
import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Plus, Minus } from 'lucide-react';
import { cn } from '../lib/utils';
import { useCart } from '../context/CartContext';
import { getItemTypeConfig, calculateItemPrice, HSP_SIZE_PRICES, CHIPS_SIZE_PRICES } from '../lib/itemTypes';
import { SALAD_OPTIONS, SAUCE_OPTIONS, EXTRA_MEAT_OPTIONS } from '../data/options';

const SAUCE_DISPLAY = [
  { id: 'garlic',       name: 'Garlic',       price: 3, popular: true },
  { id: 'chilli',       name: 'Chilli',       price: 3, popular: true },
  { id: 'mayo',         name: 'Mayo',         price: 1 },
  { id: 'tomato-sauce', name: 'Tomato',       price: 1 },
  { id: 'sweet-chilli', name: 'Sweet Chilli', price: 1 },
  { id: 'bbq',          name: 'BBQ',          price: 1 },
  { id: 'tzaziki',      name: 'Chipotle',     price: 1 },
];

const SIZE_OPTIONS = ['S', 'M', 'L', 'XL'];
const SIZE_LABELS = { S: 'Small', M: 'Medium', L: 'Large', XL: 'Extra Large' };

export default function ItemModal({ item, isOpen, onClose }) {
  const { addItem } = useCart();
  const config = item ? getItemTypeConfig(item.itemType) : {};

  const [qty, setQty] = useState(1);
  const [selectedSize, setSelectedSize] = useState('S');
  const [hasExtraMeat, setHasExtraMeat] = useState(false);
  const [extraMeatType, setExtraMeatType] = useState('lamb');
  const [selectedSauces, setSelectedSauces] = useState([]);
  const [selectedSalads, setSelectedSalads] = useState(
    SALAD_OPTIONS.map(s => s.id)
  );
  const [specialNote, setSpecialNote] = useState('');

  // Reset state when a different item opens
  useEffect(() => {
    if (isOpen) {
      setQty(1);
      setSelectedSize('S');
      setHasExtraMeat(false);
      setExtraMeatType('lamb');
      setSelectedSauces([]);
      setSelectedSalads(SALAD_OPTIONS.map(s => s.id));
      setSpecialNote('');
    }
  }, [isOpen, item?.id]);

  if (!item) return null;

  const unitPrice = calculateItemPrice(item.price, {
    itemType: item.itemType,
    selectedSize,
    hasExtraMeat,
    selectedSauces,
    isChips: item.isChips,
  });

  const totalPrice = unitPrice * qty;

  const toggleSauce = (id) => {
    setSelectedSauces(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleSalad = (id) => {
    setSelectedSalads(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleAdd = () => {
    const sauceName = id => SAUCE_DISPLAY.find(s => s.id === id)?.name ?? id;
    const saladName = id => SALAD_OPTIONS.find(s => s.id === id)?.name ?? id;

    addItem({
      ...item,
      baseId: item.id,
      price: unitPrice,
      displayName: item.name,
      customisations: {
        size: config.hasSize ? selectedSize : null,
        extraMeat: hasExtraMeat ? extraMeatType : null,
        sauces: config.hasSauces ? selectedSauces.map(sauceName) : [],
        salads: config.hasSalad ? selectedSalads.map(saladName) : [],
        note: specialNote.trim().slice(0, 500) || null,
      },
      qty,
    });
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={open => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm animate-fadeIn" />
        <Dialog.Content
          className="fixed bottom-0 left-0 right-0 z-[101] bg-[#1C1C1E] rounded-t-2xl max-h-[90vh] overflow-y-auto animate-slideUp focus:outline-none"
          style={{ maxWidth: 640, margin: '0 auto' }}
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-[#3A3A3A]" />
          </div>

          {/* Item image */}
          {item.image && (
            <div className="w-full h-48 overflow-hidden">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="px-5 pb-8 pt-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 pr-3">
                <Dialog.Title className="text-xl font-bold text-white">
                  {item.name}
                </Dialog.Title>
                {item.description && (
                  <p className="text-sm text-[#9CA3AF] mt-1 leading-relaxed">
                    {item.description}
                  </p>
                )}
                <p className="text-amber-500 font-bold text-lg mt-1">
                  ${item.price.toFixed(2)}
                </p>
              </div>
              <Dialog.Close asChild>
                <button className="w-8 h-8 rounded-full bg-[#2A2A2A] flex items-center justify-center text-[#9CA3AF] hover:text-white transition-colors flex-shrink-0">
                  <X size={16} />
                </button>
              </Dialog.Close>
            </div>

            {/* Size selector (HSP and Chips) */}
            {config.hasSize && (
              <Section title="Size">
                <div className="grid grid-cols-4 gap-2">
                  {SIZE_OPTIONS.map(size => {
                    const extraCost = item.isChips
                      ? null
                      : (HSP_SIZE_PRICES[size] > 0 ? `+$${HSP_SIZE_PRICES[size]}` : 'Base');
                    return (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={cn(
                          'py-2.5 rounded-xl text-sm font-semibold border transition-all',
                          selectedSize === size
                            ? 'bg-amber-500 border-amber-500 text-[#111111]'
                            : 'bg-[#2A2A2A] border-[#3A3A3A] text-white hover:border-amber-500/50'
                        )}
                      >
                        <div>{SIZE_LABELS[size]}</div>
                        {item.isChips && (
                          <div className="text-xs mt-0.5 opacity-75">
                            ${CHIPS_SIZE_PRICES[size]}
                          </div>
                        )}
                        {!item.isChips && (
                          <div className="text-xs mt-0.5 opacity-75">{extraCost}</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* Extra meat */}
            {config.hasMeat && (
              <Section title="Extra Meat">
                <button
                  onClick={() => setHasExtraMeat(p => !p)}
                  className={cn(
                    'w-full py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-between transition-all',
                    hasExtraMeat
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                      : 'bg-[#2A2A2A] border-[#3A3A3A] text-white hover:border-amber-500/50'
                  )}
                >
                  <span>Add Extra Meat</span>
                  <span className="text-xs opacity-75">+$2.00</span>
                </button>
                {hasExtraMeat && (
                  <div className="flex gap-2 mt-2">
                    {EXTRA_MEAT_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setExtraMeatType(opt.id)}
                        className={cn(
                          'flex-1 py-2 rounded-lg border text-sm font-semibold transition-all',
                          extraMeatType === opt.id
                            ? 'bg-amber-500 border-amber-500 text-[#111111]'
                            : 'bg-[#2A2A2A] border-[#3A3A3A] text-white'
                        )}
                      >
                        {opt.name.replace('Extra ', '')}
                      </button>
                    ))}
                  </div>
                )}
              </Section>
            )}

            {/* Sauces */}
            {config.hasSauces && (
              <Section title="Sauces" note="First sauce is free · Garlic & Chilli +$3 · Others +$1">
                <div className="flex flex-wrap gap-2">
                  {SAUCE_DISPLAY.map(sauce => {
                    const active = selectedSauces.includes(sauce.id);
                    return (
                      <button
                        key={sauce.id}
                        onClick={() => toggleSauce(sauce.id)}
                        className={cn(
                          'px-3 py-2 rounded-full text-sm font-semibold border transition-all flex items-center gap-1.5',
                          active
                            ? 'bg-amber-500 border-amber-500 text-[#111111]'
                            : 'bg-[#2A2A2A] border-[#3A3A3A] text-white hover:border-amber-500/50'
                        )}
                      >
                        {sauce.name}
                        {sauce.popular && <span className="text-xs">⭐</span>}
                        <span className="text-xs opacity-70">+${sauce.price}</span>
                      </button>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* Salad */}
            {config.hasSalad && (
              <Section title="Salad" note="All included by default — tap to remove">
                <div className="flex flex-wrap gap-2">
                  {SALAD_OPTIONS.map(s => {
                    const active = selectedSalads.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        onClick={() => toggleSalad(s.id)}
                        className={cn(
                          'px-3 py-2 rounded-full text-sm font-semibold border transition-all',
                          active
                            ? 'bg-[#2A2A2A] border-amber-500/60 text-white'
                            : 'bg-transparent border-[#3A3A3A] text-[#9CA3AF] line-through'
                        )}
                      >
                        {active && '✓ '}{s.name}
                      </button>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* Special instructions */}
            <Section title="Special Instructions">
              <textarea
                value={specialNote}
                onChange={e => setSpecialNote(e.target.value.slice(0, 500))}
                placeholder="e.g. extra crispy, no onion, allergies..."
                rows={3}
                className="w-full bg-[#2A2A2A] border border-[#3A3A3A] rounded-xl px-4 py-3 text-sm text-white placeholder-[#6B7280] resize-none focus:outline-none focus:border-amber-500/60 transition-colors"
              />
              <p className="text-xs text-[#6B7280] mt-1 text-right">
                {specialNote.length}/500
              </p>
            </Section>

            {/* Quantity + Add button */}
            <div className="flex items-center gap-3 mt-6">
              <div className="flex items-center gap-3 bg-[#2A2A2A] rounded-xl px-3 py-2">
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-7 h-7 flex items-center justify-center text-white hover:text-amber-400 transition-colors"
                >
                  <Minus size={16} />
                </button>
                <span className="text-white font-bold text-base w-6 text-center">{qty}</span>
                <button
                  onClick={() => setQty(q => q + 1)}
                  className="w-7 h-7 flex items-center justify-center text-white hover:text-amber-400 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>

              <button
                onClick={handleAdd}
                className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-400 rounded-xl font-extrabold text-base flex items-center justify-between px-5 transition-all active:scale-95"
                style={{ color: '#111111' }}
              >
                <span>Add to Order</span>
                <span>${totalPrice.toFixed(2)}</span>
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Section({ title, note, children }) {
  return (
    <div className="mt-5 pt-5 border-t border-[#2A2A2A]">
      <div className="flex items-baseline gap-2 mb-2">
        <h3 className="text-white font-semibold text-sm">{title}</h3>
        {note && <span className="text-[#9CA3AF] text-xs">{note}</span>}
      </div>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Verify modal renders (manual test)**

```bash
npm start
```

In `src/pages/HomePage.js`, temporarily hardcode `showModal={true}` with a fake item to confirm the modal slides up, shows amber buttons, and the X closes it. Remove the temporary test after verifying.

- [ ] **Step 3: Commit**

```bash
git add src/components/ItemModal.js
git commit -m "feat: add ItemModal with Radix Dialog, full customisation UX"
```

---

## Task 6: MenuItemCard Redesign

**Files:**
- Modify: `src/components/MenuItemCard.js`

**Interfaces:**
- Consumes: `item: { id, name, description, price, image, itemType, popular }`, `category: { id, name }`
- Produces: dark card that opens `<ItemModal>` on click

- [ ] **Step 1: Rewrite src/components/MenuItemCard.js**

Replace entire file content with:

```js
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import { useCart } from '../context/CartContext';
import ItemModal from './ItemModal';

export default function MenuItemCard({ item }) {
  const { cart } = useCart();
  const [modalOpen, setModalOpen] = useState(false);
  const qty = cart.filter(c => c.baseId === item.id).reduce((s, c) => s + c.qty, 0);

  return (
    <>
      <div
        onClick={() => setModalOpen(true)}
        className={cn(
          'relative bg-[#1C1C1E] rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 group',
          'border hover:border-amber-500/40 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30',
          qty > 0 ? 'border-amber-500/60' : 'border-[#2A2A2A]'
        )}
      >
        {/* Food photo */}
        {item.image ? (
          <div className="w-full aspect-video overflow-hidden">
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="w-full aspect-video bg-[#2A2A2A] flex items-center justify-center">
            <span className="text-4xl opacity-30">🥙</span>
          </div>
        )}

        {/* Popular badge */}
        {item.popular && (
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-amber-500 rounded-full text-[10px] font-bold text-[#111111] tracking-wide">
            ★ POPULAR
          </div>
        )}

        {/* Qty badge */}
        {qty > 0 && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-xs font-bold text-[#111111]">
            {qty}
          </div>
        )}

        {/* Card body */}
        <div className="p-4">
          <h3 className="text-white font-semibold text-sm leading-snug mb-1">{item.name}</h3>
          {item.description && (
            <p className="text-[#9CA3AF] text-xs leading-relaxed line-clamp-2 mb-3">
              {item.description}
            </p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-amber-500 font-bold text-base">${item.price.toFixed(2)}</span>
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
              qty > 0 ? 'bg-amber-500' : 'bg-[#2A2A2A] group-hover:bg-amber-500/20'
            )}>
              <Plus size={16} className={qty > 0 ? 'text-[#111111]' : 'text-amber-500'} />
            </div>
          </div>
        </div>
      </div>

      <ItemModal item={item} isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/MenuItemCard.js
git commit -m "feat: redesign MenuItemCard with dark Tailwind card + food photo"
```

---

## Task 7: CartBar Component

**Files:**
- Create: `src/components/CartBar.js`

**Interfaces:**
- Consumes: `useCart()` from context — reads `itemCount`, `total`
- Produces: `<CartBar />` — fixed bottom bar, navigates to `/cart`

- [ ] **Step 1: Create src/components/CartBar.js**

```js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function CartBar() {
  const { itemCount, total } = useCart();
  const navigate = useNavigate();

  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pointer-events-none">
      <button
        onClick={() => navigate('/cart')}
        className="w-full max-w-2xl mx-auto flex items-center justify-between bg-amber-500 hover:bg-amber-400 text-[#111111] font-extrabold py-4 px-6 rounded-2xl shadow-2xl shadow-amber-500/30 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] pointer-events-auto"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-[#111111]/20 rounded-full flex items-center justify-center text-sm font-bold">
            {itemCount}
          </div>
          <span className="text-base">View Order</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base">${total.toFixed(2)}</span>
          <ShoppingBag size={18} />
        </div>
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/CartBar.js
git commit -m "feat: add fixed amber CartBar with item count and total"
```

---

## Task 8: MenuGrid Component

**Files:**
- Create: `src/components/MenuGrid.js`

**Interfaces:**
- Consumes:
  - `categories: Array<{ id, name, emoji, items: Item[] }>` — from `useMenu()`
  - `drinks: Item[]` — from `useMenu()`
  - `categoryRefs: React.MutableRefObject<{}>` — ref map for scroll tracking
- Produces: `<MenuGrid categories={[]} drinks={[]} categoryRefs={ref} />` full scrollable menu

- [ ] **Step 1: Create src/components/MenuGrid.js**

```js
import React from 'react';
import MenuItemCard from './MenuItemCard';

export default function MenuGrid({ categories, drinks, categoryRefs }) {
  const drinksCategory = drinks.length > 0
    ? { id: 'drinks', name: 'Drinks', emoji: '🥤', items: drinks }
    : null;

  const allCategories = drinksCategory
    ? [...categories, drinksCategory]
    : categories;

  return (
    <div className="bg-[#111111] min-h-screen pb-32">
      {allCategories.map(cat => (
        <div
          key={cat.id}
          id={`cat-${cat.id}`}
          ref={el => { if (categoryRefs?.current) categoryRefs.current[cat.id] = el; }}
          className="px-4 pt-8"
        >
          {/* Category header */}
          <div className="flex items-center gap-2 mb-4">
            {cat.emoji && <span className="text-2xl">{cat.emoji}</span>}
            <h2 className="text-white text-xl font-extrabold">{cat.name}</h2>
          </div>

          {/* Items grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {cat.items.map(item => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/MenuGrid.js
git commit -m "feat: add MenuGrid with per-category sections and 2-col grid"
```

---

## Task 9: Rewrite HomePage

**Files:**
- Modify: `src/pages/HomePage.js`

**Interfaces:**
- Consumes: `useMenu()`, `useCart()`, `useNavigate()`
- Produces: full page composing HeroSection + CategoryNav + MenuGrid + CartBar

- [ ] **Step 1: Replace src/pages/HomePage.js entirely**

```js
import React, { useState, useEffect, useRef } from 'react';
import { useMenu } from '../hooks/useMenu';
import HeroSection from '../components/HeroSection';
import CategoryNav from '../components/CategoryNav';
import MenuGrid from '../components/MenuGrid';
import CartBar from '../components/CartBar';

export default function HomePage() {
  const { categories, drinks, promotions, loading } = useMenu();
  const [activeCatId, setActiveCatId] = useState(null);
  const categoryRefs = useRef({});
  const scrollingRef = useRef(false);

  const firstCatId = categories[0]?.id;
  const displayActiveCat = activeCatId || firstCatId;

  // IntersectionObserver — highlight active category as user scrolls
  useEffect(() => {
    if (!categories.length) return;
    const observers = [];
    categories.forEach(cat => {
      const el = categoryRefs.current[cat.id];
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !scrollingRef.current) {
            setActiveCatId(cat.id);
          }
        },
        { rootMargin: '-80px 0px -55% 0px', threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, [categories]);

  const scrollToCategory = (catId) => {
    setActiveCatId(catId);
    const el = categoryRefs.current[catId];
    if (!el) return;
    scrollingRef.current = true;
    const NAVBAR_H = 64;
    const CATNAV_H = 52;
    const top = el.getBoundingClientRect().top + window.scrollY - NAVBAR_H - CATNAV_H;
    window.scrollTo({ top, behavior: 'smooth' });
    setTimeout(() => { scrollingRef.current = false; }, 900);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="text-amber-500 text-lg font-semibold animate-pulse">Loading menu...</div>
      </div>
    );
  }

  // Build category list for nav (include Drinks if present)
  const navCategories = [
    ...categories,
    ...(drinks.length > 0 ? [{ id: 'drinks', name: 'Drinks', emoji: '🥤' }] : []),
  ];

  return (
    <div className="bg-[#111111] min-h-screen">
      {/* Promotions banner (if any) */}
      {promotions.length > 0 && (
        <div className="px-4 pt-4 space-y-2">
          {promotions.map(promo => (
            <div key={promo.id} className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
              <span className="text-2xl">{promo.emoji || '🎉'}</span>
              <div>
                <p className="text-amber-400 font-bold text-sm">{promo.title}</p>
                <p className="text-amber-400/70 text-xs">{promo.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <HeroSection onCtaClick={() => scrollToCategory(firstCatId)} />

      <CategoryNav
        categories={navCategories}
        activeCatId={displayActiveCat}
        onCategoryClick={scrollToCategory}
      />

      <MenuGrid
        categories={categories}
        drinks={drinks}
        categoryRefs={categoryRefs}
      />

      <CartBar />
    </div>
  );
}
```

- [ ] **Step 2: Verify full page in browser**

```bash
npm start
```

Check:
1. Hero shows with ken-burns animation and amber CTA
2. Clicking "ORDER NOW →" smoothly scrolls to first category
3. Category nav is sticky and highlights active category while scrolling
4. Menu items render in dark cards; clicking opens ItemModal
5. Adding items shows amber qty badge on card and CartBar appears at bottom
6. CartBar shows correct count + total; clicking navigates to `/cart`
7. Cart page, Checkout page still work (they use old inline styles — should be unchanged)

- [ ] **Step 3: Commit**

```bash
git add src/pages/HomePage.js
git commit -m "feat: rewrite HomePage with HeroSection, CategoryNav, MenuGrid, CartBar"
```

---

## Task 10: Firestore itemType Migration Helper

**Files:**
- Modify: `src/admin/AdminApp.js` (or wherever the admin panel's main component is)

**Interfaces:**
- Produces: a "Set Item Types" button in the admin panel that assigns `itemType` to all Firestore menu items based on their `category` field

- [ ] **Step 1: Find the admin panel's relevant file**

```bash
grep -rn "menuItems\|addDoc\|setDoc" /Users/saichetankari/Downloads/tjs-v6/src/admin/ | head -20
```

Read the output to identify which admin file manages menu items, then locate the JSX render section.

- [ ] **Step 2: Add the migration helper function**

In the admin file that imports `db` and renders admin UI, add this function and button. Place the function near other Firebase functions in the file:

```js
// One-time migration: assigns itemType to all menuItems based on category name
async function assignItemTypes() {
  const { collection, getDocs, updateDoc, doc } = await import('firebase/firestore');
  const snap = await getDocs(collection(db, 'menuItems'));

  const categoryToItemType = {
    'wraps': 'wrap',
    'hsp': 'hsp',
    'halal snack pack': 'hsp',
    'rice bowls': 'ricebowl',
    'rice bowl': 'ricebowl',
    'salad bowls': 'salad',
    'salad bowl': 'salad',
    'bowl salad': 'salad',
    'skewers': 'skewer',
    'skewer': 'skewer',
    'chargrilled': 'chargrilled',
    'snacks': 'snack',
    'chips': 'snack',
    'drinks': 'drink',
    'drink': 'drink',
  };

  const isChipsItem = (name) => name?.toLowerCase().includes('chip');

  let updated = 0;
  for (const d of snap.docs) {
    const data = d.data();
    const cat = (data.category || data.categoryName || '').toLowerCase();
    const name = (data.name || '').toLowerCase();
    const itemType = categoryToItemType[cat] ?? 'wrap';
    await updateDoc(doc(db, 'menuItems', d.id), {
      itemType,
      isChips: isChipsItem(name),
    });
    updated++;
  }
  alert(`Updated ${updated} items with itemType.`);
}
```

In the JSX, add a button in the admin panel (near other admin actions):

```jsx
<button
  onClick={assignItemTypes}
  style={{ background: '#F59E0B', color: '#111', padding: '10px 20px', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', marginTop: 12 }}
>
  Set Item Types (run once)
</button>
```

- [ ] **Step 3: Run the migration**

1. Start the app: `npm start`
2. Navigate to `/admin`
3. Click "Set Item Types (run once)"
4. Confirm the alert shows the correct count of updated items
5. Verify in Firebase Console that `menuItems` documents now have `itemType` field

- [ ] **Step 4: Commit**

```bash
git add src/admin/
git commit -m "feat: add one-time itemType migration helper in admin panel"
```

---

## Task 11: Update Navbar for Dark Theme

**Files:**
- Modify: `src/components/Navbar.js`

**Interfaces:**
- Produces: Navbar with dark charcoal background matching the new homepage

- [ ] **Step 1: Read current Navbar.js**

```bash
cat /Users/saichetankari/Downloads/tjs-v6/src/components/Navbar.js
```

- [ ] **Step 2: Update background color**

Find the nav container's `background` style value and change it to `#111111`. Find any border-bottom and change to `1px solid #2A2A2A`. Keep all other logic (links, cart icon, etc.) unchanged.

- [ ] **Step 3: Commit**

```bash
git add src/components/Navbar.js
git commit -m "fix: update Navbar background to match dark charcoal theme"
```

---

## Task 12: Security Audit & Push to GitHub

**Files:**
- None modified — audit only

- [ ] **Step 1: Check for exposed secrets**

```bash
grep -rn "REACT_APP_\|apiKey\|firebaseConfig\|AIza" /Users/saichetankari/Downloads/tjs-v6/src/ --include="*.js"
```

Expected: `firebase.js` references `process.env.REACT_APP_*` variables — NOT hardcoded values. If any hardcoded key appears, move it to `.env` immediately.

- [ ] **Step 2: Check .gitignore covers .env**

```bash
cat /Users/saichetankari/Downloads/tjs-v6/.gitignore | grep env
```

Expected: `.env` or `.env*` appears in the output. If not, add `.env` to `.gitignore`.

- [ ] **Step 3: Check special instructions is capped in ItemModal**

Verify `src/components/ItemModal.js` line with `setSpecialNote` uses `.slice(0, 500)` and the `handleAdd` uses `.trim().slice(0, 500)`. These are already in the code from Task 5.

- [ ] **Step 4: Verify no XSS vectors**

All user text goes into React JSX as text content (not `dangerouslySetInnerHTML`). Confirm `ItemModal.js` uses `{specialNote}` not `dangerouslySetInnerHTML`. The `item.description` and `item.name` fields are also rendered as text content only.

- [ ] **Step 5: Check Firebase rules allow read-only for menu**

```bash
cat /Users/saichetankari/Downloads/tjs-v6/src/firebaseRules.md
```

Confirm rules allow public read for `menuItems` and `drinks`, but only authenticated writes (or write-only for `orders`). If not, update the rules in Firebase Console.

- [ ] **Step 6: Push to GitHub**

```bash
git status
git log --oneline -10
git push origin main
```

Expected: All commits from Tasks 1–11 push successfully.

---

## Self-Review Checklist

- [x] **Spec coverage:**
  - Dark charcoal + amber theme → All components use `#111111` / `#F59E0B`
  - Ken-burns hero animation → Task 3, `animate-kenburns` Tailwind animation
  - Sticky category nav → Task 4, `sticky top-0 z-50`
  - Item modal slides up → Task 5, Radix Dialog + `animate-slideUp`
  - Size selector (HSP + Chips) → Task 5, `config.hasSize` conditional
  - Extra meat +$2 (lamb/chicken) → Task 5, `config.hasMeat` + `EXTRA_MEAT_OPTIONS`
  - Sauces with correct pricing → Task 5, `SAUCE_DISPLAY` + `calculateItemPrice`
  - Salad (free, all on by default) → Task 5, `config.hasSalad` + toggleSalad
  - Special instructions (500 char max) → Task 5, `slice(0, 500)`
  - CartBar fixed bottom amber → Task 7
  - All menu categories + items → Task 8 MenuGrid
  - Firestore itemType migration → Task 10
  - Security audit → Task 12
  - GitHub push → Task 12

- [x] **No placeholders:** All steps contain actual code

- [x] **Type consistency:**
  - `calculateItemPrice(basePrice, options)` defined in Task 2, consumed in Task 5
  - `getItemTypeConfig(itemType)` defined in Task 2, consumed in Task 5
  - `EXTRA_MEAT_OPTIONS` added to `options.js` in Task 2, imported in Task 5
  - `HSP_SIZE_PRICES`, `CHIPS_SIZE_PRICES` defined in Task 2, imported in Task 5
  - `cn()` defined in Task 1, used in Tasks 3–9
  - Category `id` used as key in all components consistently
