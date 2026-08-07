const express = require('express');
const db = require('../../db');
const { requireAuth } = require('../../middleware/auth');
const { buildResponseFilters } = require('../../utils/responseFilters');

const router = express.Router();
router.use(requireAuth);

const BASE_HEADERS = [
  'מזהה', 'סניף', 'דירוג', 'סנטימנט', 'מקור', 'קטגוריות', 'הערה',
  'שם לקוח', 'טלפון', 'הסכמה ליצירת קשר', 'סטטוס טיפול', 'הערות פנימיות', 'תאריך',
];

// The exported file is opened directly by the business owner, so enum values
// (which stay English internally, e.g. for the admin UI's status <select>)
// must be translated here too, not just the column headers.
const SENTIMENT_LABELS = { positive: 'חיובי', neutral: 'ניטרלי', negative: 'שלילי' };
const STATUS_LABELS = { pending: 'ממתין', in_progress: 'בטיפול', resolved: 'טופל', closed: 'נסגר' };

// SQLite stores 'YYYY-MM-DD HH:MM:SS' - reformat to DD/MM/YYYY HH:MM for the export.
function formatDateForExport(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/.exec(value || '');
  if (!match) return value;
  const [, year, month, day, hour, minute] = match;
  return `${day}/${month}/${year} ${hour}:${minute}`;
}

function escapeCsvField(value) {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

router.get('/responses.csv', (req, res) => {
  const { whereSql, params } = buildResponseFilters(req);
  const rows = db
    .prepare(
      `SELECT r.*, b.name as branch_name FROM responses r JOIN branches b ON b.id = r.branch_id ${whereSql} ORDER BY r.created_at DESC`
    )
    .all(...params);

  // Phone is now the platform's only customer contact field; email is legacy
  // and mostly empty going forward, so the column is only included at all
  // when at least one row in this export actually has an email on file.
  const hasAnyEmail = rows.some((r) => r.customer_email);
  const headers = hasAnyEmail
    ? [...BASE_HEADERS.slice(0, 9), 'אימייל', ...BASE_HEADERS.slice(9)]
    : BASE_HEADERS;

  const lines = [headers.map(escapeCsvField).join(',')];
  rows.forEach((r) => {
    let categories = [];
    try {
      categories = JSON.parse(r.categories || '[]');
    } catch {
      categories = [];
    }
    const fields = [
      r.id, r.branch_name, r.rating, SENTIMENT_LABELS[r.sentiment] || r.sentiment, r.source, categories.join('; '), r.comment,
      r.customer_name, r.customer_phone,
    ];
    if (hasAnyEmail) fields.push(r.customer_email);
    fields.push(
      r.contact_consent ? 'כן' : 'לא',
      STATUS_LABELS[r.status] || r.status, r.internal_notes, formatDateForExport(r.created_at)
    );
    lines.push(fields.map(escapeCsvField).join(','));
  });

  const csv = lines.join('\r\n');
  // UTF-8 BOM so Excel opens Hebrew text correctly.
  const bom = '﻿';

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="feedback-export-${Date.now()}.csv"`);
  res.send(bom + csv);
});

module.exports = router;
