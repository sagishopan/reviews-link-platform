const db = require('../db');

// Returns null when the user has no restriction (sees everything), or an
// array of branch ids the user is scoped to (possibly empty).
function accessibleBranchIds(user, restaurantId) {
  if (user.role === 'super_admin') {
    if (restaurantId) return db.prepare('SELECT id FROM branches WHERE restaurant_id = ?').all(restaurantId).map((b) => b.id);
    return null;
  }
  if (user.role === 'restaurant_admin') {
    return db.prepare('SELECT id FROM branches WHERE restaurant_id = ?').all(user.restaurant_id).map((b) => b.id);
  }
  if (user.role === 'branch_manager') return user.branch_id ? [user.branch_id] : [];
  return [];
}

module.exports = { accessibleBranchIds };
