const { Router }                               = require('express');
const { verifyAdmin }                          = require('../middleware/auth');
const { sendOrderConfirmation, sendPromoBlast } = require('../services/email');
const { sendSMS, sendSMSBlast }                = require('../services/sms');
const { sendPushBlast }                        = require('../services/push');
const admin = require('../services/firebaseAdmin');

const router = Router();

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

// Order status change — called from AdminDashboard when status changes
router.post('/order-status', async (req, res) => {
  const { to, phone, firstName, orderId, status } = req.body;

  if (!orderId || !status) {
    return res.status(400).json({ error: 'orderId and status are required' });
  }

  const STATUS_COPY = {
    confirmed: {
      subject: `Your order is confirmed — #${(orderId || '').slice(-6).toUpperCase()} · TJ's Kebab`,
      headline: 'Order Confirmed! ✅',
      body:     "Great news! We've received your order and it's in the queue.",
      sms:      `Hi ${firstName ?? 'there'}! Your TJ's Kebab order #${(orderId || '').slice(-6).toUpperCase()} is confirmed and in the queue. We'll notify you when it's being prepared!`,
    },
    preparing: {
      subject: `Your order is being prepared — #${(orderId || '').slice(-6).toUpperCase()} · TJ's Kebab`,
      headline: 'Being Prepared 👨‍🍳',
      body:     "Our chefs are working on your food right now. It won't be long!",
      sms:      `Hi ${firstName ?? 'there'}! Your TJ's Kebab order #${(orderId || '').slice(-6).toUpperCase()} is now being prepared. Almost there!`,
    },
    ready: {
      subject: `Your order is READY for pickup — #${(orderId || '').slice(-6).toUpperCase()} · TJ's Kebab`,
      headline: "Ready for Pickup! 🥙",
      body:     'Your order is hot and ready! Come grab it at the counter.',
      sms:      `Hi ${firstName ?? 'there'}! Your TJ's Kebab order #${(orderId || '').slice(-6).toUpperCase()} is READY for pickup! Come grab it now 🥙`,
    },
  };

  const copy = STATUS_COPY[status];
  if (!copy) return res.json({ message: 'No notification for this status', status });

  const results = {};

  if (to) {
    try {
      const { sendEmail } = require('../services/email');
      results.email = await sendEmail({
        to,
        subject: copy.subject,
        html: `<!DOCTYPE html><html><body style="background:#0e0b07;font-family:Inter,Arial,sans-serif;margin:0;padding:20px">
  <div style="max-width:480px;margin:0 auto;background:#1b1509;border-radius:16px;overflow:hidden">
    <div style="background:#f59e0b;padding:20px 24px;text-align:center">
      <h1 style="color:#0e0b07;margin:0;font-size:26px;font-weight:900;letter-spacing:2px">TJ'S KEBAB CENTRE</h1>
    </div>
    <div style="padding:28px 24px">
      <h2 style="color:#f5f5f5;margin:0 0 10px;font-size:22px">${copy.headline}</h2>
      <p style="color:#9c8a72;font-size:15px;margin:0 0 20px">Hi ${firstName ?? 'there'}! ${copy.body}</p>
      <div style="background:#251e0e;border:1px solid #332810;border-radius:10px;padding:14px;text-align:center">
        <p style="color:#9c8a72;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px">Order</p>
        <p style="color:#f59e0b;font-size:22px;font-weight:900;font-family:monospace;margin:0">#${(orderId || '').slice(-6).toUpperCase()}</p>
      </div>
    </div>
    <div style="padding:16px 24px 24px;text-align:center">
      <p style="color:#4a4030;font-size:11px;margin:0">TJ's Kebab Centre · Real Flavour, Real Good</p>
    </div>
  </div>
</body></html>`,
      });
    } catch (err) {
      results.email = { error: err.message };
    }
  }

  if (phone) {
    try {
      const { sendSMS } = require('../services/sms');
      results.sms = await sendSMS({ to: phone, body: copy.sms });
    } catch (err) {
      results.sms = { error: err.message };
    }
  }

  res.json({ message: 'Status notification sent', status, results });
});

// Promo blast — admin only
router.post('/blast', verifyAdmin, async (req, res) => {
  const { subject, message, channels = ['email'] } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }

  const db = admin.firestore();
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
