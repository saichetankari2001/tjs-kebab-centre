# TJ's Kebab Centre — Full Application Design Spec
**Date:** 2026-06-27  
**Status:** Approved by user

---

## 1. Overview

Complete rebuild of TJ's Kebab Centre into a launch-ready, professional food ordering web application. Comparable to Uber Eats / Domino's in UX quality but with TJ's own brand identity. Pickup only. Firebase Firestore as primary database. Node.js/Express as backend API server for email, SMS, and push notifications. React + Tailwind CSS + Framer Motion on the frontend.

---

## 2. Design Language

- **Background:** Deep charcoal `#0f0f0f` with `#1a1a1a` card surfaces — matches the physical in-store menu board
- **Primary accent:** Amber/gold `#f59e0b` for headings, CTAs, badges — matches physical menu typography
- **Secondary accent:** `#16a34a` (green) for loyalty stamps and success states
- **Typography:** `Inter` (UI) + `Playfair Display` (headings/brand) — or swap to `Bebas Neue` for bold headers matching the physical menu aesthetic
- **Photos:** High-quality Unsplash stock images for each category hero (kebab, HSP, bowls, chips) — sourced via free embed URLs. No per-item images; category-level hero banners only.
- **Motion:** Framer Motion — page fade-ins, card hover lifts, modal slide-up, category scroll highlight, loyalty stamp fill animation
- **Layout:** Uber Eats scroll pattern — sticky Navbar (60px) + sticky Category Nav (48px) below it. Single-page menu scroll with IntersectionObserver highlighting active category. Full-width on desktop (max 960px centered), mobile-first.

---

## 3. Full Menu Structure

### Kebab Wraps
Default salad: Lettuce, Tomato, Onion (customer can remove)

| Item | Price |
|------|-------|
| Original Kebab — Chicken | $16 |
| Original Kebab — Lamb | $18 |
| Original Kebab — Mix | $18 |
| Chargrilled Kebab — Chicken | $18 |
| Chargrilled Kebab — Lamb | $20 |
| Chargrilled Kebab — Mix | $20 |
| Falafel OG Wrap | $16 |
| Falafel Garden | $18 |

### Signature Bowls
Protein choice: Chicken / Lamb / Mix / Chargrilled Chicken / Chargrilled Lamb / Special  
Bowl type choice: Salad Bowl or Rice Bowl

| Protein | Salad Bowl | Rice Bowl |
|---------|------------|-----------|
| Chicken | $15 | $16 |
| Lamb | $16 | $17 |
| Mix | $16 | $17 |
| Chargrilled Chicken | $16 | $17 |
| Chargrilled Lamb | $17 | $18 |
| Special | $23 | $24 |

### HSP (Halal Snack Pack)
Protein: Chicken / Lamb / Mix

| Size | Chicken | Lamb | Mix |
|------|---------|------|-----|
| Small | $15 | $16 | $16 |
| Medium | $20 | $22 | $22 |
| Large | $24 | $27 | $27 |
| Extra Large | $35 | $40 | $40 |

### Skewers
Customer chooses: with Rice OR with Salad

| Item | Price |
|------|-------|
| Chargrilled Chicken Skewer | $10 |
| Lamb Skewer | $12 |

### Chips
| Size | Price |
|------|-------|
| Small | $5 |
| Medium | $7 |
| Large | $9 |
| Extra Large | $12 |

### Snacks
| Item | Price |
|------|-------|
| Nuggets | $8 |
| Chicken Tenders | $8 |
| Chips & Nuggets | $15 |
| Chips & Chicken Tenders | $15 |

### The Loaded Upgrade
Hot chips + a can drink combo

| Size | Price |
|------|-------|
| Regular | $7 |
| Large | $9 |

### Homemade Dips
| Item | Price |
|------|-------|
| Chilli Dip (spicy) | $2 |
| Tzatziki Dip | $2 |

