const { Router } = require('express');
const admin = require('../services/firebaseAdmin');

const router = Router();

router.post('/', async (req, res) => {
  const { email, phone, pushToken, channels = [] } = req.body;

  if (!email && !phone && !pushToken) {
    return res.status(400).json({ error: 'At least one contact method required' });
  }

  try {
    const db = admin.firestore();
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
    res.status(503).json({ error: err.message });
  }
});

module.exports = router;
