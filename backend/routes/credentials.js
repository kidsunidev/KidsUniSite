const express = require('express');
const router  = express.Router();
const { db }  = require('../db/database');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
  try {
    const { student_id } = req.query;
    const filters = student_id ? { student_id } : {};
    const creds = await db.find('credentials', filters, { order: 'issued_at', asc: false });
    res.json({ success: true, data: creds });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/', verifyToken, requireRole(['admin','mentor']), async (req, res) => {
  try {
    const cred = await db.insert('credentials', req.body);
    res.status(201).json({ success: true, data: cred });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/:id/revoke', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const updated = await db.update('credentials', { id: req.params.id }, { is_revoked: true });
    res.json({ success: true, data: updated });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/verify/:id', async (req, res) => {
  try {
    const cred = await db.findOne('credentials', { id: req.params.id });
    if (!cred) return res.status(404).json({ success: false, error: 'Credential not found' });
    res.json({ success: true, valid: !cred.is_revoked, data: cred });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
