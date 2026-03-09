const router = require('express').Router();
const { db, p } = require('../db/database');
const auth = require('../middleware/auth');

// GET /api/courses
router.get('/', auth, async (req, res) => {
  try {
    const courses = await p.find(db.courses, {}, { courseId: 1 });
    // Attach enrollment counts
    const withCounts = await Promise.all(courses.map(async c => {
      const enrolled = await p.count(db.enrollments, { courseId: c.courseId });
      const completed = await p.count(db.enrollments, { courseId: c.courseId, status: 'completed' });
      return { ...c, enrolledCount: enrolled, completedCount: completed };
    }));
    res.json(withCounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/courses/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const course = await p.findOne(db.courses, { courseId: parseInt(req.params.id) });
    if (!course) return res.status(404).json({ error: 'Course not found' });
    const enrollments = await p.find(db.enrollments, { courseId: course.courseId });
    res.json({ ...course, enrollments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/courses
router.post('/', auth, async (req, res) => {
  try {
    const { title, category, duration, description, color, icon, credits, domain } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });
    const all = await p.find(db.courses, {});
    const maxId = all.length ? Math.max(...all.map(c => c.courseId)) : 0;
    const course = await p.insert(db.courses, {
      courseId: maxId + 1, title, category: category || 'General',
      duration: parseInt(duration) || 8, description: description || '',
      color: color || '#4fc3f7', icon: icon || '📚',
      credits: parseInt(credits) || 3, domain: domain || 'cognitive',
      active: true, createdAt: new Date(),
    });
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/courses/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    const update = { ...req.body, updatedAt: new Date() };
    delete update._id;
    await p.update(db.courses, { courseId }, { $set: update });
    res.json(await p.findOne(db.courses, { courseId }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/courses/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    await p.remove(db.courses, { courseId });
    await p.remove(db.enrollments, { courseId }, { multi: true });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/courses/:id/enroll
router.post('/:id/enroll', auth, async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ error: 'studentId required' });
    const existing = await p.findOne(db.enrollments, { studentId: parseInt(studentId), courseId });
    if (existing) return res.status(409).json({ error: 'Already enrolled' });
    const enrollment = await p.insert(db.enrollments, {
      studentId: parseInt(studentId), courseId,
      status: 'active', completedAt: null, grade: null, createdAt: new Date(),
    });
    res.status(201).json(enrollment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/courses/:id/enroll/:studentId  — update enrollment status
router.put('/:id/enroll/:studentId', auth, async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    const studentId = parseInt(req.params.studentId);
    const { status, grade } = req.body;
    const update = { status, updatedAt: new Date() };
    if (status === 'completed') update.completedAt = new Date();
    if (grade) update.grade = grade;
    await p.update(db.enrollments, { studentId, courseId }, { $set: update });
    res.json(await p.findOne(db.enrollments, { studentId, courseId }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
