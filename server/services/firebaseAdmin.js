const admin = require('firebase-admin');

let _initialised = false;
let _failed = false;

function ensureInit() {
  if (_initialised || _failed) return;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    console.warn('[firebaseAdmin] FIREBASE_SERVICE_ACCOUNT not set — Firestore/Auth features disabled');
    _failed = true;
    return;
  }
  try {
    if (!admin.apps.length) {
      const serviceAccount = typeof raw === 'string' ? JSON.parse(raw) : raw;
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    }
    _initialised = true;
  } catch (err) {
    console.error('[firebaseAdmin] Init failed:', err.message);
    _failed = true;
  }
}

// Lazy proxy — init happens on first property access (e.g. admin.firestore())
module.exports = new Proxy({}, {
  get(_, prop) {
    ensureInit();
    if (_failed && prop !== 'apps') {
      throw new Error(`Firebase Admin not initialised. Cannot call .${String(prop)}() — set FIREBASE_SERVICE_ACCOUNT in server/.env`);
    }
    if (prop === 'apps') return admin.apps;
    const val = admin[prop];
    return typeof val === 'function' ? val.bind(admin) : val;
  },
});
