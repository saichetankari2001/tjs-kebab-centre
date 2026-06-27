const { Router } = require('express');
const router = Router();

router.get('/', (_req, res) => {
  res.json({ status: 'ok', service: "TJ's Kebab Backend", ts: new Date().toISOString() });
});

module.exports = router;
