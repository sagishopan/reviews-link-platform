const express = require('express');
const db = require('../../db');
const { requireAuth, canAccessRestaurant, canAccessBranch } = require('../../middleware/auth');
const { cleanText, isValidSlug, isValidEmail, isValidPhone } = require('../../utils/validate');

const router = express.Router();
router.use(requireAuth);

function withStats(branch) {
  const stats = db
    .prepare('SELECT COUNT(*) as feedback_count, COALESCE(AVG(rating), 0) as avg_rating FROM responses WHERE branch_id = ?')
    .get(branch.id);
  return { ...branch, feedback_count: stats.feedback_count, avg_rating: Number(stats.avg_rating.toFixed(2)) };
}

function scopedBranches(user, restaurantId) {
  if (user.role === 'super_admin') {
    return restaurantId
      ? db.prepare('SELECT * FROM branches WHERE restaurant_id = ? ORDER BY created_at DESC').all(restaurantId)
      : db.prepare('SELECT * FROM branches ORDER BY created_at DESC').all();
  }
  if (user.role === 'restaurant_admin') {
    return db.prepare('SELECT * FROM branches WHERE restaurant_id = ? ORDER BY created_at DESC').all(user.restaurant_id);
  }
  if (user.role === 'branch_manager') {
    return db.prepare('SELECT * FROM branches WHERE id = ?').all(user.branch_id);
  }
  return [];
}

router.get('/', (req, res) => {
  const rows = scopedBranches(req.user, req.query.restaurant_id ? Number(req.query.restaurant_id) : null);
  res.json({ branches: rows.map(withStats) });
});

router.get('/:id', (req, res) => {
  const branch = db.prepare('SELECT * FROM branches WHERE id = ?').get(req.params.id);
  if (!branch) return res.status(404).json({ error: 'Not found' });
  if (!canAccessBranch(req.user, branch)) return res.status(403).json({ error: 'Forbidden' });
  res.json({ branch: withStats(branch) });
});

