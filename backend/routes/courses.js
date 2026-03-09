const express = require('express');
const router  = express.Router();
const { db }  = require('../db/database');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
  try {
    const courses = await db.find('courses', {}, { order: 'title', asc: true });
    res.json({ success: true, data: courses });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const course = await db.findOne('courses', { id: req.params.id });
    if (!course) return res.status(404).json({ success: false, error: 'Course not found' });
    const enrollments = await db.find('enrollments', { course_id: course.id });
    res.json({ success: true, data: { ...course, enrollment_count: enrollments.length }});
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/', verifyToken, requireRole(['admin','mentor']), async (req, res) => {
  try {
    const course = await db.insert('courses', req.body);
    res.status(201).json({ success: true, data: course });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/:id', verifyToken, requireRole(['admin','mentor']), async (req, res) => {
  try {
    const updated = await db.update('courses', { id: req.params.id }, req.body);
    res.json({ success: true, data: updated });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/:id/enroll', verifyToken, async (req, res) => {
  try {
    const { student_id } = req.body;
    const enrollment = await db.upsert('enrollments', {
      student_id, course_id: req.params.id, status: 'enrolled', progress: 0
    }, 'student_id,course_id');
    res.status(201).json({ success: true, data: enrollment });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
