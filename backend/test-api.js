/**
 * Kids Uni API Test Suite — Supabase version
 * Run: node test-api.js  (while npm start is running in another terminal)
 */

const BASE = 'http://localhost:3001/api';
let token = '';
let studentId = '';
let createdStudentId = '';

const pass = (msg) => console.log(`  ✅ ${msg}`);
const fail = (msg) => console.log(`  ❌ ${msg}`);

async function req(method, path, body, auth = true) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };
  const r = await fetch(`${BASE}${path}`, opts);
  const data = await r.json().catch(() => ({}));
  return { status: r.status, data };
}

async function run() {
  console.log('\n🎓 Kids Uni API Test Suite (Supabase)\n');

  // ── Health ──────────────────────────────────────────────────
  console.log('── Health ──────────────────────────');
  {
    const r = await fetch('http://localhost:3001/health');
    const d = await r.json();
    d.status === 'ok' && d.database === 'supabase'
      ? pass(`GET /health — version ${d.version}`)
      : fail(`GET /health: ${JSON.stringify(d)}`);
  }

  // ── Auth ────────────────────────────────────────────────────
  console.log('\n── Auth ──────────────────────────');
  {
    const r = await req('POST', '/auth/login', { email: 'admin@kidsuni.edu', password: 'kidsuni2024' }, false);
    if (r.status === 200 && r.data.token) {
      token = r.data.token;
      pass(`POST /auth/login — role: ${r.data.user.role}`);
    } else {
      fail(`POST /auth/login: ${JSON.stringify(r.data)}`);
    }
  }
  {
    const r = await req('GET', '/auth/me');
    r.status === 200 && r.data.user?.email
      ? pass(`GET /auth/me — ${r.data.user.email}`)
      : fail(`GET /auth/me: ${JSON.stringify(r.data)}`);
  }
  {
    const r = await req('POST', '/auth/login', { email: 'admin@kidsuni.edu', password: 'wrongpassword' }, false);
    r.status === 401
      ? pass('POST /auth/login (wrong password → 401)')
      : fail(`Wrong password should be 401, got ${r.status}`);
  }

  // ── Students ────────────────────────────────────────────────
  console.log('\n── Students ──────────────────────────');
  {
    const r = await req('GET', '/students');
    if (r.status === 200 && Array.isArray(r.data.data) && r.data.data.length > 0) {
      // Pick student with skills (not first alphabetically)
      const withSkills = r.data.data.find(s => s.skills && s.skills.length > 0) || r.data.data.find(s => s.name === "Rohan Sharma") || r.data.data[0];
      studentId = withSkills.id;
      pass(`GET /students — ${r.data.data.length} students, first: ${r.data.data[0].name}`);
    } else {
      fail(`GET /students: ${JSON.stringify(r.data)}`);
    }
  }
  {
    const r = await req('GET', `/students/${studentId}`);
    if (r.status === 200 && r.data.data?.name) {
      const s = r.data.data;
      pass(`GET /students/:id — ${s.name}, skills: ${s.skills?.length ?? 0}, era: ${s.era}`);
    } else {
      fail(`GET /students/:id: ${JSON.stringify(r.data)}`);
    }
  }
  {
    // Check skills on first student
    const r = await req('GET', `/students/${studentId}`);
    const skills = r.data.data?.skills;
    Array.isArray(skills) && skills.length > 0
      ? pass(`Student skills — ${skills.length} skills, avg score: ${Math.round(skills.reduce((a,b)=>a+b.score,0)/skills.length)}`)
      : fail(`Student skills: none found`);
  }
  {
    const r = await req('POST', '/students', { name: 'Test Student', age: 13, grade: 'Grade 8', era: 'Exploration' });
    if (r.status === 201 && r.data.data?.id) {
      createdStudentId = r.data.data.id;
      pass(`POST /students — created: ${r.data.data.student_id}`);
    } else {
      fail(`POST /students: ${JSON.stringify(r.data)}`);
    }
  }
  {
    const r = await req('PUT', `/students/${createdStudentId}`, { era: 'Reinforcement' });
    r.status === 200 && r.data.data?.era === 'Reinforcement'
      ? pass(`PUT /students/:id — era updated`)
      : fail(`PUT /students/:id: ${JSON.stringify(r.data)}`);
  }
  {
    // Update skills
    const r = await req('PUT', `/students/${studentId}/skills`, {
      skills: [{ domain: 'Technical', skill_name: 'Coding & Programming', score: 95, evidence: 'Test update' }]
    });
    r.status === 200
      ? pass(`PUT /students/:id/skills — skill updated`)
      : fail(`PUT skills: ${JSON.stringify(r.data)}`);
  }

  // ── Courses ─────────────────────────────────────────────────
  console.log('\n── Courses ──────────────────────────');
  let courseId = '';
  {
    const r = await req('GET', '/courses');
    if (r.status === 200 && r.data.data?.length > 0) {
      courseId = r.data.data[0].id;
      pass(`GET /courses — ${r.data.data.length} courses`);
    } else {
      fail(`GET /courses: ${JSON.stringify(r.data)}`);
    }
  }
  {
    const r = await req('GET', `/courses/${courseId}`);
    r.status === 200 && r.data.data?.title
      ? pass(`GET /courses/:id — ${r.data.data.title}`)
      : fail(`GET /courses/:id: ${JSON.stringify(r.data)}`);
  }
  {
    const r = await req('POST', `/courses/${courseId}/enroll`, { student_id: studentId });
    r.status === 201 || r.status === 200
      ? pass(`POST /courses/:id/enroll`)
      : fail(`Enroll: ${JSON.stringify(r.data)}`);
  }

  // ── Goals ───────────────────────────────────────────────────
  console.log('\n── Goals ──────────────────────────');
  let goalId = '';
  {
    const r = await req('POST', '/goals', { student_id: studentId, title: 'Learn advanced Python', target_date: '2024-12-31' });
    if (r.status === 201 && r.data.data?.id) {
      goalId = r.data.data.id;
      pass(`POST /goals — created: ${r.data.data.title}`);
    } else {
      fail(`POST /goals: ${JSON.stringify(r.data)}`);
    }
  }
  {
    const r = await req('GET', `/goals/${studentId}`);
    r.status === 200 && Array.isArray(r.data.data)
      ? pass(`GET /goals/:studentId — ${r.data.data.length} goals`)
      : fail(`GET /goals: ${JSON.stringify(r.data)}`);
  }
  {
    const r = await req('PUT', `/goals/${goalId}/toggle`);
    r.status === 200 && r.data.data?.completed === true
      ? pass(`PUT /goals/:id/toggle — marked complete`)
      : fail(`Toggle goal: ${JSON.stringify(r.data)}`);
  }
  {
    const r = await req('DELETE', `/goals/${goalId}`);
    r.status === 200
      ? pass(`DELETE /goals/:id`)
      : fail(`DELETE goal: ${JSON.stringify(r.data)}`);
  }

  // ── Credentials ─────────────────────────────────────────────
  console.log('\n── Credentials ──────────────────────────');
  let credId = '';
  {
    const r = await req('GET', `/credentials?student_id=${studentId}`);
    if (r.status === 200 && Array.isArray(r.data.data)) {
      pass(`GET /credentials — ${r.data.data.length} credentials`);
    } else {
      fail(`GET /credentials: ${JSON.stringify(r.data)}`);
    }
  }
  {
    const r = await req('POST', '/credentials', {
      student_id: studentId, type: 'badge', title: 'Test Badge',
      description: 'Awarded for testing', skill_domain: 'Technical'
    });
    if (r.status === 201 && r.data.data?.id) {
      credId = r.data.data.id;
      pass(`POST /credentials — issued: ${r.data.data.title}`);
    } else {
      fail(`POST /credentials: ${JSON.stringify(r.data)}`);
    }
  }
  {
    const r = await fetch(`${BASE}/credentials/verify/${credId}`, { headers: { Authorization: `Bearer ${token}` }});
    const d = await r.json();
    d.valid === true
      ? pass(`GET /credentials/verify/:id — valid: ${d.valid}`)
      : fail(`Verify credential: ${JSON.stringify(d)}`);
  }

  // ── Evidence ────────────────────────────────────────────────
  console.log('\n── Evidence ──────────────────────────');
  let evidenceId = '';
  {
    const r = await req('POST', '/evidence', {
      student_id: studentId, title: 'Python App Demo', type: 'project',
      url: 'https://github.com/test', skill_domain: 'Technical'
    });
    if (r.status === 201 && r.data.data?.id) {
      evidenceId = r.data.data.id;
      pass(`POST /evidence — created: ${r.data.data.title}`);
    } else {
      fail(`POST /evidence: ${JSON.stringify(r.data)}`);
    }
  }
  {
    const r = await req('GET', `/evidence?student_id=${studentId}`);
    r.status === 200 && Array.isArray(r.data.data)
      ? pass(`GET /evidence — ${r.data.data.length} items`)
      : fail(`GET /evidence: ${JSON.stringify(r.data)}`);
  }
  {
    const r = await req('DELETE', `/evidence/${evidenceId}`);
    r.status === 200
      ? pass(`DELETE /evidence/:id`)
      : fail(`DELETE evidence: ${JSON.stringify(r.data)}`);
  }

  // ── Transcripts ─────────────────────────────────────────────
  console.log('\n── Transcripts ──────────────────────────');
  {
    const r = await req('GET', `/transcripts/${studentId}`);
    if (r.status === 200 && r.data.data?.student) {
      const t = r.data.data;
      pass(`GET /transcripts/:id — ${t.student.name}, avg: ${t.summary.avg_score}, level: ${t.summary.overall_level}`);
    } else {
      fail(`GET /transcripts/:id: ${JSON.stringify(r.data)}`);
    }
  }

  // ── Analytics ───────────────────────────────────────────────
  console.log('\n── Analytics ──────────────────────────');
  {
    const r = await req('GET', '/analytics/dashboard');
    if (r.status === 200 && r.data.data?.totals) {
      const t = r.data.data.totals;
      pass(`GET /analytics/dashboard — students: ${t.students}, courses: ${t.courses}, credentials: ${t.credentials}`);
    } else {
      fail(`GET /analytics/dashboard: ${JSON.stringify(r.data)}`);
    }
  }
  {
    const r = await req('GET', '/analytics/leaderboard');
    r.status === 200 && Array.isArray(r.data.data)
      ? pass(`GET /analytics/leaderboard — ${r.data.data.length} entries`)
      : fail(`GET /analytics/leaderboard: ${JSON.stringify(r.data)}`);
  }
  {
    const r = await req('GET', '/analytics/skills-heatmap');
    r.status === 200 && Array.isArray(r.data.data)
      ? pass(`GET /analytics/skills-heatmap — ${r.data.data.length} domains`)
      : fail(`GET /analytics/skills-heatmap: ${JSON.stringify(r.data)}`);
  }

  // ── Forum ───────────────────────────────────────────────────
  console.log('\n── Forum ──────────────────────────');
  let postId = '';
  {
    const r = await req('GET', '/forum');
    if (r.status === 200 && Array.isArray(r.data.data)) {
      postId = r.data.data[0]?.id;
      pass(`GET /forum — ${r.data.data.length} posts`);
    } else {
      fail(`GET /forum: ${JSON.stringify(r.data)}`);
    }
  }
  {
    const r = await req('POST', '/forum', { title: 'Test Post', content: 'Hello from test suite', category: 'general' });
    r.status === 201 && r.data.data?.id
      ? pass(`POST /forum — created`)
      : fail(`POST /forum: ${JSON.stringify(r.data)}`);
  }
  {
    const r = await req('POST', `/forum/${postId}/like`);
    r.status === 200
      ? pass(`POST /forum/:id/like`)
      : fail(`Like post: ${JSON.stringify(r.data)}`);
  }

  // ── Announcements ───────────────────────────────────────────
  console.log('\n── Announcements ──────────────────────────');
  {
    const r = await req('GET', '/announcements');
    r.status === 200 && Array.isArray(r.data.data)
      ? pass(`GET /announcements — ${r.data.data.length} announcements`)
      : fail(`GET /announcements: ${JSON.stringify(r.data)}`);
  }
  {
    const r = await req('POST', '/announcements', { title: 'Test Announcement', content: 'Test content', category: 'general' });
    r.status === 201 && r.data.data?.id
      ? pass(`POST /announcements — created`)
      : fail(`POST /announcements: ${JSON.stringify(r.data)}`);
  }

  // ── Cleanup ─────────────────────────────────────────────────
  console.log('\n── Cleanup ──────────────────────────');
  {
    const r = await req('DELETE', `/students/${createdStudentId}`);
    r.status === 200
      ? pass(`DELETE test student`)
      : fail(`DELETE student: ${JSON.stringify(r.data)}`);
  }

  console.log('\n✨ Test suite complete\n');
}

run().catch(err => { console.error('\n💥 Test runner error:', err.message); });
