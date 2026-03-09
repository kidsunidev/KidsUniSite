const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { db, p } = require('../db/database');
const auth    = require('../middleware/auth');

const sign = (user) => jwt.sign(
  { id: user._id, email: user.email, name: user.name, role: user.role },
  process.env.JWT_SECRET || 'kids-uni-secret',
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await p.findOne(db.users, { email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = sign(user);
    res.json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/register  (admin only in production)
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role = 'mentor' } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'Email, password and name required' });

    const existing = await p.findOne(db.users, { email: email.toLowerCase().trim() });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const user = await p.insert(db.users, { email: email.toLowerCase().trim(), password: hash, name, role, createdAt: new Date() });
    res.status(201).json({ token: sign(user), user: { id: user._id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await p.findOne(db.users, { _id: req.user.id });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { password: _, ...safe } = user;
    res.json(safe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/users  (list all users - admin)
router.get('/users', auth, async (req, res) => {
  try {
    const users = await p.find(db.users, {});
    res.json(users.map(({ password: _, ...u }) => u));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
