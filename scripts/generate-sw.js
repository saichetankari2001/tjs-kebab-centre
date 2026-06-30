// Load .env for local dev (Netlify injects env vars directly into process.env)
try { require('dotenv').config({ path: '.env' }); } catch (_) {}
try { require('dotenv').config({ path: '.env.local' }); } catch (_) {}

const fs = require('fs');
const path = require('path');

const template = fs.readFileSync(
  path.join(__dirname, '../public/firebase-messaging-sw.template.js'),
  'utf8'
);

const vars = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_STORAGE_BUCKET',
  'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
  'REACT_APP_FIREBASE_APP_ID',
];

let result = template;
for (const key of vars) {
  result = result.replaceAll(`%${key}%`, process.env[key] || '');
}

fs.writeFileSync(
  path.join(__dirname, '../public/firebase-messaging-sw.js'),
  result
);
console.log('firebase-messaging-sw.js generated');
