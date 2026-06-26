# TJ's Kebab Centre — Menu Page Redesign Spec
**Date:** 2026-06-26  
**Scope:** Menu page redesign with Domino's-style UX, pickup-only flow, full customization modal  
**Stack addition:** Tailwind CSS + shadcn/ui + 21st.dev components  

---

## 1. Goal

Redesign the existing `HomePage.js` / `MenuPage.js` into a single unified, professional pickup-ordering experience. Target aesthetic: dark charcoal + amber, clean and minimal, feels like a funded food-tech product, not a local shop site.

---

## 2. Tech Stack Changes

| Addition | Purpose |
|---|---|
| Tailwind CSS | Utility-first styling throughout |
| shadcn/ui | Base accessible components (Dialog, Sheet, Button, Badge) |
| 21st.dev components | Polished hero, cards, nav elements |

Install sequence:
1. `npx tailwindcss init` + configure `tailwind.config.js`
2. Add `@tailwind` directives to `global.css`
3. `npx shadcn@latest init` — choose dark theme, zinc base
4. Install specific shadcn components: `dialog`, `sheet`, `button`, `badge`, `separator`, `scroll-area`

Existing inline-style components (`Navbar.js`, `MenuItemCard.js`, etc.) are replaced as part of this work. `CartPage.js`, `CheckoutPage.js`, `OrderConfirmationPage.js` are **out of scope** for this spec.

---

## 3. Page Architecture

Single route `/` renders `HomePage.js` which composes:

```
<HomePage>
  <HeroSection />           ← animated ken-burns food photo + CTA
  <CategoryNav />           ← sticky horizontal pill nav
  <MenuGrid />              ← renders per-category sections
    <MenuItemCard />        ← individual item card
  <ItemModal />             ← customization sheet (shadcn Sheet, slides up)
  <CartBar />               ← fixed bottom floating bar
</HomePage>
```

---

## 4. Component Specs

### 4.1 HeroSection
- Full-width, ~420px tall on desktop, 280px on mobile
- Background: dark charcoal `#111111` with a food photo (existing hero image)
- Ken-burns animation: CSS `@keyframes` that slowly scales the image from `1.0` to `1.08` over 8s, loops infinitely
- Overlay: semi-transparent dark gradient bottom-to-top so text is readable
- Content: TJ's logo/name (top-left), bold headline "Fresh. Chargrilled. Yours." + amber CTA button "Order Pickup"
- CTA scrolls to menu grid

### 4.2 CategoryNav
- Horizontal scrollable pill buttons
- Categories (in order): Wraps, HSP, Rice Bowls, Salad Bowls, Skewers, Snacks, Drinks
- Sticky at top (`position: sticky; top: 0`) with `z-index: 50`
- Background: `#111111` (same as hero), subtle bottom border when stuck
- Active pill: amber background `#F59E0B`, dark text
- Inactive pill: dark outline, white text
- Clicking a pill smoothly scrolls to that category section

### 4.3 MenuGrid
- Two-column grid on desktop (`grid-cols-2`), single column on mobile
- Each category rendered as a section with an `id` matching category slug
- Section header: category name in white, large font, left-aligned
- Items fetched from Firestore via existing `useMenu()` hook — items need `itemType` field added

### 4.4 MenuItemCard
- Dark card `#1C1C1E` with subtle border `#2A2A2A`
- Food photo top (16:9 ratio, `object-cover`)
- Card body: item name (white, semibold), short description (gray), price (amber)
- Hover: slight lift (`translateY(-2px)`) + border brightens
- "Add" button: amber, rounded-full, bottom-right of card
- Clicking anywhere on card opens `ItemModal`

### 4.5 ItemModal (shadcn Sheet — slides up from bottom)
- Triggered by clicking any menu card
- Header: item name + close button
- Dynamic sections based on `itemType`:

**Size selector** (HSP and Chips only):
- Horizontal radio button group: S / M / L / XL
- Selected size highlighted in amber
- Price updates live in the "Add to Order" button

**Extra Meat** (Wraps, HSP, Rice Bowls, Salad Bowls, Chargrilled items):
- Toggle: "+ Extra Meat — $2.00"
- Sub-choice appears on toggle: Lamb / Chicken (radio)

**Sauces** (Wraps, HSP, Rice Bowls, Salad Bowls, Chargrilled items):
- Checkbox list, all unchecked by default
- Garlic: "Garlic Sauce — +$3.00 ⭐ Popular"
- Chilli: "Chilli Sauce — +$3.00 ⭐ Popular"
- Mayo, Tomato, Sweet Chilli, BBQ, Chipotle: each "+$1.00"
- Note below: "First sauce free with your order"

