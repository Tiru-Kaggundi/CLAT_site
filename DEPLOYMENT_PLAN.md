# Deployment Plan: GK Daily Scan

## Executive Summary

This document outlines the deployment strategy for GK Daily Scan, a Next.js 15 application that generates daily GK questions using Google Gemini AI. The application requires:
- Next.js hosting (server-side rendering)
- PostgreSQL database (via Supabase)
- Scheduled cron jobs (daily question generation at 8:00 AM IST)
- Google OAuth authentication
- Environment variable management

---

## 1. Hosting Platform Recommendation

### Option A: Vercel (Recommended) ⭐
**Pros:**
- **Zero-config deployment** for Next.js (built by Next.js creators)
- **Built-in cron jobs** via `vercel.json` (exactly what you need)
- **Automatic SSL** certificates
- **Edge network** for fast global performance
- **Free tier** is generous (100GB bandwidth, unlimited requests for hobby)
- **Easy environment variable** management
- **Automatic deployments** from GitHub
- **Preview deployments** for testing

**Cons:**
- Less control over infrastructure
- Vendor lock-in (but easy to migrate)

**Cost:** Free tier available, Pro plan $20/month for production

### Option B: Google Cloud Platform (GCP)
**Pros:**
- Full control over infrastructure
- Can use existing Google Cloud account
- Good for scaling
- Can use Cloud Run (serverless containers)

**Cons:**
- **More complex setup** (need to configure Cloud Run, Cloud Scheduler, etc.)
- **No built-in cron** - need to set up Cloud Scheduler separately
- **More configuration** required (Docker, Cloud Build, etc.)
- **Higher learning curve**
- **More expensive** for small apps (Cloud Run charges per request + compute time)

**Cost:** ~$10-30/month minimum (Cloud Run + Cloud Scheduler + Load Balancer)

### Recommendation: **Vercel**
Given your current setup already has `vercel.json` configured, Vercel is the fastest and most cost-effective option. You can always migrate to GCP later if needed.

---

## 2. Required Environment Variables

All these need to be set in your hosting platform:

### Database & Auth (Supabase)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
DATABASE_URL=postgresql://user:password@host:port/database
```

### AI Integration
```
GEMINI_API_KEY=your_google_gemini_api_key
```

### Cron Job Security
```
CRON_SECRET=your_random_secure_string_here
```

### Important Notes:
- `NEXT_PUBLIC_*` variables are exposed to the browser (safe for anon keys)
- `SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET` must be kept secret
- Generate `CRON_SECRET` using: `openssl rand -base64 32`

---

## 3. Cron Job Configuration

### Current Setup (Vercel)
Your `vercel.json` is already configured:
```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "30 2 * * *"  // 02:30 UTC = 08:00 IST
    }
  ]
}
```

### What You Need to Do:
1. **Set CRON_SECRET** in Vercel environment variables
2. **Verify the schedule** - Currently set to 02:30 UTC (8:00 AM IST)
3. **Test manually** after deployment:
   ```bash
   curl -X GET https://your-domain.com/api/cron \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

### If Using Google Cloud Platform Instead:
You would need to:
1. Set up **Cloud Scheduler** job
2. Configure it to call your Cloud Run service
3. Set up authentication (OIDC token or API key)
4. Schedule: `30 2 * * *` (02:30 UTC daily)
5. Target: `https://your-app.run.app/api/cron`
6. Headers: `Authorization: Bearer YOUR_CRON_SECRET`

---

## 4. Database Setup (Supabase)

### Already Configured:
- You're using Supabase (PostgreSQL)
- Drizzle ORM for database operations
- Connection via `DATABASE_URL`

### What to Verify:
1. **Supabase project** is created and running
2. **Database migrations** are applied:
   ```bash
   npm run db:push
   ```
3. **Connection pooling** - Supabase has connection limits, your code already handles this (`max: 1`)
4. **Backup strategy** - Supabase provides automatic backups (verify in dashboard)

### Production Checklist:
- [ ] Enable database backups in Supabase dashboard
- [ ] Set up connection pooling if needed (Supabase offers PgBouncer)
- [ ] Monitor database usage/quota
- [ ] Set up database alerts for high usage

---

## 5. Authentication Setup

### Google OAuth Configuration:
1. **Google Cloud Console:**
   - Go to APIs & Services > Credentials
   - Create OAuth 2.0 Client ID
   - Add authorized redirect URI: `https://your-domain.com/auth/callback`

2. **Supabase Dashboard:**
   - Authentication > Providers > Google
   - Enable Google provider
   - Add Client ID and Client Secret from Google Cloud Console
   - Set redirect URL: `https://your-domain.com/auth/callback`

### Email/Password:
- Already enabled in Supabase (default)
- No additional configuration needed

