const router = require('express').Router();
const { db, p } = require('../db/database');
const auth = require('../middleware/auth');

// GET /api/analytics/dashboard
router.get('/dashboard', auth, async (req, res) => {
  try {
    const [students, courses, credentials, evidence, enrollments, skills] = await Promise.all([
      p.find(db.students,    { active: true }),
      p.find(db.courses,     { active: true }),
      p.find(db.credentials, {}),
      p.find(db.evidence,    {}),
      p.find(db.enrollments, {}),
      p.find(db.skills,      {}),
    ]);

    // ERA distribution
    const eraDist = { Exploration: 0, Reinforcement: 0, Application: 0 };
    students.forEach(s => { if (eraDist[s.era] !== undefined) eraDist[s.era]++; });

    // Compute composite per student
    const studentScores = {};
    skills.forEach(s => {
      if (!studentScores[s.studentId]) studentScores[s.studentId] = [];
      studentScores[s.studentId].push(s.score);
    });
    const composites = Object.values(studentScores).map(sc => Math.round(sc.reduce((a,b)=>a+b,0)/sc.length));
    const avgScore = composites.length ? Math.round(composites.reduce((a,b)=>a+b,0)/composites.length) : 0;
    const advanced = composites.filter(s => s >= 81).length;
    const intermediate = composites.filter(s => s >= 51 && s < 81).length;
    const beginner = composites.filter(s => s < 51).length;

    // Domain averages across all students
    const domainScores = {};
    skills.forEach(s => {
      if (!domainScores[s.domain]) domainScores[s.domain] = [];
      domainScores[s.domain].push(s.score);
    });
    const domainAverages = Object.fromEntries(
      Object.entries(domainScores).map(([d, scores]) => [d, Math.round(scores.reduce((a,b)=>a+b,0)/scores.length)])
    );

    // Active enrollments
    const activeEnrollments = enrollments.filter(e => e.status === 'active').length;
    const completedEnrollments = enrollments.filter(e => e.status === 'completed').length;

    res.json({
      totals: {
        students: students.length, courses: courses.length,
        credentials: credentials.length, evidence: evidence.length,
      },
      scores: { average: avgScore, advanced, intermediate, beginner },
      eraDist,
      domainAverages,
      enrollments: { active: activeEnrollments, completed: completedEnrollments },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/analytics/leaderboard
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const students = await p.find(db.students, { active: true });
    const skills = await p.find(db.skills, {});

    const grouped = {};
    skills.forEach(s => {
      if (!grouped[s.studentId]) grouped[s.studentId] = [];
      grouped[s.studentId].push(s.score);
    });

    const board = students.map(s => {
      const sc = grouped[s.studentId] || [];
      const composite = sc.length ? Math.round(sc.reduce((a,b)=>a+b,0)/sc.length) : 0;
      return { studentId: s.studentId, name: s.name, grade: s.grade, era: s.era, composite, level: composite>=81?'Advanced':composite>=51?'Intermediate':'Beginner' };
    }).sort((a, b) => b.composite - a.composite).map((s, i) => ({ ...s, rank: i + 1 }));

    res.json(board);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/analytics/skill-heatmap
router.get('/skill-heatmap', auth, async (req, res) => {
  try {
    const skills = await p.find(db.skills, {});
    const heatmap = {};
    skills.forEach(s => {
      if (!heatmap[s.domain]) heatmap[s.domain] = {};
      if (!heatmap[s.domain][s.skillName]) heatmap[s.domain][s.skillName] = [];
      heatmap[s.domain][s.skillName].push(s.score);
    });
    const averaged = {};
    for (const [domain, skillObj] of Object.entries(heatmap)) {
      averaged[domain] = {};
      for (const [skill, scores] of Object.entries(skillObj)) {
        averaged[domain][skill] = Math.round(scores.reduce((a,b)=>a+b,0)/scores.length);
      }
    }
    res.json(averaged);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/analytics/student/:id/progress  — skill history over time
router.get('/student/:id/progress', auth, async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);
    const skills = await p.find(db.skills, { studentId }, { assessedAt: 1 });
    res.json(skills);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
