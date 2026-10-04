# Study Nowie 2.0

A personal CBSE Class 10 board-exam preparation system — built for one student, one goal: walk into the February 2026 boards fully prepared, with nothing left to chance and no time wasted on busywork.

This is a complete rebuild. The old Study Nowie was a static HTML/CSS/vanilla-JS planner with JSON files and localStorage. Nothing from it is reused — not the architecture, not the data, not the content. This version is a typed Next.js application on Supabase, and the study content inside it is written from scratch against the **actual CBSE 2025–26 syllabus, blueprint, and marking scheme**.

---

## 1. The problem this app solves

It is **4 October 2025**. The CBSE Class 10 board exams begin on **17 February 2026**. That is **136 days**, and preparation has not started.

The student has ~2–3 focused hours on school days, more on weekends. Maths is the weakest subject. The target is 90%+.

That is achievable, but only with a plan that is honest about arithmetic. 136 days is not "four months of revision" — it is roughly 100 usable study days after school, holidays, illness, and slippage. The whole point of this app is to convert that scarce time into the highest possible marks per hour, by always answering one question clearly: **what should I study right now, and why that?**

The app will never promise 90%. It shows real pace against required pace, including when she is behind.

---

## 2. What makes this different from a generic planner

Most study apps are to-do lists with a progress bar. This one is built around the structure of the actual exam.

### It plans backwards from the real datesheet

The CBSE Class 10 2026 datesheet is published, and the gaps between papers are not uniform. This is the single most exploitable fact in the entire plan:

| Date | Paper | Days since previous paper |
|---|---|---|
| **Tue 17 Feb 2026** | **Mathematics (Standard / Basic)** | — (day 1) |
| Sat 21 Feb 2026 | English (Language & Literature) | 4 |
| Wed 25 Feb 2026 | Science | 4 |
| Mon 2 Mar 2026 | Hindi (Course A / B) | 5 |
| **Sat 7 Mar 2026** | **Social Science** | 5 |

Maths — the weakest subject — is the **first paper, with zero buffer before it**. Social Science is last, with **18 days of study leave** available after the exams begin. So the pre-board plan front-loads Maths hard and deliberately back-loads Social Science memory-heavy work into the gap days. The app encodes this: every session carries a `phase`, and the February phase schedules revision in reverse datesheet order.

### It knows which chapters are worth the most marks

Content is not distributed evenly, because marks are not distributed evenly. Every chapter in the database carries a `board_weightage` (marks in the 80-mark paper) and a `cbq_frequency` (how often it appears as a competency-based question). The planner and the "what to study now" logic sort by marks-at-risk, not by chapter number.

**Mathematics (80 marks theory + 20 internal)**

| Unit | Marks | Chapters |
|---|---|---|
| Algebra | 20 | Polynomials, Pair of Linear Equations, Quadratic Equations, Arithmetic Progressions |
| Geometry | 15 | Triangles, Circles |
| Trigonometry | 12 | Introduction to Trigonometry, Heights & Distances |
| Statistics & Probability | 11 | Statistics, Probability |
| Mensuration | 10 | Areas Related to Circles, Surface Areas & Volumes |
| Number Systems | 6 | Real Numbers |
| Coordinate Geometry | 6 | Coordinate Geometry |

**Science (80 marks theory + 20 internal)**

| Unit | Marks | Highest-value chapters |
|---|---|---|
| Chemical Substances – Nature & Behaviour | 25 | Metals and Non-metals (10), Chemical Reactions (6), Carbon & its Compounds (6), Acids Bases & Salts (3) |
| World of Living | 25 | Life Processes (9), Heredity & Evolution (7), Control & Coordination (6), How do Organisms Reproduce (3) |
| Effects of Current | 13 | Electricity (7), Magnetic Effects (6) |
| Natural Phenomena | 12 | Light – Reflection & Refraction (10), Human Eye (2) |
| Natural Resources | 5 | Our Environment |

The practical consequence: **Real Numbers is a 6-mark chapter and the old app opened with it.** This one opens with Maths fundamentals that unlock Algebra's 20 marks, and treats Light + Electricity + Life Processes + Metals (≈36 Science marks between four chapters) as the Science spine.

### It is built for the 2026 paper pattern, not the 2019 one

Roughly **50% of every 80-mark theory paper is now competency-based** — case studies, source-based questions, assertion-reason, and application MCQs. Rote summaries do not score these. So the content in this app is not "random summaries":

