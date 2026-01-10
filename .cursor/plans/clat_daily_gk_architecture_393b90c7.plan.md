---
name: CLAT Daily GK Architecture
overview: Complete architectural plan for a Next.js 15 app that generates daily GK MCQs using Gemini AI with Google Search Grounding, featuring user streaks, historical practice, and secure cron-based automation.
todos:
  - id: init-project
    content: Initialize Next.js 15 project with TypeScript and install all dependencies
    status: completed
  - id: setup-db
    content: Configure Drizzle ORM, create database schema, and set up Supabase connection
    status: completed
    dependencies:
      - init-project
  - id: setup-auth
    content: Configure Supabase Auth with Google OAuth and Email/Password providers
    status: completed
    dependencies:
      - setup-db
  - id: ai-integration
    content: Implement Gemini AI client with Google Search grounding and question generation logic
    status: completed
    dependencies:
      - init-project
  - id: cron-security
    content: Create secure cron endpoints (/api/cron and /api/generate) with CRON_SECRET validation
    status: completed
    dependencies:
      - ai-integration
      - setup-db
  - id: streak-logic
    content: Implement flexible streak calculation with 48-hour grace period and IST timezone handling
    status: completed
    dependencies:
      - setup-db
  - id: ui-components
    content: Build UI components using Shadcn (QuestionCard, StreakDisplay, DatePicker, etc.)
    status: completed
    dependencies:
      - setup-auth
  - id: dashboard
    content: Create daily questions page with submission flow and results display
    status: completed
    dependencies:
      - ui-components
      - streak-logic
  - id: historical-practice
    content: Implement historical practice feature with calendar picker and date-based question fetching
    status: completed
    dependencies:
      - dashboard
  - id: profile-stats
    content: Build profile page with streak display, total score, and accuracy statistics
    status: completed
    dependencies:
      - dashboard
  - id: deploy-vercel
    content: Deploy to Vercel, configure environment variables, and set up cron job
    status: completed
    dependencies:
      - cron-security
      - dashboard
      - profile-stats
---

# CLAT Daily GK - Architectural Plan

## 1. Project Structure

```
CLAT_site/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx              # Today's questions
│   │   │   │   └── [date]/
│   │   │   │       └── page.tsx          # Historical practice
│   │   │   ├── profile/
│   │   │   │   └── page.tsx              # Stats, streak, scores
│   │   │   └── layout.tsx                # Protected route wrapper
│   │   ├── api/
│   │   │   ├── generate/
│   │   │   │   └── route.ts              # Cron-triggered question generation
│   │   │   └── cron/
│   │   │       └── route.ts              # Vercel cron endpoint
│   │   ├── layout.tsx                    # Root layout
│   │   ├── page.tsx                      # Landing page
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                           # Shadcn components
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── GoogleButton.tsx
│   │   ├── questions/
│   │   │   ├── QuestionCard.tsx
│   │   │   ├── QuestionSet.tsx
│   │   │   └── ResultsSummary.tsx
│   │   ├── dashboard/
│   │   │   ├── StreakDisplay.tsx
│   │   │   ├── StatsCard.tsx
│   │   │   └── DatePicker.tsx            # Calendar for historical practice
│   │   └── layout/
│   │       ├── Navbar.tsx
│   │       └── Sidebar.tsx
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── gemini-client.ts          # Gemini API wrapper
│   │   │   ├── prompt-templates.ts       # MCQ generation prompts
│   │   │   └── news-fetcher.ts           # Google Search grounding logic
│   │   ├── db/
│   │   │   ├── index.ts                  # Drizzle config & connection
│   │   │   ├── schema.ts                 # All table definitions
│   │   │   └── migrations/               # Drizzle migrations
│   │   ├── auth/
│   │   │   └── supabase-client.ts        # Supabase client setup
│   │   ├── utils/
│   │   │   ├── streak.ts                 # Streak calculation logic
│   │   │   └── date.ts                   # Timezone utilities (IST)
│   │   └── validations/
│   │       └── question-schema.ts        # Zod schemas for questions
│   ├── server-actions/
│   │   ├── questions.ts                  # Fetch questions, submit answers
│   │   ├── user.ts                       # Update streak, fetch stats
│   │   └── auth.ts                       # Auth helpers
│   └── types/
│       └── index.ts                      # Shared TypeScript types
├── public/
├── drizzle.config.ts
├── .env.local                            # Environment variables
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── components.json                        # Shadcn config
├── package.json
├── tsconfig.json
└── vercel.json                           # Cron job configuration
```