**Salad** (Wraps, HSP, Rice Bowls, Salad Bowls, Chargrilled items):
- Checkbox list with common salad items, all free, no price shown

**Special Instructions:**
- Textarea: "Any special requests? (e.g. extra crispy, no onion)"
- Shown on all item types

**Quantity:**
- `-` / count / `+` row, minimum 1

**Footer:**
- "Add to Order — $XX.XX" amber button, full width
- Price = base price + size adjustment + extras + sauces

### 4.6 CartBar
- Fixed bottom bar, full width
- Background: amber `#F59E0B`, dark text
- Left: item count badge + "View Order"
- Right: total price
- Hidden when cart is empty
- Tapping navigates to `/cart`

---

## 5. Pricing Logic

```js
// itemType controls which options render
const ITEM_TYPES = {
  wrap: { hasSize: false, hasMeat: true, hasSauces: true, hasSalad: true },
  hsp:  { hasSize: true,  hasMeat: true, hasSauces: true, hasSalad: true },
  ricebowl: { hasSize: false, hasMeat: true, hasSauces: true, hasSalad: true },
  salad:    { hasSize: false, hasMeat: true, hasSauces: true, hasSalad: true },
  chargrilled: { hasSize: false, hasMeat: false, hasSauces: false, hasSalad: false },
  skewer:  { hasSize: false, hasMeat: false, hasSauces: false, hasSalad: false },
  snack:   { hasSize: true,  hasMeat: false, hasSauces: false, hasSalad: false },
  drink:   { hasSize: false, hasMeat: false, hasSauces: false, hasSalad: false },
};

const SAUCE_PRICES = {
  garlic: 3, chilli: 3,
  mayo: 1, tomato: 1, sweetChilli: 1, bbq: 1, chipotle: 1,
};

const EXTRA_MEAT_PRICE = 2;
```

Total = base price (from size if applicable) + extra meat + sum of selected sauce prices

---

## 6. Menu Items & Categories

### Wraps
- Kebab Wrap — price from Firestore, `itemType: wrap`

### HSP
- Halal Snack Pack — prices per size from Firestore, `itemType: hsp`

### Rice Bowls
- Rice Bowl — `itemType: ricebowl`
- Special Rice Bowl (lamb + chicken + 1 skewer each) — `itemType: ricebowl`
- Chargrilled Lamb Rice (2 lamb skewers + tomato + rice) — `itemType: chargrilled`
- Chargrilled Chicken Rice (2 chicken skewers + tomato + rice) — `itemType: chargrilled`

### Salad Bowls
- Bowl Salad — `itemType: salad`
- Special Salad Bowl (lamb + chicken + 1 skewer each) — `itemType: salad`
- Chargrilled Lamb Salad (2 lamb skewers + tomato + salad) — `itemType: chargrilled`
- Chargrilled Chicken Salad (2 chicken skewers + tomato + salad) — `itemType: chargrilled`

### Skewers
- Chicken Skewer — $10, `itemType: skewer`
- Lamb Skewer — $12, `itemType: skewer`

### Snacks
- Chips — S$5 / M$7 / L$9 / XL$12, `itemType: snack`
- Nuggets — $8, `itemType: snack`
- Chicken Tenders — $8, `itemType: snack`
- Chips + Nuggets Combo — $15, `itemType: snack`
- Chips + Tenders Combo — $15, `itemType: snack`

### Drinks
- Items from Firestore, `itemType: drink`

---

## 7. Firestore Changes

Each menu item document needs an `itemType` field added. This is a one-time data migration run from the existing Admin panel (add a "Set Item Types" button) or via a script.

No other schema changes required. Cart and order documents remain unchanged.

---

## 8. Security

- Google Maps API key stays in `REACT_APP_GOOGLE_API_KEY` env var (never committed)
- Firebase rules unchanged — read-only for menu, write-only for orders
- No user auth required for ordering (guest checkout)
- Input sanitation: special instructions field capped at 500 chars, trimmed before saving to Firestore
- No PII stored beyond what customer voluntarily enters at checkout

---

## 9. Out of Scope

- Cart page, Checkout page, Order Confirmation page — no changes
- Admin panel — no changes (except optional itemType migration helper)
- Online payment flow — not implemented in this spec
- User accounts / login
