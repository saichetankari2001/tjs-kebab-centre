// One-off CLI to grant/revoke the `admin` custom claim used by firestore.rules'
// isAdmin() and the verifyAdmin middleware. Requires FIREBASE_SERVICE_ACCOUNT
// in server/.env (Firebase Console → Project Settings → Service Accounts).
//
// Usage:
//   node scripts/set-admin-claim.js someone@example.com
//   node scripts/set-admin-claim.js someone@example.com --revoke
require('dotenv').config();
const admin = require('../services/firebaseAdmin');

async function main() {
  const [email, flag] = process.argv.slice(2);
  if (!email) {
    console.error('Usage: node scripts/set-admin-claim.js <email> [--revoke]');
    process.exit(1);
  }

  const user = await admin.auth().getUserByEmail(email);
  const grant = flag !== '--revoke';
  await admin.auth().setCustomUserClaims(user.uid, { admin: grant ? true : null });

  console.log(`${grant ? 'Granted' : 'Revoked'} admin claim for ${email} (uid: ${user.uid}).`);
  console.log('They must sign out and back in (or wait for their ID token to refresh) for this to take effect.');
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
