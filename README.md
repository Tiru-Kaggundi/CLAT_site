# CLAT Daily GK

AI-powered General Knowledge MCQ platform for CLAT exam preparation. Generates 10 daily MCQs based on the last 72 hours of news using Google Gemini AI with Search Grounding.

## Features

- **Daily Question Generation**: 10 fresh MCQs generated daily at 8:00 AM IST (02:30 UTC)
- **AI-Powered**: Uses Google Gemini AI with Google Search Grounding for current affairs
- **User Streaks**: Flexible 48-hour grace period streak system
- **Historical Practice**: Practice questions from any previous date
- **Progress Tracking**: Track scores, accuracy, and streaks
- **Authentication**: Google OAuth and Email/Password login via Supabase

## Tech Stack

- **Framework**: Next.js 15 (App Router, Server Actions)
- **Database**: Supabase (PostgreSQL)
- **ORM**: Drizzle ORM
- **Auth**: Supabase Auth
- **UI**: Tailwind CSS, Shadcn/UI
- **AI**: Google Gemini API (with Search Grounding)
- **Deployment**: Vercel

## Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Google Gemini API key
- Vercel account (for deployment)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_gemini_api_key
CRON_SECRET=your_random_secure_string
DATABASE_URL=your_supabase_database_url
```

### 3. Database Setup

1. Create a new Supabase project
2. Get your database connection string (found in Supabase dashboard under Settings > Database)
3. Run database migrations:

```bash
npm run db:generate
npm run db:push
```

Or use Drizzle Studio to manage your database:

```bash
npm run db:studio
```

### 4. Configure Supabase Auth

1. In Supabase dashboard, go to Authentication > Providers
2. Enable Email provider
3. Enable Google OAuth provider and configure:
   - Add your OAuth credentials from Google Cloud Console
   - For local development: Set redirect URL to: `http://localhost:3000/auth/callback`
   - For production: See [CUSTOM_DOMAIN_SETUP.md](./CUSTOM_DOMAIN_SETUP.md) for detailed instructions

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin your-repo-url
git push -u origin main
```

### 2. Deploy to Vercel

1. Import your GitHub repository in Vercel
2. Add all environment variables in Vercel dashboard
3. Deploy

### 2.5. Set Up Custom Domain (Optional)

If you have a custom domain, follow the comprehensive guide in [CUSTOM_DOMAIN_SETUP.md](./CUSTOM_DOMAIN_SETUP.md) to:
- Add your domain to Vercel
- Configure DNS records
- Update Supabase and Google OAuth settings
- Verify everything works correctly

### 3. Configure Cron Job

The cron job is automatically configured via `vercel.json`. It will trigger `/api/cron` at 02:30 UTC daily (08:00 AM IST).

**Important**: Set the `CRON_SECRET` environment variable in Vercel dashboard. Vercel will automatically send this in the `Authorization` header when triggering the cron job.

### 4. Verify Cron Job

After deployment, you can manually trigger the cron job to test:

```bash
curl -X GET https://your-domain.com/api/cron \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Protected dashboard routes
│   └── api/               # API routes (cron, generate)
├── components/            # React components
│   ├── ui/               # Shadcn UI components
│   ├── auth/             # Auth components
│   ├── questions/        # Question-related components
│   ├── dashboard/         # Dashboard components
│   └── layout/            # Layout components
├── lib/
│   ├── ai/               # Gemini AI integration
│   ├── db/               # Database schema and connection
│   ├── auth/             # Supabase auth helpers
│   ├── utils/            # Utility functions
│   └── validations/      # Zod schemas
└── server-actions/       # Server actions
```

## Database Schema

- **users**: User accounts with streak tracking
- **question_sets**: Daily question sets (one per date)
- **questions**: Individual questions (10 per set)
- **user_responses**: User answers and results

## API Routes

### `/api/cron` (GET)
Vercel cron endpoint that validates CRON_SECRET and triggers question generation.

### `/api/generate` (POST)
Protected endpoint that generates questions using Gemini AI and saves to database.

## Development

### Generate Database Migrations

```bash
npm run db:generate
```

### Push Schema Changes

```bash
npm run db:push
```

### Open Drizzle Studio

```bash
npm run db:studio
```

## License

MIT
