# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

TJ's Kebab Centre — a customer-facing ordering site + admin dashboard (Create React App), a small Express notifications API, and an Expo/React Native merchant tablet app, all living in one repo. Orders/menu/auth are backed by Firebase (Firestore + Auth); the Express server only handles email/SMS/push notifications and admin-blast endpoints — it is not the app's primary backend.

Related sibling repos (separate git repos, not part of this one): `tjs-pickup` (customer pickup-kiosk app) and a standalone `tjs-merchant` repo that has diverged slightly from the `merchant/` copy checked into this repo. When editing shared logic (e.g. `firebase.js`, cart/menu data shapes), check whether the same change is needed in those sibling repos.

## Commands

Frontend (root):
- `npm start` — runs `scripts/generate-sw.js` (injects Firebase env vars into `public/firebase-messaging-sw.js`) then starts CRA dev server on :3000
- `npm run build` — same prebuild step, then CRA production build to `build/`
- `npm test` — CRA/Jest test runner (watch mode). Run a single file: `npm test -- src/lib/itemTypes.test.js`; run once without watch: `CI=true npm test`

Backend (`server/`):
- `cd server && npm run dev` — runs with `node --watch` on :4000 (or `$PORT`)
- `cd server && npm start` — plain `node index.js`

Merchant app (`merchant/`):
- `cd merchant && npm start` — Expo dev server (`npm run android` / `npm run ios` / `npm run web` for specific targets)
- Expo version pinned to ~54; before writing merchant code, check `merchant/AGENTS.md` — it flags that Expo APIs have changed and versioned docs must be consulted first

Firebase:
- `firebase deploy --only hosting` deploys `build/` (see `firebase.json`); Firestore rules live in `firestore.rules` and deploy via `firebase deploy --only firestore:rules`

There is no lint script beyond CRA's built-in ESLint (`eslintConfig` in `package.json` extends `react-app`); it runs as part of `npm start`/`npm run build`.

## Architecture

### Routing is manual, not nested under react-router for everything
`src/App.js` inspects `window.location.pathname` directly: paths starting with `/admin` render `AdminApp`, `/staff` renders `StaffPortal`, and everything else renders the customer site inside `BrowserRouter`/`Routes`. This means the admin and staff apps are effectively separate SPAs mounted at the top level — they don't share the customer `AuthProvider`/`CartProvider`, routing, or layout (Navbar, cursor, grain overlay).

### Auth is split by audience
- Customer auth: `src/context/AuthContext.js` + `src/hooks/useAuth.js`, wraps Firebase `onAuthStateChanged`.
- Admin auth: `AdminApp.js` manages its own `onAuthStateChanged` listener independently and gates between `AdminLogin`/`AdminDashboard` on Firebase auth state — any signed-in Firebase user is treated as admin (see `firestore.rules`: most write rules just check `request.auth != null`, they don't check a role/claim).
- Staff auth is separate again, under `src/admin/staff/` (`StaffPortal`, `StaffManagement`), backed by the `staff`/`staffSessions` Firestore collections.

### Menu/order data flow
- `src/data/menu.js` is the canonical source for category metadata (id, name, emoji, photo, display order) — `CATEGORIES` here drives ordering even though item data itself lives in Firestore.
- `src/hooks/useMenu.js` subscribes to the `menuItems` and `drinks` Firestore collections in real time (`onSnapshot`) and merges them into `CATEGORIES`, filtering out `available === false` items. Drinks can live in either the `drinks` collection or as `menuItems` with `categoryId: 'drinks'` — both are merged and de-duped.
- `useOrders()` (same file) subscribes to `orders` ordered by `createdAt desc` — used by the admin dashboard for live order tracking.
- Item pricing/customisation rules (sizes, sauces, extras per item type) live in `src/lib/itemTypes.js` (`ITEM_TYPE_CONFIG`, `calculateItemPrice`) — this is the one place with unit tests (`itemTypes.test.js`).
- `src/context/CartContext.js` persists cart to `localStorage` (`tj_cart`) and merges duplicate "simple" (no customisation) line items by `baseId`; customised items always get their own line.

### Notifications: two independent paths
1. **Web push (FCM)**: `src/hooks/useNotifications.js` requests browser notification permission, gets an FCM token, and saves it onto the order doc (`orders/{id}.fcmToken`). Note the VAPID key is currently a placeholder (`'YOUR_VAPID_KEY'`) — push token retrieval will silently fail until that's set.
2. **Email/SMS**: the frontend calls the Express server (`server/routes/notify.js`) at checkout (`/api/notify/order-confirm`) and on status change (`/api/notify/order-status`), which uses `services/email.js` (Nodemailer) and `services/sms.js` (Twilio). `/api/notify/blast` (admin promo blasts to all subscribers) is gated by `verifyAdmin` middleware, which checks a Firebase ID token via `firebase-admin` — this is the only endpoint with real auth; the order-confirm/status endpoints are unauthenticated by design (called right after checkout, no user session guaranteed yet).

### Firestore security model is intentionally permissive
`firestore.rules` allows public read/write on `menuItems`, `categories`, `drinks`, `addOns`, and `orders` (so the merchant tablet — which has no separate backend — and the customer site can both read/write directly). Only `staff`, `staffSessions`, and order *deletes* require `request.auth != null`; `customers/{userId}` docs require the auth uid to match. Don't tighten these rules without checking merchant/pickup app impact first, and don't assume `request.auth != null` implies "admin" — it just means "any signed-in Firebase user."

### Admin dashboard is a single large tabbed component
`src/admin/AdminDashboard.js` uses a numeric `tab` index (0–8: Overview, Menu, Orders, Promotions, Drinks, Staff, QR Code, Blast, Subscribers) rendered via `tab === n` conditionals in one file rather than routed sub-pages. The animated intro/HUD styling in `AdminApp.js` and the "NOVA" assistant (`src/components/AdminAssistant.js`, Gemini-Flash-backed chat widget keyed off the active tab) are cosmetic layers around this.

### 3D/visual scenes
`src/components/*Scene.js` (LavaScene, UnderwaterScene, CyberGridScene, TileGridScene, EmberScene, DashboardScene, VortexScene) are `@react-three/fiber`/`drei` canvases used as decorative backgrounds on specific pages/admin panels — they're independent, swappable visual layers, not shared state or logic.

## Environment variables

Frontend (`.env`, `REACT_APP_*` prefix required for CRA to expose them client-side): Firebase config (`API_KEY`, `AUTH_DOMAIN`, `PROJECT_ID`, `STORAGE_BUCKET`, `MESSAGING_SENDER_ID`, `APP_ID`), plus `GOOGLE_API_KEY`, `GEMINI_API_KEY` (NOVA assistant), `TTS_ENDPOINT`.

Server (`server/.env`): `PORT`, `FRONTEND_URL` (CORS origin), plus whatever `services/email.js`, `services/sms.js`, and `services/firebaseAdmin.js` need (Nodemailer/Twilio/Firebase Admin credentials — check those files for exact var names before assuming).

`scripts/generate-sw.js` reads the Firebase `REACT_APP_*` vars and stamps them into `public/firebase-messaging-sw.js` from a template — this runs automatically via `prestart`/`prebuild`, so editing `public/firebase-messaging-sw.js` directly will be overwritten; edit `public/firebase-messaging-sw.template.js` instead.

## Planning docs

`docs/superpowers/plans/` and `docs/superpowers/specs/` hold dated implementation plans and specs written via the superpowers skill workflow (e.g. auth/loyalty, admin staff, menu redesign) — check these for prior design decisions before re-planning a feature that may already have a written spec.
