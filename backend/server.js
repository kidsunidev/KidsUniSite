require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { initDB } = require('./db/database');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Request logger ────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString().slice(11,19)} ${req.method} ${req.path}`);
  next();
});

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/students',      require('./routes/students'));
app.use('/api/courses',       require('./routes/courses'));
app.use('/api/credentials',   require('./routes/credentials'));
app.use('/api/evidence',      require('./routes/evidence'));
app.use('/api/goals',         require('./routes/goals'));
app.use('/api/transcripts',   require('./routes/transcripts'));
app.use('/api/analytics',     require('./routes/analytics'));
app.use('/api/forum',         require('./routes/forum'));
app.use('/api/announcements', require('./routes/announcements'));

// ── Health check ──────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({
  status: 'ok',
  version: '4.1.0',
  database: 'supabase',
  timestamp: new Date().toISOString()
}));

// ── 404 handler ───────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, error: 'Route not found' }));

// ── Error handler ─────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────
async function start() {
  await initDB();
  app.listen(PORT, () => {
    console.log(`🎓 Kids Uni API  →  http://localhost:${PORT}`);
    console.log(`   Database      →  Supabase (${process.env.SUPABASE_URL})`);
    console.log(`   Health check  →  http://localhost:${PORT}/health\n`);
  });
}

start().catch(err => { console.error('Startup failed:', err); process.exit(1); });
