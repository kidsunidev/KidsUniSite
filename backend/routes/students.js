const router = require('express').Router();
const { db, p } = require('../db/database');
const auth = require('../middleware/auth');

// helper: build full student object with all related data
async function buildStudentProfile(student) {
  const [skills, enrollments, achievements, goals, mentor, credentials] = await Promise.all([
    p.find(db.skills,        { studentId: student.studentId }),
    p.find(db.enrollments,   { studentId: student.studentId }),
    p.find(db.achievements,  { studentId: student.studentId }),
    p.find(db.goals,         { studentId: student.studentId }),
    p.findOne(db.mentorFeedback, { studentId: student.studentId }),
    p.find(db.credentials,   { studentId: student.studentId }),
  ]);

  // Reshape skills into { domain: { skillName: score } }
  const skillMap = {};
  for (const s of skills) {
    if (!skillMap[s.domain]) skillMap[s.domain] = {};
    skillMap[s.domain][s.skillName] = s.score;
  }

  // Compute composite score
  const allScores = skills.map(s => s.score);
  const composite = allScores.length
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
    : 0;

  return {
    ...student,
    skills: skillMap,
    composite,
    courses: enrollments.map(e => e.courseId),
    enrollments,
    achievements,
    goals,
    mentor: mentor || null,
    credentials,
  };
}