---

## 6. Domain & SSL

### If Using Vercel:
- **Free SSL** automatically provided
- **Custom domain** setup:
  1. Add domain in Vercel dashboard
  2. Update DNS records (A/CNAME) as instructed
  3. SSL certificate auto-provisioned

### If Using Google Cloud:
- Need to set up **Cloud Load Balancer** with SSL certificate
- Use **Google-managed SSL** certificates (free)
- More complex DNS configuration

---

## 7. Deployment Steps

### Option A: Vercel Deployment

#### Step 1: Prepare Repository
```bash
# Ensure all code is committed
git add .
git commit -m "Ready for production deployment"
git push origin main
```

#### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up/login with GitHub
3. Click "Add New Project"
4. Import your GitHub repository
5. Vercel auto-detects Next.js configuration

#### Step 3: Configure Environment Variables
In Vercel dashboard > Project Settings > Environment Variables, add:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `GEMINI_API_KEY`
- `CRON_SECRET`

#### Step 4: Deploy
- Click "Deploy"
- Wait for build to complete
- Get your deployment URL (e.g., `your-app.vercel.app`)

#### Step 5: Verify Cron Job
- Cron job automatically configured via `vercel.json`
- First run will be at next scheduled time (02:30 UTC)
- Test manually using the curl command above

#### Step 6: Custom Domain (Optional)
- Add domain in Vercel dashboard
- Update DNS records
- Wait for SSL certificate (usually < 5 minutes)

---

### Option B: Google Cloud Platform Deployment

#### Step 1: Prepare Dockerfile
Create `Dockerfile` in project root:
```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

#### Step 2: Build and Deploy to Cloud Run
```bash
# Install Google Cloud SDK
gcloud init
gcloud auth login

# Build container
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/gk-daily-scan

# Deploy to Cloud Run
gcloud run deploy gk-daily-scan \
  --image gcr.io/YOUR_PROJECT_ID/gk-daily-scan \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="NEXT_PUBLIC_SUPABASE_URL=...,GEMINI_API_KEY=..."
```

#### Step 3: Set Up Cloud Scheduler
```bash
gcloud scheduler jobs create http daily-question-generation \
  --schedule="30 2 * * *" \
  --uri="https://your-app.run.app/api/cron" \
  --http-method=GET \
  --headers="Authorization=Bearer YOUR_CRON_SECRET" \
  --time-zone="UTC"