## 2. Dependencies Installation

```bash
# Core Next.js 15
npm install next@latest react@latest react-dom@latest

# TypeScript
npm install -D typescript @types/react @types/node

# Database & ORM
npm install drizzle-orm @supabase/supabase-js
npm install -D drizzle-kit

# Authentication
npm install @supabase/ssr @supabase/auth-helpers-nextjs

# AI Integration
npm install @google/generative-ai

# UI Framework
npm install tailwindcss postcss autoprefixer
npm install -D @tailwindcss/typography
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card calendar input label

# Icons
npm install lucide-react

# Validation
npm install zod

# Date handling
npm install date-fns date-fns-tz

# Utilities
npm install clsx tailwind-merge
```

## 3. Database Schema (Drizzle)

**File: `src/lib/db/schema.ts`**

```typescript
// Users table
users: {
  id: uuid (primary key, default gen_random_uuid())
  email: text (unique, not null)
  created_at: timestamp (default now())
  streak_count: integer (default 0)
  last_active_date: date (nullable)
  total_score: integer (default 0)
  last_completed_at: timestamp (nullable) // For flexible streak logic
}

// Question sets (one per day)
question_sets: {
  id: uuid (primary key)
  date: date (unique index, not null) // YYYY-MM-DD format
  created_at: timestamp (default now())
}

// Questions (10 per set)
questions: {
  id: uuid (primary key)
  set_id: uuid (foreign key -> question_sets.id, on delete cascade)
  content: text (not null) // The question text
  options: jsonb (not null) // { a: string, b: string, c: string, d: string }
  correct_option: text (not null) // 'a', 'b', 'c', or 'd'
  explanation: text (not null)
  category: text (not null) // e.g., 'current_affairs', 'constitution', 'history', etc.
  created_at: timestamp (default now())
}

// User responses
user_responses: {
  id: uuid (primary key)
  user_id: uuid (foreign key -> users.id, on delete cascade)
  question_id: uuid (foreign key -> questions.id, on delete cascade)
  selected_option: text (not null) // 'a', 'b', 'c', or 'd'
  is_correct: boolean (not null)
  answered_at: timestamp (default now())
  unique constraint: (user_id, question_id) // Prevent duplicate answers
}
```

**Indexes:**

- `question_sets.date` (unique)
- `questions.set_id` (for fast lookups)
- `user_responses.user_id` (for user stats)
- `user_responses.question_id` (for question analytics)

## 4. Streak Logic Implementation

**File: `src/lib/utils/streak.ts`**

**Strategy:** Flexible 48-hour grace period

- User must complete all 10 questions of a set to count toward streak
- Streak increments if completion happens within 48 hours of last completion
- If gap exceeds 48 hours, streak resets to 1 (current completion)
- `last_completed_at` tracks the timestamp of last full set completion
- `last_active_date` tracks the calendar date (IST) for display purposes

**Timezone Handling:**

- All date comparisons use IST (UTC+5:30)
- Use `date-fns-tz` for conversions
- Store `last_completed_at` as UTC timestamp in DB
- Convert to IST for display and calculations

**Function Logic:**

```typescript
async function updateUserStreak(userId: string, completedAt: Date) {
  // 1. Fetch user's last_completed_at
  // 2. Convert both timestamps to IST
  // 3. Calculate hours difference
  // 4. If < 48 hours: increment streak
  // 5. If >= 48 hours: reset streak to 1
  // 6. Update last_completed_at and streak_count
}
```

## 5. Vercel Cron Job Security

**File: `vercel.json`**

```json
{
  "crons": [{
    "path": "/api/cron",
    "schedule": "30 2 * * *"  // 02:30 UTC daily
  }]
}
```

**File: `src/app/api/cron/route.ts`**