router.post('/', (req, res) => {
  if (req.user.role === 'branch_manager') return res.status(403).json({ error: 'Forbidden' });
  const restaurantId = Number(req.body?.restaurant_id);
  if (!canAccessRestaurant(req.user, restaurantId)) return res.status(403).json({ error: 'Forbidden' });

  const name = cleanText(req.body?.name, 150);
  const slug = req.body?.slug ? String(req.body.slug).toLowerCase().trim() : null;
  if (!name || !isValidSlug(slug)) return res.status(400).json({ error: 'Valid name and slug are required' });

  const existing = db.prepare('SELECT id FROM branches WHERE slug = ?').get(slug);
  if (existing) return res.status(409).json({ error: 'Slug already in use' });

  const reviewUrl = cleanText(req.body?.review_url, 500);
  const restaurant = db.prepare('SELECT default_rating_threshold FROM restaurants WHERE id = ?').get(restaurantId);
  const threshold = Number.isInteger(req.body?.rating_threshold) ? req.body.rating_threshold : (restaurant?.default_rating_threshold || 4);
  const managerPhone = req.body?.manager_phone && isValidPhone(req.body.manager_phone) ? req.body.manager_phone : null;
  const managerEmail = req.body?.manager_email && isValidEmail(req.body.manager_email) ? req.body.manager_email : null;

  const result = db
    .prepare(
      `INSERT INTO branches (restaurant_id, name, slug, review_url, rating_threshold, manager_phone, manager_email)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(restaurantId, name, slug, reviewUrl, threshold, managerPhone, managerEmail);

  res.status(201).json({ branch: withStats(db.prepare('SELECT * FROM branches WHERE id = ?').get(result.lastInsertRowid)) });
});

router.put('/:id', (req, res) => {
  const branch = db.prepare('SELECT * FROM branches WHERE id = ?').get(req.params.id);
  if (!branch) return res.status(404).json({ error: 'Not found' });
  if (!canAccessBranch(req.user, branch)) return res.status(403).json({ error: 'Forbidden' });

  const fields = {
    name: req.body?.name !== undefined ? cleanText(req.body.name, 150) : branch.name,
    review_url: req.body?.review_url !== undefined ? cleanText(req.body.review_url, 500) : branch.review_url,
    rating_threshold: Number.isInteger(req.body?.rating_threshold) ? req.body.rating_threshold : branch.rating_threshold,
    manager_phone: req.body?.manager_phone !== undefined ? (isValidPhone(req.body.manager_phone) ? req.body.manager_phone : null) : branch.manager_phone,
    manager_email: req.body?.manager_email !== undefined ? (isValidEmail(req.body.manager_email) ? req.body.manager_email : null) : branch.manager_email,
    manager_whatsapp: req.body?.manager_whatsapp !== undefined ? cleanText(req.body.manager_whatsapp, 30) : branch.manager_whatsapp,
    is_active: req.body?.is_active !== undefined ? (req.body.is_active ? 1 : 0) : branch.is_active,
    intro_text: req.body?.intro_text !== undefined ? cleanText(req.body.intro_text, 300) : branch.intro_text,
    question_text: req.body?.question_text !== undefined ? cleanText(req.body.question_text, 150) : branch.question_text,
    feature_loyalty_enabled: req.body?.feature_loyalty_enabled !== undefined ? (req.body.feature_loyalty_enabled ? 1 : 0) : branch.feature_loyalty_enabled,
    feature_wheel_enabled: req.body?.feature_wheel_enabled !== undefined ? (req.body.feature_wheel_enabled ? 1 : 0) : branch.feature_wheel_enabled,
    notify_email_enabled: req.body?.notify_email_enabled !== undefined ? (req.body.notify_email_enabled ? 1 : 0) : branch.notify_email_enabled,
    notify_whatsapp_enabled: req.body?.notify_whatsapp_enabled !== undefined ? (req.body.notify_whatsapp_enabled ? 1 : 0) : branch.notify_whatsapp_enabled,
    notify_webhook_enabled: req.body?.notify_webhook_enabled !== undefined ? (req.body.notify_webhook_enabled ? 1 : 0) : branch.notify_webhook_enabled,
    notify_webhook_url: req.body?.notify_webhook_url !== undefined ? cleanText(req.body.notify_webhook_url, 500) : branch.notify_webhook_url,
  };

  db.prepare(
    `UPDATE branches SET name=?, review_url=?, rating_threshold=?, manager_phone=?, manager_email=?, manager_whatsapp=?,
     is_active=?, intro_text=?, question_text=?, feature_loyalty_enabled=?, feature_wheel_enabled=?,
     notify_email_enabled=?, notify_whatsapp_enabled=?, notify_webhook_enabled=?, notify_webhook_url=? WHERE id=?`
  ).run(
    fields.name, fields.review_url, fields.rating_threshold, fields.manager_phone, fields.manager_email, fields.manager_whatsapp,
    fields.is_active, fields.intro_text, fields.question_text, fields.feature_loyalty_enabled, fields.feature_wheel_enabled,
    fields.notify_email_enabled, fields.notify_whatsapp_enabled, fields.notify_webhook_enabled, fields.notify_webhook_url,
    branch.id
  );

  res.json({ branch: withStats(db.prepare('SELECT * FROM branches WHERE id = ?').get(branch.id)) });
});

router.delete('/:id', (req, res) => {
  const branch = db.prepare('SELECT * FROM branches WHERE id = ?').get(req.params.id);
  if (!branch) return res.status(404).json({ error: 'Not found' });
  if (req.user.role === 'branch_manager' || !canAccessBranch(req.user, branch)) return res.status(403).json({ error: 'Forbidden' });

  const tx = db.transaction(() => {
    db.prepare('DELETE FROM responses WHERE branch_id = ?').run(branch.id);
    db.prepare('DELETE FROM qr_sources WHERE branch_id = ?').run(branch.id);
    db.prepare('DELETE FROM branches WHERE id = ?').run(branch.id);
  });
  tx();
  res.json({ ok: true });
});

module.exports = router;
