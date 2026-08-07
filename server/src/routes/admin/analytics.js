const express = require('express');
const db = require('../../db');
const { requireAuth } = require('../../middleware/auth');
const { accessibleBranchIds } = require('../../utils/scope');

const router = express.Router();
router.use(requireAuth);

const CATEGORY_LABELS = {
  food_quality: 'איכות האוכל',
  poor_service: 'שירות לקוי',
  long_wait: 'זמני המתנה ארוכים',
  low_quality: 'איכות נמוכה',
  high_price: 'מחיר גבוה',
  cleanliness: 'ניקיון לא מספק',
  atmosphere: 'אווירה לא נעימה',
  limited_variety: 'מגוון מוגבל',
  unprofessional_staff: 'צוות לא מקצועי',
  other: 'אחר',
};

const WEEKDAY_LABELS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

function scopeWhere(req) {
  const where = [];
  const params = [];
  const branchIds = accessibleBranchIds(req.user, req.query.restaurant_id ? Number(req.query.restaurant_id) : null);

  if (branchIds !== null) {
    if (branchIds.length === 0) {
      where.push('1 = 0');
    } else {
      where.push(`r.branch_id IN (${branchIds.map(() => '?').join(',')})`);
      params.push(...branchIds);
    }
  }
  if (req.query.branch_id) {
    where.push('r.branch_id = ?');
    params.push(Number(req.query.branch_id));
  }
  return { whereSql: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
}

router.get('/trend', (req, res) => {
  const days = Math.min(90, Number(req.query.days) || 14);
  const { whereSql, params } = scopeWhere(req);
  // Cutoffs are computed SQL-side via datetime('now', ...) and bound as the
  // '-N days' modifier string, so they're evaluated in the same native format
  // SQLite writes to created_at. A JS-computed ISO cutoff string-compares
  // incorrectly against that format (space vs 'T' separator) and silently
  // drops rows from the same calendar day.
  const sinceModifier = `-${days} days`;
  const combinedWhere = whereSql ? `${whereSql} AND r.created_at >= datetime('now', ?)` : `WHERE r.created_at >= datetime('now', ?)`;

  const rows = db
    .prepare(
      `SELECT date(r.created_at) as day, AVG(r.rating) as avg_rating, COUNT(*) as count
       FROM responses r ${combinedWhere}
       GROUP BY date(r.created_at) ORDER BY day ASC`
    )
    .all(...params, sinceModifier);

  const totalRow = db
    .prepare(`SELECT COUNT(*) as count, COALESCE(AVG(r.rating),0) as avg FROM responses r ${combinedWhere}`)
    .get(...params, sinceModifier);

  // Compare to the previous equal-length period for the trend badge (up/down %).
  const prevSinceModifier = `-${days * 2} days`;
  const prevWhere = whereSql
    ? `${whereSql} AND r.created_at >= datetime('now', ?) AND r.created_at < datetime('now', ?)`
    : `WHERE r.created_at >= datetime('now', ?) AND r.created_at < datetime('now', ?)`;
  const prevRow = db
    .prepare(`SELECT COALESCE(AVG(r.rating),0) as avg FROM responses r ${prevWhere}`)
    .get(...params, prevSinceModifier, sinceModifier);

  const change = prevRow.avg > 0 ? ((totalRow.avg - prevRow.avg) / prevRow.avg) * 100 : 0;

  res.json({
    days: rows.map((r) => ({ day: r.day, avg_rating: Number(r.avg_rating.toFixed(2)), count: r.count })),
    total_feedback: totalRow.count,
    avg_rating: Number(totalRow.avg.toFixed(2)),
    change_pct: Number(change.toFixed(1)),
  });
});

router.get('/sentiment', (req, res) => {
  const { whereSql, params } = scopeWhere(req);
  const rows = db.prepare(`SELECT r.sentiment, COUNT(*) as count FROM responses r ${whereSql} GROUP BY r.sentiment`).all(...params);
  const total = rows.reduce((sum, r) => sum + r.count, 0);
  const breakdown = { positive: 0, neutral: 0, negative: 0 };
  rows.forEach((r) => {
    if (r.sentiment) breakdown[r.sentiment] = r.count;
  });
  res.json({
    total,
    breakdown,
    percentages: {
      positive: total ? Number(((breakdown.positive / total) * 100).toFixed(1)) : 0,
      neutral: total ? Number(((breakdown.neutral / total) * 100).toFixed(1)) : 0,
      negative: total ? Number(((breakdown.negative / total) * 100).toFixed(1)) : 0,
    },
  });
});

router.get('/heatmap', (req, res) => {
  const { whereSql, params } = scopeWhere(req);
  const combinedWhere = whereSql ? `${whereSql} AND r.sentiment = 'negative'` : `WHERE r.sentiment = 'negative'`;

  const rows = db
    .prepare(
      `SELECT CAST(strftime('%w', r.created_at) as INTEGER) as weekday, CAST(strftime('%H', r.created_at) as INTEGER) as hour, COUNT(*) as count
       FROM responses r ${combinedWhere} GROUP BY weekday, hour`
    )
    .all(...params);

  const grid = {};
  let max = 0;
  let busiestDay = null;
  let peakHour = null;
  const dayTotals = new Array(7).fill(0);
  const hourTotals = {};

  rows.forEach((r) => {
    grid[`${r.weekday}-${r.hour}`] = r.count;
    if (r.count > max) max = r.count;
    dayTotals[r.weekday] += r.count;
    hourTotals[r.hour] = (hourTotals[r.hour] || 0) + r.count;
  });

  const maxDayTotal = Math.max(0, ...dayTotals);
  if (maxDayTotal > 0) busiestDay = WEEKDAY_LABELS[dayTotals.indexOf(maxDayTotal)];
  const hourEntries = Object.entries(hourTotals);
  if (hourEntries.length) {
    const [topHour] = hourEntries.sort((a, b) => b[1] - a[1])[0];
    peakHour = `${topHour}:00`;
  }

  const totalComplaints = rows.reduce((sum, r) => sum + r.count, 0);

  res.json({
    grid,
    max,
    weekday_labels: WEEKDAY_LABELS,
    hours: Array.from({ length: 15 }, (_, i) => i + 8), // 08:00-22:00
    total_complaints: totalComplaints,
    busiest_day: busiestDay,
    peak_hour: peakHour,
  });
});

// Cheap heuristic "weekly summary" - counts category frequency and rating
// movement from the last 7 days of free-text feedback. Swap the body of this
// function for a real LLM call later; the caching contract stays the same.
function generateWeeklySummary(branchIds, whereParams, whereSql) {
  const combinedWhere = whereSql ? `${whereSql} AND r.created_at >= datetime('now', ?)` : `WHERE r.created_at >= datetime('now', ?)`;
  const rows = db.prepare(`SELECT r.rating, r.categories, r.sentiment FROM responses r ${combinedWhere}`).all(...whereParams, '-7 days');

  const categoryCounts = {};
  let positive = 0;
  let negative = 0;
  rows.forEach((r) => {
    if (r.sentiment === 'positive') positive += 1;
    if (r.sentiment === 'negative') negative += 1;
    try {
      const cats = JSON.parse(r.categories || '[]');
      cats.forEach((c) => {
        categoryCounts[c] = (categoryCounts[c] || 0) + 1;
      });
    } catch {
      // ignore malformed json
    }
  });

  const topCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const insights = [];

  if (topCategories.length) {
    const [topKey, topCount] = topCategories[0];
    insights.push(`הנושא שדווח הכי הרבה השבוע הוא "${CATEGORY_LABELS[topKey] || topKey}" (${topCount} אזכורים).`);
  } else {
    insights.push('לא התקבלו מספיק פידבקים עם קטגוריות השבוע כדי לזהות מגמה.');
  }
  insights.push(`התקבלו ${positive} משובים חיוביים ו-${negative} משובים שליליים השבוע.`);
  if (rows.length) {
    const avg = rows.reduce((s, r) => s + r.rating, 0) / rows.length;
    insights.push(`הדירוג הממוצע השבוע עמד על ${avg.toFixed(1)} מתוך 5, מתוך ${rows.length} משובים.`);
  }

  return { insights, feedback_count: rows.length, generated_at: new Date().toISOString() };
}

router.get('/weekly-summary', (req, res) => {
  const branchId = req.query.branch_id ? Number(req.query.branch_id) : null;
  if (!branchId) return res.status(400).json({ error: 'branch_id is required' });

  // Freshness is decided in SQL (generated_at compared against datetime('now', ...))
  // to stay in SQLite's own timestamp format - see the note on trend cutoffs above.
  const cached = db
    .prepare(
      `SELECT *, (generated_at >= datetime('now', '-1 day')) as is_fresh
       FROM weekly_summaries WHERE branch_id = ? ORDER BY generated_at DESC LIMIT 1`
    )
    .get(branchId);

  const isFresh = cached && cached.is_fresh === 1;
  if (isFresh && req.query.refresh !== 'true') {
    return res.json({ summary: JSON.parse(cached.summary_json), cached: true });
  }

  const summary = generateWeeklySummary([branchId], [branchId], 'WHERE r.branch_id = ?');
  db.prepare('INSERT INTO weekly_summaries (branch_id, summary_json) VALUES (?, ?)').run(branchId, JSON.stringify(summary));
  res.json({ summary, cached: false });
});

module.exports = router;
