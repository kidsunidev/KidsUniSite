const router = require('express').Router();
const { db, p } = require('../db/database');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const q = req.query.studentId ? { studentId: parseInt(req.query.studentId) } : {};
    res.json(await p.find(db.evidence, q, { date: -1 }));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { studentId, title, type, url, competency, proficiency, date } = req.body;
    if (!studentId || !title) return res.status(400).json({ error: 'studentId and title required' });
    const all = await p.find(db.evidence, {});
    const evidenceId = `ev${String(all.length + 1).padStart(3, '0')}`;
    const ev = await p.insert(db.evidence, {
      evidenceId, studentId: parseInt(studentId), title,
      type: type || 'Document', url: url || '', competency: competency || '',
      proficiency: proficiency || 'Developing',
      date: date || new Date().toISOString().split('T')[0],
      uploadedBy: req.user.name, createdAt: new Date(),
    });
    res.status(201).json(ev);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { title, type, url, competency, proficiency } = req.body;
    await p.update(db.evidence, { evidenceId: req.params.id }, { $set: { title, type, url, competency, proficiency, updatedAt: new Date() } });
    res.json(await p.findOne(db.evidence, { evidenceId: req.params.id }));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await p.remove(db.evidence, { evidenceId: req.params.id });
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
