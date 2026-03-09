/**
 * Kids University — Database Layer
 * Uses NeDB (embedded, file-persisted document store)
 * Zero native dependencies — runs anywhere Node.js runs
 */

const Datastore = require('nedb');
const path      = require('path');
const bcrypt    = require('bcryptjs');

const DB_PATH = process.env.DB_PATH || './db/data';

// ── Collection definitions ────────────────────────────────────
const db = {
  users:         null,
  students:      null,
  skills:        null,   // skill scores per student per domain
  courses:       null,
  enrollments:   null,   // student ↔ course
  achievements:  null,
  goals:         null,
  credentials:   null,   // open badges / mastery credits
  evidence:      null,   // portfolio evidence items
  mentorFeedback:null,
  forum:         null,
  announcements: null,
  notifications: null,
  gradProfiles:  null,   // graduate attribute progress
  auditLog:      null,
};

// ── Promisified NeDB helpers ──────────────────────────────────
const p = {
  insert:  (col, doc)           => new Promise((res, rej) => col.insert(doc,          (e,d) => e ? rej(e) : res(d))),
  find:    (col, q={}, sort={}) => new Promise((res, rej) => col.find(q).sort(sort).exec((e,d) => e ? rej(e) : res(d))),
  findOne: (col, q)             => new Promise((res, rej) => col.findOne(q,           (e,d) => e ? rej(e) : res(d))),
  update:  (col, q, u, opt={}) => new Promise((res, rej) => col.update(q, u, opt,    (e,n) => e ? rej(e) : res(n))),
  remove:  (col, q, opt={})    => new Promise((res, rej) => col.remove(q, opt,       (e,n) => e ? rej(e) : res(n))),
  count:   (col, q={})         => new Promise((res, rej) => col.count(q,             (e,n) => e ? rej(e) : res(n))),
};

// ── Init DB ───────────────────────────────────────────────────
async function initDB() {
  console.log('📦 Initialising Kids Uni database…');

  // Create all collections (auto-compaction every 10 min)
  const collections = {
    users:          'users.db',
    students:       'students.db',
    skills:         'skills.db',
    courses:        'courses.db',
    enrollments:    'enrollments.db',
    achievements:   'achievements.db',
    goals:          'goals.db',
    credentials:    'credentials.db',
    evidence:       'evidence.db',
    mentorFeedback: 'mentor_feedback.db',
    forum:          'forum.db',
    announcements:  'announcements.db',
    notifications:  'notifications.db',
    gradProfiles:   'grad_profiles.db',
    auditLog:       'audit_log.db',
  };

  for (const [key, file] of Object.entries(collections)) {
    db[key] = new Datastore({
      filename: path.join(DB_PATH, file),
      autoload: true,
    });
    db[key].persistence.setAutocompactionInterval(600000);
  }

  // Create indexes for performance
  db.users.ensureIndex(         { fieldName: 'email',     unique: true });
  db.students.ensureIndex(      { fieldName: 'studentId', unique: true });
  db.students.ensureIndex(      { fieldName: 'name' });
  db.students.ensureIndex(      { fieldName: 'era' });
  db.skills.ensureIndex(        { fieldName: 'studentId' });
  db.enrollments.ensureIndex(   { fieldName: 'studentId' });
  db.enrollments.ensureIndex(   { fieldName: 'courseId' });
  db.achievements.ensureIndex(  { fieldName: 'studentId' });
  db.goals.ensureIndex(         { fieldName: 'studentId' });
  db.credentials.ensureIndex(   { fieldName: 'studentId' });
  db.evidence.ensureIndex(      { fieldName: 'studentId' });
  db.mentorFeedback.ensureIndex({ fieldName: 'studentId' });
  db.forum.ensureIndex(         { fieldName: 'createdAt' });
  db.gradProfiles.ensureIndex(  { fieldName: 'studentId' });
  db.auditLog.ensureIndex(      { fieldName: 'createdAt' });

  await seedIfEmpty();
  console.log('✅ Database ready\n');
}

