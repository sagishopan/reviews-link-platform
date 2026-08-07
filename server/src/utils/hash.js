const crypto = require('crypto');

// One-way hash of the client IP - we never persist the raw address.
function hashIp(ip) {
  const salt = process.env.JWT_SECRET || 'static-salt';
  return crypto.createHash('sha256').update(`${salt}:${ip || 'unknown'}`).digest('hex');
}

function randomCode(length = 8) {
  return crypto.randomBytes(length).toString('hex').slice(0, length).toUpperCase();
}

// Formats a Date the same way SQLite's CURRENT_TIMESTAMP does ('YYYY-MM-DD HH:MM:SS', UTC).
// Any created_at written manually (e.g. by the seed script) must use this - a JS
// toISOString() string ('...T...Z') string-compares incorrectly against SQLite's
// native format in range queries (space vs 'T' separator).
function toSqliteUtc(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

module.exports = { hashIp, randomCode, toSqliteUtc };
