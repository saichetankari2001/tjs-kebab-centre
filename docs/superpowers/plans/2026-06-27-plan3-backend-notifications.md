# TJ's Kebab Centre — Plan 3: Node.js Backend + Notifications

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up a Node.js/Express backend server that handles email (order confirmations + promo blasts via Nodemailer), SMS (Twilio), and push notifications (Firebase Admin SDK). Wired to the frontend's promo signup form and admin's "send blast" button.

**Architecture:** `server/` folder at repo root. Express app with routes for `/health`, `/api/subscribe`, `/api/notify/order-confirm`, `/api/notify/blast`. Nodemailer with Gmail SMTP for email. Twilio for SMS. Firebase Admin SDK for push. Firebase ID token verification on admin-only routes. Deployed to Railway (free tier).

**Tech Stack:** Node.js 20, Express 5, Nodemailer, Twilio SDK, Firebase Admin SDK, dotenv, cors

## Global Constraints
- All env vars in `server/.env` (never committed — add to .gitignore)
- Admin endpoints require `Authorization: Bearer <firebaseIdToken>` header
- Email sender: Gmail SMTP with App Password (2FA required on Gmail account)
- SMS: Twilio trial or paid account
- Push: Firebase Admin SDK (uses service account JSON)
- Frontend fetch calls go to `REACT_APP_API_URL` env var (defaults to `http://localhost:4000`)

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Create | `server/package.json` | Node dependencies |
| Create | `server/.env.example` | env var template |
| Create | `server/index.js` | Express app entry |
| Create | `server/middleware/auth.js` | Firebase ID token verification |
| Create | `server/services/email.js` | Nodemailer send functions |
| Create | `server/services/sms.js` | Twilio send function |
| Create | `server/services/push.js` | Firebase Admin push function |
| Create | `server/routes/health.js` | GET /health |
| Create | `server/routes/subscribe.js` | POST /api/subscribe |
| Create | `server/routes/notify.js` | POST /api/notify/* |
| Modify | `.gitignore` | add server/.env, server/node_modules |
| Modify | `src/components/PromoSignupBanner.js` | use REACT_APP_API_URL |
| Modify | `src/pages/CheckoutPage.js` | call /api/notify/order-confirm after order |
| Modify | `src/admin/AdminDashboard.js` | add "Send Blast" button calling /api/notify/blast |

---

### Task 1: Server scaffold — package.json, .env, index.js

**Files:**
- Create: `server/package.json`
- Create: `server/.env.example`
- Create: `server/index.js`
- Modify: `.gitignore`

- [ ] **Step 1: Create server/package.json**
```json
{
  "name": "tjs-kebab-server",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev":   "node --watch index.js"
  },
  "dependencies": {
    "cors":                 "^2.8.5",
    "dotenv":               "^16.4.5",
    "express":              "^5.0.1",
    "firebase-admin":       "^12.0.0",
    "nodemailer":           "^6.9.13",
    "twilio":               "^5.0.4"
  }
}
```

- [ ] **Step 2: Install server dependencies**
```bash
cd server && npm install && cd ..
```
Expected: `node_modules` created in `server/`.

- [ ] **Step 3: Create server/.env.example**
```
# Copy this to server/.env and fill in your values

# Server
PORT=4000

# Gmail SMTP (create an App Password at https://myaccount.google.com/apppasswords)
GMAIL_USER=your@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx

# Twilio (https://console.twilio.com)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Firebase Admin SDK
# Download service account JSON from Firebase Console → Project Settings → Service Accounts
# Set FIREBASE_SERVICE_ACCOUNT to the stringified JSON or path to file
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

- [ ] **Step 4: Add server/.env to .gitignore**

Open `.gitignore`. Add:
```
server/.env
server/node_modules/
```

- [ ] **Step 5: Create server/index.js**
```js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const healthRouter    = require('./routes/health');
const subscribeRouter = require('./routes/subscribe');
const notifyRouter    = require('./routes/notify');

const app  = express();
const PORT = process.env.PORT ?? 4000;

app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:3000' }));
app.use(express.json());

app.use('/health',        healthRouter);
app.use('/api/subscribe', subscribeRouter);
app.use('/api/notify',    notifyRouter);

app.listen(PORT, () => console.log(`TJ's backend running on port ${PORT}`));
```

- [ ] **Step 6: Verify server starts**
```bash
cd server && node index.js
```
Expected output: `TJ's backend running on port 4000`

- [ ] **Step 7: Commit**
```bash
git add server/package.json server/.env.example server/index.js .gitignore server/package-lock.json
git commit -m "feat: scaffold Node.js/Express backend server"
```

---

### Task 2: Firebase Admin SDK middleware

**Files:**
- Create: `server/middleware/auth.js`

**Interfaces:**
- Exports: `verifyAdmin` middleware — reads `Authorization: Bearer <token>` header, verifies with Firebase Admin, attaches `req.uid` and `req.isAdmin` (always true if token verifies — admin users are any authenticated Firebase users who have admin role, checked via Firestore `admins` collection or simply any Firebase Auth user for now)
- On invalid token: responds `401 { error: 'Unauthorized' }`

- [ ] **Step 1: Create server/middleware/auth.js**
```js
const admin = require('../services/firebaseAdmin');

async function verifyAdmin(req, res, next) {
  const header = req.headers.authorization ?? '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.uid = decoded.uid;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { verifyAdmin };
```

- [ ] **Step 2: Create server/services/firebaseAdmin.js**
```js
const admin = require('firebase-admin');

if (!admin.apps.length) {
  const serviceAccount = typeof process.env.FIREBASE_SERVICE_ACCOUNT === 'string'
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : require(process.env.FIREBASE_SERVICE_ACCOUNT);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin;
```

- [ ] **Step 3: Commit**
```bash
git add server/middleware/auth.js server/services/firebaseAdmin.js
git commit -m "feat: add Firebase Admin SDK init + verifyAdmin middleware"
```

---

### Task 3: Health route

**Files:**
- Create: `server/routes/health.js`

- [ ] **Step 1: Create server/routes/health.js**
```js
const { Router } = require('express');
const router = Router();

router.get('/', (_req, res) => {
  res.json({ status: 'ok', service: "TJ's Kebab Backend", ts: new Date().toISOString() });
});

module.exports = router;
```

- [ ] **Step 2: Verify**
```bash
curl http://localhost:4000/health
```
Expected: `{"status":"ok","service":"TJ's Kebab Backend","ts":"..."}`

- [ ] **Step 3: Commit**
```bash
git add server/routes/health.js
git commit -m "feat: add /health route"
```

---

### Task 4: Email service (Nodemailer)

**Files:**
- Create: `server/services/email.js`

**Interfaces:**
- Exports: `sendEmail({ to, subject, html })` → Promise
- Exports: `sendOrderConfirmation({ to, firstName, orderId, items, total })` → Promise
- Exports: `sendPromoBlast({ emails, subject, html })` → Promise (sends to array)

- [ ] **Step 1: Create server/services/email.js**
```js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

async function sendEmail({ to, subject, html }) {
  return transporter.sendMail({
    from: `"TJ's Kebab Centre" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

function orderConfirmHtml({ firstName, orderId, items, total }) {
  const itemRows = items
    .map((i) => `<tr><td style="padding:6px 0;color:#f5f5f5">${i.name}${i.qty > 1 ? ` ×${i.qty}` : ''}</td><td style="padding:6px 0;color:#f59e0b;text-align:right">$${(i.price * i.qty).toFixed(2)}</td></tr>`)
    .join('');

  return `
<!DOCTYPE html>
<html>
<body style="background:#0f0f0f;font-family:Inter,Arial,sans-serif;margin:0;padding:20px">
  <div style="max-width:480px;margin:0 auto;background:#1a1a1a;border-radius:16px;overflow:hidden">
    <div style="background:#f59e0b;padding:24px;text-align:center">
      <h1 style="color:#0f0f0f;margin:0;font-size:28px;font-weight:900;letter-spacing:2px">TJ'S KEBAB</h1>
      <p style="color:#0f0f0f;margin:4px 0 0;font-size:12px;font-weight:600">REAL FLAVOUR · REAL GOOD</p>
    </div>
    <div style="padding:28px 24px">
      <h2 style="color:#f5f5f5;margin:0 0 8px;font-size:22px">Order Confirmed! 🥙</h2>
      <p style="color:#9ca3af;margin:0 0 20px;font-size:14px">Thanks ${firstName}! We're getting your order ready.</p>
      <div style="background:#111;border-radius:10px;padding:16px;margin-bottom:16px">
        <p style="color:#9ca3af;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 12px">Order #${orderId.slice(-6).toUpperCase()}</p>
        <table style="width:100%;border-collapse:collapse">${itemRows}</table>
        <hr style="border:none;border-top:1px solid #2a2a2a;margin:12px 0"/>
        <div style="display:flex;justify-content:space-between;font-weight:900;font-size:16px">
          <span style="color:#f5f5f5">Total</span>
          <span style="color:#f59e0b">$${total.toFixed(2)}</span>
        </div>
      </div>
      <div style="background:#0f3d1e;border:1px solid #166534;border-radius:10px;padding:14px;text-align:center">
        <p style="color:#4ade80;margin:0;font-size:14px;font-weight:600">🏃 Pickup order — we'll let you know when it's ready!</p>
      </div>
    </div>
    <div style="padding:16px 24px 24px;text-align:center">
      <p style="color:#4a5568;font-size:11px;margin:0">TJ's Kebab Centre · Real Flavour, Real Good</p>
    </div>
  </div>
</body>
</html>`;
}

async function sendOrderConfirmation({ to, firstName, orderId, items, total }) {
  return sendEmail({
    to,
    subject: `Order Confirmed — #${orderId.slice(-6).toUpperCase()} · TJ's Kebab Centre`,
    html: orderConfirmHtml({ firstName, orderId, items, total }),
  });
}

async function sendPromoBlast({ emails, subject, html }) {
  const promises = emails.map((email) => sendEmail({ to: email, subject, html }));
  const results  = await Promise.allSettled(promises);
  const sent     = results.filter((r) => r.status === 'fulfilled').length;
  const failed   = results.filter((r) => r.status === 'rejected').length;
  return { sent, failed };
}

module.exports = { sendEmail, sendOrderConfirmation, sendPromoBlast };
```

- [ ] **Step 2: Commit**
```bash
git add server/services/email.js
git commit -m "feat: add Nodemailer email service — order confirmation + promo blast"
```

---

### Task 5: SMS service (Twilio)

**Files:**
- Create: `server/services/sms.js`

**Interfaces:**
- Exports: `sendSMS({ to, body })` → Promise
- Exports: `sendSMSBlast({ phones, body })` → Promise

- [ ] **Step 1: Create server/services/sms.js**
```js
const twilio = require('twilio');

// Twilio client is created lazily so missing env vars don't crash startup
let _client = null;
function getClient() {
  if (!_client) {
    _client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return _client;
}

async function sendSMS({ to, body }) {
  return getClient().messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
  });
}

async function sendSMSBlast({ phones, body }) {
  const results = await Promise.allSettled(phones.map((to) => sendSMS({ to, body })));
  return {
    sent:   results.filter((r) => r.status === 'fulfilled').length,
    failed: results.filter((r) => r.status === 'rejected').length,
  };
}

module.exports = { sendSMS, sendSMSBlast };
```

- [ ] **Step 2: Commit**
```bash
git add server/services/sms.js
git commit -m "feat: add Twilio SMS service — direct send + blast"
```

---

### Task 6: Push notification service

**Files:**
- Create: `server/services/push.js`

**Interfaces:**
- Exports: `sendPush({ token, title, body, data })` → Promise
- Exports: `sendPushBlast({ tokens, title, body })` → Promise

- [ ] **Step 1: Create server/services/push.js**
```js
const admin = require('./firebaseAdmin');

async function sendPush({ token, title, body, data = {} }) {
  return admin.messaging().send({
    token,
    notification: { title, body },
    data,
    android: { priority: 'high' },
    apns:    { payload: { aps: { sound: 'default' } } },
  });
}

async function sendPushBlast({ tokens, title, body }) {
  if (!tokens.length) return { sent: 0, failed: 0 };
  const results = await Promise.allSettled(tokens.map((token) => sendPush({ token, title, body })));
  return {
    sent:   results.filter((r) => r.status === 'fulfilled').length,
    failed: results.filter((r) => r.status === 'rejected').length,
  };
}

module.exports = { sendPush, sendPushBlast };
```

- [ ] **Step 2: Commit**
```bash
git add server/services/push.js
git commit -m "feat: add Firebase push notification service"
```

---

### Task 7: Subscribe route (save promo subscribers)

**Files:**
- Create: `server/routes/subscribe.js`

**Interfaces:**
- `POST /api/subscribe` body: `{ email?, phone?, pushToken?, channels: ['email'|'sms'|'push'] }`
- Saves to Firestore `subscribers` collection
- Returns `201 { message: 'Subscribed' }`

- [ ] **Step 1: Create server/routes/subscribe.js**
```js
const { Router } = require('express');
const admin  = require('../services/firebaseAdmin');

const router = Router();
const db     = admin.firestore();

router.post('/', async (req, res) => {
  const { email, phone, pushToken, channels = [] } = req.body;

  if (!email && !phone && !pushToken) {
    return res.status(400).json({ error: 'At least one contact method required' });
  }

  try {
    await db.collection('subscribers').add({
      email:     email     ?? null,
      phone:     phone     ?? null,
      pushToken: pushToken ?? null,
      channels,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(201).json({ message: 'Subscribed successfully' });
  } catch (err) {
    console.error('Subscribe error:', err);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

module.exports = router;
```

- [ ] **Step 2: Test subscribe endpoint**
```bash
curl -X POST http://localhost:4000/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","channels":["email"]}'
```
Expected: `{"message":"Subscribed successfully"}`

- [ ] **Step 3: Commit**
```bash
git add server/routes/subscribe.js
git commit -m "feat: add /api/subscribe route — saves to Firestore subscribers collection"
```

---

### Task 8: Notify routes (order-confirm + blast)

**Files:**
- Create: `server/routes/notify.js`

**Interfaces:**
- `POST /api/notify/order-confirm` (no auth required) body: `{ to, firstName, orderId, items, total, phone? }`
  - Sends order confirmation email + optional SMS
- `POST /api/notify/blast` (admin auth required) body: `{ subject, message, channels: ['email'|'sms'|'push'] }`
  - Reads all subscribers from Firestore, sends to opted-in contacts

- [ ] **Step 1: Create server/routes/notify.js**
```js
const { Router }         = require('express');
const { verifyAdmin }    = require('../middleware/auth');
const { sendOrderConfirmation, sendPromoBlast } = require('../services/email');
const { sendSMS, sendSMSBlast }  = require('../services/sms');
const { sendPushBlast }          = require('../services/push');
const admin = require('../services/firebaseAdmin');

const router = Router();
const db     = admin.firestore();

// ── Order confirmation (called from frontend after successful order) ──
router.post('/order-confirm', async (req, res) => {
  const { to, firstName, orderId, items, total, phone } = req.body;

  if (!to || !orderId) {
    return res.status(400).json({ error: 'Missing required fields: to, orderId' });
  }

  const results = { email: null, sms: null };

  try {
    results.email = await sendOrderConfirmation({ to, firstName: firstName ?? 'there', orderId, items: items ?? [], total: total ?? 0 });
  } catch (err) {
    console.error('Order confirm email failed:', err.message);
    results.email = { error: err.message };
  }

  if (phone) {
    try {
      results.sms = await sendSMS({
        to: phone,
        body: `Hi ${firstName ?? 'there'}! Your TJ's Kebab order #${orderId.slice(-6).toUpperCase()} is confirmed. We'll notify you when it's ready for pickup!`,
      });
    } catch (err) {
      console.error('Order confirm SMS failed:', err.message);
      results.sms = { error: err.message };
    }
  }

  res.json({ message: 'Notifications sent', results });
});

// ── Promo blast (admin only) ──
router.post('/blast', verifyAdmin, async (req, res) => {
  const { subject, message, channels = ['email'] } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }

  const snap = await db.collection('subscribers').get();
  const subscribers = snap.docs.map((d) => d.data());

  const results = {};

  if (channels.includes('email')) {
    const emails = subscribers.filter((s) => s.channels?.includes('email') && s.email).map((s) => s.email);
    results.email = await sendPromoBlast({
      emails,
      subject: subject ?? "TJ's Kebab — Special Offer!",
      html: `<div style="font-family:Arial;background:#0f0f0f;color:#f5f5f5;padding:24px;border-radius:12px"><h2 style="color:#f59e0b">TJ's Kebab Centre</h2><p style="font-size:16px">${message}</p><hr style="border-color:#2a2a2a"/><p style="color:#9ca3af;font-size:12px">You're receiving this because you signed up for TJ's deals.</p></div>`,
    });
  }

  if (channels.includes('sms')) {
    const phones = subscribers.filter((s) => s.channels?.includes('sms') && s.phone).map((s) => s.phone);
    results.sms = await sendSMSBlast({ phones, body: `TJ's Kebab Centre: ${message}` });
  }

  if (channels.includes('push')) {
    const tokens = subscribers.filter((s) => s.channels?.includes('push') && s.pushToken).map((s) => s.pushToken);
    results.push = await sendPushBlast({ tokens, title: "TJ's Kebab 🥙", body: message });
  }

  res.json({ message: 'Blast sent', results });
});

module.exports = router;
```

- [ ] **Step 2: Test order-confirm endpoint**
```bash
curl -X POST http://localhost:4000/api/notify/order-confirm \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","firstName":"John","orderId":"testorder123","items":[{"name":"Chicken Kebab","price":16,"qty":1}],"total":16}'
```
Expected: email delivered to test@example.com (check inbox/spam).

- [ ] **Step 3: Commit**
```bash
git add server/routes/notify.js
git commit -m "feat: add /api/notify/order-confirm and /api/notify/blast routes"
```

---

### Task 9: Wire frontend to backend

**Files:**
- Modify: `src/pages/CheckoutPage.js`
- Modify: `src/components/PromoSignupBanner.js`
- Create: `.env` (or document for user to create)

**Interfaces:**
- CheckoutPage: after successful order addDoc, POST to `/api/notify/order-confirm`
- PromoSignupBanner: already has POST to `/api/subscribe` — confirm URL uses env var

- [ ] **Step 1: Add REACT_APP_API_URL to .env**

Create `.env` in project root (add to .gitignore if not already):
```
REACT_APP_API_URL=http://localhost:4000
```

Add to .gitignore:
```
.env
.env.local
```

- [ ] **Step 2: Update CheckoutPage to call order-confirm after order**

In `src/pages/CheckoutPage.js`, inside `handleSubmit`, after `clearCart()`:
```js
// Fire-and-forget — don't block navigation on notification failure
fetch(`${process.env.REACT_APP_API_URL ?? 'http://localhost:4000'}/api/notify/order-confirm`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to:        form.email.trim(),
    firstName: form.firstName.trim(),
    orderId:   orderRef.id,
    items:     cart.map((i) => ({ name: i.displayName ?? i.name, price: i.price, qty: i.qty })),
    total,
    phone: form.phone.trim() || null,
  }),
}).catch(() => {}); // never block the UX on notification failure
```

- [ ] **Step 3: Update PromoSignupBanner to use env var**

In `src/components/PromoSignupBanner.js`, update the fetch URL:
```js
await fetch(`${process.env.REACT_APP_API_URL ?? 'http://localhost:4000'}/api/subscribe`, {
  // ...
});
```

- [ ] **Step 4: Verify end-to-end**

1. Start backend: `cd server && node index.js`
2. Start frontend: `npm start` (separate terminal)
3. Fill out checkout form with a real email
4. Submit order — check email inbox within 30 seconds
5. Check Firestore `orders` collection — order exists

- [ ] **Step 5: Commit**
```bash
git add src/pages/CheckoutPage.js src/components/PromoSignupBanner.js .gitignore
git commit -m "feat: wire frontend to backend — order confirm email on checkout, subscribe banner"
```

---

### Task 10: Admin promo blast UI

**Files:**
- Modify: `src/admin/AdminDashboard.js`

**Interfaces:**
- New "📢 Blast" tab in admin
- Shows subscriber count
- Form: subject + message + channel checkboxes + Send button
- Calls `POST /api/notify/blast` with admin Firebase ID token

- [ ] **Step 1: Add Blast tab to AdminDashboard**

In `src/admin/AdminDashboard.js`, update `TABS` array:
```js
const TABS = ['📊 Dashboard', '🍽️ Menu', '📦 Orders', '🎉 Promotions', '🥤 Drinks', '👥 Staff', '📱 QR Code', '📢 Blast'];
```

Add state for blast:
```js
const [blastSubject,  setBlastSubject]  = useState('');
const [blastMessage,  setBlastMessage]  = useState('');
const [blastChannels, setBlastChannels] = useState(['email']);
const [blastSending,  setBlastSending]  = useState(false);
const [blastResult,   setBlastResult]   = useState(null);
const [subscribers,   setSubscribers]   = useState([]);
```

Add subscriber listener in useEffect:
```js
onSnapshot(collection(db, 'subscribers'), snap => setSubscribers(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
```

Add Blast tab render (inside the tab content section, new `tab === 7` case):
```jsx
{tab === 7 && (
  <div style={{ padding: '20px', maxWidth: 600 }}>
    <h3 style={{ color: '#f59e0b', marginBottom: 16 }}>📢 Send Promotional Blast</h3>
    <p style={{ color: '#9ca3af', fontSize: 13, marginBottom: 20 }}>
      {subscribers.length} subscriber{subscribers.length !== 1 ? 's' : ''} total.
      Email: {subscribers.filter(s => s.channels?.includes('email')).length} ·
      SMS: {subscribers.filter(s => s.channels?.includes('sms')).length} ·
      Push: {subscribers.filter(s => s.channels?.includes('push')).length}
    </p>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input
        value={blastSubject}
        onChange={e => setBlastSubject(e.target.value)}
        placeholder="Email subject line"
        style={{ background: '#222', border: '1px solid #333', color: '#fff', padding: '10px 14px', borderRadius: 8, fontSize: 14 }}
      />
      <textarea
        value={blastMessage}
        onChange={e => setBlastMessage(e.target.value)}
        placeholder="Your promo message (used for email body, SMS text, and push notification)"
        rows={5}
        style={{ background: '#222', border: '1px solid #333', color: '#fff', padding: '10px 14px', borderRadius: 8, fontSize: 14, resize: 'vertical' }}
      />

      <div style={{ display: 'flex', gap: 12 }}>
        {['email', 'sms', 'push'].map(ch => (
          <label key={ch} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: blastChannels.includes(ch) ? '#f59e0b' : '#9ca3af', fontSize: 13, fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={blastChannels.includes(ch)}
              onChange={e => setBlastChannels(p => e.target.checked ? [...p, ch] : p.filter(c => c !== ch))}
              style={{ accentColor: '#f59e0b' }}
            />
            {ch.toUpperCase()}
          </label>
        ))}
      </div>

      {blastResult && (
        <div style={{ background: '#0f3d1e', border: '1px solid #166534', borderRadius: 8, padding: '10px 14px', color: '#4ade80', fontSize: 13 }}>
          ✓ Blast sent! {JSON.stringify(blastResult)}
        </div>
      )}

      <button
        onClick={async () => {
          if (!blastMessage.trim()) return;
          if (!window.confirm(`Send blast to ${subscribers.length} subscribers?`)) return;
          setBlastSending(true);
          setBlastResult(null);
          try {
            const token = await auth.currentUser.getIdToken();
            const res = await fetch(`${process.env.REACT_APP_API_URL ?? 'http://localhost:4000'}/api/notify/blast`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ subject: blastSubject || "TJ's Kebab Special Offer!", message: blastMessage, channels: blastChannels }),
            });
            const data = await res.json();
            setBlastResult(data.results);
          } catch (err) {
            alert('Blast failed: ' + err.message);
          } finally {
            setBlastSending(false);
          }
        }}
        disabled={blastSending || !blastMessage.trim()}
        style={{ background: blastSending ? '#555' : '#f59e0b', color: '#000', border: 'none', padding: '12px 24px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: blastSending ? 'not-allowed' : 'pointer' }}
      >
        {blastSending ? 'Sending...' : `📢 Send Blast (${subscribers.length} subscribers)`}
      </button>
    </div>
  </div>
)}
```

- [ ] **Step 2: Verify**

Log in to admin. Click "📢 Blast" tab. Subscriber count shown. Type a message, click Send. Check email inbox.

- [ ] **Step 3: Final commit**
```bash
git add src/admin/AdminDashboard.js
git commit -m "feat: add promo blast UI to admin — sends email/SMS/push to all subscribers"
git commit -m "feat: Plan 3 complete — Node.js backend, email/SMS/push, subscriber blast"
```

---

## Plan 3 Complete

After all tasks:
- Node.js/Express server in `server/` folder
- Order confirmation email sent on every checkout
- Optional SMS confirmation if customer provides phone
- Promo subscriber list in Firestore
- Admin "Blast" tab sends email/SMS/push to all subscribers
- All secrets in `server/.env` (never committed)

**Deployment:** On Railway: create new project → Deploy from GitHub → set root to `server/` → add all env vars from `.env.example`.

**Next:** Plan 4 (Admin enhancements — inline price editing, subscriber management) or Plan 5 (Printable menu card)