```

#### Step 4: Set Up Load Balancer & SSL
- Create Cloud Load Balancer
- Configure SSL certificate (Google-managed)
- Point domain to load balancer IP

---

## 8. Post-Deployment Checklist

### Immediate (Day 1):
- [ ] Verify application loads correctly
- [ ] Test user registration/login
- [ ] Test question submission
- [ ] Manually trigger cron job to generate questions
- [ ] Verify questions appear on dashboard
- [ ] Check error logs for any issues

### Week 1:
- [ ] Monitor cron job execution (check Vercel/Cloud Run logs)
- [ ] Verify questions generate daily at 8:00 AM IST
- [ ] Monitor API usage (Gemini API quota)
- [ ] Check database connection stability
- [ ] Monitor application performance

### Ongoing:
- [ ] Set up error monitoring (Sentry, LogRocket, etc.)
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Monitor costs (API usage, database, hosting)
- [ ] Regular database backups verification
- [ ] Review and optimize API calls

---

## 9. Monitoring & Alerts

### Recommended Tools:

1. **Vercel Analytics** (if using Vercel)
   - Built-in performance monitoring
   - Real-time analytics
   - Error tracking

2. **Sentry** (Error Tracking)
   - Free tier available
   - Track JavaScript errors
   - Performance monitoring

3. **UptimeRobot** (Uptime Monitoring)
   - Free tier: 50 monitors
   - Check if site is up
   - Email/SMS alerts

4. **Google Cloud Monitoring** (if using GCP)
   - Built-in monitoring
   - Set up alerts for errors, latency

### Key Metrics to Monitor:
- Application uptime
- Cron job execution success/failure
- Gemini API quota usage
- Database connection errors
- Response times
- Error rates

---

## 10. Cost Estimation

### Vercel (Recommended):
- **Hobby Plan (Free):**
  - 100GB bandwidth/month
  - Unlimited requests
  - Cron jobs included
  - **Cost: $0/month**

- **Pro Plan ($20/month):**
  - Unlimited bandwidth
  - Advanced analytics
  - Team collaboration
  - **Cost: $20/month**

### Google Cloud Platform:
- **Cloud Run:** ~$5-15/month (depending on traffic)
- **Cloud Scheduler:** $0.10/job = ~$0.30/month
- **Cloud Load Balancer:** ~$18/month
- **SSL Certificate:** Free
- **Total: ~$23-33/month**

### Additional Costs (Both Platforms):
- **Supabase:** Free tier (500MB database, 2GB bandwidth)
- **Gemini API:** Pay-per-use (check current pricing)
- **Domain:** ~$10-15/year

### Recommendation:
Start with **Vercel Hobby (Free)** - it's sufficient for initial launch and you can upgrade later if needed.

---

## 11. Security Considerations

### Environment Variables:
- ✅ Never commit `.env.local` to git (already in `.gitignore`)
- ✅ Use platform's secret management (Vercel/GCP)
- ✅ Rotate `CRON_SECRET` periodically
- ✅ Keep `SUPABASE_SERVICE_ROLE_KEY` secure

### API Security:
- ✅ Cron endpoint protected with `CRON_SECRET`
- ✅ Generate endpoint protected with `CRON_SECRET`
- ✅ User authentication via Supabase (secure)

### Database:
- ✅ Use connection pooling (already configured)
- ✅ Supabase provides automatic security updates
- ✅ Enable Row Level Security (RLS) if needed

---

## 12. Backup Strategy

### Database Backups:
- **Supabase:** Automatic daily backups (verify in dashboard)
- **Manual backup:** Export data periodically
  ```bash
  pg_dump $DATABASE_URL > backup.sql
  ```

### Code Backups:
- **GitHub:** Your code repository serves as backup
- **Regular commits:** Ensure all changes are committed

### Configuration Backup:
- Document all environment variables
- Save Supabase project settings
- Document cron job configuration

---

## 13. Scaling Considerations

### Current Setup (Small-Medium Scale):
- Handles: 100-1000 concurrent users
- Database: Supabase free tier sufficient
- API: Gemini API handles requests well

### When to Scale:
- **Traffic:** > 10,000 daily active users
- **Database:** > 8GB data
- **API:** Hitting Gemini API rate limits

### Scaling Options:
1. **Upgrade Supabase plan** (if database is bottleneck)
2. **Upgrade Vercel to Pro** (if bandwidth is issue)
3. **Add caching** (Redis) for frequently accessed data
4. **CDN** for static assets (Vercel provides this automatically)

---

## 14. Migration Path (If Needed)

### From Vercel to GCP (Future):
1. Export environment variables
2. Create Dockerfile
3. Deploy to Cloud Run
4. Set up Cloud Scheduler
5. Update DNS
6. Test thoroughly
7. Switch DNS

### From GCP to Vercel:
1. Much easier - just import GitHub repo
2. Add environment variables
3. Deploy
4. Update DNS

---

## 15. Recommended Deployment Order

### Phase 1: Initial Deployment (Day 1)
1. ✅ Push code to GitHub
2. ✅ Deploy to Vercel
3. ✅ Set environment variables
4. ✅ Test basic functionality
5. ✅ Verify database connection

### Phase 2: Authentication Setup (Day 1)
1. ✅ Configure Google OAuth in Supabase
2. ✅ Update redirect URLs
3. ✅ Test login flow

### Phase 3: Cron Job Verification (Day 2)
1. ✅ Wait for first scheduled run OR
2. ✅ Manually trigger cron job
3. ✅ Verify questions are generated
4. ✅ Check logs for errors

### Phase 4: Production Hardening (Week 1)
1. ✅ Set up monitoring
2. ✅ Configure custom domain
3. ✅ Set up alerts
4. ✅ Document runbook

---

## 16. Troubleshooting Guide

### Cron Job Not Running:
- Check Vercel cron logs in dashboard
- Verify `CRON_SECRET` is set correctly
- Check schedule format in `vercel.json`
- Verify endpoint is accessible

### Questions Not Generating:
- Check Gemini API key is valid
- Verify API quota not exceeded
- Check application logs for errors
- Verify database connection

### Authentication Issues:
- Verify OAuth redirect URLs match
- Check Supabase provider settings
- Verify environment variables are set

---

## Final Recommendation

**Deploy to Vercel** for the following reasons:
1. ✅ Zero configuration needed (your `vercel.json` is ready)
2. ✅ Built-in cron jobs (exactly what you need)
3. ✅ Free tier is sufficient for launch
4. ✅ Fastest time to production
5. ✅ Easy to scale later
6. ✅ Excellent Next.js integration

**Estimated Time to Deploy:** 30-60 minutes

**Estimated Monthly Cost:** $0 (free tier) or $20 (Pro plan if needed)

---

## Next Steps

1. Review this plan
2. Choose hosting platform (recommend Vercel)
3. Prepare environment variables list
4. Set up Supabase project (if not done)
5. Deploy application
6. Test thoroughly
7. Go live! 🚀
