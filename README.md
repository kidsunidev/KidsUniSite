# Kids University — Mastery Platform v4.0

A full-stack skill-based learning management system for Kids University, featuring mastery transcripts, digital credentials, ERA framework tracking, and a complete student information system.

---

## Project Structure

```
KidsUniSite/
├── frontend/
│   └── index.html          # Full LMS+SIS single-page app (~680KB)
│
├── backend/
│   ├── server.js            # Express API server
│   ├── db/
│   │   └── database.js      # NeDB schema + seed data
│   ├── middleware/
│   │   └── auth.js          # JWT authentication
│   ├── routes/
│   │   ├── auth.js          # Login, register, user management
│   │   ├── students.js      # Student CRUD + skills + achievements
│   │   ├── courses.js       # Course library + enrollments
│   │   ├── credentials.js   # Open badges + mastery credits
│   │   ├── evidence.js      # Portfolio evidence vault
│   │   ├── goals.js         # Learning goals
│   │   ├── transcripts.js   # CLR-style mastery transcripts
│   │   ├── analytics.js     # Dashboard stats + leaderboard
│   │   ├── forum.js         # Discussion forum
│   │   └── announcements.js # Platform announcements
│   ├── .env.example         # Environment variable template
│   ├── package.json
│   ├── test-api.js          # Full API test suite (40 tests)
│   └── README.md            # Backend API documentation
│
└── README.md                # This file
```

---

## Quick Start

### Frontend (no server needed)
Just open `frontend/index.html` in a browser. Runs fully in demo mode with built-in seed data.

### Backend API
```bash
cd backend
npm install
cp .env.example .env        # Edit JWT_SECRET for production
npm start
# → API running at http://localhost:3001
```

**Default login credentials** (password: `kidsuni2024`):
- `admin@kidsuni.edu` — Admin
- `anjali@kidsuni.edu` — Mentor
- `priya@kidsuni.edu` — Mentor

### Connect Frontend to Backend
In `frontend/index.html`, find this line near the top of the `<script>` tag:
```javascript
const USE_BACKEND = false;  // ← change to true
```
Then click the **SWITCH** button in the sidebar to connect live.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML/CSS/JS, single-file SPA |
| Backend | Node.js + Express |
| Database | NeDB (embedded, file-persisted) → migrating to Supabase |
| Auth | JWT (bcryptjs) |
| Styling | Custom CSS design system (Sora + Plus Jakarta Sans) |

---

## Features

- **21-module platform**: Dashboard, Students, Courses, Portfolio, Goals, Transcripts, Credentials, Evidence Vault, Analytics, Forum, Announcements, ERA Framework, Skill Matrix, Graduate Profiles, Journey to Mastery, MTC Learning Record, Competency Wheel, Progress Tracker, Digital Wallet, Messages, Notifications
- **7-domain skill framework**: Cognitive, Social, Emotional, Technical, Global, Practical, Health (28 skills total)
- **ERA system**: Exploration → Reinforcement → Application
- **CLR-style transcripts**: Comprehensive Learner Record with shareable links
- **8 Graduate Attributes**: Aligned with OECD and WEF future skills frameworks
- **MTC 5-level proficiency**: Not Started → Foundational → Developing → Proficient → Mastery
- **45 REST API endpoints** with JWT auth and role-based access

---

## Roadmap

- [ ] Migrate database to Supabase (PostgreSQL)
- [ ] Parent portal with read-only access
- [ ] PDF transcript export
- [ ] Email notifications
- [ ] Mobile responsive improvements
- [ ] Public credential verification page
