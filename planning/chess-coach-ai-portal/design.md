## Context

This is a greenfield web application — there is no existing chess coaching portal to migrate from. The system must serve three distinct user roles (coach, student, parent) with meaningfully different experiences. The core differentiator is persistent, personalized AI context per student: every AI interaction is informed by that student's history, game patterns, goals, and health notes. The stack should be chosen to minimize operational complexity while supporting LLM integration, real-time data, and a multi-role auth model.

## Goals / Non-Goals

**Goals:**
- Role-based portal with three distinct UX surfaces: Coach Dashboard, Student Mentor, Parent Report View
- Persistent student profiles that accumulate history across sessions (games, feedback, goals, wellness notes)
- AI mentor for students: conversational, context-aware, chess-knowledgeable
- AI assistant for coach: aggregated student insights, alerts, suggestions, progress summaries
- Monthly progress reports auto-generated and deliverable to parents (email or in-app)
- Target-based improvement plans: topic list + milestones + deadlines per student
- Game analysis module: input PGN or position, get AI feedback with pattern detection
- Health/mental coach module: integrated wellness check-ins and tips during student sessions

**Non-Goals:**
- Real-time multiplayer chess (no game board engine in v1)
- Mobile native apps (web-responsive only in v1)
- Payment/billing system
- Automated tournament management
- Integration with external chess platforms (Lichess, Chess.com) in v1

## Decisions

### 1. Full-stack framework: Next.js (App Router)
**Why:** Single codebase for coach, student, and parent surfaces. Server components handle data fetching close to the DB; client components handle interactive AI chat. Built-in API routes serve the LLM proxy layer. Avoids maintaining a separate backend service in v1.
**Alternative considered:** Separate React frontend + Express backend — rejected due to added deployment complexity for a solo/small team.

### 2. Database: PostgreSQL via Prisma ORM
**Why:** Student profiles, progress records, plans, and reports are relational data. Prisma provides type-safe queries and easy schema migration. PostgreSQL handles JSON columns for flexible AI context blobs.
**Alternative considered:** MongoDB — rejected because the core domain (students, plans, sessions) is highly relational.

### 3. AI layer: Anthropic Claude API (claude-sonnet-4-6) with prompt caching
**Why:** Claude performs strongly on instructional, analytical, and long-context tasks — all critical here. Prompt caching reduces cost and latency for student profile context (which is loaded on every mentor interaction). System prompts are pre-cached per student.
**Alternative considered:** OpenAI GPT-4o — viable, but Claude's larger context window and caching support are a better fit for persistent student context.

### 4. Student context strategy: DB-backed context window with summarization
**Why:** Student history (games, notes, feedback, goals) grows over time and cannot all fit in a single prompt. A summarization job runs periodically (or on-demand) to compress history into a structured "student context document" stored in the DB, which is injected into every AI call for that student.
**Alternative considered:** Full history in prompt — rejected due to token limits and cost at scale.

### 5. Authentication: NextAuth.js with role-based access control
**Why:** Supports email/password and OAuth providers. Role field on User model (COACH, STUDENT, PARENT) gates routes and API access. Middleware-based route protection.
**Alternative considered:** Clerk — good DX but adds a third-party dependency for a core feature; NextAuth keeps auth self-contained.

### 6. Parent reports: Scheduled generation + email delivery
**Why:** Reports should be periodic (weekly/monthly) rather than real-time to reduce noise. A cron job (or Vercel cron) triggers report generation via the AI layer, stores the report in DB, and sends via Resend (email API).
**Alternative considered:** Manual coach-triggered reports only — rejected because automation is a key value proposition.

### 7. Deployment: Vercel + Supabase (PostgreSQL)
**Why:** Zero-config deployment for Next.js. Supabase provides managed PostgreSQL with a good free tier for early users, plus built-in connection pooling.
**Alternative considered:** Railway or Render — viable alternatives if Vercel/Supabase limits become an issue.

## Risks / Trade-offs

- **AI cost at scale** → Mitigate with prompt caching, summarized context documents, and rate limiting per student session
- **Context staleness** — summarized student context may lag recent sessions → Mitigate by always including last N raw session notes alongside the summary
- **PGN parsing complexity** — game analysis requires parsing chess notation → Use an existing library (chess.js) for move validation and position extraction before sending to AI
- **Report quality** — AI-generated parent reports may feel generic → Mitigate with rich structured student data fed to the prompt; coach can review before delivery
- **Role confusion in UX** — three very different surfaces share a codebase → Use Next.js route groups per role (`(coach)`, `(student)`, `(parent)`) with separate layouts to keep concerns cleanly separated

## Migration Plan

This is a new application — no migration from legacy system required.

**Rollout phases:**
1. Phase 1: Auth + student profiles + coach dashboard (manual data entry)
2. Phase 2: AI mentor for students + game analysis
3. Phase 3: Progress tracking + improvement plans + health coach
4. Phase 4: Parent reports + communication hub

**Rollback:** Each phase is independently deployable. Feature flags (env vars) gate phases in production.

## Open Questions

- Should coaches be able to edit AI-generated parent reports before sending, or send automatically?
- What chess game input formats will be supported in v1 for game analysis (PGN only, or FEN positions too)?
- Will there be a mobile-responsive requirement from day one or is desktop-first acceptable for v1?
