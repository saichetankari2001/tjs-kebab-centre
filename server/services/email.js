const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
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

  return `<!DOCTYPE html>
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
  const results = await Promise.allSettled(emails.map((email) => sendEmail({ to: email, subject, html })));
  return {
    sent:   results.filter((r) => r.status === 'fulfilled').length,
    failed: results.filter((r) => r.status === 'rejected').length,
  };
}

module.exports = { sendEmail, sendOrderConfirmation, sendPromoBlast };