- Every chapter gets **case-study practice** matching Section E format (a 50–120 word stimulus with 3–4 sub-questions), because that is 12 marks in Maths and 12 in Science, every single year.
- Every chapter gets **assertion-reason items**, which are their own skill and are routinely lost by students who know the content.
- Questions are tagged by **mark value** (1/2/3/4/5), so practice mirrors the real section structure rather than being an undifferentiated MCQ pile.
- Answers are written to the **marking scheme**: step marks for Maths, keyword-based value points for Science and Social Science, and format marks for languages.

### Maths Basic and Standard in one content tree

Her Maths level may end up Basic rather than Standard. The two papers share the same syllabus and the same exam date — they differ in difficulty distribution (Basic is 75% remembering/understanding; Standard is 54%, with 22% in the applying-evaluating-creating band).

So there are **not two plans**. There is one chapter tree where harder exercises, tougher MCQs, and extended applications are tagged `standard_only`. A single switch in Settings (`maths_level`) hides or greys those items. She is safe under either paper, the decision can be deferred to December, and nothing has to be rebuilt.

### It targets the leak, not just the syllabus

Finishing the syllabus is not the same as scoring. Marks leak through repeated mistakes, so the app makes mistakes first-class data:

- A **mistake notebook** — question/topic, what went wrong, the correct method, and a scheduled reattempt date. Items surface on the dashboard when the reattempt comes due.
- **Weak-topic detection** driven by actual quiz and test scores, not self-assessment.
- A **marks tracker** for chapter tests, sample papers, and mocks, with a trend line and a per-subject projection.
- **Internal assessment is 20 marks per subject** and is often ignored until it is too late. The app tracks it as a visible component of the 100, not an afterthought.

---

## 3. The preparation plan the app implements

Four phases, each encoded as a `phase` value on sessions so the dashboard can show where she is and whether she is on track.

### Phase 1 — Foundation (4 Oct → 31 Oct, ~28 days)
Fix the base before building on it. Maths diagnostic on day one to produce a real weak-topic profile instead of a guess. Heavy Maths fundamentals — the arithmetic, algebraic manipulation, and equation-solving that every later chapter silently depends on. Begin high-weightage Science chapters. Start short revision notes for Science and Social Science in the format they will actually be revised from. Textbook questions immediately after each topic, never deferred.

### Phase 2 — Syllabus completion (1 Nov → 15 Dec, ~45 days)
Cover the full syllabus across all five subjects, prioritised by marks. Introduce previous-year and competency-based questions as soon as a chapter is closed, not at the end. One timed chapter test every week, logged. The mistake notebook becomes the main driver of what gets re-studied.

### Phase 3 — First full revision (16 Dec → 31 Jan, ~47 days)
Complete revision round one. Chapter-wise sample papers first, then full-length papers under timing. Identify repeated error patterns from the mistake log and attack them specifically. Maths gets a dedicated recovery track: NCERT concept → solved examples unaided → full exercise → mark unsolved → extra questions only once NCERT is comfortable → reattempt wrong questions after 2–3 days. Note: **school practicals and internal assessment run from 1 January**, so January capacity is lower than it looks and the plan accounts for that.

### Phase 4 — Exam sprint (1 Feb → 7 Mar)
Full mock papers under exam conditions. Formula sheets, diagrams, map work, definitions, dates, and writing formats. No new resources — consolidation only. From 17 February the plan switches to **gap-day mode**, allocating each inter-paper gap to the next paper in datesheet order: Maths → English → Science → Hindi → Social Science.

### Weekly rhythm

| | Maths | Science / Social Science | Language | Test & review |
|---|---|---|---|---|
| School day (~2.5h) | 75 min | 50 min | 25 min | — |
| Weekend (~5h) | 120 min | 60 min + 60 min | 30 min | 30 min |

Every task in the database carries `estimated_minutes`, so the daily view shows a time-budgeted plan that actually fits the day rather than an open-ended list.

### Subject methods baked into the checklists

Checklist templates are per subject, not generic:

- **Mathematics** — the 7-step recovery loop above, with "marked unsolved" and "reattempt due" as tracked states.
- **Science** — definitions, laws, formulas, balanced equations, labelled diagrams, numericals, and a one-page chapter summary. Diagram practice is explicitly separate, since diagram marks are reliably winnable.
- **Social Science** — timelines, key terms, likely 3- and 5-mark questions, examples, and map work. Long answers practised with headings and bullet structure, because that is how the marking scheme awards points.
- **English** — reading comprehension, writing formats (letter, analytical paragraph), literature answers, grammar.
- **Hindi** — पाठ पढ़ना, भावार्थ, शब्दार्थ, व्याकरण, लेखन (अनुच्छेद, पत्र, सूचना).

