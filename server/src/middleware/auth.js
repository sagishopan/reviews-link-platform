const jwt = require('jsonwebtoken');
const db = require('../db');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = db.prepare('SELECT id, email, name, role, restaurant_id, branch_id FROM users WHERE id = ?').get(payload.sub);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

// Ensures the authenticated user is allowed to act on the given restaurant id.
function canAccessRestaurant(user, restaurantId) {
  if (user.role === 'super_admin') return true;
  return user.restaurant_id === Number(restaurantId);
}

// Ensures the authenticated user is allowed to act on the given branch row
// (branch object must include restaurant_id and id).
function canAccessBranch(user, branch) {
  if (!branch) return false;
  if (user.role === 'super_admin') return true;
  if (user.role === 'restaurant_admin') return user.restaurant_id === branch.restaurant_id;
  if (user.role === 'branch_manager') return user.branch_id === branch.id;
  return false;
}

module.exports = { requireAuth, requireRole, canAccessRestaurant, canAccessBranch };