### Drinks
| Item | Price |
|------|-------|
| Can | $3 |
| Regular Bottle | $5 |
| Large Bottle | $7 |

---

## 4. Customisation Rules

### Sauces
One sauce FREE with every item. Additional sauces $2 each.
- Garlic ⭐ (house-made, most popular)
- Tomato
- Chilli
- Sweet Chilli
- Mayonnaise
- Chipotle
- BBQ

### Salad (for wraps and bowls)
Default ON: Lettuce, Tomato, Onion  
Optional extras: Cheese, Tabouli, Salad Mix

### Add-on Meat
- Extra Chicken: $2 (standard) / $10 (chargrilled)
- Extra Lamb: $2 (standard) / $12 (chargrilled)

### Skewer base choice
- With Rice
- With Salad

---

## 5. Service Rules
- **Pickup only** — no delivery, no delivery fee
- Customers order online, pay at counter or card online
- No table service

---

## 6. Loyalty Stamp System

- Every completed order = 1 stamp
- 5 stamps collected → 6th order = free kebab wrap + can (any flavour)
- Customer must be logged in for stamps to count
- Stamp card shown in customer profile
- Visual: animated stamp card (like a paper loyalty card) with 5 slots + free reward slot

---

## 7. Customer Accounts

### Registration fields
- First name, last name
- Email address
- Mobile number (Australian +61 format)
- Password

### Stored in Firestore `customers` collection
```
{
  uid: string,          // Firebase Auth UID
  firstName: string,
  lastName: string,
  email: string,
  phone: string,
  stamps: number,       // 0-5, resets to 0 after free order claimed
  totalOrders: number,
  freeOrderEligible: boolean,
  createdAt: timestamp,
  notifyEmail: boolean,
  notifySMS: boolean,
  notifyPush: boolean,
  fcmToken: string|null,
}
```

### Orders linked to customer
Each order stores `customerId` field. When order status → `delivered`, increment `stamps`.

---

## 8. Promo / Notification Signup

At checkout (and as a floating banner on the menu page), customers can opt in to:
- Email promotions
- SMS deals
- Push notifications

Stored in Firestore `subscribers` collection (for non-account guests).
Account holders use their customer document's notify flags.

Admin can send a blast from admin panel → hits Node.js `/api/notify/blast` endpoint → sends email via Nodemailer + SMS via Twilio + push via FCM.

---

## 9. Frontend — Page Structure

### `/` — Menu Page (Uber Eats style)
- Sticky Navbar: Logo, Sign In / My Account, cart count badge
- Hero banner: full-width, category food photo, TJ's logo, tagline, "Order Now" CTA
- Sticky Category Nav: pill buttons for each category (Wraps, Bowls, HSP, Skewers, Chips, Snacks, Dips, Drinks). Highlights on scroll.
- Menu sections: one per category, with category header (name + stock photo banner) then item list rows
- Item row: name (bold), description (muted), price (amber), ADD button. On ADD: opens customisation modal.
- Floating promo signup banner: dismissible, "Sign up for deals →"
- Sticky CartBar at bottom: item count + total + "View Order" button

### `/cart` — Cart Page
- Header: back arrow, "Your Order", item count
- PICKUP ONLY notice (no delivery toggle)
- Cart items list: name, customisations summary, price, qty +/−
- "Add a drink?" upsell row
- Promo code input
- Order summary: subtotal, total
- "Proceed to Checkout" CTA

### `/checkout` — Checkout Page
- Customer details: first name, last name, phone, email
- If logged in: pre-filled
- If not logged in: option to save details / create account
- Pickup time: ASAP or scheduled time
- Promo signup widget (email, SMS, push opt-in checkboxes)
- Payment: Card (Stripe) / Cash at counter
- Order summary sidebar
- "Place Order" CTA

