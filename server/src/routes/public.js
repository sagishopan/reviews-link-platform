const express = require('express');
const db = require('../db');
const { checkRatingRateLimit, recordRatingSubmission } = require('../middleware/rateLimit');
const { sentimentFromRating } = require('../services/sentiment');
const { notifyLowRating } = require('../services/notifications');
const { cleanText, isValidEmail, isValidPhone, isValidRating, isValidSlug } = require('../utils/validate');
const { randomCode } = require('../utils/hash');

const router = express.Router();

const ALLOWED_CATEGORIES = [
  'food_quality', 'poor_service', 'long_wait', 'low_quality', 'high_price',
  'cleanliness', 'atmosphere', 'limited_variety', 'unprofessional_staff', 'other',
];

function getActiveBranch(slug) {
  return db
    .prepare(
      `SELECT b.*, r.name as restaurant_name, r.slug as restaurant_slug, r.logo_url, r.primary_color, r.accent_color, r.privacy_policy_url
       FROM branches b JOIN restaurants r ON r.id = b.restaurant_id
       WHERE b.slug = ? AND b.is_active = 1`
    )
    .get(slug);
}

// Chain-level entry point: every QR/link lands here first and must show the
// branch picker, even if it was printed for a specific branch - the branch is
// never assumed from the link alone, the customer always confirms it.
router.get('/restaurants/:slug', (req, res) => {
  if (!isValidSlug(req.params.slug)) return res.status(400).json({ error: 'Invalid restaurant' });
  const restaurant = db.prepare('SELECT * FROM restaurants WHERE slug = ?').get(req.params.slug);
  if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

  const branches = db
    .prepare('SELECT id, name, slug FROM branches WHERE restaurant_id = ? AND is_active = 1 ORDER BY name ASC')
    .all(restaurant.id);

  res.json({
    restaurant: {
      id: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
      logo_url: restaurant.logo_url,
      primary_color: restaurant.primary_color,
      accent_color: restaurant.accent_color,
      privacy_policy_url: restaurant.privacy_policy_url,
    },
    branches,
  });
});

router.get('/branches/:slug', (req, res) => {
  if (!isValidSlug(req.params.slug)) return res.status(400).json({ error: 'Invalid branch' });
  const branch = getActiveBranch(req.params.slug);
  if (!branch) return res.status(404).json({ error: 'Branch not found' });

  res.json({
    branch: {
      id: branch.id,
      slug: branch.slug,
      name: branch.name,
      restaurant_name: branch.restaurant_name,
      restaurant_slug: branch.restaurant_slug,
      logo_url: branch.logo_url,
      primary_color: branch.primary_color,
      accent_color: branch.accent_color,
      privacy_policy_url: branch.privacy_policy_url,
      intro_text: branch.intro_text,
      question_text: branch.question_text,
      feature_wheel_enabled: !!branch.feature_wheel_enabled,
    },
  });
});

router.post('/branches/:slug/ratings', (req, res, next) => {
  try {
    if (!isValidSlug(req.params.slug)) return res.status(400).json({ error: 'Invalid branch' });
    const branch = getActiveBranch(req.params.slug);
    if (!branch) return res.status(404).json({ error: 'Branch not found' });

    const rating = Number(req.body?.rating);
    if (!isValidRating(rating)) return res.status(400).json({ error: 'Invalid rating' });
    const source = cleanText(req.body?.source, 100);

    const { allowed, ipHash } = checkRatingRateLimit(req);
    if (!allowed) return res.status(429).json({ error: 'Too many submissions, please try again later' });

    const sentiment = sentimentFromRating(rating);
    const feedbackToken = randomCode(24);
    const needsFeedback = rating < branch.rating_threshold;
    const selectionMethod = req.body?.branch_selection_method || 'manual';

    const result = db
      .prepare(
        `INSERT INTO responses (branch_id, rating, source, sentiment, ip_hash, feedback_token, redirected_out, status, branch_selection_method, policy_version)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
      )
      .run(branch.id, rating, source, sentiment, ipHash, feedbackToken, needsFeedback ? 0 : 1, selectionMethod, '1.0');

    recordRatingSubmission(ipHash, branch.id);

    if (needsFeedback && sentiment === 'negative') {
      const responseRow = db.prepare('SELECT * FROM responses WHERE id = ?').get(result.lastInsertRowid);
      const restaurant = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(branch.restaurant_id);
      notifyLowRating({ branch, restaurant, response: responseRow }).catch(() => {});
    }

    res.status(201).json({
      response_id: result.lastInsertRowid,
      feedback_token: feedbackToken,
      needs_feedback: needsFeedback,
      redirect_url: needsFeedback ? null : branch.review_url,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/responses/:id/feedback', (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { feedback_token: token } = req.body || {};
    if (!id || !token) return res.status(400).json({ error: 'Invalid request' });

    const response = db.prepare('SELECT * FROM responses WHERE id = ?').get(id);
    if (!response || response.feedback_token !== token) {
      return res.status(404).json({ error: 'Not found' });
    }

    const rawCategories = Array.isArray(req.body?.categories) ? req.body.categories : [];
    const categories = rawCategories.filter((c) => ALLOWED_CATEGORIES.includes(c)).slice(0, ALLOWED_CATEGORIES.length);

    const comment = cleanText(req.body?.comment, 2000);
    const customerName = cleanText(req.body?.customer_name, 120);
    const customerPhone = req.body?.customer_phone && isValidPhone(req.body.customer_phone) ? req.body.customer_phone.trim() : null;
    const customerEmail = req.body?.customer_email && isValidEmail(req.body.customer_email) ? req.body.customer_email.trim() : null;
    const contactConsent = req.body?.contact_consent ? 1 : 0;

    db.prepare(
      `UPDATE responses
       SET categories = ?, comment = ?, customer_name = ?, customer_phone = ?, customer_email = ?, contact_consent = ?
       WHERE id = ?`
    ).run(JSON.stringify(categories), comment, customerName, customerPhone, customerEmail, contactConsent, id);

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.get('/categories', (req, res) => {
  res.json({ categories: ALLOWED_CATEGORIES });
});

module.exports = router;
