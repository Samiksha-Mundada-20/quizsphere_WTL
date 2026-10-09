// routes/auth.js - register and login
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { asyncHandler } = require('../middleware/errors');

const router = express.Router();

// Creates the login token (JWT). It carries the user's id, name and role and expires in 2 hours.
function makeToken(user) {
  return jwt.sign(
    { id: user.user_id, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );
}

// POST /api/auth/register  (public) - creates a STUDENT account
router.post('/register', asyncHandler(async (req, res) => {
  const name = (req.body.name || '').trim();
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';

  if (!name || !email || !password) return res.status(400).json({ message: 'Please fill all fields.' });
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Enter a valid email address.' });
  if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters.' });

  const [existing] = await pool.execute('SELECT user_id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) return res.status(409).json({ message: 'This email is already registered.' });

  const hash = await bcrypt.hash(password, 10);   // never store the plain password
  const [result] = await pool.execute(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [name, email, hash, 'student']
  );

  const user = { user_id: result.insertId, name, email, role: 'student' };
  res.status(201).json({ token: makeToken(user), user: { id: user.user_id, name, email, role: 'student' } });
}));

// POST /api/auth/login  (public) - works for both admin and student
router.post('/login', asyncHandler(async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';

  const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
  const user = rows[0];

  // Same message for "no such email" and "wrong password" so attackers learn nothing.
  const ok = user && (await bcrypt.compare(password, user.password_hash));
  if (!ok) return res.status(401).json({ message: 'Invalid email or password.' });

  res.json({
    token: makeToken(user),
    user: { id: user.user_id, name: user.name, email: user.email, role: user.role }
  });
}));

module.exports = router;
