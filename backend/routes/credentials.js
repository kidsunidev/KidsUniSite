// ── credentials.js ───────────────────────────────────────────
const credRouter = require('express').Router();
const { db, p } = require('../db/database');
const auth = require('../middleware/auth');

credRouter.get('/', auth, async (req, res) => {
  try {
    const q = req.query.studentId ? { studentId: parseInt(req.query.studentId) } : {};
    const creds = await p.find(db.credentials, q, { issuedAt: -1 });
    res.json(creds);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

credRouter.get('/:id', auth, async (req, res) => {
  try {
    const cred = await p.findOne(db.credentials, { credentialId: req.params.id });
    if (!cred) return res.status(404).json({ error: 'Credential not found' });
    res.json(cred);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

credRouter.post('/', auth, async (req, res) => {
  try {
    const { studentId, type, name, skill, evidence } = req.body;
    if (!studentId || !name) return res.status(400).json({ error: 'studentId and name required' });
    const all = await p.find(db.credentials, {});
    const credentialId = `cr${String(all.length + 1).padStart(3, '0')}`;
    const cred = await p.insert(db.credentials, {
      credentialId, studentId: parseInt(studentId),
      type: type || 'Open Badge', name, skill: skill || '',
      evidence: evidence || '', issuedAt: new Date(),
      issuedBy: req.user.name,
      verificationUrl: `https://kidsuni.edu/verify/${credentialId}`,
      createdAt: new Date(),
    });
    res.status(201).json(cred);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

credRouter.delete('/:id', auth, async (req, res) => {
  try {
    await p.remove(db.credentials, { credentialId: req.params.id });
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

credRouter.get('/verify/:id', async (req, res) => {
  try {
    const cred = await p.findOne(db.credentials, { credentialId: req.params.id });
    if (!cred) return res.status(404).json({ valid: false });
    const student = await p.findOne(db.students, { studentId: cred.studentId });
    res.json({ valid: true, credential: cred, student: student ? { name: student.name, grade: student.grade } : null });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = credRouter;
