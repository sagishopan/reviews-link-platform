const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../../db');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { cleanText, isValidEmail } = require('../../utils/validate');

const router = express.Router();
router.use(requireAuth);
router.use(requireRole('super_admin', 'restaurant_admin'));

const SAFE_FIELDS = 'id, email, name, role, restaurant_id, branch_id, created_at';

function assertCanAssign(actor, targetRole, targetRestaurantId, targetBranchId) {
  if (actor.role === 'super_admin') return true;
  if (actor.role === 'restaurant_admin') {
    if (targetRole === 'super_admin') return false;
    if (targetRestaurantId !== actor.restaurant_id) return false;
    if (targetRole === 'branch_manager' && targetBranchId) {
      const branch = db.prepare('SELECT restaurant_id FROM branches WHERE id = ?').get(targetBranchId);
      if (!branch || branch.restaurant_id !== actor.restaurant_id) return false;
    }
    return true;
  }
  return false;
}

router.get('/', (req, res) => {
  const rows =
    req.user.role === 'super_admin'
      ? db.prepare(`SELECT ${SAFE_FIELDS} FROM users ORDER BY created_at DESC`).all()
      : db.prepare(`SELECT ${SAFE_FIELDS} FROM users WHERE restaurant_id = ? ORDER BY created_at DESC`).all(req.user.restaurant_id);
  res.json({ users: rows });
});

router.post('/', (req, res) => {
  const email = req.body?.email ? String(req.body.email).toLowerCase().trim() : null;
  const password = req.body?.password;
  const name = cleanText(req.body?.name, 120);
  const role = req.body?.role;
  const restaurantId = req.body?.restaurant_id ? Number(req.body.restaurant_id) : null;
  const branchId = req.body?.branch_id ? Number(req.body.branch_id) : null;

  if (!isValidEmail(email) || !password || password.length < 8) {
    return res.status(400).json({ error: 'Valid email and password (min 8 chars) are required' });
  }
  if (!['super_admin', 'restaurant_admin', 'branch_manager'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  if (!assertCanAssign(req.user, role, restaurantId, branchId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (db.prepare('SELECT id FROM users WHERE email = ?').get(email)) {
    return res.status(409).json({ error: 'Email already in use' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare('INSERT INTO users (email, password_hash, name, role, restaurant_id, branch_id) VALUES (?, ?, ?, ?, ?, ?)')
    .run(email, passwordHash, name, role, role === 'super_admin' ? null : restaurantId, role === 'branch_manager' ? branchId : null);

  res.status(201).json({ user: db.prepare(`SELECT ${SAFE_FIELDS} FROM users WHERE id = ?`).get(result.lastInsertRowid) });
});

router.put('/:id', (req, res) => {
  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!target) return res.status(404).json({ error: 'Not found' });
  if (req.user.role === 'restaurant_admin' && target.restaurant_id !== req.user.restaurant_id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const name = req.body?.name !== undefined ? cleanText(req.body.name, 120) : target.name;
  const role = req.body?.role || target.role;
  const restaurantId = req.body?.restaurant_id !== undefined ? Number(req.body.restaurant_id) : target.restaurant_id;
  const branchId = req.body?.branch_id !== undefined ? Number(req.body.branch_id) : target.branch_id;

  if (!assertCanAssign(req.user, role, restaurantId, branchId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  let passwordHash = target.password_hash;
  if (req.body?.password) {
    if (req.body.password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    passwordHash = bcrypt.hashSync(req.body.password, 10);
  }

  db.prepare(
    'UPDATE users SET name=?, role=?, restaurant_id=?, branch_id=?, password_hash=? WHERE id=?'
  ).run(name, role, role === 'super_admin' ? null : restaurantId, role === 'branch_manager' ? branchId : null, passwordHash, target.id);

  res.json({ user: db.prepare(`SELECT ${SAFE_FIELDS} FROM users WHERE id = ?`).get(target.id) });
});

router.delete('/:id', (req, res) => {
  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!target) return res.status(404).json({ error: 'Not found' });
  if (req.user.role === 'restaurant_admin' && target.restaurant_id !== req.user.restaurant_id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (target.id === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account' });

  db.prepare('DELETE FROM users WHERE id = ?').run(target.id);
  res.json({ ok: true });
});

module.exports = router;
