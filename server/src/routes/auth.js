const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { loginLimiter } = require('../middleware/rateLimit');
const { requireAuth } = require('../middleware/auth');
const { isValidEmail } = require('../utils/validate');

const router = express.Router();

router.post('/login', loginLimiter, (req, res) => {
  try {
    const { email, password } = req.body || {};
    const normalizedEmail = email ? email.toLowerCase().trim() : '';

    if (!isValidEmail(normalizedEmail) || typeof password !== 'string' || !password) {
      console.log(`[auth] Invalid input: email="${email}", passwordLength=${password?.length || 0}`);
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);
    console.log(`[auth] Login attempt: email="${normalizedEmail}", userFound=${!!user}, passwordLength=${password.length}`);

    if (!user) {
      console.log(`[auth] User not found for email: ${normalizedEmail}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordMatch = bcrypt.compareSync(password, user.password_hash);
    console.log(`[auth] Password comparison result: ${passwordMatch}`);

    if (!passwordMatch) {
      console.log(`[auth] Password mismatch for user: ${normalizedEmail}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('[auth] Login error:', error.message, error.stack);
    return res.status(500).json({ error: 'Server error' });
  }

  const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      restaurant_id: user.restaurant_id,
      branch_id: user.branch_id,
    },
  });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
