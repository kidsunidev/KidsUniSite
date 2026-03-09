const router = require('express').Router();
const { db, p } = require('../db/database');
const auth = require('../middleware/auth');

const DOMAINS = [
  { id: 'cognitive',  label: 'Cognitive Skills',   icon: '🧠' },
  { id: 'social',     label: 'Social Skills',       icon: '🤝' },
  { id: 'emotional',  label: 'Emotional Skills',    icon: '💚' },
  { id: 'technical',  label: 'Technical Skills',    icon: '💻' },
  { id: 'global',     label: 'Global Citizenship',  icon: '🌍' },
  { id: 'practical',  label: 'Practical Skills',    icon: '⚙️' },
  { id: 'health',     label: 'Health & Well-being', icon: '🌱' },
];

function calcLevel(score) {
  if (score >= 81) return 'Advanced';
  if (score >= 51) return 'Intermediate';
  return 'Beginner';
}

function calcMTC(score) {
  if (score >= 90) return 'Mastery';
  if (score >= 75) return 'Proficient';
  if (score >= 55) return 'Developing';
  if (score >= 30) return 'Foundational';
  return 'Not Started';
}

// GET /api/transcripts/:studentId
router.get('/:studentId', auth, async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);

    const [student, skills, enrollments, achievements, goals, mentor, credentials, evidence] = await Promise.all([
      p.findOne(db.students,       { studentId }),
      p.find(db.skills,            { studentId }),
      p.find(db.enrollments,       { studentId }),
      p.find(db.achievements,      { studentId }),
      p.find(db.goals,             { studentId }),
      p.findOne(db.mentorFeedback, { studentId }),
      p.find(db.credentials,       { studentId }),
      p.find(db.evidence,          { studentId }),
    ]);

    if (!student) return res.status(404).json({ error: 'Student not found' });

    // Build domain skill map
    const skillMap = {};
    for (const s of skills) {
      if (!skillMap[s.domain]) skillMap[s.domain] = [];
      skillMap[s.domain].push({ name: s.skillName, score: s.score, level: calcLevel(s.score), mtcLevel: calcMTC(s.score), assessedBy: s.assessedBy, assessedAt: s.assessedAt });
    }

    // Domain averages
    const domainAverages = DOMAINS.map(d => {
      const domSkills = skillMap[d.id] || [];
      const avg = domSkills.length ? Math.round(domSkills.reduce((a, s) => a + s.score, 0) / domSkills.length) : 0;
      return { ...d, average: avg, level: calcLevel(avg), skills: domSkills };
    });

    // Composite score
    const allScores = skills.map(s => s.score);
    const composite = allScores.length ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;

    // Courses with names
    const courseIds = enrollments.map(e => e.courseId);
    const courses = await p.find(db.courses, { courseId: { $in: courseIds } });
    const courseMap = Object.fromEntries(courses.map(c => [c.courseId, c]));
    const enrichedEnrollments = enrollments.map(e => ({ ...e, course: courseMap[e.courseId] || null }));

    // Graduate profile scores (mapped from skill domains)
    const gradProfiles = [
      { name: 'Innovative Thinkers',         score: Math.round(((skillMap.cognitive?.[0]?.score||0) + (skillMap.cognitive?.[1]?.score||0)) / 2) },
      { name: 'Entrepreneurial Mindset',      score: Math.round(((skillMap.practical?.[1]?.score||0) + (skillMap.cognitive?.[2]?.score||0)) / 2) },
      { name: 'Technologically Proficient',   score: Math.round(((skillMap.technical?.[0]?.score||0) + (skillMap.technical?.[1]?.score||0)) / 2) },
      { name: 'Collaborative Team Players',   score: Math.round(((skillMap.social?.[0]?.score||0) + (skillMap.emotional?.[0]?.score||0)) / 2) },
      { name: 'Globally Aware Citizens',      score: Math.round(((skillMap.global?.[0]?.score||0) + (skillMap.global?.[1]?.score||0)) / 2) },
      { name: 'Lifelong Learners',            score: Math.round(((skillMap.emotional?.[3]?.score||0) + (skillMap.cognitive?.[3]?.score||0)) / 2) },
      { name: 'Effective Communicators',      score: Math.round(((skillMap.social?.[1]?.score||0) + (skillMap.social?.[2]?.score||0)) / 2) },
      { name: 'Ethical Leaders',              score: Math.round(((skillMap.global?.[2]?.score||0) + (skillMap.practical?.[3]?.score||0)) / 2) },
    ];

    res.json({
      generatedAt: new Date().toISOString(),
      clrCertified: true,
      student: {
        studentId, name: student.name, age: student.age, grade: student.grade,
        era: student.era, programStart: student.programStart, programEnd: student.programEnd,
        statement: student.statement,
      },
      composite, overallLevel: calcLevel(composite),
      domains: domainAverages,
      enrollments: enrichedEnrollments,
      achievements,
      goals: { total: goals.length, completed: goals.filter(g => g.done).length, list: goals },
      credentials,
      evidence,
      mentor: mentor || null,
      gradProfiles,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/transcripts/:studentId/share  — generate shareable token
router.get('/:studentId/share', auth, async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    const studentId = parseInt(req.params.studentId);
    const token = jwt.sign({ studentId, type: 'transcript-share' }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ shareUrl: `https://kidsuni.edu/transcript/shared/${token}`, expiresIn: '30 days' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
