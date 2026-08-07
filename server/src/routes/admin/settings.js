const express = require('express');
const db = require('../../db');
const { requireAuth, canAccessRestaurant } = require('../../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// Consolidated read for the settings screen: brand colors, per-branch copy/threshold,
// and which notification channels are configured at the platform level (booleans only,
// never the secrets themselves). Writes go through /restaurants, /branches, /users.
router.get('/:restaurantId', (req, res) => {
  const restaurantId = Number(req.params.restaurantId);
  if (!canAccessRestaurant(req.user, restaurantId)) return res.status(403).json({ error: 'Forbidden' });

  const restaurant = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(restaurantId);
  if (!restaurant) return res.status(404).json({ error: 'Not found' });

  const branches = db.prepare('SELECT * FROM branches WHERE restaurant_id = ?').all(restaurantId);
  const users = db
    .prepare('SELECT id, email, name, role, restaurant_id, branch_id FROM users WHERE restaurant_id = ?')
    .all(restaurantId);

  res.json({
    restaurant,
    branches,
    users,
    notification_channels_configured: {
      email: process.env.NOTIFY_EMAIL_ENABLED === 'true' && !!process.env.RESEND_API_KEY,
      whatsapp: process.env.NOTIFY_WHATSAPP_ENABLED === 'true' && !!process.env.WHATSAPP_TOKEN,
      webhook: process.env.NOTIFY_WEBHOOK_ENABLED === 'true',
    },
  });
});

module.exports = router;
