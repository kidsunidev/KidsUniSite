const express = require('express');
const router  = express.Router();
const { db }  = require('../db/database');
const { verifyToken, requireRole } = require('../middleware/auth');

// GET /api/students
router.get('/', verifyToken, async (req, res) => {
  try {
    const students = await db.find('students', {}, { order: 'name', asc: true });
    // attach skill summary
    for (const s of students) {
      const skills = await db.find('skills', { student_id: s.id });
      s.skills = skills;
      s.avgScore = skills.length ? Math.round(skills.reduce((a,b) => a + b.score, 0) / skills.length) : 0;
    }
    res.json({ success: true, data: students });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/students/:id
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const student = await db.findOne('students', { id: req.params.id });
    if (!student) return res.status(404).json({ success: false, error: 'Student not found' });

    const [skills, achievements, credentials, evidence, goals, feedback, gradProfile, enrollments] =
      await Promise.all([
        db.find('skills',          { student_id: student.id }),
        db.find('achievements',    { student_id: student.id }),
        db.find('credentials',     { student_id: student.id }),
        db.find('evidence',        { student_id: student.id }),
        db.find('goals',           { student_id: student.id }),
        db.find('mentor_feedback', { student_id: student.id }),
        db.findOne('grad_profiles',{ student_id: student.id }),
        db.find('enrollments',     { student_id: student.id }),
      ]);

    res.json({ success: true, data: { ...student, skills, achievements, credentials, evidence, goals, feedback, gradProfile, enrollments }});
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/students
router.post('/', verifyToken, requireRole(['admin','mentor']), async (req, res) => {
  try {
    const { name, age, grade, email, era, program_start, program_end } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Name is required' });
    const count = await db.count('students');
    const student_id = `KU-${new Date().getFullYear()}-${String(count + 1).padStart(3,'0')}`;
    const student = await db.insert('students', { name, age, grade, email, era: era || 'Exploration', program_start, program_end, student_id });
    res.status(201).json({ success: true, data: student });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PUT /api/students/:id
router.put('/:id', verifyToken, requireRole(['admin','mentor']), async (req, res) => {
  try {
    const updated = await db.update('students', { id: req.params.id }, req.body);
    res.json({ success: true, data: updated });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// DELETE /api/students/:id
router.delete('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    await db.delete('students', { id: req.params.id });
    res.json({ success: true, message: 'Student deleted' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PUT /api/students/:id/skills
router.put('/:id/skills', verifyToken, requireRole(['admin','mentor']), async (req, res) => {
  try {
    const { skills } = req.body; // array of { domain, skill_name, score, evidence }
    const results = [];
    for (const sk of skills) {
      const row = await db.upsert('skills', { student_id: req.params.id, ...sk }, 'student_id,skill_name');
      results.push(row);
    }
    res.json({ success: true, data: results });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/students/:id/achievements
router.post('/:id/achievements', verifyToken, requireRole(['admin','mentor']), async (req, res) => {
  try {
    const ach = await db.insert('achievements', { student_id: req.params.id, ...req.body });
    res.status(201).json({ success: true, data: ach });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/students/:id/feedback
router.post('/:id/feedback', verifyToken, requireRole(['admin','mentor']), async (req, res) => {
  try {
    const fb = await db.insert('mentor_feedback', {
      student_id:  req.params.id,
      mentor_name: req.user.name || 'Mentor',
      ...req.body
    });
    res.status(201).json({ success: true, data: fb });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