### `/order-confirmation` — Order Confirmation
- Order received animation
- Order number + estimated ready time
- Order items summary
- Loyalty stamp progress (if logged in): visual card showing stamps earned
- "Track your order" status bar: Received → Preparing → Ready for Pickup
- "Order Again" button

### `/account` — Customer Account
- Loyalty stamp card (visual, animated)
- Order history
- Update details
- Notification preferences

### `/login` and `/signup` — Auth Pages
- Clean, minimal. Firebase Auth.

---

## 10. Backend — Node.js / Express (`/server`)

### Structure
```
server/
  index.js          — Express app entry
  routes/
    notify.js       — email / SMS / push endpoints
    subscribe.js    — subscriber management
    health.js       — health check
  services/
    email.js        — Nodemailer (Gmail SMTP or SendGrid)
    sms.js          — Twilio
    push.js         — Firebase Admin SDK push
  middleware/
    auth.js         — verify Firebase ID token
```

### Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Health check |
| POST | /api/subscribe | Save subscriber (email/phone/push token) |
| POST | /api/notify/order-confirm | Send order confirmation email + SMS |
| POST | /api/notify/blast | Send promo blast to all subscribers (admin only) |
| POST | /api/notify/loyalty | Notify customer of free order eligibility |

### Auth
All admin-only endpoints verify a Firebase ID token in `Authorization: Bearer <token>` header. Customer endpoints verify customer token or are open (subscribe).

---

## 11. Admin Panel (existing, enhanced)

New capabilities added to existing AdminDashboard:

### Menu Management
- Inline price editing per item — saves to Firestore on blur → reflects live in menu instantly
- Toggle item availability (existing)
- Add / edit / delete items (existing, enhanced with itemType selector)

### Orders
- Live order feed (existing)
- Status updates with auto-notifications (existing, enhanced to call Node backend)

### Promotions
- Create/activate/deactivate promo codes
- Promo blast: send email + SMS to all subscribers via Node backend

### Subscribers
- New tab: list all subscribers (email, phone, channels opted in, date)
- Send blast button

### Staff Management
- Clock in / clock out (existing StaffPortal enhanced)
- View total hours worked per staff per day
- Export CSV of hours

### QR Code
- Existing, generates QR linking to website
- Add: printable menu card generator (PDF/image)

---

## 12. Staff Portal (`/staff`)

- Staff login with PIN or email/password
- Clock In / Clock Out buttons
- Shows current session duration
- Admin can view all staff sessions with timestamps and total hours

---

## 13. QR Code + Printable Menu Card

- QR code: existing, links to `https://tjs-kebab-centre.netlify.app`
- Printable menu card: A4 landscape HTML page (`/menu-card`) styled to match physical board — dark background, amber headings, full menu listed. Print via browser → PDF.

---

## 14. Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Tailwind CSS, Framer Motion |
| Routing | React Router v6 |
| Database | Firebase Firestore |
| Auth | Firebase Auth |
| Backend | Node.js + Express |
| Email | Nodemailer + Gmail SMTP |
| SMS | Twilio |
| Push | Firebase Cloud Messaging |
| Payment | Cash at counter (Stripe integration deferred) |
| Hosting | Netlify (frontend) + Railway (backend) |
| Stock photos | Unsplash free embed URLs |

---

## 15. Phased Build Order

1. **Frontend redesign** — Navbar, Hero, CategoryNav, MenuGrid (Uber Eats style), ItemModal (full customisation), CartBar
2. **Cart + Checkout pages** — Pickup only, promo signup widget
3. **Order Confirmation** — stamps animation, status tracker
4. **Customer Auth** — login/signup pages, account page, loyalty stamps
5. **Node.js backend** — email + SMS + push endpoints
6. **Admin enhancements** — inline price editing, subscriber list, promo blast
7. **Staff portal enhancements** — hours tracking
8. **Printable menu card** — `/menu-card` page
9. **Seed updated menu data** — replace existing Firestore data with full menu from spec