// GET /api/students  — list all (with optional filters)
router.get('/', auth, async (req, res) => {
  try {
    const { era, search, level } = req.query;
    let query = {};
    if (era) query.era = era;
    if (req.query.active !== undefined) query.active = req.query.active !== 'false';

    let students = await p.find(db.students, query, { name: 1 });

    if (search) {
      const q = search.toLowerCase();
      students = students.filter(s => s.name.toLowerCase().includes(q) || String(s.studentId).includes(q));
    }

    // Attach composite scores for list view
    const withScores = await Promise.all(students.map(async s => {
      const skills = await p.find(db.skills, { studentId: s.studentId });
      const scores = skills.map(sk => sk.score);
      const composite = scores.length ? Math.round(scores.reduce((a,b) => a+b,0) / scores.length) : 0;
      const level_ = composite >= 81 ? 'Advanced' : composite >= 51 ? 'Intermediate' : 'Beginner';
      return { ...s, composite, level: level_ };
    }));

    const filtered = level ? withScores.filter(s => s.level === level) : withScores;
    res.json({ count: filtered.length, students: filtered });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/students/:id  — full profile
router.get('/:id', auth, async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);
    const student = await p.findOne(db.students, { studentId });
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(await buildStudentProfile(student));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/students  — create student
router.post('/', auth, async (req, res) => {
  try {
    const { name, age, grade, era, programStart, programEnd, statement } = req.body;
    if (!name || !era) return res.status(400).json({ error: 'name and era required' });

    // Auto-increment studentId
    const all = await p.find(db.students, {});
    const maxId = all.length ? Math.max(...all.map(s => s.studentId)) : 1000;

    const student = await p.insert(db.students, {
      studentId: maxId + 1, name, age: parseInt(age) || null,
      grade: grade || '', era: era || 'Exploration',
      programStart: programStart || new Date().toISOString().split('T')[0],
      programEnd: programEnd || null,
      statement: statement || '',
      active: true, createdAt: new Date(),
    });

    // Log audit
    await p.insert(db.auditLog, { action: 'CREATE_STUDENT', studentId: student.studentId, by: req.user.name, at: new Date() });

    res.status(201).json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/students/:id  — update student
router.put('/:id', auth, async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);
    const { name, age, grade, era, programStart, programEnd, statement, active } = req.body;
    const update = {};
    if (name !== undefined)         update.name = name;
    if (age !== undefined)          update.age = parseInt(age);
    if (grade !== undefined)        update.grade = grade;
    if (era !== undefined)          update.era = era;
    if (programStart !== undefined) update.programStart = programStart;
    if (programEnd !== undefined)   update.programEnd = programEnd;
    if (statement !== undefined)    update.statement = statement;
    if (active !== undefined)       update.active = active;
    update.updatedAt = new Date();

    await p.update(db.students, { studentId }, { $set: update });
    const updated = await p.findOne(db.students, { studentId });
    if (!updated) return res.status(404).json({ error: 'Student not found' });

    await p.insert(db.auditLog, { action: 'UPDATE_STUDENT', studentId, fields: Object.keys(update), by: req.user.name, at: new Date() });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/students/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);
    const n = await p.remove(db.students, { studentId });
    if (!n) return res.status(404).json({ error: 'Student not found' });
    // Cascade remove related records
    await Promise.all([
      p.remove(db.skills,        { studentId }, { multi: true }),
      p.remove(db.enrollments,   { studentId }, { multi: true }),
      p.remove(db.achievements,  { studentId }, { multi: true }),
      p.remove(db.goals,         { studentId }, { multi: true }),
      p.remove(db.credentials,   { studentId }, { multi: true }),
      p.remove(db.evidence,      { studentId }, { multi: true }),
      p.remove(db.mentorFeedback,{ studentId }, { multi: true }),
    ]);
    await p.insert(db.auditLog, { action: 'DELETE_STUDENT', studentId, by: req.user.name, at: new Date() });
    res.json({ deleted: true, studentId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Skills ────────────────────────────────────────────────────

// GET /api/students/:id/skills
router.get('/:id/skills', auth, async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);
    const skills = await p.find(db.skills, { studentId });
    // Group by domain
    const grouped = {};
    for (const s of skills) {
      if (!grouped[s.domain]) grouped[s.domain] = {};
      grouped[s.domain][s.skillName] = { score: s.score, assessedAt: s.assessedAt, assessedBy: s.assessedBy };
    }
    res.json({ studentId, skills: grouped, raw: skills });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/students/:id/skills  — upsert a skill score
router.post('/:id/skills', auth, async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);
    const { domain, skillName, score } = req.body;
    if (!domain || !skillName || score === undefined) return res.status(400).json({ error: 'domain, skillName, score required' });
    if (score < 0 || score > 100) return res.status(400).json({ error: 'score must be 0-100' });

    const existing = await p.findOne(db.skills, { studentId, domain, skillName });
    if (existing) {
      await p.update(db.skills, { studentId, domain, skillName }, { $set: { score, assessedAt: new Date(), assessedBy: req.user.name } });
    } else {
      await p.insert(db.skills, { studentId, domain, skillName, score, assessedAt: new Date(), assessedBy: req.user.name });
    }

    // Update student ERA based on composite score
    const allSkills = await p.find(db.skills, { studentId });
    const avg = allSkills.reduce((a, s) => a + s.score, 0) / allSkills.length;
    const era = avg >= 75 ? 'Application' : avg >= 55 ? 'Reinforcement' : 'Exploration';
    await p.update(db.students, { studentId }, { $set: { era, updatedAt: new Date() } });

    await p.insert(db.auditLog, { action: 'UPDATE_SKILL', studentId, domain, skillName, score, by: req.user.name, at: new Date() });
    res.json({ studentId, domain, skillName, score });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Achievements ──────────────────────────────────────────────

// GET /api/students/:id/achievements
router.get('/:id/achievements', auth, async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);
    const achievements = await p.find(db.achievements, { studentId }, { date: -1 });
    res.json(achievements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/students/:id/achievements
router.post('/:id/achievements', auth, async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);
    const { title, category, description, date } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });
    const ach = await p.insert(db.achievements, { studentId, title, category: category || 'Badge', description: description || '', date: date || new Date().toISOString().split('T')[0], createdAt: new Date() });
    res.status(201).json(ach);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/students/:id/achievements/:achId
router.delete('/:id/achievements/:achId', auth, async (req, res) => {
  try {
    const n = await p.remove(db.achievements, { _id: req.params.achId });
    res.json({ deleted: n > 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Mentor Feedback ───────────────────────────────────────────

// GET /api/students/:id/mentor
router.get('/:id/mentor', auth, async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);
    const feedback = await p.findOne(db.mentorFeedback, { studentId });
    res.json(feedback || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/students/:id/mentor  — upsert mentor feedback
router.put('/:id/mentor', auth, async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);
    const { mentorName, mentorTitle, feedback, recommendations } = req.body;
    const existing = await p.findOne(db.mentorFeedback, { studentId });
    const data = { studentId, mentorName, mentorTitle, feedback, recommendations, updatedAt: new Date() };
    if (existing) {
      await p.update(db.mentorFeedback, { studentId }, { $set: data });
    } else {
      data.createdAt = new Date();
      await p.insert(db.mentorFeedback, data);
    }
    res.json(await p.findOne(db.mentorFeedback, { studentId }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
