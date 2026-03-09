const express = require('express');
const router  = express.Router();
const { db }  = require('../db/database');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
  try {
    const items = await db.find('announcements', {}, { order: 'created_at', asc: false });
    res.json({ success: true, data: items });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/', verifyToken, requireRole(['admin','mentor']), async (req, res) => {
  try {
    const ann = await db.insert('announcements', {
      author_id:   req.user.id,
      author_name: req.user.name,
      ...req.body
    });
    res.status(201).json({ success: true, data: ann });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    await db.delete('announcements', { id: req.params.id });
    res.json({ success: true, message: 'Announcement deleted' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
