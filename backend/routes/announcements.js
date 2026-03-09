const router = require('express').Router();
const { db, p } = require('../db/database');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    res.json(await p.find(db.announcements, {}, { pinned: -1, createdAt: -1 }));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, body, pinned } = req.body;
    if (!title || !body) return res.status(400).json({ error: 'title and body required' });
    const ann = await p.insert(db.announcements, { title, body, author: req.user.name, pinned: !!pinned, createdAt: new Date() });
    res.status(201).json(ann);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { title, body, pinned } = req.body;
    await p.update(db.announcements, { _id: req.params.id }, { $set: { title, body, pinned: !!pinned, updatedAt: new Date() } });
    res.json(await p.findOne(db.announcements, { _id: req.params.id }));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await p.remove(db.announcements, { _id: req.params.id });
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
