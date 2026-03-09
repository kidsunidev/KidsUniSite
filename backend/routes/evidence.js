const express = require('express');
const router  = express.Router();
const { db }  = require('../db/database');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
  try {
    const { student_id } = req.query;
    const filters = student_id ? { student_id } : {};
    const items = await db.find('evidence', filters, { order: 'created_at', asc: false });
    res.json({ success: true, data: items });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const item = await db.insert('evidence', req.body);
    res.status(201).json({ success: true, data: item });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await db.delete('evidence', { id: req.params.id });
    res.json({ success: true, message: 'Evidence deleted' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
