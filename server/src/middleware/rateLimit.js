const rateLimit = require('express-rate-limit');
const db = require('../db');
const { hashIp } = require('../utils/hash');

// General-purpose HTTP-level throttle for all public endpoints (protects against floods).
const publicApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

// Business-rule limit: at most N ratings per hour from the same source IP,
// persisted in SQLite so it survives server restarts. Returns { allowed, ipHash }.
function checkRatingRateLimit(req) {
  const limit = Number(process.env.RATING_RATE_LIMIT_PER_HOUR || 5);
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || '';
  const ipHash = hashIp(ip);

  // Cutoff is computed SQL-side (datetime('now', ...)) so it matches the
  // exact format SQLite's CURRENT_TIMESTAMP writes ('YYYY-MM-DD HH:MM:SS').
  // A JS-generated ISO string ('...T...Z') string-compares incorrectly
  // against that format and silently defeats the limit.
  const { count } = db
    .prepare("SELECT COUNT(*) as count FROM rate_limit_log WHERE ip_hash = ? AND created_at >= datetime('now', '-1 hour')")
    .get(ipHash);

  return { allowed: count < limit, ipHash };
}

function recordRatingSubmission(ipHash, branchId) {
  db.prepare('INSERT INTO rate_limit_log (ip_hash, branch_id) VALUES (?, ?)').run(ipHash, branchId);
}

module.exports = { publicApiLimiter, loginLimiter, checkRatingRateLimit, recordRatingSubmission };
