const express = require('express');
const router = express.Router();

// GET /api/test/ping
router.get('/ping', (req, res) => {
  res.status(200).json({ message: 'pong 🏓 — working fine!' });
});

module.exports = router;
