require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
);

async function run() {
  console.log('🔌 Connecting to Supabase…');
  console.log(`   URL: ${process.env.SUPABASE_URL}`);

  // Test connection
  const { error: pingErr } = await supabase.from('users').select('id').limit(1);
  
  if (pingErr && pingErr.code === '42P01') {
    console.log('⚠️  Tables not found — you need to run schema.sql first in the SQL Editor');
    console.log('   https://supabase.com/dashboard/project/wycadifstdaonpzrscng/sql/new');
    process.exit(1);
  } else if (pingErr) {
    console.error('❌ Connection error:', pingErr.message);
    process.exit(1);
  }

  console.log('✅ Connected!\n');

  // Check if already seeded
  const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
  if (count > 0) {
    console.log(`✅ Already seeded — ${count} users found. Nothing to do.`);
    process.exit(0);
  }

  console.log('🌱 Seeding database…\n');

  // Users
  const { error: usersErr } = await supabase.from('users').insert([
    { id: '00000000-0000-0000-0000-000000000001', email: 'admin@kidsuni.edu',   name: 'Admin User',       role: 'admin'  },
    { id: '00000000-0000-0000-0000-000000000002', email: 'anjali@kidsuni.edu',  name: 'Ms. Anjali Mehta', role: 'mentor' },
    { id: '00000000-0000-0000-0000-000000000003', email: 'priya@kidsuni.edu',   name: 'Ms. Priya Nair',   role: 'mentor' },
    { id: '00000000-0000-0000-0000-000000000004', email: 'vikram@kidsuni.edu',  name: 'Mr. Vikram Singh', role: 'mentor' },
    { id: '00000000-0000-0000-0000-000000000005', email: 'preethi@kidsuni.edu', name: 'Ms. Preethi Raj',  role: 'mentor' },
    { id: '00000000-0000-0000-0000-000000000006', email: 'james@kidsuni.edu',   name: 'Mr. James Lee',    role: 'mentor' },
    { id: '00000000-0000-0000-0000-000000000007', email: 'fatimah@kidsuni.edu', name: 'Ms. Fatimah Ali',  role: 'mentor' },
  ]);
  if (usersErr) { console.error('❌ Users:', usersErr.message); process.exit(1); }
  console.log('✅ Users seeded');

  // Students
  const { error: studentsErr } = await supabase.from('students').insert([
    { id: '10000000-0000-0000-0000-000000000001', student_id: 'KU-2024-001', name: 'Rohan Sharma',     age: 12, grade: 'Grade 7',  email: 'rohan@kidsuni.edu',  era: 'Application',   program_start: '2024-01-15', program_end: '2024-12-15', mentor_id: '00000000-0000-0000-0000-000000000002' },
    { id: '10000000-0000-0000-0000-000000000002', student_id: 'KU-2024-002', name: 'Emily Johnson',    age: 14, grade: 'Grade 9',  email: 'emily@kidsuni.edu',  era: 'Application',   program_start: '2024-02-01', program_end: '2024-12-01', mentor_id: '00000000-0000-0000-0000-000000000003' },
    { id: '10000000-0000-0000-0000-000000000003', student_id: 'KU-2024-003', name: 'Arjun Patel',      age: 11, grade: 'Grade 6',  email: 'arjun@kidsuni.edu',  era: 'Reinforcement', program_start: '2024-03-10', program_end: '2024-12-10', mentor_id: '00000000-0000-0000-0000-000000000004' },
    { id: '10000000-0000-0000-0000-000000000004', student_id: 'KU-2024-004', name: 'Sana Malik',       age: 13, grade: 'Grade 8',  email: 'sana@kidsuni.edu',   era: 'Reinforcement', program_start: '2024-01-20', program_end: '2024-12-20', mentor_id: '00000000-0000-0000-0000-000000000005' },
    { id: '10000000-0000-0000-0000-000000000005', student_id: 'KU-2024-005', name: 'Lucas Chen',       age: 15, grade: 'Grade 10', email: 'lucas@kidsuni.edu',  era: 'Application',   program_start: '2023-09-01', program_end: '2024-06-30', mentor_id: '00000000-0000-0000-0000-000000000006' },
    { id: '10000000-0000-0000-0000-000000000006', student_id: 'KU-2024-006', name: 'Aisha Binte Omar', age: 10, grade: 'Grade 5',  email: 'aisha@kidsuni.edu',  era: 'Exploration',   program_start: '2024-06-01', program_end: '2025-05-31', mentor_id: '00000000-0000-0000-0000-000000000007' },
  ]);
  if (studentsErr) { console.error('❌ Students:', studentsErr.message); process.exit(1); }
  console.log('✅ Students seeded');

  // Skills
  const { error: skillsErr } = await supabase.from('skills').insert([
    // Rohan
    { student_id: '10000000-0000-0000-0000-000000000001', domain: 'Cognitive',  skill_name: 'Critical Thinking',       score: 88, evidence: 'Debate competition winner' },
    { student_id: '10000000-0000-0000-0000-000000000001', domain: 'Cognitive',  skill_name: 'Creativity & Innovation',  score: 82, evidence: 'Built school event app' },
    { student_id: '10000000-0000-0000-0000-000000000001', domain: 'Cognitive',  skill_name: 'Problem-Solving',          score: 90, evidence: 'Hackathon 1st place' },
    { student_id: '10000000-0000-0000-0000-000000000001', domain: 'Technical',  skill_name: 'Coding & Programming',     score: 92, evidence: 'Python mobile app deployed' },
    { student_id: '10000000-0000-0000-0000-000000000001', domain: 'Technical',  skill_name: 'Digital Literacy',         score: 85, evidence: 'Multiple certifications' },
    { student_id: '10000000-0000-0000-0000-000000000001', domain: 'Social',     skill_name: 'Collaboration',            score: 78, evidence: 'Robotics team captain' },
    { student_id: '10000000-0000-0000-0000-000000000001', domain: 'Social',     skill_name: 'Communication (Verbal)',   score: 70, evidence: 'Science fair presentation' },
    { student_id: '10000000-0000-0000-0000-000000000001', domain: 'Practical',  skill_name: 'Financial Literacy',       score: 65, evidence: 'Mock business plan' },
    { student_id: '10000000-0000-0000-0000-000000000001', domain: 'Practical',  skill_name: 'Entrepreneurship',         score: 80, evidence: 'Mini startup launched' },
    { student_id: '10000000-0000-0000-0000-000000000001', domain: 'Emotional',  skill_name: 'Resilience',               score: 75, evidence: 'Overcame project failures' },
    // Emily
    { student_id: '10000000-0000-0000-0000-000000000002', domain: 'Cognitive',  skill_name: 'Critical Thinking',        score: 91, evidence: 'Model UN delegate' },
    { student_id: '10000000-0000-0000-0000-000000000002', domain: 'Cognitive',  skill_name: 'Creativity & Innovation',  score: 87, evidence: 'Award-winning art project' },
    { student_id: '10000000-0000-0000-0000-000000000002', domain: 'Social',     skill_name: 'Collaboration',            score: 89, evidence: 'Led renewable energy project' },
    { student_id: '10000000-0000-0000-0000-000000000002', domain: 'Social',     skill_name: 'Communication (Written)',  score: 85, evidence: 'Published school newsletter' },
    { student_id: '10000000-0000-0000-0000-000000000002', domain: 'Global',     skill_name: 'Cultural Intelligence',    score: 82, evidence: 'Cultural exchange program' },
    { student_id: '10000000-0000-0000-0000-000000000002', domain: 'Global',     skill_name: 'Sustainability',           score: 88, evidence: 'Eco-club president' },
    { student_id: '10000000-0000-0000-0000-000000000002', domain: 'Technical',  skill_name: 'Digital Literacy',         score: 79, evidence: 'Google certifications' },
    { student_id: '10000000-0000-0000-0000-000000000002', domain: 'Practical',  skill_name: 'Leadership',               score: 84, evidence: 'Student council VP' },
    // Arjun
    { student_id: '10000000-0000-0000-0000-000000000003', domain: 'Technical',  skill_name: 'Coding & Programming',     score: 72, evidence: 'Scratch projects' },
    { student_id: '10000000-0000-0000-0000-000000000003', domain: 'Cognitive',  skill_name: 'Problem-Solving',          score: 68, evidence: 'Math olympiad' },
    { student_id: '10000000-0000-0000-0000-000000000003', domain: 'Social',     skill_name: 'Collaboration',            score: 65, evidence: 'Group science fair' },
    { student_id: '10000000-0000-0000-0000-000000000003', domain: 'Cognitive',  skill_name: 'Critical Thinking',        score: 70, evidence: 'Reading comprehension award' },
    { student_id: '10000000-0000-0000-0000-000000000003', domain: 'Health',     skill_name: 'Physical Health',          score: 75, evidence: 'School sports team' },
    // Sana
    { student_id: '10000000-0000-0000-0000-000000000004', domain: 'Social',     skill_name: 'Communication (Verbal)',   score: 82, evidence: 'Debate team member' },
    { student_id: '10000000-0000-0000-0000-000000000004', domain: 'Cognitive',  skill_name: 'Creativity & Innovation',  score: 78, evidence: 'Art competition finalist' },
    { student_id: '10000000-0000-0000-0000-000000000004', domain: 'Practical',  skill_name: 'Financial Literacy',       score: 75, evidence: 'Junior Achievement program' },
    { student_id: '10000000-0000-0000-0000-000000000004', domain: 'Emotional',  skill_name: 'Resilience',               score: 80, evidence: 'Overcame learning challenges' },
    // Lucas
    { student_id: '10000000-0000-0000-0000-000000000005', domain: 'Technical',  skill_name: 'Coding & Programming',     score: 95, evidence: 'National coding champion' },
    { student_id: '10000000-0000-0000-0000-000000000005', domain: 'Technical',  skill_name: 'Data Analysis',            score: 88, evidence: 'Science research project' },
    { student_id: '10000000-0000-0000-0000-000000000005', domain: 'Cognitive',  skill_name: 'Problem-Solving',          score: 90, evidence: 'Olympiad gold medal' },
    { student_id: '10000000-0000-0000-0000-000000000005', domain: 'Practical',  skill_name: 'Entrepreneurship',         score: 85, evidence: 'Tech startup idea pitched' },
    // Aisha
    { student_id: '10000000-0000-0000-0000-000000000006', domain: 'Cognitive',  skill_name: 'Creativity & Innovation',  score: 65, evidence: 'Drawing and storytelling' },
    { student_id: '10000000-0000-0000-0000-000000000006', domain: 'Social',     skill_name: 'Collaboration',            score: 62, evidence: 'Class group activities' },
    { student_id: '10000000-0000-0000-0000-000000000006', domain: 'Emotional',  skill_name: 'Self-Awareness',           score: 60, evidence: 'Reflective journaling' },
  ]);
  if (skillsErr) { console.error('❌ Skills:', skillsErr.message); process.exit(1); }
  console.log('✅ Skills seeded');

  // Courses
  const { error: coursesErr } = await supabase.from('courses').insert([
    { id: '20000000-0000-0000-0000-000000000001', title: 'Python for Kids',         description: 'Learn Python from scratch',         domain: 'Technical',  level: 'Beginner',     duration: '8 weeks',  instructor: 'Mr. James Lee',    era_phase: 'Exploration',   tags: ['coding','python'] },
    { id: '20000000-0000-0000-0000-000000000002', title: 'Robotics Fundamentals',   description: 'Build and program your first robot', domain: 'Technical',  level: 'Intermediate', duration: '10 weeks', instructor: 'Mr. Vikram Singh', era_phase: 'Reinforcement', tags: ['robotics','engineering'] },
    { id: '20000000-0000-0000-0000-000000000003', title: 'Public Speaking Mastery', description: 'Speak with confidence and clarity',  domain: 'Social',     level: 'Beginner',     duration: '6 weeks',  instructor: 'Ms. Priya Nair',   era_phase: 'Exploration',   tags: ['communication','speaking'] },
    { id: '20000000-0000-0000-0000-000000000004', title: 'Financial Literacy 101',  description: 'Money management for young minds',   domain: 'Practical',  level: 'Beginner',     duration: '4 weeks',  instructor: 'Ms. Anjali Mehta', era_phase: 'Exploration',   tags: ['finance','business'] },
    { id: '20000000-0000-0000-0000-000000000005', title: 'Design Thinking',         description: 'Solve problems creatively',           domain: 'Cognitive',  level: 'Intermediate', duration: '8 weeks',  instructor: 'Ms. Fatimah Ali',  era_phase: 'Reinforcement', tags: ['design','creativity'] },
    { id: '20000000-0000-0000-0000-000000000006', title: 'Global Citizenship',      description: 'Understand our connected world',      domain: 'Global',     level: 'Intermediate', duration: '6 weeks',  instructor: 'Ms. Preethi Raj',  era_phase: 'Reinforcement', tags: ['global','culture'] },
    { id: '20000000-0000-0000-0000-000000000007', title: 'Advanced Python & AI',    description: 'Machine learning for young coders',   domain: 'Technical',  level: 'Advanced',     duration: '12 weeks', instructor: 'Mr. James Lee',    era_phase: 'Application',   tags: ['python','ai'] },
    { id: '20000000-0000-0000-0000-000000000008', title: 'Young Entrepreneurs',     description: 'Launch your first business idea',     domain: 'Practical',  level: 'Intermediate', duration: '8 weeks',  instructor: 'Ms. Anjali Mehta', era_phase: 'Application',   tags: ['entrepreneurship'] },
  ]);
  if (coursesErr) { console.error('❌ Courses:', coursesErr.message); process.exit(1); }
  console.log('✅ Courses seeded');

  // Achievements
  const { error: achErr } = await supabase.from('achievements').insert([
    { student_id: '10000000-0000-0000-0000-000000000001', title: 'Regional Robotics Champion', description: 'Won 1st place in regional robotics competition', category: 'Competition', date_earned: '2024-03-15' },
    { student_id: '10000000-0000-0000-0000-000000000001', title: 'Python App Developer',       description: 'Built and deployed a mobile app using Python',  category: 'Project',     date_earned: '2024-06-20' },
    { student_id: '10000000-0000-0000-0000-000000000001', title: 'Hackathon Winner',            description: '1st place at Kids Uni Annual Hackathon',         category: 'Competition', date_earned: '2024-09-10' },
    { student_id: '10000000-0000-0000-0000-000000000002', title: 'Model UN Delegate',           description: 'Outstanding delegate at Model UN conference',    category: 'Academic',    date_earned: '2024-04-22' },
    { student_id: '10000000-0000-0000-0000-000000000002', title: 'Eco-Club President',          description: 'Led sustainability initiatives at school',       category: 'Leadership',  date_earned: '2024-01-15' },
    { student_id: '10000000-0000-0000-0000-000000000005', title: 'National Coding Champion',    description: '1st place in national coding competition',       category: 'Competition', date_earned: '2024-05-18' },
  ]);
  if (achErr) { console.error('❌ Achievements:', achErr.message); process.exit(1); }
  console.log('✅ Achievements seeded');

  // Credentials
  const { error: credErr } = await supabase.from('credentials').insert([
    { student_id: '10000000-0000-0000-0000-000000000001', type: 'certificate', title: 'Certified Junior Python Developer', description: 'Mastery in Python programming',  skill_domain: 'Technical', issued_at: '2024-06-20' },
    { student_id: '10000000-0000-0000-0000-000000000001', type: 'badge',       title: 'Robotics Enthusiast',               description: 'Completed robotics programme',   skill_domain: 'Technical', issued_at: '2024-04-01' },
    { student_id: '10000000-0000-0000-0000-000000000001', type: 'badge',       title: 'Critical Thinker',                  description: 'Advanced problem-solving skills', skill_domain: 'Cognitive', issued_at: '2024-09-15' },
    { student_id: '10000000-0000-0000-0000-000000000002', type: 'certificate', title: 'Global Citizen Award',              description: 'Excellence in global awareness',  skill_domain: 'Global',    issued_at: '2024-07-10' },
    { student_id: '10000000-0000-0000-0000-000000000002', type: 'badge',       title: 'Creative Innovator',                description: 'Outstanding creative projects',   skill_domain: 'Cognitive', issued_at: '2024-05-20' },
    { student_id: '10000000-0000-0000-0000-000000000005', type: 'certificate', title: 'Advanced Coder',                    description: 'National coding champion',         skill_domain: 'Technical', issued_at: '2024-05-18' },
  ]);
  if (credErr) { console.error('❌ Credentials:', credErr.message); process.exit(1); }
  console.log('✅ Credentials seeded');

  // Mentor Feedback
  const { error: fbErr } = await supabase.from('mentor_feedback').insert([
    { student_id: '10000000-0000-0000-0000-000000000001', mentor_name: 'Ms. Anjali Mehta', content: 'Rohan has shown exceptional growth in coding and robotics. His ability to solve complex problems and work in teams is commendable. I recommend he explores advanced programming languages next.', category: 'general' },
    { student_id: '10000000-0000-0000-0000-000000000002', mentor_name: 'Ms. Priya Nair',   content: 'Emily demonstrates outstanding leadership and global awareness. Her passion for sustainability is inspiring. She should consider international exchange programmes.', category: 'general' },
    { student_id: '10000000-0000-0000-0000-000000000003', mentor_name: 'Mr. Vikram Singh', content: 'Arjun is making great progress in his foundational skills. With continued practice in coding and problem-solving, he will be ready for intermediate challenges soon.', category: 'general' },
  ]);
  if (fbErr) { console.error('❌ Feedback:', fbErr.message); process.exit(1); }
  console.log('✅ Mentor feedback seeded');

  // Announcements
  const { error: annErr } = await supabase.from('announcements').insert([
    { author_name: 'Admin User',       title: 'Welcome to Kids Uni Platform v4.0', content: 'We are excited to launch our new mastery-based learning platform!', category: 'general',  is_pinned: true  },
    { author_name: 'Ms. Anjali Mehta', title: 'Hackathon Registration Open',       content: 'Annual Kids Uni Hackathon registrations are now open. Teams of 3-4.',  category: 'event',    is_pinned: false },
    { author_name: 'Admin User',       title: 'New Courses Available',             content: 'Eight new courses have been added across all skill domains.',           category: 'academic', is_pinned: false },
  ]);
  if (annErr) { console.error('❌ Announcements:', annErr.message); process.exit(1); }
  console.log('✅ Announcements seeded');

  // Graduate Profiles
  const { error: gpErr } = await supabase.from('grad_profiles').insert([
    { student_id: '10000000-0000-0000-0000-000000000001', innovative: 85, entrepreneurial: 78, technological: 92, collaborative: 76, global_aware: 65, lifelong_learn: 88, communicator: 70, ethical_leader: 72 },
    { student_id: '10000000-0000-0000-0000-000000000002', innovative: 88, entrepreneurial: 72, technological: 79, collaborative: 90, global_aware: 85, lifelong_learn: 91, communicator: 86, ethical_leader: 80 },
    { student_id: '10000000-0000-0000-0000-000000000003', innovative: 65, entrepreneurial: 60, technological: 72, collaborative: 65, global_aware: 55, lifelong_learn: 70, communicator: 62, ethical_leader: 58 },
    { student_id: '10000000-0000-0000-0000-000000000004', innovative: 75, entrepreneurial: 80, technological: 68, collaborative: 82, global_aware: 70, lifelong_learn: 76, communicator: 78, ethical_leader: 74 },
    { student_id: '10000000-0000-0000-0000-000000000005', innovative: 90, entrepreneurial: 85, technological: 95, collaborative: 80, global_aware: 72, lifelong_learn: 88, communicator: 75, ethical_leader: 78 },
    { student_id: '10000000-0000-0000-0000-000000000006', innovative: 60, entrepreneurial: 55, technological: 58, collaborative: 65, global_aware: 62, lifelong_learn: 68, communicator: 60, ethical_leader: 56 },
  ]);
  if (gpErr) { console.error('❌ Grad profiles:', gpErr.message); process.exit(1); }
  console.log('✅ Graduate profiles seeded');

  // Forum
  const { error: forumErr } = await supabase.from('forum').insert([
    { author_name: 'Ms. Anjali Mehta', author_role: 'mentor', title: 'Tips for the Hackathon',          content: 'Great tips: 1) Plan your MVP first 2) Divide tasks by skill 3) Test early. Good luck!', category: 'academic', is_pinned: true  },
    { author_name: 'Admin User',       author_role: 'admin',  title: 'How to use your Transcript',      content: 'Your skill-based transcript updates automatically as you complete courses and projects.', category: 'general',  is_pinned: false },
  ]);
  if (forumErr) { console.error('❌ Forum:', forumErr.message); process.exit(1); }
  console.log('✅ Forum seeded');

  console.log('\n🎉 Database fully seeded! Kids Uni is ready.\n');
}

run().catch(err => { console.error('Fatal:', err); process.exit(1); });
