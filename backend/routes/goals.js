const express = require('express');
const router  = express.Router();
const { db }  = require('../db/database');
const { verifyToken } = require('../middleware/auth');

router.get('/:studentId', verifyToken, async (req, res) => {
  try {
    const goals = await db.find('goals', { student_id: req.params.studentId }, { order: 'created_at', asc: false });
    res.json({ success: true, data: goals });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const goal = await db.insert('goals', req.body);
    res.status(201).json({ success: true, data: goal });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/:id/toggle', verifyToken, async (req, res) => {
  try {
    const goal = await db.findOne('goals', { id: req.params.id });
    if (!goal) return res.status(404).json({ success: false, error: 'Goal not found' });
    const updated = await db.update('goals', { id: req.params.id }, {
      completed: !goal.completed,
      completed_at: !goal.completed ? new Date().toISOString() : null
    });
    res.json({ success: true, data: updated });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await db.delete('goals', { id: req.params.id });
    res.json({ success: true, message: 'Goal deleted' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
