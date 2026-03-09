const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { db }  = require('../db/database');
const { verifyToken } = require('../middleware/auth');

const JWT_SECRET  = process.env.JWT_SECRET  || 'kidsuni-secret';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, error: 'Email and password required' });

    const user = await db.findOne('users', { email: email.toLowerCase() });
    if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    // For seeded users without hashed passwords, accept default password
    const DEFAULT = 'kidsuni2024';
    const valid = user.password_hash
      ? await bcrypt.compare(password, user.password_hash)
      : password === DEFAULT;

    if (!valid) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    const { password_hash, ...safeUser } = user;
    res.json({ success: true, token, user: safeUser });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name) return res.status(400).json({ success: false, error: 'Name, email and password required' });

    const existing = await db.findOne('users', { email: email.toLowerCase() });
    if (existing) return res.status(409).json({ success: false, error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const user = await db.insert('users', { email: email.toLowerCase(), name, role: role || 'mentor', password_hash: hash });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    const { password_hash, ...safeUser } = user;
    res.status(201).json({ success: true, token, user: safeUser });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/auth/me
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await db.findOne('users', { id: req.user.id });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    const { password_hash, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
