# Custom Domain Setup Guide

This guide will help you configure your custom domain for GK Daily Scan.

## Prerequisites

- ✅ Domain purchased and ready to use
- ✅ Vercel project deployed and working
- ✅ Supabase project configured
- ✅ Google OAuth credentials created

---

## Step 1: Add Domain to Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Domains**
3. Click **Add Domain**
4. Enter your domain (e.g., `yourdomain.com`)
5. Vercel will show you DNS records to add:
   - **A Record** or **CNAME Record** (Vercel will tell you which)
   - **Value**: Vercel's provided IP or CNAME target

### For Root Domain (yourdomain.com):
- Add an **A Record** pointing to Vercel's IP address
- Or use **CNAME** if your DNS provider supports it (some don't for root domains)

### For Subdomain (www.yourdomain.com):
- Add a **CNAME Record** pointing to `cname.vercel-dns.com`

6. Wait for DNS propagation (usually 5-60 minutes, can take up to 48 hours)
7. Vercel will automatically provision an SSL certificate once DNS is verified

---

## Step 2: Update Supabase Configuration

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **URL Configuration**
4. Update the following:

   **Site URL:**
   ```
   https://yourdomain.com
   ```
   (or `https://www.yourdomain.com` if using www subdomain)

   **Redirect URLs:**
   Add both:
   ```
   https://yourdomain.com/auth/callback
   https://www.yourdomain.com/auth/callback  (if using www)
   ```

   **Note:** You can keep `http://localhost:3000` for local development, but make sure your production domain is listed.

5. Click **Save**

---

## Step 3: Update Google OAuth Configuration

**IMPORTANT:** Supabase uses its own callback URL to handle OAuth, then redirects to your app. You need to add **BOTH** URLs to Google Cloud Console.

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your **OAuth 2.0 Client ID** (the one used for Supabase)
4. Under **Authorized redirect URIs**, add **ALL** of these:

   **Required - Supabase Callback URL:**
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```
   *(Replace `YOUR_PROJECT_REF` with your Supabase project reference - you can find this in your Supabase dashboard URL or in your `NEXT_PUBLIC_SUPABASE_URL` environment variable)*

   **Required - Your Custom Domain:**
   ```
   https://yourdomain.com/auth/callback
   https://www.yourdomain.com/auth/callback  (if using www)
   ```

   **Optional - For Local Development:**
   ```
   http://localhost:3000/auth/callback
   ```

   **Example:** If your Supabase URL is `https://findwoilunqdyezifesa.supabase.co`, then add:
   ```
   https://findwoilunqdyezifesa.supabase.co/auth/v1/callback
   https://yourdomain.com/auth/callback
   http://localhost:3000/auth/callback
   ```

5. Click **Save**

**Why both?** Supabase receives the OAuth callback first at `supabase.co/auth/v1/callback`, then redirects to your app at `yourdomain.com/auth/callback`.

---

## Step 4: Verify Everything Works

### Test Checklist:

- [ ] Domain loads in browser (shows your app)
- [ ] SSL certificate is active (HTTPS works, no warnings)
- [ ] Google OAuth login works
- [ ] Redirect after login goes to dashboard (not localhost)
- [ ] All pages load correctly
- [ ] API routes work (e.g., `/api/cron`)

### Manual Tests:

1. **Test Domain Access:**
   ```bash
   curl -I https://yourdomain.com
   ```
   Should return `200 OK`

2. **Test OAuth Redirect:**
   - Click "Continue with Google" on your site
   - After Google login, you should be redirected to `https://yourdomain.com/dashboard`
   - NOT `localhost:3000`

3. **Test Cron Endpoint:**
   ```bash
   curl -X GET https://yourdomain.com/api/cron \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

---

## Step 5: Update Environment Variables (if needed)

Your code already uses `window.location.origin` which automatically detects the domain, so **no code changes are needed**.

However, if you have any hardcoded URLs in environment variables (you shouldn't), update them in:
- Vercel Dashboard → Settings → Environment Variables

---

## Troubleshooting

### Domain Not Loading
- **Check DNS:** Use `dig yourdomain.com` or [DNS Checker](https://dnschecker.org) to verify DNS propagation
- **Wait:** DNS changes can take up to 48 hours (usually 5-60 minutes)
- **Check Vercel:** Ensure domain shows as "Valid" in Vercel dashboard

### SSL Certificate Not Working
- **Wait:** SSL provisioning takes 5-10 minutes after DNS verification
- **Check Vercel:** Look for SSL status in domain settings
- **Force HTTPS:** Vercel automatically redirects HTTP to HTTPS

### OAuth Redirect Still Goes to Localhost
- **Clear Browser Cache:** Sometimes browsers cache redirect URLs
- **Check Supabase:** Verify redirect URLs are saved correctly
- **Check Google Console:** Verify authorized redirect URIs include your domain
- **Wait:** Changes can take 1-2 minutes to propagate

### "Redirect URI Mismatch" or "OAuth 2.0 policy" Error
- **Supabase Callback Required:** You MUST add Supabase's callback URL: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
- **Your Domain Also Required:** Add your custom domain callback: `https://yourdomain.com/auth/callback`
- **Exact Match Required:** The redirect URI must match EXACTLY what's configured
- **Check Protocol:** Must be `https://` (not `http://`) in production
- **Check Path:** Must be exactly `/auth/v1/callback` for Supabase, `/auth/callback` for your domain
- **Check Domain:** Must match exactly (including www or not)
- **Find Your Supabase Project Ref:** Check your `NEXT_PUBLIC_SUPABASE_URL` environment variable or Supabase dashboard URL

---

## Code Verification

Your code is already configured correctly:

✅ **`src/components/auth/GoogleButton.tsx`** uses `window.location.origin` (dynamic)
✅ **`src/app/auth/callback/route.ts`** uses `request.url` (dynamic)
✅ No hardcoded localhost references in code

**No code changes needed!** Just update the configuration in Supabase and Google Cloud Console.

---

## Production Checklist

Before going live, ensure:

- [ ] Custom domain added to Vercel
- [ ] DNS records configured correctly
- [ ] SSL certificate active (HTTPS works)
- [ ] Supabase Site URL updated
- [ ] Supabase Redirect URLs include production domain
- [ ] Google OAuth Authorized Redirect URIs include **BOTH** Supabase callback URL and production domain
- [ ] Test login flow works end-to-end
- [ ] Test cron job works (if needed)
- [ ] Remove or update any development/test data

---

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check Supabase logs (Authentication → Logs)
3. Check browser console for errors
4. Verify DNS propagation with [DNS Checker](https://dnschecker.org)

---

**Last Updated:** This guide assumes you're using Vercel for hosting. If using a different platform, adjust DNS and SSL setup accordingly.