---

## 4. Features

**Dashboard** — days to boards, current phase, today's time-budgeted plan, active session, overall progress, on-track vs. behind status, mistakes due for reattempt, and quick cards for Continue Study, Pending Quizzes, Completed Subjects, and Upcoming Sessions.

**Study sessions** — session number, date, phase, focus topics, and five subjects. Each subject has chapter, focus topic, checklist items, resources, and a quiz. Future sessions can be locked until prerequisites are complete; the rule lives in one configurable place.

**Syllabus tracker** — a chapter-wise grid across all five subjects with states: not started → learning → NCERT done → revised → tested. Chapters already covered at school can be pre-marked.

**Quiz engine** — questions with options, correct answer, optional explanation, mark value, difficulty, and type (MCQ / assertion-reason / case-study). Immediate score, correct/wrong review, explanations. Retakes allowed; full attempt history retained.

**Question bank** — filterable by subject, chapter, difficulty, mark value, and question type. Practice sets generate independently of session quizzes.

**Previous year papers** — PYQs and sample papers by subject and year, with links or PDFs in Supabase Storage, a timed full-length mode, and marks logging.

**Mistake notebook** — the repeated-error system described above, with reattempt scheduling.

**Marks tracker** — chapter tests, sample papers, and mocks over time, with trend charts and per-subject projections.

**Progress** — overall, per-session, per-subject, and per-chapter progress, quiz scores, completed sessions, and weak topics. Updates immediately after any checklist or quiz change.

**Completed sessions** — date completed, subjects covered, quiz scores, and review access.

**Admin panel** — full CRUD for sessions, subjects, checklist items, resources, quizzes, question bank, and papers. Validated forms, confirmation dialogs on destructive actions, and student-progress visibility. All changes write to the database.

**Settings** — display name, class, Maths level (Basic/Standard), exam date, theme (light/dark), and reset progress with confirmation.

---

## 5. Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) + TypeScript (strict) |
| Styling | Tailwind CSS |
| Components | shadcn/ui on Radix primitives |
| Database / Auth / Storage | Supabase (Postgres, RLS, Storage) |
| Hosting | Vercel |
| Quality | ESLint + Prettier, typed Supabase client |

No Firebase. No hardcoded credentials. No paid services — Supabase free tier and Vercel hobby are sufficient.

---

## 6. Project structure

```
study-nowie-2.0/
├── src/
│   ├── app/
│   │   ├── (auth)/              login, signup, callback
│   │   ├── (app)/               dashboard, sessions, syllabus, quiz,
│   │   │                        question-bank, papers, mistakes, progress,
│   │   │                        completed, settings
│   │   ├── (admin)/admin/       sessions, content, quizzes, papers, students
│   │   └── api/
│   ├── components/
│   │   ├── ui/                  shadcn primitives
│   │   ├── layout/              sidebar, mobile drawer, header
│   │   ├── dashboard/  sessions/  quiz/  progress/  admin/
│   ├── lib/
│   │   ├── supabase/            browser, server, middleware clients
│   │   ├── planner/             phase logic, pacing, datesheet, locking rules
│   │   ├── queries/             typed data access
│   │   └── utils/
│   ├── types/                   generated DB types + domain types
│   └── hooks/
├── supabase/
│   ├── migrations/              numbered SQL migrations
│   └── seed/                    syllabus, sessions, quizzes, question bank
├── .env.example
└── README.md
```

---

## 7. Database schema

Postgres on Supabase. Every user-owned table is protected by row-level security; admin access is role-based via `profiles.role`.

| Table | Purpose |
|---|---|
| `profiles` | User identity, `role` (student/admin), display name, class, `maths_level`, theme, exam date |
| `subjects` | The five subjects, with paper date and internal-assessment weight |
| `chapters` | Chapter master with `board_weightage`, `cbq_frequency`, unit, and order |
| `sessions` | Session number, date, `phase`, title, focus topics, prerequisites |
| `session_subjects` | Join of session × subject with chapter, focus topic, `estimated_minutes` |
| `checklist_items` | Ordered tasks per session-subject, with `standard_only` flag |
| `resources` | Typed links (youtube / ncert_pdf / notes / extra_questions) with validation |
| `quizzes` | Quiz metadata, linked to a session-subject or standalone |
| `quiz_questions` | Question text, JSONB options, correct answer, explanation, marks, difficulty, type |
| `quiz_attempts` | Per-user attempt history with score and per-question responses |
| `checklist_progress` | Per-user completion state and timestamps |
| `chapter_progress` | Per-user syllabus-tracker state per chapter |
| `question_bank` | Standalone questions by subject / chapter / difficulty / marks / type |
| `previous_year_papers` | Papers by subject and year, link or Storage file, with solutions |
| `mistakes` | Mistake notebook entries with reattempt scheduling |
| `test_scores` | Logged marks for chapter tests, sample papers, and mocks |

