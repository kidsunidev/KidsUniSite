const express = require('express');
const router  = express.Router();
const { db }  = require('../db/database');
const { verifyToken } = require('../middleware/auth');

router.get('/dashboard', verifyToken, async (req, res) => {
  try {
    const [studentCount, courseCount, credentialCount, evidenceCount] = await Promise.all([
      db.count('students'),
      db.count('courses'),
      db.count('credentials'),
      db.count('evidence'),
    ]);

    // ERA breakdown
    const students = await db.find('students');
    const era = { Exploration: 0, Reinforcement: 0, Application: 0 };
    students.forEach(s => { if (era[s.era] !== undefined) era[s.era]++; });

    // Top performers via view
    const { data: topStudents } = await db.client
      .from('student_summary')
      .select('*')
      .order('avg_score', { ascending: false })
      .limit(5);

    res.json({ success: true, data: {
      totals: { students: studentCount, courses: courseCount, credentials: credentialCount, evidence: evidenceCount },
      era_breakdown: era,
      top_students: topStudents || []
    }});
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/leaderboard', verifyToken, async (req, res) => {
  try {
    const { data, error } = await db.client
      .from('student_summary')
      .select('*')
      .order('avg_score', { ascending: false })
      .limit(10);
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/skills-heatmap', verifyToken, async (req, res) => {
  try {
    const skills = await db.find('skills');
    // group by domain, average score
    const domains = {};
    skills.forEach(sk => {
      if (!domains[sk.domain]) domains[sk.domain] = { total: 0, count: 0 };
      domains[sk.domain].total += sk.score;
      domains[sk.domain].count++;
    });
    const heatmap = Object.entries(domains).map(([domain, v]) => ({
      domain, avg_score: Math.round(v.total / v.count), count: v.count
    }));
    res.json({ success: true, data: heatmap });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
