#!/usr/bin/env node
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../src/db');

const email = process.argv[2];

if (!email) {
  console.error('Usage: npm run reset-password -- <email>');
  console.error('Example: npm run reset-password -- admin@example.com');
  process.exit(1);
}

const normalizedEmail = email.toLowerCase().trim();
const newPassword = 'TempPassword123!';
const passwordHash = bcrypt.hashSync(newPassword, 10);

try {
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);
  if (!user) {
    console.error(`❌ User not found: ${normalizedEmail}`);
    process.exit(1);
  }

  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, user.id);
  console.log(`✅ Password reset for ${normalizedEmail}`);
  console.log(`📝 Temporary password: ${newPassword}`);
  console.log(`ℹ️  User should change this password on first login`);
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
