/**
 * Kids University — Mastery Platform v4.0
 * Backend API Server
 */

require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const { initDB } = require('./db/database');

const authRoutes       = require('./routes/auth');
const studentRoutes    = require('./routes/students');
const courseRoutes     = require('./routes/courses');
const credentialRoutes = require('./routes/credentials');
const evidenceRoutes   = require('./routes/evidence');
const transcriptRoutes = require('./routes/transcripts');
const analyticsRoutes  = require('./routes/analytics');
const forumRoutes      = require('./routes/forum');
const goalRoutes       = require('./routes/goals');
const announcementRoutes = require('./routes/announcements');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/students',      studentRoutes);
app.use('/api/courses',       courseRoutes);
app.use('/api/credentials',   credentialRoutes);
app.use('/api/evidence',      evidenceRoutes);
app.use('/api/transcripts',   transcriptRoutes);
app.use('/api/analytics',     analyticsRoutes);
app.use('/api/forum',         forumRoutes);
app.use('/api/goals',         goalRoutes);
app.use('/api/announcements', announcementRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '4.0.0', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ── Start ─────────────────────────────────────────────────────
async function start() {
  await initDB();
  app.listen(PORT, () => {
    console.log(`\n🎓 Kids Uni API Server running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health\n`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = app;
