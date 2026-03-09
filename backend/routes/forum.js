// ── forum.js ──────────────────────────────────────────────────
const forumRouter = require('express').Router();
const { db, p }   = require('../db/database');
const auth        = require('../middleware/auth');

forumRouter.get('/', auth, async (req, res) => {
  try {
    res.json(await p.find(db.forum, {}, { createdAt: -1 }));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

forumRouter.post('/', auth, async (req, res) => {
  try {
    const { title, body, tags } = req.body;
    if (!title || !body) return res.status(400).json({ error: 'title and body required' });
    const post = await p.insert(db.forum, {
      authorId: req.user.id, authorName: req.user.name,
      title, body, likes: 0, replies: [], tags: tags || [], createdAt: new Date(),
    });
    res.status(201).json(post);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

forumRouter.post('/:id/like', auth, async (req, res) => {
  try {
    await p.update(db.forum, { _id: req.params.id }, { $inc: { likes: 1 } });
    res.json(await p.findOne(db.forum, { _id: req.params.id }));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

forumRouter.post('/:id/reply', auth, async (req, res) => {
  try {
    const { text } = req.body;
    const reply = { author: req.user.name, text, createdAt: new Date() };
    await p.update(db.forum, { _id: req.params.id }, { $push: { replies: reply } });
    res.json(await p.findOne(db.forum, { _id: req.params.id }));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

forumRouter.delete('/:id', auth, async (req, res) => {
  try {
    await p.remove(db.forum, { _id: req.params.id });
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = forumRouter;
