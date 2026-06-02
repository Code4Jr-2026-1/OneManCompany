## 1. Project Setup

- [ ] 1.1 Initialise Next.js 14 project with App Router and TypeScript
- [ ] 1.2 Install and configure Prisma with PostgreSQL (Supabase)
- [ ] 1.3 Set up Tailwind CSS and shadcn/ui component library
- [ ] 1.4 Configure environment variables (DATABASE_URL, ANTHROPIC_API_KEY, NEXTAUTH_SECRET, RESEND_API_KEY)
- [ ] 1.5 Set up NextAuth.js with email/password provider and COACH / STUDENT / PARENT roles
- [ ] 1.6 Create route groups: `(coach)`, `(student)`, `(parent)` with separate layouts and middleware guards
- [ ] 1.7 Deploy skeleton to Vercel and confirm DB connection

## 2. Database Schema

- [ ] 2.1 Create `User` model with role enum (COACH, STUDENT, PARENT)
- [ ] 2.2 Create `Student` model: name, age, rating, skillLevel, goals, coachId FK
- [ ] 2.3 Create `StudentContext` model: studentId FK, contextSummary (text), rawNotesBuffer (JSON), updatedAt
- [ ] 2.4 Create `Session` model: studentId FK, date, coachNotes, wellnessData (JSON), aiSummary
- [ ] 2.5 Create `GameAnalysis` model: studentId FK, pgn, aiAnalysis, patternsDetected (JSON), createdAt
- [ ] 2.6 Create `ProgressSnapshot` model: studentId FK, month, rating, topicMastery (JSON), improvementRate
- [ ] 2.7 Create `ImprovementPlan` model: studentId FK, topics (JSON), milestones (JSON), startDate, endDate, isActive
- [ ] 2.8 Create `ParentReport` model: studentId FK, month, content, status (DRAFT/SENT), sentAt
- [ ] 2.9 Create `Message` model: fromUserId FK, toUserId FK, body, readAt, createdAt
- [ ] 2.10 Run initial migration and seed script with a demo coach + 2 students

## 3. Student Profile

- [ ] 3.1 Build student creation form (coach-facing) with all required fields
- [ ] 3.2 Build student profile edit page
- [ ] 3.3 Implement student history log view (reverse chronological feed of sessions, analyses, notes)
- [ ] 3.4 Implement StudentContext update logic — append new session data and trigger summarisation when buffer exceeds threshold
- [ ] 3.5 Write context summarisation function: calls Claude API to compress raw notes buffer into updated summary

## 4. Coach Dashboard

- [ ] 4.1 Build student roster list with status cards (rating, trend indicator, last active, plan progress)
- [ ] 4.2 Implement sort/filter by improvement trend and last active date
- [ ] 4.3 Build per-student detail page with tabs: Overview, History, Plan, Analyses, Wellness, Messages
- [ ] 4.4 Implement AI coaching suggestion panel (calls Claude with student context, returns coaching tips for coach)
- [ ] 4.5 Build session notes entry form and save flow (saves to Session, triggers context update)
- [ ] 4.6 Implement inactivity alert badge (configurable threshold, default 7 days)
- [ ] 4.7 Build aggregate overview tab with cross-student metrics

## 5. Game Analysis

- [ ] 5.1 Install chess.js for PGN parsing and move extraction
- [ ] 5.2 Build game analysis submission form (PGN textarea + submit button)
- [ ] 5.3 Implement API route: parse PGN → extract moves → call Claude for analysis → save GameAnalysis record
- [ ] 5.4 Build analysis results display: key moments list, summary paragraph, detected patterns
- [ ] 5.5 Trigger student context update with newly detected patterns after each analysis
- [ ] 5.6 Build coach view of student's game analysis history

## 6. Progress Tracking

- [ ] 6.1 Implement monthly snapshot job (Vercel cron or manual trigger) that records ProgressSnapshot for each active student
- [ ] 6.2 Build rating trend line chart (recharts or Chart.js) for student and coach views
- [ ] 6.3 Build topic mastery radar/spider chart
- [ ] 6.4 Implement improvement rate calculation: compare current month snapshot to previous month
- [ ] 6.5 Surface improvement rate indicator on coach dashboard student cards

## 7. Improvement Plan

- [ ] 7.1 Build "Generate Plan" button that calls Claude with student context + goals → returns structured plan JSON
- [ ] 7.2 Build plan editor for coach: add/remove/edit topics and milestones, set deadlines
- [ ] 7.3 Build student-facing plan view: topic list with progress bars and deadlines
- [ ] 7.4 Implement milestone completion toggle (student or coach can mark done)
- [ ] 7.5 Build plan history list for coach view

## 8. AI Mentor (Student)

- [ ] 8.1 Build conversational chat UI (streaming responses) for student mentor session
- [ ] 8.2 Implement mentor API route: load student context → build system prompt → stream Claude response
- [ ] 8.3 Add wellness check-in at session start (3 quick questions, save responses to Session.wellnessData)
- [ ] 8.4 Implement session auto-summary on session end: call Claude to summarise topics discussed
- [ ] 8.5 Save session summary to Session record and trigger context update
- [ ] 8.6 Ensure system prompt adapts explanation depth to student's stored skill level

## 9. Health Coach

- [ ] 9.1 Build wellness check-in component (embedded in mentor session start flow)
- [ ] 9.2 Implement logic to detect low wellness scores and adjust mentor session tone/intensity
- [ ] 9.3 Build wellness history chart for coach view (mood, energy, sleep over time)
- [ ] 9.4 Integrate mental performance tips into analysis and mentor responses (injected via system prompt context)

## 10. Parent Reports

- [ ] 10.1 Implement monthly report generation job: gather student data → call Claude → save as DRAFT ParentReport
- [ ] 10.2 Build coach report review/edit UI with approve and discard actions
- [ ] 10.3 Implement "Send to Parent" action: send email via Resend API, update status to SENT, record sentAt
- [ ] 10.4 Build parent-facing report view page (in-app, accessible after login)
- [ ] 10.5 Build sent reports list with delivery status (Sent / Opened) tracked via Resend webhooks

## 11. Communication Hub

- [ ] 11.1 Build in-app messaging UI for coach ↔ student (thread view per student)
- [ ] 11.2 Implement message send/receive API routes
- [ ] 11.3 Add in-app notification badge for unread messages
- [ ] 11.4 Implement email notification for new messages when recipient is offline (via Resend)
- [ ] 11.5 Build coach broadcast message UI (select recipients, compose, send)

## 12. Polish and Launch Readiness

- [ ] 12.1 Implement responsive layout for all key pages (mobile-usable on tablets)
- [ ] 12.2 Add loading states and error boundaries to all async data pages
- [ ] 12.3 Write end-to-end tests for critical flows: student creation, game analysis, report send
- [ ] 12.4 Review and harden all API routes with proper auth checks (no cross-role data leakage)
- [ ] 12.5 Set up Vercel cron jobs for monthly snapshot and report generation
- [ ] 12.6 Conduct coach UAT session and address feedback before public launch
