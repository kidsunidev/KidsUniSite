-- ============================================================
-- Kids University — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. USERS (auth handled by Supabase Auth + this profile table)
-- ============================================================
create table if not exists users (
  id            uuid primary key default uuid_generate_v4(),
  email         text unique not null,
  name          text not null,
  role          text not null default 'mentor' check (role in ('admin','mentor','student','parent')),
  avatar        text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ============================================================
-- 2. STUDENTS
-- ============================================================
create table if not exists students (
  id            uuid primary key default uuid_generate_v4(),
  student_id    text unique not null,
  name          text not null,
  age           int,
  grade         text,
  email         text,
  era           text default 'Exploration' check (era in ('Exploration','Reinforcement','Application')),
  program_start date,
  program_end   date,
  mentor_id     uuid references users(id),
  avatar        text,
  bio           text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ============================================================
-- 3. SKILLS (score per student per skill)
-- ============================================================
create table if not exists skills (
  id            uuid primary key default uuid_generate_v4(),
  student_id    uuid not null references students(id) on delete cascade,
  domain        text not null,
  skill_name    text not null,
  score         int default 0 check (score between 0 and 100),
  level         text generated always as (
                  case
                    when score >= 81 then 'Advanced'
                    when score >= 51 then 'Intermediate'
                    else 'Beginner'
                  end
                ) stored,
  evidence      text,
  updated_at    timestamptz default now(),
  unique(student_id, skill_name)
);

-- ============================================================
-- 4. COURSES
-- ============================================================
create table if not exists courses (
  id            uuid primary key default uuid_generate_v4(),
  title         text not null,
  description   text,
  domain        text,
  level         text default 'Beginner' check (level in ('Beginner','Intermediate','Advanced')),
  duration      text,
  instructor    text,
  era_phase     text check (era_phase in ('Exploration','Reinforcement','Application')),
  tags          text[],
  thumbnail     text,
  is_active     bool default true,
  created_at    timestamptz default now()
);

-- ============================================================
-- 5. ENROLLMENTS
-- ============================================================
create table if not exists enrollments (
  id            uuid primary key default uuid_generate_v4(),
  student_id    uuid not null references students(id) on delete cascade,
  course_id     uuid not null references courses(id) on delete cascade,
  status        text default 'enrolled' check (status in ('enrolled','in_progress','completed','dropped')),
  progress      int default 0 check (progress between 0 and 100),
  enrolled_at   timestamptz default now(),
  completed_at  timestamptz,
  unique(student_id, course_id)
);

-- ============================================================
-- 6. ACHIEVEMENTS
-- ============================================================
create table if not exists achievements (
  id            uuid primary key default uuid_generate_v4(),
  student_id    uuid not null references students(id) on delete cascade,
  title         text not null,
  description   text,
  category      text,
  date_earned   date default current_date,
  issuer        text default 'Kids University',
  created_at    timestamptz default now()
);

-- ============================================================
-- 7. GOALS
-- ============================================================
create table if not exists goals (
  id            uuid primary key default uuid_generate_v4(),
  student_id    uuid not null references students(id) on delete cascade,
  title         text not null,
  description   text,
  target_date   date,
  completed     bool default false,
  completed_at  timestamptz,
  created_at    timestamptz default now()
);

-- ============================================================
-- 8. CREDENTIALS (Open Badges / Mastery Credits)
-- ============================================================
create table if not exists credentials (
  id            uuid primary key default uuid_generate_v4(),
  student_id    uuid not null references students(id) on delete cascade,
  type          text default 'badge' check (type in ('badge','certificate','mastery_credit','achievement')),
  title         text not null,
  description   text,
  skill_domain  text,
  issued_by     text default 'Kids University',
  issued_at     timestamptz default now(),
  expires_at    timestamptz,
  verify_url    text,
  is_revoked    bool default false,
  metadata      jsonb default '{}'
);

-- ============================================================
-- 9. EVIDENCE (Portfolio)
-- ============================================================
create table if not exists evidence (
  id            uuid primary key default uuid_generate_v4(),
  student_id    uuid not null references students(id) on delete cascade,
  title         text not null,
  description   text,
  type          text default 'project' check (type in ('project','video','document','image','link','certificate')),
  url           text,
  skill_domain  text,
  skill_name    text,
  tags          text[],
  created_at    timestamptz default now()
);

-- ============================================================
-- 10. MENTOR FEEDBACK
-- ============================================================
create table if not exists mentor_feedback (
  id            uuid primary key default uuid_generate_v4(),
  student_id    uuid not null references students(id) on delete cascade,
  mentor_id     uuid references users(id),
  mentor_name   text,
  content       text not null,
  category      text default 'general' check (category in ('general','skill','project','behaviour','recommendation')),
  is_public     bool default true,
  created_at    timestamptz default now()
);

-- ============================================================
-- 11. FORUM
-- ============================================================
create table if not exists forum (
  id            uuid primary key default uuid_generate_v4(),
  author_id     uuid references users(id),
  author_name   text not null,
  author_role   text,
  title         text not null,
  content       text not null,
  category      text default 'general',
  tags          text[],
  likes         int default 0,
  reply_count   int default 0,
  is_pinned     bool default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create table if not exists forum_replies (
  id            uuid primary key default uuid_generate_v4(),
  post_id       uuid not null references forum(id) on delete cascade,
  author_id     uuid references users(id),
  author_name   text not null,
  content       text not null,
  likes         int default 0,
  created_at    timestamptz default now()
);

-- ============================================================
-- 12. ANNOUNCEMENTS
-- ============================================================
create table if not exists announcements (
  id            uuid primary key default uuid_generate_v4(),
  author_id     uuid references users(id),
  author_name   text not null,
  title         text not null,
  content       text not null,
  category      text default 'general' check (category in ('general','academic','event','urgent','reminder')),
  is_pinned     bool default false,
  expires_at    timestamptz,
  created_at    timestamptz default now()
);

-- ============================================================
-- 13. NOTIFICATIONS
-- ============================================================
create table if not exists notifications (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references users(id) on delete cascade,
  title         text not null,
  message       text,
  type          text default 'info' check (type in ('info','success','warning','error')),
  is_read       bool default false,
  link          text,
  created_at    timestamptz default now()
);

-- ============================================================
-- 14. GRADUATE PROFILES
-- ============================================================
create table if not exists grad_profiles (
  id              uuid primary key default uuid_generate_v4(),
  student_id      uuid not null references students(id) on delete cascade unique,
  innovative      int default 0 check (innovative between 0 and 100),
  entrepreneurial int default 0 check (entrepreneurial between 0 and 100),
  technological   int default 0 check (technological between 0 and 100),
  collaborative   int default 0 check (collaborative between 0 and 100),
  global_aware    int default 0 check (global_aware between 0 and 100),
  lifelong_learn  int default 0 check (lifelong_learn between 0 and 100),
  communicator    int default 0 check (communicator between 0 and 100),
  ethical_leader  int default 0 check (ethical_leader between 0 and 100),
  updated_at      timestamptz default now()
);

-- ============================================================
-- 15. AUDIT LOG
-- ============================================================
create table if not exists audit_log (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references users(id),
  action        text not null,
  entity_type   text,
  entity_id     text,
  details       jsonb default '{}',
  ip_address    text,
  created_at    timestamptz default now()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
create index if not exists idx_students_era        on students(era);
create index if not exists idx_students_mentor      on students(mentor_id);
create index if not exists idx_skills_student       on skills(student_id);
create index if not exists idx_skills_domain        on skills(domain);
create index if not exists idx_enrollments_student  on enrollments(student_id);
create index if not exists idx_enrollments_course   on enrollments(course_id);
create index if not exists idx_achievements_student on achievements(student_id);
create index if not exists idx_goals_student        on goals(student_id);
create index if not exists idx_credentials_student  on credentials(student_id);
create index if not exists idx_evidence_student     on evidence(student_id);
create index if not exists idx_feedback_student     on mentor_feedback(student_id);
create index if not exists idx_forum_created        on forum(created_at desc);
create index if not exists idx_notifications_user   on notifications(user_id);
create index if not exists idx_audit_created        on audit_log(created_at desc);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table users           enable row level security;
alter table students        enable row level security;
alter table skills          enable row level security;
alter table courses         enable row level security;
alter table enrollments     enable row level security;
alter table achievements    enable row level security;
alter table goals           enable row level security;
alter table credentials     enable row level security;
alter table evidence        enable row level security;
alter table mentor_feedback enable row level security;
alter table forum           enable row level security;
alter table forum_replies   enable row level security;
alter table announcements   enable row level security;
alter table notifications   enable row level security;
alter table grad_profiles   enable row level security;
alter table audit_log       enable row level security;

-- Service role bypasses RLS (used by our backend)
-- Publishable/anon key gets read-only on safe tables

-- Allow service role full access (backend uses this)
create policy "service_role_all" on users           for all using (true);
create policy "service_role_all" on students        for all using (true);
create policy "service_role_all" on skills          for all using (true);
create policy "service_role_all" on courses         for all using (true);
create policy "service_role_all" on enrollments     for all using (true);
create policy "service_role_all" on achievements    for all using (true);
create policy "service_role_all" on goals           for all using (true);
create policy "service_role_all" on credentials     for all using (true);
create policy "service_role_all" on evidence        for all using (true);
create policy "service_role_all" on mentor_feedback for all using (true);
create policy "service_role_all" on forum           for all using (true);
create policy "service_role_all" on forum_replies   for all using (true);
create policy "service_role_all" on announcements   for all using (true);
create policy "service_role_all" on notifications   for all using (true);
create policy "service_role_all" on grad_profiles   for all using (true);
create policy "service_role_all" on audit_log       for all using (true);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Users (mentors + admin)
insert into users (id, email, name, role) values
  ('00000000-0000-0000-0000-000000000001', 'admin@kidsuni.edu',   'Admin User',      'admin'),
  ('00000000-0000-0000-0000-000000000002', 'anjali@kidsuni.edu',  'Ms. Anjali Mehta','mentor'),
  ('00000000-0000-0000-0000-000000000003', 'priya@kidsuni.edu',   'Ms. Priya Nair',  'mentor'),
  ('00000000-0000-0000-0000-000000000004', 'vikram@kidsuni.edu',  'Mr. Vikram Singh','mentor'),
  ('00000000-0000-0000-0000-000000000005', 'preethi@kidsuni.edu', 'Ms. Preethi Raj', 'mentor'),
  ('00000000-0000-0000-0000-000000000006', 'james@kidsuni.edu',   'Mr. James Lee',   'mentor'),
  ('00000000-0000-0000-0000-000000000007', 'fatimah@kidsuni.edu', 'Ms. Fatimah Ali', 'mentor')
on conflict (email) do nothing;

-- Students
insert into students (id, student_id, name, age, grade, email, era, program_start, program_end, mentor_id) values
  ('10000000-0000-0000-0000-000000000001','KU-2024-001','Rohan Sharma',     12,'Grade 7', 'rohan@kidsuni.edu',    'Application',   '2024-01-15','2024-12-15','00000000-0000-0000-0000-000000000002'),
  ('10000000-0000-0000-0000-000000000002','KU-2024-002','Emily Johnson',    14,'Grade 9', 'emily@kidsuni.edu',    'Application',   '2024-02-01','2024-12-01','00000000-0000-0000-0000-000000000003'),
  ('10000000-0000-0000-0000-000000000003','KU-2024-003','Arjun Patel',      11,'Grade 6', 'arjun@kidsuni.edu',    'Reinforcement', '2024-03-10','2024-12-10','00000000-0000-0000-0000-000000000004'),
  ('10000000-0000-0000-0000-000000000004','KU-2024-004','Sana Malik',       13,'Grade 8', 'sana@kidsuni.edu',     'Reinforcement', '2024-01-20','2024-12-20','00000000-0000-0000-0000-000000000005'),
  ('10000000-0000-0000-0000-000000000005','KU-2024-005','Lucas Chen',       15,'Grade 10','lucas@kidsuni.edu',    'Application',   '2023-09-01','2024-06-30','00000000-0000-0000-0000-000000000006'),
  ('10000000-0000-0000-0000-000000000006','KU-2024-006','Aisha Binte Omar', 10,'Grade 5', 'aisha@kidsuni.edu',    'Exploration',   '2024-06-01','2025-05-31','00000000-0000-0000-0000-000000000007')
on conflict (student_id) do nothing;

-- Skills for Rohan (KU-2024-001)
insert into skills (student_id, domain, skill_name, score, evidence) values
  ('10000000-0000-0000-0000-000000000001','Cognitive','Critical Thinking',      88,'Debate competition winner'),
  ('10000000-0000-0000-0000-000000000001','Cognitive','Creativity & Innovation', 82,'Built school event app'),
  ('10000000-0000-0000-0000-000000000001','Cognitive','Problem-Solving',         90,'Hackathon 1st place'),
  ('10000000-0000-0000-0000-000000000001','Technical','Coding & Programming',    92,'Python mobile app deployed'),
  ('10000000-0000-0000-0000-000000000001','Technical','Digital Literacy',        85,'Multiple certifications'),
  ('10000000-0000-0000-0000-000000000001','Social',  'Collaboration',            78,'Robotics team captain'),
  ('10000000-0000-0000-0000-000000000001','Social',  'Communication (Verbal)',   70,'Science fair presentation'),
  ('10000000-0000-0000-0000-000000000001','Practical','Financial Literacy',      65,'Mock business plan created'),
  ('10000000-0000-0000-0000-000000000001','Practical','Entrepreneurship',        80,'Mini startup launched'),
  ('10000000-0000-0000-0000-000000000001','Emotional','Resilience',              75,'Overcame project failures')
on conflict (student_id, skill_name) do nothing;

-- Skills for Emily (KU-2024-002)
insert into skills (student_id, domain, skill_name, score, evidence) values
  ('10000000-0000-0000-0000-000000000002','Cognitive','Critical Thinking',      91,'Model UN delegate'),
  ('10000000-0000-0000-0000-000000000002','Cognitive','Creativity & Innovation', 87,'Award-winning art project'),
  ('10000000-0000-0000-0000-000000000002','Social',  'Collaboration',            89,'Led renewable energy project'),
  ('10000000-0000-0000-0000-000000000002','Social',  'Communication (Written)',  85,'Published school newsletter'),
  ('10000000-0000-0000-0000-000000000002','Global',  'Cultural Intelligence',    82,'Cultural exchange program'),
  ('10000000-0000-0000-0000-000000000002','Global',  'Sustainability',           88,'Eco-club president'),
  ('10000000-0000-0000-0000-000000000002','Technical','Digital Literacy',        79,'Google certifications'),
  ('10000000-0000-0000-0000-000000000002','Practical','Leadership',              84,'Student council VP')
on conflict (student_id, skill_name) do nothing;

-- Skills for Arjun (KU-2024-003)
insert into skills (student_id, domain, skill_name, score, evidence) values
  ('10000000-0000-0000-0000-000000000003','Technical','Coding & Programming',    72,'Scratch projects completed'),
  ('10000000-0000-0000-0000-000000000003','Cognitive','Problem-Solving',         68,'Math olympiad participant'),
  ('10000000-0000-0000-0000-000000000003','Social',  'Collaboration',            65,'Group science fair'),
  ('10000000-0000-0000-0000-000000000003','Cognitive','Critical Thinking',       70,'Reading comprehension award'),
  ('10000000-0000-0000-0000-000000000003','Health',  'Physical Health',          75,'School sports team')
on conflict (student_id, skill_name) do nothing;

-- Courses
insert into courses (id, title, description, domain, level, duration, instructor, era_phase, tags) values
  ('20000000-0000-0000-0000-000000000001','Python for Kids',          'Learn Python programming from scratch','Technical',  'Beginner',     '8 weeks', 'Mr. James Lee',   'Exploration',   array['coding','python','beginner']),
  ('20000000-0000-0000-0000-000000000002','Robotics Fundamentals',    'Build and program your first robot',   'Technical',  'Intermediate', '10 weeks','Mr. Vikram Singh','Reinforcement', array['robotics','engineering']),
  ('20000000-0000-0000-0000-000000000003','Public Speaking Mastery',  'Speak with confidence and clarity',    'Social',     'Beginner',     '6 weeks', 'Ms. Priya Nair',  'Exploration',   array['communication','speaking']),
  ('20000000-0000-0000-0000-000000000004','Financial Literacy 101',   'Money management for young minds',     'Practical',  'Beginner',     '4 weeks', 'Ms. Anjali Mehta','Exploration',   array['finance','money','business']),
  ('20000000-0000-0000-0000-000000000005','Design Thinking',          'Solve problems creatively',            'Cognitive',  'Intermediate', '8 weeks', 'Ms. Fatimah Ali', 'Reinforcement', array['design','creativity','innovation']),
  ('20000000-0000-0000-0000-000000000006','Global Citizenship',       'Understand our connected world',       'Global',     'Intermediate', '6 weeks', 'Ms. Preethi Raj', 'Reinforcement', array['global','culture','sustainability']),
  ('20000000-0000-0000-0000-000000000007','Advanced Python & AI',     'Machine learning for young coders',    'Technical',  'Advanced',     '12 weeks','Mr. James Lee',   'Application',   array['python','ai','advanced']),
  ('20000000-0000-0000-0000-000000000008','Young Entrepreneurs',      'Launch your first business idea',      'Practical',  'Intermediate', '8 weeks', 'Ms. Anjali Mehta','Application',   array['entrepreneurship','business'])
on conflict do nothing;

-- Achievements
insert into achievements (student_id, title, description, category, date_earned) values
  ('10000000-0000-0000-0000-000000000001','Regional Robotics Champion', 'Won 1st place in regional robotics competition', 'Competition', '2024-03-15'),
  ('10000000-0000-0000-0000-000000000001','Python App Developer',       'Built and deployed a mobile app using Python',   'Project',     '2024-06-20'),
  ('10000000-0000-0000-0000-000000000001','Hackathon Winner',           '1st place at Kids Uni Annual Hackathon',          'Competition', '2024-09-10'),
  ('10000000-0000-0000-0000-000000000002','Model UN Delegate',          'Outstanding delegate at Model UN conference',     'Academic',    '2024-04-22'),
  ('10000000-0000-0000-0000-000000000002','Eco-Club President',         'Led sustainability initiatives at school',        'Leadership',  '2024-01-15'),
  ('10000000-0000-0000-0000-000000000005','National Coding Champion',   '1st place in national coding competition',        'Competition', '2024-05-18');

-- Credentials
insert into credentials (student_id, type, title, description, skill_domain, issued_at) values
  ('10000000-0000-0000-0000-000000000001','certificate','Certified Junior Python Developer', 'Mastery in Python programming', 'Technical',  '2024-06-20'),
  ('10000000-0000-0000-0000-000000000001','badge',      'Robotics Enthusiast',               'Completed robotics programme',  'Technical',  '2024-04-01'),
  ('10000000-0000-0000-0000-000000000001','badge',      'Critical Thinker',                  'Advanced problem-solving skills','Cognitive', '2024-09-15'),
  ('10000000-0000-0000-0000-000000000002','certificate','Global Citizen Award',              'Excellence in global awareness', 'Global',     '2024-07-10'),
  ('10000000-0000-0000-0000-000000000002','badge',      'Creative Innovator',                'Outstanding creative projects',  'Cognitive',  '2024-05-20'),
  ('10000000-0000-0000-0000-000000000005','certificate','Advanced Coder',                    'National coding champion',       'Technical',  '2024-05-18');

-- Mentor Feedback
insert into mentor_feedback (student_id, mentor_name, content, category) values
  ('10000000-0000-0000-0000-000000000001','Ms. Anjali Mehta',
   'Rohan has shown exceptional growth in coding and robotics. His ability to solve complex problems and work in teams is commendable. I recommend he explores advanced programming languages next.',
   'general'),
  ('10000000-0000-0000-0000-000000000002','Ms. Priya Nair',
   'Emily demonstrates outstanding leadership and global awareness. Her passion for sustainability is inspiring. She should consider international exchange programmes.',
   'general'),
  ('10000000-0000-0000-0000-000000000003','Mr. Vikram Singh',
   'Arjun is making great progress in his foundational skills. With continued practice in coding and problem-solving, he will be ready for intermediate challenges soon.',
   'general');

-- Announcements
insert into announcements (author_name, title, content, category, is_pinned) values
  ('Admin User',        'Welcome to Kids Uni Platform v4.0', 'We are excited to launch our new mastery-based learning platform. Explore all the new features!', 'general',  true),
  ('Ms. Anjali Mehta',  'Hackathon Registration Open',       'Annual Kids Uni Hackathon registrations are now open. Teams of 3-4 students. Register by end of month.', 'event', false),
  ('Admin User',        'New Courses Available',             'Eight new courses have been added across all skill domains. Check the Course Library for details.',      'academic', false);

-- Graduate Profiles
insert into grad_profiles (student_id, innovative, entrepreneurial, technological, collaborative, global_aware, lifelong_learn, communicator, ethical_leader) values
  ('10000000-0000-0000-0000-000000000001', 85, 78, 92, 76, 65, 88, 70, 72),
  ('10000000-0000-0000-0000-000000000002', 88, 72, 79, 90, 85, 91, 86, 80),
  ('10000000-0000-0000-0000-000000000003', 65, 60, 72, 65, 55, 70, 62, 58),
  ('10000000-0000-0000-0000-000000000004', 75, 80, 68, 82, 70, 76, 78, 74),
  ('10000000-0000-0000-0000-000000000005', 90, 85, 95, 80, 72, 88, 75, 78),
  ('10000000-0000-0000-0000-000000000006', 60, 55, 58, 65, 62, 68, 60, 56)
on conflict (student_id) do nothing;

-- Forum Posts
insert into forum (author_name, author_role, title, content, category, is_pinned) values
  ('Ms. Anjali Mehta', 'mentor', 'Tips for the Hackathon',
   'Great tips for the upcoming hackathon: 1) Plan your MVP first 2) Divide tasks by skill 3) Test early and often. Good luck everyone!',
   'academic', true),
  ('Admin User', 'admin', 'Platform Guide: How to use your Transcript',
   'Your skill-based transcript updates automatically as you complete courses and projects. Check the Mastery Transcript module to see your progress.',
   'general', false);

-- ============================================================
-- HELPFUL VIEWS
-- ============================================================

-- Student summary with average skill score
create or replace view student_summary as
select
  s.id,
  s.student_id,
  s.name,
  s.age,
  s.grade,
  s.era,
  count(distinct sk.id)     as skill_count,
  round(avg(sk.score))      as avg_score,
  count(distinct a.id)      as achievement_count,
  count(distinct c.id)      as credential_count,
  count(distinct e.id)      as enrollment_count
from students s
left join skills        sk on sk.student_id = s.id
left join achievements  a  on a.student_id  = s.id
left join credentials   c  on c.student_id  = s.id
left join enrollments   e  on e.student_id  = s.id
group by s.id, s.student_id, s.name, s.age, s.grade, s.era;
