const sanitizeHtml = require('sanitize-html');

// Strips all markup - free-text fields are plain text only, never rendered as HTML,
// but we sanitize server-side too as defense in depth against stored XSS.
function cleanText(value, maxLength = 2000) {
  if (typeof value !== 'string') return null;
  const stripped = sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim();
  if (!stripped) return null;
  return stripped.slice(0, maxLength);
}

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Israeli phone numbers only: local format (0 + 8-9 digits, covers mobile 05X
// and landline 0X) or international format (+972/972 + 8-9 digits).
function isValidPhone(phone) {
  if (typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return /^0\d{8,9}$/.test(cleaned) || /^(\+972|972)\d{8,9}$/.test(cleaned);
}

function isValidRating(rating) {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
}

function isValidSlug(slug) {
  return typeof slug === 'string' && /^[a-z0-9-]{2,64}$/.test(slug);
}

module.exports = { cleanText, isValidEmail, isValidPhone, isValidRating, isValidSlug };