Includes SQL migration files, RLS policies, role-based admin access, indexes on every foreign key and common filter, and seed data covering the full Class 10 syllabus.

---

## 8. Local setup

Requires Node 18+ (developed on Node 22).

```bash
git clone https://github.com/zapp111/Study-Nowie-2.0.git
cd Study-Nowie-2.0
npm install
cp .env.example .env.local   # fill in Supabase values
npm run dev
```

Open http://localhost:3000.

```bash
npm run build      # production build
npm run lint       # eslint
npm run format     # prettier
npm run typecheck  # tsc --noEmit
```

---

## 9. Supabase setup

1. Create a project at [supabase.com](https://supabase.com) (free tier is enough). Choose a region close to India.
2. Copy the **Project URL** and **anon public key** from Project Settings → API into `.env.local`.
3. Run migrations — either paste `supabase/migrations/*.sql` in order into the SQL Editor, or use the CLI:
   ```bash
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```
4. Run the seed files in `supabase/seed/` in order to load the syllabus, sessions, and question content.
5. **Auth** → enable Email provider. Disable public sign-ups once both accounts exist (this is a private app for two people).
6. **Auth → URL Configuration** → Site URL `http://localhost:3000` for local, your Vercel URL for production. Redirect URLs: `http://localhost:3000/**` and `https://<your-app>.vercel.app/**`.
7. **Storage** → create a `papers` bucket (private) for PYQ and sample-paper PDFs. Policies are included in the migrations.
8. Promote the admin account: after signing up, set `role = 'admin'` on that row in `profiles`.

A second Supabase project can be used for staging later — nothing is hardcoded to one instance; only the env vars change.

---

## 10. Deployment (Vercel)

1. Import the GitHub repo at [vercel.com/new](https://vercel.com/new). Next.js is detected automatically; no build-setting changes required.
2. Add these environment variables (Production, Preview, and Development):

   | Variable | Value | Exposed to browser |
   |---|---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | Yes |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public key | Yes |
   | `NEXT_PUBLIC_SITE_URL` | `https://<your-app>.vercel.app` | Yes |
   | `SUPABASE_SERVICE_ROLE_KEY` | Service role key — **only if** admin bulk operations need it | No, server only |

   The anon key is safe in the browser; RLS is what protects the data. The service-role key must never appear in client code or in chat.
3. Deploy, then add the Vercel URL to Supabase redirect URLs (step 6 above).

---

## 11. Design

Soft study-dashboard aesthetic: generous spacing, restrained colour, rounded cards, no visual noise. Sidebar navigation on desktop, drawer on mobile. Progress bars, badges, empty states, skeleton loading states, and real error states — no default browser dialogs anywhere. Light and dark themes. Accessible semantics, visible focus rings, and full keyboard operation throughout. Responsive from phone to desktop; the daily view in particular is designed to be used one-handed on a phone.

---

## 12. Build phases

**Phase 1 — Foundation.** Scaffold, schema, migrations, RLS, auth with student/admin roles, layout and navigation, dashboard, sessions, subject view, quiz engine, progress, admin CRUD.

**Phase 2 — Full feature set.** Syllabus tracker, question bank, previous year papers with Storage, mistake notebook, marks tracker, completed sessions, settings with themes.

**Phase 3 — Content.** The full Oct→Feb session plan, chapter-wise checklists, researched resource links, and the question bank written against the CBSE blueprint, including case-study and assertion-reason items.

Nothing ships as "Coming Soon."

---

## 13. A note on honesty

136 days is enough for 90%+, but only if the time is spent on the right things in the right order. This app is built to make that ordering obvious and to tell the truth about where she actually stands — including the days when the answer is "behind, and here is what to cut." It will not inflate progress to feel encouraging.

Scores come from exercises solved, mistakes fixed, and papers written under time. The app's only job is to make sure none of those hours are wasted.
