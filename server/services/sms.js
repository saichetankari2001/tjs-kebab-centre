const twilio = require('twilio');

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
