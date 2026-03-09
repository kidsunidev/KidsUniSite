const express = require('express');
const router  = express.Router();
const { db }  = require('../db/database');
const { verifyToken } = require('../middleware/auth');

router.get('/:studentId', verifyToken, async (req, res) => {
  try {
    const student = await db.findOne('students', { id: req.params.studentId });
    if (!student) return res.status(404).json({ success: false, error: 'Student not found' });

    const [skills, achievements, credentials, evidence, feedback, gradProfile] = await Promise.all([
      db.find('skills',          { student_id: student.id }),
      db.find('achievements',    { student_id: student.id }),
      db.find('credentials',     { student_id: student.id }),
      db.find('evidence',        { student_id: student.id }),
      db.find('mentor_feedback', { student_id: student.id }),
      db.findOne('grad_profiles',{ student_id: student.id }),
    ]);

    const avgScore = skills.length ? Math.round(skills.reduce((a,b) => a + b.score, 0) / skills.length) : 0;
    const overallLevel = avgScore >= 81 ? 'Advanced' : avgScore >= 51 ? 'Intermediate' : 'Beginner';

    // Group skills by domain
    const skillsByDomain = skills.reduce((acc, sk) => {
      if (!acc[sk.domain]) acc[sk.domain] = [];
      acc[sk.domain].push(sk);
      return acc;
    }, {});

    res.json({ success: true, data: {
      student,
      generated_at: new Date().toISOString(),
      summary: { avg_score: avgScore, overall_level: overallLevel, skill_count: skills.length },
      skills_by_domain: skillsByDomain,
      achievements,
      credentials,
      evidence,
      mentor_feedback: feedback,
      graduate_profile: gradProfile,
      share_url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/transcript/${student.student_id}`
    }});
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
