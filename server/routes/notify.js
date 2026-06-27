const { Router }                               = require('express');
const { verifyAdmin }                          = require('../middleware/auth');
const { sendOrderConfirmation, sendPromoBlast } = require('../services/email');
const { sendSMS, sendSMSBlast }                = require('../services/sms');
const { sendPushBlast }                        = require('../services/push');
const admin = require('../services/firebaseAdmin');

const router = Router();
const db     = admin.firestore();

// Order confirmation — called from frontend after successful checkout
router.post('/order-confirm', async (req, res) => {
  const { to, firstName, orderId, items, total, phone } = req.body;

  if (!to || !orderId) {
    return res.status(400).json({ error: 'Missing required fields: to, orderId' });
  }

  const results = { email: null, sms: null };

  try {
    results.email = await sendOrderConfirmation({
      to,
      firstName: firstName ?? 'there',
      orderId,
      items: items ?? [],
      total: total ?? 0,
    });
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

// Promo blast — admin only
router.post('/blast', verifyAdmin, async (req, res) => {
  const { subject, message, channels = ['email'] } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }

  const snap = await db.collection('subscribers').get();
  const subscribers = snap.docs.map((d) => d.data());

  const results = {};

  if (channels.includes('email')) {
    const emails = subscribers
      .filter((s) => s.channels?.includes('email') && s.email)
      .map((s) => s.email);
    results.email = await sendPromoBlast({
      emails,
      subject: subject ?? "TJ's Kebab — Special Offer!",
      html: `<div style="font-family:Arial;background:#0f0f0f;color:#f5f5f5;padding:24px;border-radius:12px"><h2 style="color:#f59e0b">TJ's Kebab Centre</h2><p style="font-size:16px">${message}</p><hr style="border-color:#2a2a2a"/><p style="color:#9ca3af;font-size:12px">You're receiving this because you signed up for TJ's deals.</p></div>`,
    });
  }

  if (channels.includes('sms')) {
    const phones = subscribers
      .filter((s) => s.channels?.includes('sms') && s.phone)
      .map((s) => s.phone);
    results.sms = await sendSMSBlast({ phones, body: `TJ's Kebab Centre: ${message}` });
  }

  if (channels.includes('push')) {
    const tokens = subscribers
      .filter((s) => s.channels?.includes('push') && s.pushToken)
      .map((s) => s.pushToken);
    results.push = await sendPushBlast({ tokens, title: "TJ's Kebab 🥙", body: message });
  }

  res.json({ message: 'Blast sent', results });
});

module.exports = router;
