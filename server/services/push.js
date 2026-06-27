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
