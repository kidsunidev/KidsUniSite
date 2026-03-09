const router = require('express').Router();
const { db, p } = require('../db/database');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const q = req.query.studentId ? { studentId: parseInt(req.query.studentId) } : {};
    res.json(await p.find(db.goals, q, { createdAt: -1 }));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { studentId, text, dueDate } = req.body;
    if (!studentId || !text) return res.status(400).json({ error: 'studentId and text required' });
    const goal = await p.insert(db.goals, {
      studentId: parseInt(studentId), text,
      done: false, dueDate: dueDate || null,
      completedAt: null, createdAt: new Date(),
    });
    res.status(201).json(goal);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id/toggle', auth, async (req, res) => {
  try {
    const goal = await p.findOne(db.goals, { _id: req.params.id });
    if (!goal) return res.status(404).json({ error: 'Goal not found' });
    const done = !goal.done;
    await p.update(db.goals, { _id: req.params.id }, { $set: { done, completedAt: done ? new Date() : null } });
    res.json(await p.findOne(db.goals, { _id: req.params.id }));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await p.remove(db.goals, { _id: req.params.id });
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
