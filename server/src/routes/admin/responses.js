const express = require('express');
const db = require('../../db');
const { requireAuth } = require('../../middleware/auth');
const { cleanText } = require('../../utils/validate');
const { buildResponseFilters } = require('../../utils/responseFilters');

const router = express.Router();
router.use(requireAuth);

const SORT_MAP = {
  newest: 'r.created_at DESC',
  oldest: 'r.created_at ASC',
  rating_high: 'r.rating DESC, r.created_at DESC',
  rating_low: 'r.rating ASC, r.created_at DESC',
};

router.get('/', (req, res) => {
  const { whereSql, params } = buildResponseFilters(req);
  const sort = SORT_MAP[req.query.sort] || SORT_MAP.newest;
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Number(req.query.page_size) || 20);
  const offset = (page - 1) * pageSize;

  const totalRow = db
    .prepare(`SELECT COUNT(*) as count FROM responses r ${whereSql}`)
    .get(...params);

  const rows = db
    .prepare(
      `SELECT r.*, b.name as branch_name, b.restaurant_id
       FROM responses r JOIN branches b ON b.id = r.branch_id
       ${whereSql} ORDER BY ${sort} LIMIT ? OFFSET ?`
    )
    .all(...params, pageSize, offset);

  const summary = db
    .prepare(
      `SELECT
        COALESCE(AVG(r.rating), 0) as avg_rating,
        SUM(CASE WHEN r.sentiment = 'positive' THEN 1 ELSE 0 END) as positive_count,
        SUM(CASE WHEN r.sentiment = 'negative' THEN 1 ELSE 0 END) as negative_count,
        SUM(CASE WHEN r.status = 'pending' THEN 1 ELSE 0 END) as pending_count
       FROM responses r ${whereSql}`
    )
    .get(...params);

  res.json({
    responses: rows.map((r) => ({ ...r, categories: safeParse(r.categories) })),
    total: totalRow.count,
    page,
    page_size: pageSize,
    summary: {
      avg_rating: Number((summary.avg_rating || 0).toFixed(2)),
      positive_count: summary.positive_count || 0,
      negative_count: summary.negative_count || 0,
      pending_count: summary.pending_count || 0,
    },
  });
});

router.get('/:id', (req, res) => {
  const row = db
    .prepare(
      `SELECT r.*, b.name as branch_name, b.restaurant_id FROM responses r JOIN branches b ON b.id = r.branch_id WHERE r.id = ?`
    )
    .get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  if (!isAccessible(req.user, row)) return res.status(403).json({ error: 'Forbidden' });
  res.json({ response: { ...row, categories: safeParse(row.categories) } });
});

router.put('/:id', (req, res) => {
  const row = db.prepare('SELECT r.*, b.restaurant_id FROM responses r JOIN branches b ON b.id = r.branch_id WHERE r.id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  if (!isAccessible(req.user, row)) return res.status(403).json({ error: 'Forbidden' });

  const validStatuses = ['pending', 'in_progress', 'resolved', 'closed'];
  const status = req.body?.status && validStatuses.includes(req.body.status) ? req.body.status : row.status;
  const internalNotes = req.body?.internal_notes !== undefined ? cleanText(req.body.internal_notes, 2000) : row.internal_notes;
  const handledBy = status !== 'pending' ? req.user.id : row.handled_by;
  const handledAt = status !== 'pending' ? new Date().toISOString() : row.handled_at;

  db.prepare('UPDATE responses SET status=?, internal_notes=?, handled_by=?, handled_at=? WHERE id=?').run(
    status, internalNotes, handledBy, handledAt, row.id
  );

  const updated = db.prepare('SELECT * FROM responses WHERE id = ?').get(row.id);
  res.json({ response: { ...updated, categories: safeParse(updated.categories) } });
});

function isAccessible(user, row) {
  if (user.role === 'super_admin') return true;
  if (user.role === 'restaurant_admin') return user.restaurant_id === row.restaurant_id;
  if (user.role === 'branch_manager') return user.branch_id === row.branch_id;
  return false;
}

function safeParse(json) {
  try {
    return JSON.parse(json || '[]');
  } catch {
    return [];
  }
}

module.exports = router;
