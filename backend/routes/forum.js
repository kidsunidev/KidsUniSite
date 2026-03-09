const express = require('express');
const router  = express.Router();
const { db }  = require('../db/database');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
  try {
    const posts = await db.find('forum', {}, { order: 'created_at', asc: false });
    res.json({ success: true, data: posts });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const post = await db.insert('forum', {
      author_name: req.user.name,
      author_role: req.user.role,
      author_id:   req.user.id,
      ...req.body
    });
    res.status(201).json({ success: true, data: post });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/:id/like', verifyToken, async (req, res) => {
  try {
    const post = await db.findOne('forum', { id: req.params.id });
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
    const updated = await db.update('forum', { id: req.params.id }, { likes: post.likes + 1 });
    res.json({ success: true, data: updated });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/:id/replies', verifyToken, async (req, res) => {
  try {
    const replies = await db.find('forum_replies', { post_id: req.params.id }, { order: 'created_at', asc: true });
    res.json({ success: true, data: replies });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/:id/replies', verifyToken, async (req, res) => {
  try {
    const reply = await db.insert('forum_replies', {
      post_id:     req.params.id,
      author_id:   req.user.id,
      author_name: req.user.name,
      content:     req.body.content
    });
    // increment reply_count
    const post = await db.findOne('forum', { id: req.params.id });
    await db.update('forum', { id: req.params.id }, { reply_count: (post.reply_count || 0) + 1 });
    res.status(201).json({ success: true, data: reply });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