- Validates `CRON_SECRET` from request headers
- Returns 401 if secret doesn't match `process.env.CRON_SECRET`
- Calls the actual generation endpoint internally

**File: `src/app/api/generate/route.ts`**

- Protected by middleware checking `CRON_SECRET`
- Generates questions using Gemini AI
- Saves to database via Drizzle
- Returns success/error status

**Security Flow:**

```
Vercel Cron → /api/cron → Validates CRON_SECRET → /api/generate → Gemini AI → Database
```

**Environment Variables:**

- `CRON_SECRET`: Random secure string (set in Vercel dashboard)
- `GEMINI_API_KEY`: Google Gemini API key
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: For server-side operations

## 6. AI Integration Strategy

**File: `src/lib/ai/gemini-client.ts`**

- Initialize Gemini with Google Search grounding enabled
- Configure model: `gemini-2.0-flash-exp` or `gemini-1.5-pro` (with search grounding)

**File: `src/lib/ai/prompt-templates.ts`**

- Structured prompt requesting:
  - News from last 72 hours (Google Search grounding)
  - Focus areas: current affairs, international relations, legal developments, government schemes, science/tech, sports, awards
  - Static GK: Constitution, modern history, economics, geography
  - Output format: JSON array of 10 questions with specified structure

**File: `src/lib/ai/news-fetcher.ts`**

- Uses Gemini's Google Search grounding feature
- Queries: "news from last 3 days India international relations legal developments"
- Filters and categorizes news for question generation

**Generation Flow:**

1. Cron triggers `/api/cron`
2. Validates secret
3. Calls Gemini with grounding enabled
4. Parses JSON response (10 questions)
5. Validates structure with Zod
6. Creates `question_set` for today's date
7. Inserts 10 questions with category tags
8. Returns success/error

## 7. Key Features Implementation

### Daily Questions Page (`/dashboard`)

- Fetches today's question set
- Displays 10 questions sequentially or all at once
- Tracks answers locally (client state)
- Submit button: saves all responses, updates streak, shows results

### Historical Practice (`/dashboard/[date]`)

- Calendar picker component (Shadcn Calendar)
- Fetches question set for selected date
- Same UI as daily questions
- Doesn't affect streak (only today's set counts)

### Profile/Stats Page (`/profile`)

- Displays: current streak, total score, accuracy percentage
- Chart showing streak history
- List of completed dates

### Authentication

- Supabase Auth with Google OAuth + Email/Password
- Server-side session management
- Protected routes via middleware

## 8. Data Flow Diagram

```mermaid
flowchart TD
    A[Vercel Cron 02:30 UTC] -->|Triggers| B[/api/cron]
    B -->|Validates| C{CRON_SECRET?}
    C -->|Valid| D[/api/generate]
    C -->|Invalid| E[401 Unauthorized]
    D -->|Calls| F[Gemini API with Search Grounding]
    F -->|Returns| G[10 MCQs JSON]
    G -->|Validates| H[Zod Schema]
    H -->|Valid| I[Save to Supabase via Drizzle]
    H -->|Invalid| J[Log Error & Retry]
    I -->|Success| K[Question Set Created]
    
    L[User Login] -->|Google/Email| M[Supabase Auth]
    M -->|Session| N[Dashboard]
    N -->|Fetches| O[Today's Questions]
    O -->|Submits| P[Server Action]
    P -->|Saves| Q[user_responses]
    P -->|Updates| R[Streak Logic]
    R -->|48hr Check| S[Increment/Reset Streak]
```

## 9. Environment Variables Template

**File: `.env.example`**

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
CRON_SECRET=
DATABASE_URL=
```

## 10. Next Steps After Approval

1. Initialize Next.js 15 project with TypeScript
2. Set up Drizzle ORM with Supabase connection
3. Create database schema and run migrations
4. Configure Supabase Auth (Google + Email)
5. Implement Gemini AI client with search grounding
6. Build cron job endpoints with security
7. Create UI components (Shadcn)
8. Implement streak logic with timezone handling
9. Build question display and submission flow
10. Add historical practice feature
11. Deploy to Vercel and configure cron job