const express = require('express');
const QRCode = require('qrcode');
const db = require('../../db');
const { requireAuth, canAccessBranch, canAccessRestaurant } = require('../../middleware/auth');
const { cleanText } = require('../../utils/validate');
const { randomCode } = require('../../utils/hash');

const router = express.Router();
router.use(requireAuth);

function getBranchOr403(req, res) {
  const branch = db.prepare('SELECT * FROM branches WHERE id = ?').get(req.params.branchId);
  if (!branch) {
    res.status(404).json({ error: 'Not found' });
    return null;
  }
  if (!canAccessBranch(req.user, branch)) {
    res.status(403).json({ error: 'Forbidden' });
    return null;
  }
  return branch;
}

function buildUrl(branch, source) {
  const base = (process.env.BASE_URL || 'http://localhost:4000').replace(/\/$/, '');
  const url = `${base}/r/${branch.slug}`;
  return source ? `${url}?t=${encodeURIComponent(source)}` : url;
}

// Chain-level QR - this is the recommended/default code to print. It always
// lands on the mandatory branch-picker screen instead of assuming a branch.
function buildRestaurantUrl(restaurant, source) {
  const base = (process.env.BASE_URL || 'http://localhost:4000').replace(/\/$/, '');
  const url = `${base}/r/${restaurant.slug}`;
  return source ? `${url}?t=${encodeURIComponent(source)}` : url;
}

router.get('/restaurant/:restaurantId', async (req, res, next) => {
  try {
    const restaurant = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(req.params.restaurantId);
    if (!restaurant) return res.status(404).json({ error: 'Not found' });
    if (!canAccessRestaurant(req.user, restaurant.id)) return res.status(403).json({ error: 'Forbidden' });
    if (!restaurant.slug) return res.status(400).json({ error: 'Restaurant has no slug set yet' });

    const source = req.query.source ? String(req.query.source) : null;
    const url = buildRestaurantUrl(restaurant, source);
    const dataUrl = await QRCode.toDataURL(url, { margin: 1, width: 400 });
    res.json({ url, qr_data_url: dataUrl });
  } catch (err) {
    next(err);
  }
});

router.get('/restaurant/:restaurantId/download', async (req, res, next) => {
  try {
    const restaurant = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(req.params.restaurantId);
    if (!restaurant) return res.status(404).json({ error: 'Not found' });
    if (!canAccessRestaurant(req.user, restaurant.id)) return res.status(403).json({ error: 'Forbidden' });
    if (!restaurant.slug) return res.status(400).json({ error: 'Restaurant has no slug set yet' });

    const source = req.query.source ? String(req.query.source) : null;
    const size = Math.min(2000, Math.max(200, Number(req.query.size) || 1000));
    const url = buildRestaurantUrl(restaurant, source);
    const buffer = await QRCode.toBuffer(url, { margin: 2, width: size });
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="qr-${restaurant.slug}${source ? `-${source}` : ''}.png"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

router.get('/:branchId', async (req, res, next) => {
  try {
    const branch = getBranchOr403(req, res);
    if (!branch) return;
    const source = req.query.source ? String(req.query.source) : null;
    const url = buildUrl(branch, source);
    const dataUrl = await QRCode.toDataURL(url, { margin: 1, width: 400 });
    res.json({ url, qr_data_url: dataUrl });
  } catch (err) {
    next(err);
  }
});

router.get('/:branchId/download', async (req, res, next) => {
  try {
    const branch = getBranchOr403(req, res);
    if (!branch) return;
    const source = req.query.source ? String(req.query.source) : null;
    const size = Math.min(2000, Math.max(200, Number(req.query.size) || 1000));
    const url = buildUrl(branch, source);
    const buffer = await QRCode.toBuffer(url, { margin: 2, width: size });
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="qr-${branch.slug}${source ? `-${source}` : ''}.png"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

router.get('/:branchId/sources', (req, res) => {
  const branch = getBranchOr403(req, res);
  if (!branch) return;
  const sources = db.prepare('SELECT * FROM qr_sources WHERE branch_id = ? ORDER BY created_at DESC').all(branch.id);
  res.json({ sources });
});

router.post('/:branchId/sources', (req, res) => {
  const branch = getBranchOr403(req, res);
  if (!branch) return;
  const label = cleanText(req.body?.label, 100);
  if (!label) return res.status(400).json({ error: 'Label is required' });
  const code = randomCode(6).toLowerCase();

  const result = db.prepare('INSERT INTO qr_sources (branch_id, label, code) VALUES (?, ?, ?)').run(branch.id, label, code);
  const source = db.prepare('SELECT * FROM qr_sources WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ source });
});

router.delete('/sources/:id', (req, res) => {
  const source = db.prepare('SELECT * FROM qr_sources WHERE id = ?').get(req.params.id);
  if (!source) return res.status(404).json({ error: 'Not found' });
  const branch = db.prepare('SELECT * FROM branches WHERE id = ?').get(source.branch_id);
  if (!canAccessBranch(req.user, branch)) return res.status(403).json({ error: 'Forbidden' });

  db.prepare('DELETE FROM qr_sources WHERE id = ?').run(source.id);
  res.json({ ok: true });
});

module.exports = router;
