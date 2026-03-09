# Kids University — Mastery Platform Backend API v4.0

A complete REST API backend for the Kids University Mastery Platform.  
Built with **Node.js + Express + NeDB** (embedded file-persisted database, zero native dependencies).

---

## Quick Start

```bash
# Install dependencies
npm install

# Start server
npm start
# → Server running at http://localhost:3001
```

**Default credentials** (all use password: `kidsuni2024`):
| Email | Role |
|---|---|
| admin@kidsuni.edu | admin |
| anjali@kidsuni.edu | mentor |
| priya@kidsuni.edu | mentor |
| vikram@kidsuni.edu | mentor |

---

## API Reference

All endpoints (except `/api/auth/login` and `/api/health`) require:
```
Authorization: Bearer <JWT_TOKEN>
```

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login → returns JWT token |
| POST | `/api/auth/register` | Register new user |
| GET | `/api/auth/me` | Get current user profile |
| GET | `/api/auth/users` | List all users |

**Login example:**
```json
POST /api/auth/login
{ "email": "admin@kidsuni.edu", "password": "kidsuni2024" }
→ { "token": "eyJ...", "user": { "name": "Admin User", "role": "admin" } }
```

---

### Students
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/students` | List all students |
| GET | `/api/students?search=rohan` | Search by name |
| GET | `/api/students?era=Application` | Filter by ERA stage |
| GET | `/api/students?level=Advanced` | Filter by mastery level |
| GET | `/api/students/:id` | Full student profile (with skills, goals, credentials) |
| POST | `/api/students` | Create student |
| PUT | `/api/students/:id` | Update student |
| DELETE | `/api/students/:id` | Delete student (cascades all related data) |

**Create student:**
```json
POST /api/students
{
  "name": "Ali Hassan",
  "age": 13,
  "grade": "Grade 8",
  "era": "Exploration",
  "programStart": "2024-09-01",
  "statement": "I want to build games that teach kids to code."
}
```

---

### Skills
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/students/:id/skills` | Get all skill scores (grouped by domain) |
| POST | `/api/students/:id/skills` | Upsert a skill score |

**Update skill:**
```json
POST /api/students/1001/skills
{ "domain": "technical", "skillName": "Coding & Programming", "score": 95 }
```

**Domains:** `cognitive` · `social` · `emotional` · `technical` · `global` · `practical` · `health`

---

### Courses & Enrollments
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/courses` | List all courses (with enrollment counts) |
| GET | `/api/courses/:id` | Course detail with enrollments |
| POST | `/api/courses` | Create course |
| PUT | `/api/courses/:id` | Update course |
| DELETE | `/api/courses/:id` | Delete course |
| POST | `/api/courses/:id/enroll` | Enrol student in course |
| PUT | `/api/courses/:id/enroll/:studentId` | Update enrollment status |

---

### Credentials
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/credentials` | All credentials |
| GET | `/api/credentials?studentId=1001` | Student's credentials |
| POST | `/api/credentials` | Issue new credential |
| DELETE | `/api/credentials/:id` | Revoke credential |
| GET | `/api/credentials/verify/:id` | Verify credential (public) |

**Issue credential:**
```json
POST /api/credentials
{
  "studentId": 1001,
  "type": "Open Badge",
  "name": "Advanced Python Coder",
  "skill": "Coding & Programming",
  "evidence": "https://github.com/rohan/app"
}
```
**Types:** `Open Badge` · `Mastery Credit` · `Course Completion` · `Graduate Attribute`

---

### Evidence
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/evidence` | All evidence items |
| GET | `/api/evidence?studentId=1001` | Student's evidence |
| POST | `/api/evidence` | Upload evidence |
| PUT | `/api/evidence/:id` | Update evidence |
| DELETE | `/api/evidence/:id` | Delete evidence |

---

### Goals
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/goals?studentId=1001` | Student's goals |
| POST | `/api/goals` | Create goal |
| PUT | `/api/goals/:id/toggle` | Toggle done/undone |
| DELETE | `/api/goals/:id` | Delete goal |

---

### Transcripts (CLR-style)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/transcripts/:studentId` | Full mastery transcript |
| GET | `/api/transcripts/:studentId/share` | Generate shareable link (30-day JWT) |

**Transcript response includes:**
- Student profile + ERA stage
- Composite score + overall level (Beginner/Intermediate/Advanced)
- All 7 domains with skill breakdowns + MTC proficiency levels
- Course enrollments
- Achievements, goals, credentials, evidence
- Mentor feedback + recommendations
- Graduate profile scores (8 attributes)

---

### Analytics
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/analytics/dashboard` | Platform-wide stats (totals, ERA dist, domain averages) |
| GET | `/api/analytics/leaderboard` | Students ranked by composite score |
| GET | `/api/analytics/skill-heatmap` | Average score per skill per domain |
| GET | `/api/analytics/student/:id/progress` | Skill history over time |

---

### Forum & Announcements
| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/api/forum` | List / create posts |
| POST | `/api/forum/:id/like` | Like a post |
| POST | `/api/forum/:id/reply` | Reply to a post |
| GET/POST/PUT/DELETE | `/api/announcements` | CRUD announcements |

---

## Database Schema

**15 NeDB collections** stored as files in `db/data/`:

| Collection | Description |
|---|---|
| `users.db` | Admins, mentors (bcrypt-hashed passwords) |
| `students.db` | Student profiles |
| `skills.db` | Skill scores per student per domain |
| `courses.db` | Course catalogue |
| `enrollments.db` | Student ↔ course mappings |
| `achievements.db` | Competition wins, certifications, badges |
| `goals.db` | Learning goals with completion tracking |
| `credentials.db` | Open badges, mastery credits, CLR attributes |
| `evidence.db` | Portfolio evidence (videos, docs, projects) |
| `mentor_feedback.db` | Mentor assessments and recommendations |
| `forum.db` | Discussion posts with replies and likes |
| `announcements.db` | Platform-wide announcements |
| `notifications.db` | User notifications |
| `grad_profiles.db` | Graduate attribute progress |
| `audit_log.db` | All create/update/delete operations |

---

## Skill Framework

**7 Domains × 4 Skills = 28 total trackable skills**

| Domain | Skills |
|---|---|
| 🧠 Cognitive | Critical Thinking · Creativity & Innovation · Problem-Solving · Analytical Reasoning |
| 🤝 Social | Collaboration · Communication (Verbal) · Communication (Written) · Empathy |
| 💚 Emotional | Resilience · Self-Awareness · Adaptability · Stress Management |
| 💻 Technical | Digital Literacy · Coding & Programming · Data Analysis · AI Literacy |
| 🌍 Global | Cultural Intelligence · Sustainability · Ethical Reasoning · Global Collaboration |
| ⚙️ Practical | Financial Literacy · Entrepreneurship · Time Management · Leadership |
| 🌱 Health | Physical Health · Mental Health Awareness · Mindfulness · Nutrition Awareness |

**Score → Level mapping:**
- 0–50: Beginner
- 51–80: Intermediate
- 81–100: Advanced

**MTC Proficiency Scale:**
- 90–100: Mastery
- 75–89: Proficient
- 55–74: Developing
- 30–54: Foundational
- 0–29: Not Started

---

## Testing

```bash
# With server running:
npm test
# → Runs 40 API tests covering all endpoints
```

---

## Environment Variables (`.env`)

```
PORT=3001
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
DB_PATH=./db/data
```
