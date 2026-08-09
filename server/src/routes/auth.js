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
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordMatch = bcrypt.compareSync(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
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
  } catch (error) {
    console.error('[auth] Unexpected error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
