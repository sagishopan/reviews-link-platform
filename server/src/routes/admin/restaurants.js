const express = require('express');
const db = require('../../db');
const { requireAuth, requireRole, canAccessRestaurant } = require('../../middleware/auth');
const { cleanText, isValidSlug } = require('../../utils/validate');

const router = express.Router();
router.use(requireAuth);

// branch_manager is scoped to a single branch - their restaurant-level stats
// must reflect only that branch, not the whole chain, or the summary card
// leaks aggregate data (feedback count, avg rating) for branches they can't see.
function withStats(restaurant, user) {
  const branchScoped = user?.role === 'branch_manager';
  const stats = branchScoped
    ? db
        .prepare(`SELECT COUNT(*) as feedback_count, COALESCE(AVG(rating), 0) as avg_rating FROM responses WHERE branch_id = ?`)
        .get(user.branch_id)
    : db
        .prepare(
          `SELECT COUNT(*) as feedback_count, COALESCE(AVG(r.rating), 0) as avg_rating
           FROM responses r JOIN branches b ON b.id = r.branch_id
           WHERE b.restaurant_id = ?`
        )
        .get(restaurant.id);
  const branchCount = branchScoped ? 1 : db.prepare('SELECT COUNT(*) as c FROM branches WHERE restaurant_id = ?').get(restaurant.id).c;
  return { ...restaurant, branch_count: branchCount, feedback_count: stats.feedback_count, avg_rating: Number(stats.avg_rating.toFixed(2)) };
}

router.get('/', (req, res) => {
  let rows;
  if (req.user.role === 'super_admin') {
    rows = db.prepare('SELECT * FROM restaurants ORDER BY created_at DESC').all();
  } else if (req.user.restaurant_id) {
    rows = db.prepare('SELECT * FROM restaurants WHERE id = ?').all(req.user.restaurant_id);
  } else {
    rows = [];
  }
  res.json({ restaurants: rows.map((r) => withStats(r, req.user)) });
});

router.get('/:id', (req, res) => {
  const restaurant = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(req.params.id);
  if (!restaurant) return res.status(404).json({ error: 'Not found' });
  if (!canAccessRestaurant(req.user, restaurant.id)) return res.status(403).json({ error: 'Forbidden' });
  res.json({ restaurant: withStats(restaurant, req.user) });
});

router.post('/', requireRole('super_admin'), (req, res) => {
  const name = cleanText(req.body?.name, 150);
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const slug = req.body?.slug ? String(req.body.slug).toLowerCase().trim() : null;
  if (!isValidSlug(slug)) return res.status(400).json({ error: 'A valid slug is required (this becomes the /r/:slug branch-picker link)' });
  if (db.prepare('SELECT id FROM restaurants WHERE slug = ?').get(slug)) {
    return res.status(409).json({ error: 'Slug already in use' });
  }

  const logoUrl = cleanText(req.body?.logo_url, 500);
  const primaryColor = cleanText(req.body?.primary_color, 20) || '#4A6CF7';
  const accentColor = cleanText(req.body?.accent_color, 20) || '#F97316';

  const result = db
    .prepare('INSERT INTO restaurants (name, slug, logo_url, primary_color, accent_color) VALUES (?, ?, ?, ?, ?)')
    .run(name, slug, logoUrl, primaryColor, accentColor);
  const restaurant = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ restaurant: withStats(restaurant) });
});

router.put('/:id', (req, res) => {
  const restaurant = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(req.params.id);
  if (!restaurant) return res.status(404).json({ error: 'Not found' });
  if (!canAccessRestaurant(req.user, restaurant.id)) return res.status(403).json({ error: 'Forbidden' });
  if (req.user.role === 'branch_manager') return res.status(403).json({ error: 'Forbidden' });

  const name = cleanText(req.body?.name, 150) || restaurant.name;
  let slug = restaurant.slug;
  if (req.body?.slug !== undefined) {
    const candidate = String(req.body.slug).toLowerCase().trim();
    if (!isValidSlug(candidate)) return res.status(400).json({ error: 'Invalid slug' });
    const existing = db.prepare('SELECT id FROM restaurants WHERE slug = ? AND id != ?').get(candidate, restaurant.id);
    if (existing) return res.status(409).json({ error: 'Slug already in use' });
    slug = candidate;
  }
  const logoUrl = req.body?.logo_url !== undefined ? cleanText(req.body.logo_url, 500) : restaurant.logo_url;
  const primaryColor = req.body?.primary_color !== undefined ? cleanText(req.body.primary_color, 20) : restaurant.primary_color;
  const accentColor = req.body?.accent_color !== undefined ? cleanText(req.body.accent_color, 20) : restaurant.accent_color;
  const brandColor = req.body?.brand_color !== undefined ? cleanText(req.body.brand_color, 20) : restaurant.brand_color;
  const privacyPolicyUrl = req.body?.privacy_policy_url !== undefined ? cleanText(req.body.privacy_policy_url, 500) : restaurant.privacy_policy_url;
  const defaultThreshold = Number.isInteger(req.body?.default_rating_threshold) ? req.body.default_rating_threshold : restaurant.default_rating_threshold;

  db.prepare(
    `UPDATE restaurants SET name = ?, slug = ?, logo_url = ?, primary_color = ?, accent_color = ?, brand_color = ?, privacy_policy_url = ?, default_rating_threshold = ? WHERE id = ?`
  ).run(name, slug, logoUrl, primaryColor, accentColor, brandColor, privacyPolicyUrl, defaultThreshold, restaurant.id);

  res.json({ restaurant: withStats(db.prepare('SELECT * FROM restaurants WHERE id = ?').get(restaurant.id)) });
});

router.delete('/:id', requireRole('super_admin'), (req, res) => {
  const restaurant = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(req.params.id);
  if (!restaurant) return res.status(404).json({ error: 'Not found' });
  const branchIds = db.prepare('SELECT id FROM branches WHERE restaurant_id = ?').all(restaurant.id).map((b) => b.id);
  const tx = db.transaction(() => {
    for (const branchId of branchIds) {
      db.prepare('DELETE FROM responses WHERE branch_id = ?').run(branchId);
      db.prepare('DELETE FROM qr_sources WHERE branch_id = ?').run(branchId);
    }
    db.prepare('DELETE FROM branches WHERE restaurant_id = ?').run(restaurant.id);
    db.prepare('DELETE FROM users WHERE restaurant_id = ?').run(restaurant.id);
    db.prepare('DELETE FROM restaurants WHERE id = ?').run(restaurant.id);
  });
  tx();
  res.json({ ok: true });
});

module.exports = router;