// ── Seed Data ─────────────────────────────────────────────────
async function seedIfEmpty() {
  const userCount = await p.count(db.users);
  if (userCount > 0) {
    console.log(`   ↳ Database already seeded (${userCount} users)`);
    return;
  }

  console.log('   ↳ Seeding initial data…');

  // ── Users (admins, mentors) ───────────────────────────────
  const passwordHash = await bcrypt.hash('kidsuni2024', 10);
  await p.insert(db.users, [
    { email: 'admin@kidsuni.edu',    password: passwordHash, name: 'Admin User',       role: 'admin',   createdAt: new Date() },
    { email: 'anjali@kidsuni.edu',   password: passwordHash, name: 'Ms. Anjali Mehta', role: 'mentor',  createdAt: new Date() },
    { email: 'priya@kidsuni.edu',    password: passwordHash, name: 'Dr. Priya Nair',   role: 'mentor',  createdAt: new Date() },
    { email: 'vikram@kidsuni.edu',   password: passwordHash, name: 'Mr. Vikram Singh', role: 'mentor',  createdAt: new Date() },
    { email: 'preethi@kidsuni.edu',  password: passwordHash, name: 'Ms. Preethi Rajan',role: 'mentor',  createdAt: new Date() },
    { email: 'james@kidsuni.edu',    password: passwordHash, name: 'Dr. James Wong',   role: 'mentor',  createdAt: new Date() },
    { email: 'fatimah@kidsuni.edu',  password: passwordHash, name: 'Ms. Fatimah Aziz', role: 'mentor',  createdAt: new Date() },
  ]);

  // ── Courses ───────────────────────────────────────────────
  await p.insert(db.courses, [
    { courseId: 1, title: 'Python for Kids',        category: 'Coding',            duration: 10, description: 'Learn Python programming through fun projects and games.',                            color: '#00c9a7', icon: '🐍', credits: 4, domain: 'technical', active: true, createdAt: new Date() },
    { courseId: 2, title: 'AI & Robotics Explorer', category: 'AI & Technology',   duration: 8,  description: 'Discover artificial intelligence and build your first robot.',                        color: '#4fc3f7', icon: '🤖', credits: 5, domain: 'technical', active: true, createdAt: new Date() },
    { courseId: 3, title: 'Kidspreneur MBA',         category: 'Entrepreneurship',  duration: 12, description: 'Think like an entrepreneur — build business plans and pitch ideas.',                  color: '#f5c842', icon: '💼', credits: 6, domain: 'practical', active: true, createdAt: new Date() },
    { courseId: 4, title: 'Creative Ninja',          category: 'Creative Arts',     duration: 6,  description: 'Unleash creativity through design thinking, art and storytelling.',                   color: '#b39ddb', icon: '🎨', credits: 3, domain: 'cognitive', active: true, createdAt: new Date() },
    { courseId: 5, title: 'Global Citizens',         category: 'Global Citizenship',duration: 8,  description: 'Explore cultural diversity, global issues and sustainability.',                       color: '#66bb6a', icon: '🌍', credits: 4, domain: 'global',    active: true, createdAt: new Date() },
    { courseId: 6, title: 'Arkidtechture',           category: 'Science',           duration: 10, description: 'Learn architecture and engineering through design projects.',                         color: '#ff8a65', icon: '🏛️', credits: 4, domain: 'cognitive', active: true, createdAt: new Date() },
  ]);

  // ── Students ──────────────────────────────────────────────
  const students = [
    { studentId: 1001, name: 'Rohan Sharma',      age: 12, grade: 'Grade 7',  era: 'Application',  programStart: '2024-01-15', programEnd: '2024-12-15', statement: "I love building apps and solving real-world problems through technology and creativity.",   active: true, createdAt: new Date('2024-01-15') },
    { studentId: 1002, name: 'Emily Johnson',     age: 14, grade: 'Grade 9',  era: 'Application',  programStart: '2023-08-01', programEnd: '2024-07-31', statement: 'Passionate about using design thinking to solve community problems and inspire creativity in others.', active: true, createdAt: new Date('2023-08-01') },
    { studentId: 1003, name: 'Arjun Patel',       age: 11, grade: 'Grade 6',  era: 'Reinforcement',programStart: '2024-03-01', programEnd: null,          statement: 'I want to build robots that help people and learn everything about artificial intelligence.',   active: true, createdAt: new Date('2024-03-01') },
    { studentId: 1004, name: 'Sana Malik',        age: 13, grade: 'Grade 8',  era: 'Reinforcement',programStart: '2024-02-01', programEnd: null,          statement: 'I believe every child deserves quality education, and I want to use entrepreneurship to make that happen.', active: true, createdAt: new Date('2024-02-01') },
    { studentId: 1005, name: 'Lucas Chen',        age: 15, grade: 'Grade 10', era: 'Application',  programStart: '2023-06-01', programEnd: '2024-05-31', statement: 'Data is the language of the future, and I am determined to become fluent in it.',           active: true, createdAt: new Date('2023-06-01') },
    { studentId: 1006, name: 'Aisha Binte Omar',  age: 10, grade: 'Grade 5',  era: 'Exploration',  programStart: '2024-05-01', programEnd: null,          statement: 'I love drawing and telling stories, and I want to learn how art and technology work together.', active: true, createdAt: new Date('2024-05-01') },
  ];
  await p.insert(db.students, students);

  // ── Skill Scores ──────────────────────────────────────────
  const skillData = [
    { studentId: 1001, domain: 'cognitive',  skillName: 'Critical Thinking',        score: 88, assessedAt: new Date('2024-06-01'), assessedBy: 'Ms. Anjali Mehta' },
    { studentId: 1001, domain: 'cognitive',  skillName: 'Creativity & Innovation',  score: 91, assessedAt: new Date('2024-06-01'), assessedBy: 'Ms. Anjali Mehta' },
    { studentId: 1001, domain: 'cognitive',  skillName: 'Problem-Solving',          score: 85, assessedAt: new Date('2024-06-01'), assessedBy: 'Ms. Anjali Mehta' },
    { studentId: 1001, domain: 'cognitive',  skillName: 'Analytical Reasoning',     score: 79, assessedAt: new Date('2024-06-01'), assessedBy: 'Ms. Anjali Mehta' },
    { studentId: 1001, domain: 'social',     skillName: 'Collaboration',            score: 82, assessedAt: new Date('2024-06-01'), assessedBy: 'Ms. Anjali Mehta' },
    { studentId: 1001, domain: 'social',     skillName: 'Communication (Verbal)',   score: 76, assessedAt: new Date('2024-06-01'), assessedBy: 'Ms. Anjali Mehta' },
    { studentId: 1001, domain: 'social',     skillName: 'Communication (Written)',  score: 72, assessedAt: new Date('2024-06-01'), assessedBy: 'Ms. Anjali Mehta' },
    { studentId: 1001, domain: 'social',     skillName: 'Empathy',                  score: 68, assessedAt: new Date('2024-06-01'), assessedBy: 'Ms. Anjali Mehta' },
    { studentId: 1001, domain: 'emotional',  skillName: 'Resilience',               score: 80, assessedAt: new Date('2024-06-01'), assessedBy: 'Ms. Anjali Mehta' },
    { studentId: 1001, domain: 'emotional',  skillName: 'Self-Awareness',           score: 74, assessedAt: new Date('2024-06-01'), assessedBy: 'Ms. Anjali Mehta' },
    { studentId: 1001, domain: 'emotional',  skillName: 'Adaptability',             score: 83, assessedAt: new Date('2024-06-01'), assessedBy: 'Ms. Anjali Mehta' },
    { studentId: 1001, domain: 'emotional',  skillName: 'Stress Management',        score: 70, assessedAt: new Date('2024-06-01'), assessedBy: 'Ms. Anjali Mehta' },
    { studentId: 1001, domain: 'technical',  skillName: 'Digital Literacy',         score: 93, assessedAt: new Date('2024-06-01'), assessedBy: 'Ms. Anjali Mehta' },
    { studentId: 1001, domain: 'technical',  skillName: 'Coding & Programming',     score: 90, assessedAt: new Date('2024-06-01'), assessedBy: 'Ms. Anjali Mehta' },
    { studentId: 1001, domain: 'technical',  skillName: 'Data Analysis',            score: 78, assessedAt: new Date('2024-06-01'), assessedBy: 'Ms. Anjali Mehta' },
    { studentId: 1001, domain: 'technical',  skillName: 'AI Literacy',              score: 72, assessedAt: new Date('2024-06-01'), assessedBy: 'Ms. Anjali Mehta' },
    { studentId: 1001, domain: 'global',     skillName: 'Cultural Intelligence',    score: 65, assessedAt: new Date('2024-06-01'), assessedBy: 'Ms. Anjali Mehta' },
    { studentId: 1001, domain: 'global',     skillName: 'Sustainability',           score: 71, assessedAt: new Date('2024-06-01'), assessedBy: 'Ms. Anjali Mehta' },
    { studentId: 1001, domain: 'global',     skillName: 'Ethical Reasoning',        score: 80, assessedAt: new Date('2024-06-01'), assessedBy: 'Ms. Anjali Mehta' },
    { studentId: 1001, domain: 'global',     skillName: 'Global Collaboration',     score: 67, assessedAt: new Date('2024-06-01'), assessedBy: 'Ms. Anjali Mehta' },
    { studentId: 1001, domain: 'practical',  skillName: 'Financial Literacy',       score: 74, assessedAt: new Date('2024-06-01'), assessedBy: 'Ms. Anjali Mehta' },
    { studentId: 1001, domain: 'practical',  skillName: 'Entrepreneurship',         score: 88, assessedAt: new Date('2024-06-01'), assessedBy: 'Ms. Anjali Mehta' },
    { studentId: 1001, domain: 'practical',  skillName: 'Time Management',          score: 77, assessedAt: new Date('2024-06-01'), assessedBy: 'Ms. Anjali Mehta' },
    { studentId: 1001, domain: 'practical',  skillName: 'Leadership',               score: 82, assessedAt: new Date('2024-06-01'), assessedBy: 'Ms. Anjali Mehta' },
    { studentId: 1001, domain: 'health',     skillName: 'Physical Health',          score: 75, assessedAt: new Date('2024-06-01'), assessedBy: 'Ms. Anjali Mehta' },
    { studentId: 1001, domain: 'health',     skillName: 'Mental Health Awareness',  score: 70, assessedAt: new Date('2024-06-01'), assessedBy: 'Ms. Anjali Mehta' },
    { studentId: 1001, domain: 'health',     skillName: 'Mindfulness',              score: 65, assessedAt: new Date('2024-06-01'), assessedBy: 'Ms. Anjali Mehta' },
    { studentId: 1001, domain: 'health',     skillName: 'Nutrition Awareness',      score: 68, assessedAt: new Date('2024-06-01'), assessedBy: 'Ms. Anjali Mehta' },
    // Emily Johnson (1002)
    { studentId: 1002, domain: 'cognitive',  skillName: 'Critical Thinking',        score: 92, assessedAt: new Date('2024-03-01'), assessedBy: 'Dr. Priya Nair' },
    { studentId: 1002, domain: 'cognitive',  skillName: 'Creativity & Innovation',  score: 96, assessedAt: new Date('2024-03-01'), assessedBy: 'Dr. Priya Nair' },
    { studentId: 1002, domain: 'cognitive',  skillName: 'Problem-Solving',          score: 89, assessedAt: new Date('2024-03-01'), assessedBy: 'Dr. Priya Nair' },
    { studentId: 1002, domain: 'cognitive',  skillName: 'Analytical Reasoning',     score: 84, assessedAt: new Date('2024-03-01'), assessedBy: 'Dr. Priya Nair' },
    { studentId: 1002, domain: 'social',     skillName: 'Collaboration',            score: 90, assessedAt: new Date('2024-03-01'), assessedBy: 'Dr. Priya Nair' },
    { studentId: 1002, domain: 'social',     skillName: 'Communication (Verbal)',   score: 94, assessedAt: new Date('2024-03-01'), assessedBy: 'Dr. Priya Nair' },
    { studentId: 1002, domain: 'social',     skillName: 'Communication (Written)',  score: 91, assessedAt: new Date('2024-03-01'), assessedBy: 'Dr. Priya Nair' },
    { studentId: 1002, domain: 'social',     skillName: 'Empathy',                  score: 88, assessedAt: new Date('2024-03-01'), assessedBy: 'Dr. Priya Nair' },
    { studentId: 1002, domain: 'emotional',  skillName: 'Resilience',               score: 86, assessedAt: new Date('2024-03-01'), assessedBy: 'Dr. Priya Nair' },
    { studentId: 1002, domain: 'emotional',  skillName: 'Self-Awareness',           score: 89, assessedAt: new Date('2024-03-01'), assessedBy: 'Dr. Priya Nair' },
    { studentId: 1002, domain: 'emotional',  skillName: 'Adaptability',             score: 91, assessedAt: new Date('2024-03-01'), assessedBy: 'Dr. Priya Nair' },
    { studentId: 1002, domain: 'emotional',  skillName: 'Stress Management',        score: 82, assessedAt: new Date('2024-03-01'), assessedBy: 'Dr. Priya Nair' },
    { studentId: 1002, domain: 'technical',  skillName: 'Digital Literacy',         score: 85, assessedAt: new Date('2024-03-01'), assessedBy: 'Dr. Priya Nair' },
    { studentId: 1002, domain: 'technical',  skillName: 'Coding & Programming',     score: 72, assessedAt: new Date('2024-03-01'), assessedBy: 'Dr. Priya Nair' },
    { studentId: 1002, domain: 'technical',  skillName: 'Data Analysis',            score: 68, assessedAt: new Date('2024-03-01'), assessedBy: 'Dr. Priya Nair' },
    { studentId: 1002, domain: 'technical',  skillName: 'AI Literacy',              score: 65, assessedAt: new Date('2024-03-01'), assessedBy: 'Dr. Priya Nair' },
    { studentId: 1002, domain: 'global',     skillName: 'Cultural Intelligence',    score: 92, assessedAt: new Date('2024-03-01'), assessedBy: 'Dr. Priya Nair' },
    { studentId: 1002, domain: 'global',     skillName: 'Sustainability',           score: 94, assessedAt: new Date('2024-03-01'), assessedBy: 'Dr. Priya Nair' },
    { studentId: 1002, domain: 'global',     skillName: 'Ethical Reasoning',        score: 90, assessedAt: new Date('2024-03-01'), assessedBy: 'Dr. Priya Nair' },
    { studentId: 1002, domain: 'global',     skillName: 'Global Collaboration',     score: 88, assessedAt: new Date('2024-03-01'), assessedBy: 'Dr. Priya Nair' },
    { studentId: 1002, domain: 'practical',  skillName: 'Financial Literacy',       score: 79, assessedAt: new Date('2024-03-01'), assessedBy: 'Dr. Priya Nair' },
    { studentId: 1002, domain: 'practical',  skillName: 'Entrepreneurship',         score: 85, assessedAt: new Date('2024-03-01'), assessedBy: 'Dr. Priya Nair' },
    { studentId: 1002, domain: 'practical',  skillName: 'Time Management',          score: 88, assessedAt: new Date('2024-03-01'), assessedBy: 'Dr. Priya Nair' },
    { studentId: 1002, domain: 'practical',  skillName: 'Leadership',               score: 93, assessedAt: new Date('2024-03-01'), assessedBy: 'Dr. Priya Nair' },
    { studentId: 1002, domain: 'health',     skillName: 'Physical Health',          score: 82, assessedAt: new Date('2024-03-01'), assessedBy: 'Dr. Priya Nair' },
    { studentId: 1002, domain: 'health',     skillName: 'Mental Health Awareness',  score: 88, assessedAt: new Date('2024-03-01'), assessedBy: 'Dr. Priya Nair' },
    { studentId: 1002, domain: 'health',     skillName: 'Mindfulness',              score: 90, assessedAt: new Date('2024-03-01'), assessedBy: 'Dr. Priya Nair' },
    { studentId: 1002, domain: 'health',     skillName: 'Nutrition Awareness',      score: 84, assessedAt: new Date('2024-03-01'), assessedBy: 'Dr. Priya Nair' },
    // Arjun Patel (1003) - selected key skills
    { studentId: 1003, domain: 'cognitive',  skillName: 'Critical Thinking',        score: 72, assessedAt: new Date('2024-05-01'), assessedBy: 'Mr. Vikram Singh' },
    { studentId: 1003, domain: 'cognitive',  skillName: 'Creativity & Innovation',  score: 78, assessedAt: new Date('2024-05-01'), assessedBy: 'Mr. Vikram Singh' },
    { studentId: 1003, domain: 'cognitive',  skillName: 'Problem-Solving',          score: 75, assessedAt: new Date('2024-05-01'), assessedBy: 'Mr. Vikram Singh' },
    { studentId: 1003, domain: 'cognitive',  skillName: 'Analytical Reasoning',     score: 80, assessedAt: new Date('2024-05-01'), assessedBy: 'Mr. Vikram Singh' },
    { studentId: 1003, domain: 'technical',  skillName: 'Digital Literacy',         score: 82, assessedAt: new Date('2024-05-01'), assessedBy: 'Mr. Vikram Singh' },
    { studentId: 1003, domain: 'technical',  skillName: 'Coding & Programming',     score: 79, assessedAt: new Date('2024-05-01'), assessedBy: 'Mr. Vikram Singh' },
    { studentId: 1003, domain: 'technical',  skillName: 'Data Analysis',            score: 65, assessedAt: new Date('2024-05-01'), assessedBy: 'Mr. Vikram Singh' },
    { studentId: 1003, domain: 'technical',  skillName: 'AI Literacy',              score: 74, assessedAt: new Date('2024-05-01'), assessedBy: 'Mr. Vikram Singh' },
    { studentId: 1003, domain: 'social',     skillName: 'Collaboration',            score: 65, assessedAt: new Date('2024-05-01'), assessedBy: 'Mr. Vikram Singh' },
    { studentId: 1003, domain: 'social',     skillName: 'Communication (Verbal)',   score: 58, assessedAt: new Date('2024-05-01'), assessedBy: 'Mr. Vikram Singh' },
    { studentId: 1003, domain: 'social',     skillName: 'Communication (Written)',  score: 62, assessedAt: new Date('2024-05-01'), assessedBy: 'Mr. Vikram Singh' },
    { studentId: 1003, domain: 'social',     skillName: 'Empathy',                  score: 70, assessedAt: new Date('2024-05-01'), assessedBy: 'Mr. Vikram Singh' },
    { studentId: 1003, domain: 'practical',  skillName: 'Financial Literacy',       score: 58, assessedAt: new Date('2024-05-01'), assessedBy: 'Mr. Vikram Singh' },
    { studentId: 1003, domain: 'practical',  skillName: 'Entrepreneurship',         score: 65, assessedAt: new Date('2024-05-01'), assessedBy: 'Mr. Vikram Singh' },
    { studentId: 1003, domain: 'practical',  skillName: 'Time Management',          score: 60, assessedAt: new Date('2024-05-01'), assessedBy: 'Mr. Vikram Singh' },
    { studentId: 1003, domain: 'practical',  skillName: 'Leadership',               score: 55, assessedAt: new Date('2024-05-01'), assessedBy: 'Mr. Vikram Singh' },
    // Sana Malik (1004)
    { studentId: 1004, domain: 'cognitive',  skillName: 'Critical Thinking',        score: 80, assessedAt: new Date('2024-04-01'), assessedBy: 'Ms. Preethi Rajan' },
    { studentId: 1004, domain: 'cognitive',  skillName: 'Creativity & Innovation',  score: 83, assessedAt: new Date('2024-04-01'), assessedBy: 'Ms. Preethi Rajan' },
    { studentId: 1004, domain: 'cognitive',  skillName: 'Problem-Solving',          score: 77, assessedAt: new Date('2024-04-01'), assessedBy: 'Ms. Preethi Rajan' },
    { studentId: 1004, domain: 'cognitive',  skillName: 'Analytical Reasoning',     score: 75, assessedAt: new Date('2024-04-01'), assessedBy: 'Ms. Preethi Rajan' },
    { studentId: 1004, domain: 'social',     skillName: 'Collaboration',            score: 88, assessedAt: new Date('2024-04-01'), assessedBy: 'Ms. Preethi Rajan' },
    { studentId: 1004, domain: 'social',     skillName: 'Communication (Verbal)',   score: 85, assessedAt: new Date('2024-04-01'), assessedBy: 'Ms. Preethi Rajan' },
    { studentId: 1004, domain: 'social',     skillName: 'Communication (Written)',  score: 82, assessedAt: new Date('2024-04-01'), assessedBy: 'Ms. Preethi Rajan' },
    { studentId: 1004, domain: 'social',     skillName: 'Empathy',                  score: 91, assessedAt: new Date('2024-04-01'), assessedBy: 'Ms. Preethi Rajan' },
    { studentId: 1004, domain: 'practical',  skillName: 'Financial Literacy',       score: 86, assessedAt: new Date('2024-04-01'), assessedBy: 'Ms. Preethi Rajan' },
    { studentId: 1004, domain: 'practical',  skillName: 'Entrepreneurship',         score: 90, assessedAt: new Date('2024-04-01'), assessedBy: 'Ms. Preethi Rajan' },
    { studentId: 1004, domain: 'practical',  skillName: 'Time Management',          score: 83, assessedAt: new Date('2024-04-01'), assessedBy: 'Ms. Preethi Rajan' },
    { studentId: 1004, domain: 'practical',  skillName: 'Leadership',               score: 87, assessedAt: new Date('2024-04-01'), assessedBy: 'Ms. Preethi Rajan' },
    // Lucas Chen (1005)
    { studentId: 1005, domain: 'cognitive',  skillName: 'Critical Thinking',        score: 94, assessedAt: new Date('2024-01-01'), assessedBy: 'Dr. James Wong' },
    { studentId: 1005, domain: 'cognitive',  skillName: 'Creativity & Innovation',  score: 82, assessedAt: new Date('2024-01-01'), assessedBy: 'Dr. James Wong' },
    { studentId: 1005, domain: 'cognitive',  skillName: 'Problem-Solving',          score: 96, assessedAt: new Date('2024-01-01'), assessedBy: 'Dr. James Wong' },
    { studentId: 1005, domain: 'cognitive',  skillName: 'Analytical Reasoning',     score: 97, assessedAt: new Date('2024-01-01'), assessedBy: 'Dr. James Wong' },
    { studentId: 1005, domain: 'technical',  skillName: 'Digital Literacy',         score: 95, assessedAt: new Date('2024-01-01'), assessedBy: 'Dr. James Wong' },
    { studentId: 1005, domain: 'technical',  skillName: 'Coding & Programming',     score: 93, assessedAt: new Date('2024-01-01'), assessedBy: 'Dr. James Wong' },
    { studentId: 1005, domain: 'technical',  skillName: 'Data Analysis',            score: 97, assessedAt: new Date('2024-01-01'), assessedBy: 'Dr. James Wong' },
    { studentId: 1005, domain: 'technical',  skillName: 'AI Literacy',              score: 91, assessedAt: new Date('2024-01-01'), assessedBy: 'Dr. James Wong' },
    { studentId: 1005, domain: 'practical',  skillName: 'Financial Literacy',       score: 80, assessedAt: new Date('2024-01-01'), assessedBy: 'Dr. James Wong' },
    { studentId: 1005, domain: 'practical',  skillName: 'Entrepreneurship',         score: 77, assessedAt: new Date('2024-01-01'), assessedBy: 'Dr. James Wong' },
    { studentId: 1005, domain: 'practical',  skillName: 'Time Management',          score: 85, assessedAt: new Date('2024-01-01'), assessedBy: 'Dr. James Wong' },
    { studentId: 1005, domain: 'practical',  skillName: 'Leadership',               score: 74, assessedAt: new Date('2024-01-01'), assessedBy: 'Dr. James Wong' },
    // Aisha Binte Omar (1006)
    { studentId: 1006, domain: 'cognitive',  skillName: 'Critical Thinking',        score: 58, assessedAt: new Date('2024-06-01'), assessedBy: 'Ms. Fatimah Aziz' },
    { studentId: 1006, domain: 'cognitive',  skillName: 'Creativity & Innovation',  score: 88, assessedAt: new Date('2024-06-01'), assessedBy: 'Ms. Fatimah Aziz' },
    { studentId: 1006, domain: 'cognitive',  skillName: 'Problem-Solving',          score: 60, assessedAt: new Date('2024-06-01'), assessedBy: 'Ms. Fatimah Aziz' },
    { studentId: 1006, domain: 'cognitive',  skillName: 'Analytical Reasoning',     score: 52, assessedAt: new Date('2024-06-01'), assessedBy: 'Ms. Fatimah Aziz' },
    { studentId: 1006, domain: 'social',     skillName: 'Collaboration',            score: 72, assessedAt: new Date('2024-06-01'), assessedBy: 'Ms. Fatimah Aziz' },
    { studentId: 1006, domain: 'social',     skillName: 'Empathy',                  score: 85, assessedAt: new Date('2024-06-01'), assessedBy: 'Ms. Fatimah Aziz' },
    { studentId: 1006, domain: 'health',     skillName: 'Physical Health',          score: 80, assessedAt: new Date('2024-06-01'), assessedBy: 'Ms. Fatimah Aziz' },
    { studentId: 1006, domain: 'health',     skillName: 'Mental Health Awareness',  score: 72, assessedAt: new Date('2024-06-01'), assessedBy: 'Ms. Fatimah Aziz' },
    { studentId: 1006, domain: 'health',     skillName: 'Mindfulness',              score: 75, assessedAt: new Date('2024-06-01'), assessedBy: 'Ms. Fatimah Aziz' },
    { studentId: 1006, domain: 'health',     skillName: 'Nutrition Awareness',      score: 78, assessedAt: new Date('2024-06-01'), assessedBy: 'Ms. Fatimah Aziz' },
  ];
  await p.insert(db.skills, skillData);

  // ── Enrollments ───────────────────────────────────────────
  await p.insert(db.enrollments, [
    { studentId: 1001, courseId: 1, status: 'completed', completedAt: new Date('2024-04-15'), grade: 'A', createdAt: new Date('2024-01-20') },
    { studentId: 1001, courseId: 2, status: 'completed', completedAt: new Date('2024-07-10'), grade: 'A+',createdAt: new Date('2024-02-01') },
    { studentId: 1001, courseId: 3, status: 'active',    completedAt: null,                   grade: null, createdAt: new Date('2024-08-01') },
    { studentId: 1002, courseId: 3, status: 'completed', completedAt: new Date('2024-05-20'), grade: 'A+',createdAt: new Date('2023-10-01') },
    { studentId: 1002, courseId: 4, status: 'completed', completedAt: new Date('2024-03-10'), grade: 'A', createdAt: new Date('2023-11-01') },
    { studentId: 1002, courseId: 5, status: 'active',    completedAt: null,                   grade: null, createdAt: new Date('2024-06-01') },
    { studentId: 1003, courseId: 1, status: 'completed', completedAt: new Date('2024-05-01'), grade: 'B+',createdAt: new Date('2024-03-05') },
    { studentId: 1003, courseId: 2, status: 'active',    completedAt: null,                   grade: null, createdAt: new Date('2024-05-15') },
    { studentId: 1004, courseId: 3, status: 'completed', completedAt: new Date('2024-04-30'), grade: 'A+',createdAt: new Date('2024-02-10') },
    { studentId: 1004, courseId: 5, status: 'active',    completedAt: null,                   grade: null, createdAt: new Date('2024-06-01') },
    { studentId: 1004, courseId: 6, status: 'active',    completedAt: null,                   grade: null, createdAt: new Date('2024-07-01') },
    { studentId: 1005, courseId: 1, status: 'completed', completedAt: new Date('2023-10-01'), grade: 'A+',createdAt: new Date('2023-06-10') },
    { studentId: 1005, courseId: 2, status: 'completed', completedAt: new Date('2024-01-15'), grade: 'A+',createdAt: new Date('2023-08-01') },
    { studentId: 1005, courseId: 3, status: 'completed', completedAt: new Date('2024-04-01'), grade: 'A', createdAt: new Date('2023-10-15') },
    { studentId: 1006, courseId: 4, status: 'active',    completedAt: null,                   grade: null, createdAt: new Date('2024-05-05') },
    { studentId: 1006, courseId: 5, status: 'active',    completedAt: null,                   grade: null, createdAt: new Date('2024-06-01') },
  ]);

  // ── Achievements ──────────────────────────────────────────
  await p.insert(db.achievements, [
    { studentId: 1001, title: '1st Place Regional Robotics Championship', category: 'Competition',   description: 'Led team of 4 to victory against 18 schools',          date: '2024-08-20', createdAt: new Date() },
    { studentId: 1001, title: 'Python Mobile App Developer',              category: 'Certification', description: 'Built school event management app using Python & Flask', date: '2024-06-15', createdAt: new Date() },
    { studentId: 1001, title: 'Young Entrepreneur Award',                 category: 'Badge',         description: 'Won KidspreNeur pitch competition 2024',               date: '2024-11-01', createdAt: new Date() },
    { studentId: 1002, title: 'National Youth Leadership Summit Speaker', category: 'Competition',   description: 'Delivered keynote on sustainable design to 500+ attendees',date: '2024-07-15', createdAt: new Date() },
    { studentId: 1002, title: 'Green Schools Sustainability Certificate', category: 'Certification', description: 'Led school recycling initiative reducing waste by 40%', date: '2024-05-10', createdAt: new Date() },
    { studentId: 1002, title: 'Creative Ninja Master Badge',              category: 'Badge',         description: 'Completed all Creative Ninja advanced modules',         date: '2024-03-10', createdAt: new Date() },
    { studentId: 1003, title: 'Junior Coder Certificate',                 category: 'Certification', description: 'Completed introductory Python programming with distinction',date: '2024-05-01', createdAt: new Date() },
    { studentId: 1003, title: 'Robotics Enthusiast Badge',                category: 'Badge',         description: 'Built first autonomous robot in AI Explorer course',     date: '2024-06-15', createdAt: new Date() },
    { studentId: 1004, title: 'Best Business Plan - KidspreNeur Pitch',   category: 'Competition',   description: 'Won RM5000 seed funding for EdTech startup concept',     date: '2024-04-28', createdAt: new Date() },
    { studentId: 1004, title: 'Financial Literacy Certificate',           category: 'Certification', description: 'Completed Junior Achievement financial literacy program', date: '2024-06-15', createdAt: new Date() },
    { studentId: 1004, title: 'Community Impact Award',                   category: 'Badge',         description: 'Organised free tutoring sessions for 30 underprivileged students',date: '2024-07-10', createdAt: new Date() },
    { studentId: 1005, title: 'National Data Science Olympiad - Silver',  category: 'Competition',   description: 'Ranked 2nd nationally in data science challenge for under-16s',date: '2024-02-01', createdAt: new Date() },
    { studentId: 1005, title: 'Advanced Python & ML Certificate',         category: 'Certification', description: 'Completed machine learning fundamentals with 98% score', date: '2024-04-01', createdAt: new Date() },
    { studentId: 1005, title: 'Data Wizard Master Badge',                 category: 'Badge',         description: 'Completed all Data Analysis advanced tracks',           date: '2024-05-01', createdAt: new Date() },
    { studentId: 1006, title: 'Young Artist Showcase Winner',             category: 'Competition',   description: 'Digital illustration awarded best in category at KU Arts Festival',date: '2024-06-25', createdAt: new Date() },
    { studentId: 1006, title: 'Creative Storyteller Badge',               category: 'Badge',         description: 'Completed Creative Ninja storytelling module with distinction',date: '2024-07-01', createdAt: new Date() },
  ]);

  // ── Goals ─────────────────────────────────────────────────
  await p.insert(db.goals, [
    { studentId: 1001, text: 'Earn Advanced AI Literacy badge',          done: true,  dueDate: '2024-06-30', completedAt: new Date('2024-06-28'), createdAt: new Date() },
    { studentId: 1001, text: 'Complete Robotics Level 3',                done: true,  dueDate: '2024-08-15', completedAt: new Date('2024-08-10'), createdAt: new Date() },
    { studentId: 1001, text: 'Launch mobile app publicly',               done: false, dueDate: '2024-12-31', completedAt: null,                   createdAt: new Date() },
    { studentId: 1001, text: 'Participate in national coding olympiad',  done: false, dueDate: '2025-03-01', completedAt: null,                   createdAt: new Date() },
    { studentId: 1002, text: 'Publish sustainability guide for schools', done: true,  dueDate: '2024-05-01', completedAt: new Date('2024-04-28'), createdAt: new Date() },
    { studentId: 1002, text: 'Complete Global Citizens certification',   done: true,  dueDate: '2024-07-01', completedAt: new Date('2024-06-30'), createdAt: new Date() },
    { studentId: 1002, text: 'Start youth climate action club',          done: false, dueDate: '2024-10-01', completedAt: null,                   createdAt: new Date() },
    { studentId: 1002, text: 'Apply for Young Leaders Fellowship',       done: false, dueDate: '2025-01-15', completedAt: null,                   createdAt: new Date() },
    { studentId: 1003, text: 'Complete Python for Kids course',          done: true,  dueDate: '2024-05-01', completedAt: new Date('2024-05-01'), createdAt: new Date() },
    { studentId: 1003, text: 'Build first working robot',                done: true,  dueDate: '2024-06-15', completedAt: new Date('2024-06-14'), createdAt: new Date() },
    { studentId: 1003, text: 'Improve public speaking skills',           done: false, dueDate: '2024-09-01', completedAt: null,                   createdAt: new Date() },
    { studentId: 1003, text: 'Enter junior robotics competition',        done: false, dueDate: '2024-11-01', completedAt: null,                   createdAt: new Date() },
    { studentId: 1004, text: 'Complete Kidspreneur MBA course',          done: true,  dueDate: '2024-04-30', completedAt: new Date('2024-04-28'), createdAt: new Date() },
    { studentId: 1004, text: 'Create business plan for EdTech startup',  done: true,  dueDate: '2024-06-01', completedAt: new Date('2024-05-30'), createdAt: new Date() },
    { studentId: 1004, text: 'Secure mentorship from entrepreneur',      done: false, dueDate: '2024-08-01', completedAt: null,                   createdAt: new Date() },
    { studentId: 1004, text: 'Launch pilot tutoring program',            done: false, dueDate: '2024-12-01', completedAt: null,                   createdAt: new Date() },
    { studentId: 1005, text: 'Win Data Science Olympiad',                done: true,  dueDate: '2024-02-01', completedAt: new Date('2024-02-01'), createdAt: new Date() },
    { studentId: 1005, text: 'Complete ML certificate',                  done: true,  dueDate: '2024-04-01', completedAt: new Date('2024-03-30'), createdAt: new Date() },
    { studentId: 1005, text: 'Build AI-powered climate prediction model',done: false, dueDate: '2024-08-01', completedAt: null,                   createdAt: new Date() },
    { studentId: 1005, text: 'Publish research paper on data literacy',  done: false, dueDate: '2025-01-01', completedAt: null,                   createdAt: new Date() },
    { studentId: 1006, text: 'Complete Creative Ninja course',           done: true,  dueDate: '2024-07-01', completedAt: new Date('2024-06-30'), createdAt: new Date() },
    { studentId: 1006, text: 'Create digital portfolio of artwork',      done: false, dueDate: '2024-09-01', completedAt: null,                   createdAt: new Date() },
    { studentId: 1006, text: 'Learn basic animation with Scratch',       done: false, dueDate: '2024-10-01', completedAt: null,                   createdAt: new Date() },
  ]);

  // ── Credentials ───────────────────────────────────────────
  await p.insert(db.credentials, [
    { credentialId: 'cr001', studentId: 1001, type: 'Open Badge',       name: 'Advanced Python Coder',   skill: 'Coding & Programming', evidence: 'https://kidsuni.edu/portfolio/rohan/python',    issuedAt: new Date('2024-06-15'), issuedBy: 'Ms. Anjali Mehta',  verificationUrl: 'https://kidsuni.edu/verify/cr001', createdAt: new Date() },
    { credentialId: 'cr002', studentId: 1001, type: 'Mastery Credit',   name: 'Robotics Champion',       skill: 'Problem-Solving',      evidence: 'https://kidsuni.edu/portfolio/rohan/robotics', issuedAt: new Date('2024-08-20'), issuedBy: 'Ms. Anjali Mehta',  verificationUrl: 'https://kidsuni.edu/verify/cr002', createdAt: new Date() },
    { credentialId: 'cr003', studentId: 1001, type: 'Graduate Attribute',name: 'Innovative Thinker',      skill: 'Creativity & Innovation',evidence: '',                                              issuedAt: new Date('2024-12-01'), issuedBy: 'Admin User',        verificationUrl: 'https://kidsuni.edu/verify/cr003', createdAt: new Date() },
    { credentialId: 'cr004', studentId: 1002, type: 'Open Badge',       name: 'Sustainability Leader',   skill: 'Sustainability',        evidence: 'https://kidsuni.edu/portfolio/emily/sustainability',issuedAt: new Date('2024-05-10'), issuedBy: 'Dr. Priya Nair',   verificationUrl: 'https://kidsuni.edu/verify/cr004', createdAt: new Date() },
    { credentialId: 'cr005', studentId: 1002, type: 'Graduate Attribute',name: 'Global Citizen',          skill: 'Cultural Intelligence', evidence: '',                                              issuedAt: new Date('2024-07-15'), issuedBy: 'Admin User',        verificationUrl: 'https://kidsuni.edu/verify/cr005', createdAt: new Date() },
    { credentialId: 'cr006', studentId: 1002, type: 'Course Completion', name: 'Global Citizens Course',  skill: 'Global Collaboration',  evidence: '',                                              issuedAt: new Date('2024-07-31'), issuedBy: 'Dr. Priya Nair',   verificationUrl: 'https://kidsuni.edu/verify/cr006', createdAt: new Date() },
    { credentialId: 'cr007', studentId: 1003, type: 'Open Badge',       name: 'Junior Coder',            skill: 'Coding & Programming', evidence: '',                                              issuedAt: new Date('2024-05-05'), issuedBy: 'Mr. Vikram Singh', verificationUrl: 'https://kidsuni.edu/verify/cr007', createdAt: new Date() },
    { credentialId: 'cr008', studentId: 1004, type: 'Open Badge',       name: 'Young Entrepreneur',      skill: 'Entrepreneurship',      evidence: 'https://kidsuni.edu/portfolio/sana/business',   issuedAt: new Date('2024-04-30'), issuedBy: 'Ms. Preethi Rajan',verificationUrl: 'https://kidsuni.edu/verify/cr008', createdAt: new Date() },
    { credentialId: 'cr009', studentId: 1004, type: 'Mastery Credit',   name: 'Financial Literacy Pro',  skill: 'Financial Literacy',    evidence: '',                                              issuedAt: new Date('2024-06-15'), issuedBy: 'Ms. Preethi Rajan',verificationUrl: 'https://kidsuni.edu/verify/cr009', createdAt: new Date() },
    { credentialId: 'cr010', studentId: 1005, type: 'Open Badge',       name: 'Data Science Expert',     skill: 'Data Analysis',         evidence: 'https://kidsuni.edu/portfolio/lucas/data',      issuedAt: new Date('2024-04-20'), issuedBy: 'Dr. James Wong',   verificationUrl: 'https://kidsuni.edu/verify/cr010', createdAt: new Date() },
    { credentialId: 'cr011', studentId: 1005, type: 'Mastery Credit',   name: 'AI & ML Specialist',      skill: 'AI Literacy',           evidence: '',                                              issuedAt: new Date('2024-05-01'), issuedBy: 'Dr. James Wong',   verificationUrl: 'https://kidsuni.edu/verify/cr011', createdAt: new Date() },
    { credentialId: 'cr012', studentId: 1005, type: 'Graduate Attribute',name: 'Analytical Thinker',      skill: 'Analytical Reasoning',  evidence: '',                                              issuedAt: new Date('2024-05-31'), issuedBy: 'Admin User',        verificationUrl: 'https://kidsuni.edu/verify/cr012', createdAt: new Date() },
  ]);

  // ── Evidence ──────────────────────────────────────────────
  await p.insert(db.evidence, [
    { evidenceId: 'ev001', studentId: 1001, title: 'Robotics Competition Video',       type: 'Video',    url: 'https://youtube.com/watch?v=example1',         competency: 'Problem-Solving',        proficiency: 'Mastery',    date: '2024-08-20', createdAt: new Date() },
    { evidenceId: 'ev002', studentId: 1001, title: 'Mobile App Source Code',           type: 'Project',  url: 'https://github.com/rohan/school-app',          competency: 'Coding & Programming',   proficiency: 'Proficient', date: '2024-06-10', createdAt: new Date() },
    { evidenceId: 'ev003', studentId: 1001, title: 'Entrepreneurship Pitch Deck',      type: 'Document', url: 'https://drive.google.com/example',             competency: 'Entrepreneurship',       proficiency: 'Proficient', date: '2024-11-05', createdAt: new Date() },
    { evidenceId: 'ev004', studentId: 1002, title: 'Sustainability Project Report',    type: 'Document', url: 'https://drive.google.com/emily-sustainability', competency: 'Sustainability',          proficiency: 'Mastery',    date: '2024-05-01', createdAt: new Date() },
    { evidenceId: 'ev005', studentId: 1002, title: 'Leadership Summit Recording',      type: 'Video',    url: 'https://youtube.com/watch?v=emily-summit',     competency: 'Leadership',             proficiency: 'Mastery',    date: '2024-07-15', createdAt: new Date() },
    { evidenceId: 'ev006', studentId: 1002, title: 'Cultural Exchange Portfolio',      type: 'Image',    url: 'https://kidsuni.edu/emily-portfolio',          competency: 'Cultural Intelligence',  proficiency: 'Proficient', date: '2024-06-20', createdAt: new Date() },
    { evidenceId: 'ev007', studentId: 1003, title: 'First Robot Demo',                 type: 'Video',    url: 'https://youtube.com/watch?v=arjun-robot',      competency: 'Coding & Programming',   proficiency: 'Developing', date: '2024-06-15', createdAt: new Date() },
    { evidenceId: 'ev008', studentId: 1004, title: 'Business Plan Presentation',       type: 'Document', url: 'https://drive.google.com/sana-bizplan',        competency: 'Entrepreneurship',       proficiency: 'Mastery',    date: '2024-04-28', createdAt: new Date() },
    { evidenceId: 'ev009', studentId: 1004, title: 'Community Tutoring Impact Report', type: 'Document', url: 'https://drive.google.com/sana-impact',         competency: 'Leadership',             proficiency: 'Proficient', date: '2024-07-10', createdAt: new Date() },
    { evidenceId: 'ev010', studentId: 1005, title: 'Data Olympiad Solution Notebook',  type: 'Project',  url: 'https://kaggle.com/lucas-olympiad',             competency: 'Data Analysis',          proficiency: 'Mastery',    date: '2024-02-15', createdAt: new Date() },
    { evidenceId: 'ev011', studentId: 1005, title: 'ML Model GitHub Repository',       type: 'Project',  url: 'https://github.com/lucas/climate-ml',          competency: 'AI Literacy',            proficiency: 'Proficient', date: '2024-04-30', createdAt: new Date() },
    { evidenceId: 'ev012', studentId: 1006, title: 'Digital Art Portfolio',            type: 'Image',    url: 'https://kidsuni.edu/aisha-art',                competency: 'Creativity & Innovation', proficiency: 'Proficient', date: '2024-06-25', createdAt: new Date() },
  ]);

  // ── Mentor Feedback ───────────────────────────────────────
  await p.insert(db.mentorFeedback, [
    { studentId: 1001, mentorName: 'Ms. Anjali Mehta',   mentorTitle: 'Senior STEM Mentor',       feedback: 'Rohan is an exceptional learner who consistently exceeds expectations. His ability to connect theoretical concepts with real-world applications is remarkable for his age.',         recommendations: 'Explore advanced machine learning frameworks. Consider entering the National Junior Innovation Challenge. Begin mentoring younger students in basic coding.', createdAt: new Date('2024-12-01') },
    { studentId: 1002, mentorName: 'Dr. Priya Nair',     mentorTitle: 'Global Citizenship Lead',  feedback: 'Emily is a natural leader with exceptional emotional intelligence. Her sustainability projects have had measurable real-world impact. She inspires peers and mentors alike.',          recommendations: 'Apply for international youth leadership programs. Develop her design thinking portfolio. Explore architecture or environmental design as a future pathway.',  createdAt: new Date('2024-07-31') },
    { studentId: 1003, mentorName: 'Mr. Vikram Singh',   mentorTitle: 'Technology Mentor',        feedback: 'Arjun shows exceptional aptitude for technical subjects, especially robotics and coding. While still developing his communication skills, his technical problem-solving is strong.', recommendations: 'Focus on collaborative projects to build teamwork skills. Join the debate club to develop communication. Explore data science fundamentals next term.',            createdAt: new Date('2024-08-01') },
    { studentId: 1004, mentorName: 'Ms. Preethi Rajan',  mentorTitle: 'Entrepreneurship Coach',   feedback: 'Sana has an extraordinary entrepreneurial mindset combined with genuine empathy for social impact. Her business acumen is well beyond her years.',                                   recommendations: 'Connect with social enterprise networks. Develop financial modelling skills. Explore impact investing and social entrepreneurship frameworks.',                  createdAt: new Date('2024-08-01') },
    { studentId: 1005, mentorName: 'Dr. James Wong',     mentorTitle: 'Data Science Mentor',      feedback: 'Lucas is among the most analytically gifted students I have mentored. His ability to identify patterns in complex datasets and translate insights into actionable solutions is exceptional.', recommendations: 'Apply for early university entrance programs. Begin contributing to open-source data projects. Explore research internships at technology companies.',          createdAt: new Date('2024-05-31') },
    { studentId: 1006, mentorName: 'Ms. Fatimah Aziz',   mentorTitle: 'Creative Arts Mentor',     feedback: 'Aisha possesses a rare natural talent for visual storytelling. Her empathy and creativity shine through every project. She is in the early stages but shows tremendous promise.',    recommendations: 'Introduce animation and motion graphics. Explore visual design principles. Consider digital storytelling projects that combine art with coding fundamentals.',   createdAt: new Date('2024-07-01') },
  ]);

  // ── Announcements ─────────────────────────────────────────
  await p.insert(db.announcements, [
    { title: 'Welcome to Kids Uni Mastery Platform v4.0!', body: 'We are excited to launch our new MTC-aligned mastery platform. All student records have been migrated. Please review your profiles and update any missing information.', author: 'Admin User', pinned: true,  createdAt: new Date('2024-01-01') },
    { title: 'Semester 2 Enrolment Now Open',              body: 'Enrolment for Semester 2 courses is now open. New courses include Advanced AI Workshops and the Global Leaders programme. Limited spots available.',                      author: 'Admin User', pinned: false, createdAt: new Date('2024-06-01') },
    { title: 'Congratulations to our Robotics Champions!', body: 'A huge congratulations to Rohan and his team for winning the Regional Robotics Championship! This is a proud moment for Kids University.',                               author: 'Admin User', pinned: false, createdAt: new Date('2024-08-21') },
  ]);

  // ── Forum Posts ───────────────────────────────────────────
  await p.insert(db.forum, [
    { authorId: 1001, authorName: 'Rohan Sharma',     title: 'Tips for the Robotics Competition',          body: 'Hey everyone! Just got back from the regional robotics competition. Happy to share some tips on how our team prepared.',         likes: 12, replies: [], tags: ['robotics','competition'], createdAt: new Date('2024-08-25') },
    { authorId: 1002, authorName: 'Emily Johnson',    title: 'Starting a Sustainability Club — Need Help!', body: 'I want to start a sustainability club at my school. Has anyone done this before? Would love some advice on getting started.',   likes: 8,  replies: [], tags: ['sustainability','leadership'], createdAt: new Date('2024-09-01') },
    { authorId: 1005, authorName: 'Lucas Chen',       title: 'Free Data Science Resources for Beginners',  body: 'Sharing a list of free resources I used to learn Python and data science. Kaggle is a great starting point for competitions.', likes: 15, replies: [], tags: ['data-science','coding'], createdAt: new Date('2024-09-05') },
  ]);

  console.log('   ↳ Seed complete: 7 users, 6 courses, 6 students, skills, goals, credentials, evidence');
}

module.exports = { db, p, initDB };
