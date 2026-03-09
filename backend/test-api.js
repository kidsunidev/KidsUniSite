/**
 * Kids University Backend — API Integration Test
 * Run: node test-api.js
 */

const http = require('http');

const BASE = 'http://localhost:3001/api';
let token = '';
let createdStudentId = null;

function request(method, path, body, authHeader = true) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      method,
      hostname: 'localhost',
      port: 3001,
      path: `/api${path}`,
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && token ? { Authorization: `Bearer ${token}` } : {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const req = http.request(opts, res => {
      let chunks = '';
      res.on('data', d => chunks += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(chunks) }); }
        catch { resolve({ status: res.statusCode, body: chunks }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function pass(name) { console.log(`  ✅ ${name}`); }
function fail(name, detail) { console.error(`  ❌ ${name}: ${detail}`); process.exitCode = 1; }
function section(name) { console.log(`\n── ${name} ──────────────────────────`); }

async function runTests() {
  console.log('🎓 Kids Uni API Test Suite\n');

  // Health
  section('Health');
  const health = await request('GET', '/health', null, false);
  health.status === 200 ? pass('GET /health') : fail('GET /health', health.status);

  // Auth
  section('Auth');
  const login = await request('POST', '/auth/login', { email: 'admin@kidsuni.edu', password: 'kidsuni2024' }, false);
  if (login.status === 200 && login.body.token) {
    pass('POST /auth/login');
    token = login.body.token;
  } else {
    fail('POST /auth/login', JSON.stringify(login.body));
    console.error('Cannot continue without auth token'); return;
  }

  const me = await request('GET', '/auth/me');
  me.status === 200 && me.body.email ? pass('GET /auth/me') : fail('GET /auth/me', me.status);

  const badLogin = await request('POST', '/auth/login', { email: 'admin@kidsuni.edu', password: 'wrong' }, false);
  badLogin.status === 401 ? pass('POST /auth/login (wrong password → 401)') : fail('Auth rejection', badLogin.status);

  // Students
  section('Students');
  const students = await request('GET', '/students');
  students.status === 200 && students.body.count === 6 ? pass(`GET /students (${students.body.count} students)`) : fail('GET /students', `status=${students.status} count=${students.body.count}`);

  const student = await request('GET', '/students/1001');
  student.status === 200 && student.body.name === 'Rohan Sharma' ? pass('GET /students/1001') : fail('GET /students/1001', student.body.error);

  // Check skills are loaded
  const hasSkills = student.body.skills && Object.keys(student.body.skills).length > 0;
  hasSkills ? pass('Student skills loaded') : fail('Student skills', 'no skills found');
  const hasGoals = student.body.goals && student.body.goals.length > 0;
  hasGoals ? pass('Student goals loaded') : fail('Student goals', 'no goals found');
  const hasMentor = student.body.mentor !== null;
  hasMentor ? pass('Student mentor loaded') : fail('Student mentor', 'null');

  // Create student
  const newStu = await request('POST', '/students', { name: 'Test Student', age: 12, grade: 'Grade 7', era: 'Exploration', statement: 'Test student created by automated tests.' });
  if (newStu.status === 201) {
    pass('POST /students (create)');
    createdStudentId = newStu.body.studentId;
  } else {
    fail('POST /students', JSON.stringify(newStu.body));
  }

  // Update student
  if (createdStudentId) {
    const upd = await request('PUT', `/students/${createdStudentId}`, { grade: 'Grade 8' });
    upd.status === 200 && upd.body.grade === 'Grade 8' ? pass('PUT /students/:id (update)') : fail('PUT /students/:id', upd.status);
  }

  // Search
  const search = await request('GET', '/students?search=emily');
  search.status === 200 && search.body.students.length === 1 ? pass('GET /students?search=emily') : fail('Student search', search.body.count);

  // ERA filter
  const eraFilter = await request('GET', '/students?era=Application');
  eraFilter.status === 200 && eraFilter.body.count >= 3 ? pass('GET /students?era=Application') : fail('ERA filter', eraFilter.body.count);

  // Skills
  section('Skills');
  const skills = await request('GET', '/students/1001/skills');
  skills.status === 200 && skills.body.skills ? pass('GET /students/1001/skills') : fail('GET skills', skills.status);

  const updateSkill = await request('POST', '/students/1001/skills', { domain: 'technical', skillName: 'Coding & Programming', score: 95 });
  updateSkill.status === 200 ? pass('POST /students/:id/skills (upsert)') : fail('POST skills', JSON.stringify(updateSkill.body));

  // Courses
  section('Courses');
  const courses = await request('GET', '/courses');
  courses.status === 200 && courses.body.length === 6 ? pass(`GET /courses (${courses.body.length} courses)`) : fail('GET /courses', `count=${courses.body.length}`);

  const course1 = await request('GET', '/courses/1');
  course1.status === 200 ? pass('GET /courses/1') : fail('GET /courses/1', course1.status);

  // Credentials
  section('Credentials');
  const creds = await request('GET', '/credentials');
  creds.status === 200 && creds.body.length >= 12 ? pass(`GET /credentials (${creds.body.length} total)`) : fail('GET /credentials', creds.body.length);

  const rohanCreds = await request('GET', '/credentials?studentId=1001');
  rohanCreds.status === 200 && rohanCreds.body.length === 3 ? pass(`GET /credentials?studentId=1001 (${rohanCreds.body.length} creds)`) : fail('Filter credentials', rohanCreds.body.length);

  const newCred = await request('POST', '/credentials', { studentId: 1001, type: 'Open Badge', name: 'Test Badge', skill: 'Testing' });
  newCred.status === 201 ? pass('POST /credentials (issue badge)') : fail('POST /credentials', JSON.stringify(newCred.body));

  // Evidence
  section('Evidence');
  const evidence = await request('GET', '/evidence');
  evidence.status === 200 && evidence.body.length >= 12 ? pass(`GET /evidence (${evidence.body.length} items)`) : fail('GET /evidence', evidence.body.length);

  const newEv = await request('POST', '/evidence', { studentId: 1001, title: 'Test Evidence', type: 'Document', url: 'https://test.com', competency: 'Testing', proficiency: 'Developing' });
  newEv.status === 201 ? pass('POST /evidence') : fail('POST /evidence', JSON.stringify(newEv.body));

  // Goals
  section('Goals');
  const goals = await request('GET', '/goals?studentId=1002');
  goals.status === 200 && goals.body.length === 4 ? pass(`GET /goals?studentId=1002 (${goals.body.length} goals)`) : fail('GET goals', goals.body.length);

  const newGoal = await request('POST', '/goals', { studentId: 1001, text: 'Complete test goal', dueDate: '2025-06-01' });
  if (newGoal.status === 201) {
    pass('POST /goals');
    const toggle = await request('PUT', `/goals/${newGoal.body._id}/toggle`);
    toggle.status === 200 && toggle.body.done === true ? pass('PUT /goals/:id/toggle') : fail('Toggle goal', toggle.status);
  } else {
    fail('POST /goals', JSON.stringify(newGoal.body));
  }

  // Transcripts
  section('Transcripts');
  const transcript = await request('GET', '/transcripts/1001');
  if (transcript.status === 200) {
    pass('GET /transcripts/1001');
    const t = transcript.body;
    t.composite > 0 ? pass(`  Composite score: ${t.composite}`) : fail('Composite score', t.composite);
    t.domains && t.domains.length === 7 ? pass(`  All 7 domains present`) : fail('Domains', t.domains?.length);
    t.credentials && t.credentials.length > 0 ? pass(`  Credentials: ${t.credentials.length}`) : fail('Transcript credentials', 0);
  } else {
    fail('GET /transcripts/1001', JSON.stringify(transcript.body));
  }

  // Analytics
  section('Analytics');
  const dashboard = await request('GET', '/analytics/dashboard');
  if (dashboard.status === 200) {
    pass('GET /analytics/dashboard');
    const d = dashboard.body;
    d.totals.students >= 6 ? pass(`  Students: ${d.totals.students}`) : fail('Analytics students', d.totals.students);
    d.scores.average > 0 ? pass(`  Avg score: ${d.scores.average}`) : fail('Analytics avg score', d.scores.average);
    d.eraDist ? pass(`  ERA dist: ${JSON.stringify(d.eraDist)}`) : fail('ERA dist', 'missing');
  } else {
    fail('GET /analytics/dashboard', JSON.stringify(dashboard.body));
  }

  const leaderboard = await request('GET', '/analytics/leaderboard');
  leaderboard.status === 200 && leaderboard.body[0]?.rank === 1 ? pass(`GET /analytics/leaderboard (top: ${leaderboard.body[0]?.name})`) : fail('Leaderboard', leaderboard.status);

  const heatmap = await request('GET', '/analytics/skill-heatmap');
  heatmap.status === 200 ? pass('GET /analytics/skill-heatmap') : fail('Skill heatmap', heatmap.status);

  // Forum
  section('Forum');
  const forum = await request('GET', '/forum');
  forum.status === 200 && forum.body.length >= 3 ? pass(`GET /forum (${forum.body.length} posts)`) : fail('GET /forum', forum.body.length);

  const post = await request('POST', '/forum', { title: 'Test Post', body: 'This is a test forum post.', tags: ['test'] });
  if (post.status === 201) {
    pass('POST /forum');
    const like = await request('POST', `/forum/${post.body._id}/like`);
    like.status === 200 && like.body.likes === 1 ? pass('POST /forum/:id/like') : fail('Like post', like.status);
    const reply = await request('POST', `/forum/${post.body._id}/reply`, { text: 'Test reply' });
    reply.status === 200 && reply.body.replies.length === 1 ? pass('POST /forum/:id/reply') : fail('Reply to post', reply.status);
  } else { fail('POST /forum', JSON.stringify(post.body)); }

  // Announcements
  section('Announcements');
  const anns = await request('GET', '/announcements');
  anns.status === 200 && anns.body.length >= 3 ? pass(`GET /announcements (${anns.body.length})`) : fail('GET /announcements', anns.body.length);

  // Cleanup: delete test student
  section('Cleanup');
  if (createdStudentId) {
    const del = await request('DELETE', `/students/${createdStudentId}`);
    del.status === 200 ? pass(`DELETE /students/${createdStudentId}`) : fail('DELETE student', del.status);
  }

  // Summary
  console.log('\n══════════════════════════════════════');
  console.log(process.exitCode ? '❌ Some tests FAILED' : '✅ All tests PASSED');
  console.log('══════════════════════════════════════\n');
}

runTests().catch(err => {
  console.error('\n💥 Test runner error:', err.message);
  if (err.code === 'ECONNREFUSED') {
    console.error('   Server not running. Start with: node server.js');
  }
  process.exit(1);
});
