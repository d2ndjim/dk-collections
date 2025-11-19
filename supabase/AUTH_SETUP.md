# Supabase Authentication Setup Guide

This guide will help you set up authentication for the admin side of your application using Supabase Auth with email/password and Google OAuth.

## Prerequisites

- A Supabase project (already set up)
- Admin access to your Supabase dashboard

## Step 1: Configure Email Authentication

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Ensure **Email** provider is enabled
4. Configure email settings:
   - **Enable email confirmations**: Optional (recommended for production)
   - **Secure email change**: Enable for production
   - **Double confirm email changes**: Enable for production

## Step 2: Set Up Google OAuth

### 2.1 Get Your Supabase Callback URL

**IMPORTANT:** Before configuring Google OAuth, you need to get your Supabase callback URL:

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Find the **Site URL** section
4. Your Supabase callback URL will be: `https://[your-project-ref].supabase.co/auth/v1/callback`
   - Replace `[your-project-ref]` with your actual Supabase project reference ID
   - You can find this in your Supabase project URL or in the **Settings** → **API** section
   - Example: If your project URL is `https://abcdefghijklmnop.supabase.co`, then your callback URL is `https://abcdefghijklmnop.supabase.co/auth/v1/callback`

**Copy this URL - you'll need it for Google Cloud Console configuration!**

### 2.2 Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Configure the OAuth consent screen if prompted:
   - Choose **External** user type
   - Fill in the required information (App name, User support email, Developer contact)
   - Add scopes: `email`, `profile`, `openid`
   - Add test users (your email) if in testing mode
6. Create OAuth client ID:
   - **Application type**: Web application
   - **Name**: DK Collections Admin (or your preferred name)
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
   - **Authorized redirect URIs** (THIS IS CRITICAL):
     - **MUST ADD**: `https://[your-project-ref].supabase.co/auth/v1/callback`
     - This is the Supabase callback URL you copied above
     - **DO NOT** add your app's callback URL (`/admin/auth/callback`) here
     - Google redirects to Supabase first, then Supabase redirects to your app

### 2.3 Configure Google Provider in Supabase

1. Go to Supabase Dashboard → **Authentication** → **Providers**
2. Find **Google** provider and click to enable it
3. Enter your Google OAuth credentials:
   - **Client ID (for OAuth)**: Your Google OAuth Client ID
   - **Client Secret (for OAuth)**: Your Google OAuth Client Secret
4. Click **Save**

## Step 3: Configure Redirect URLs

1. Go to Supabase Dashboard → **Authentication** → **URL Configuration**
2. Add the following to **Redirect URLs**:
   - `http://localhost:3000/admin/auth/callback` (for development)
   - `https://yourdomain.com/admin/auth/callback` (for production)
3. Set **Site URL**:
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`

## Step 4: Create Admin User

### Option A: Create via Supabase Dashboard

1. Go to **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Enter:
   - **Email**: Your admin email
   - **Password**: A secure password
   - **Auto Confirm User**: ✅ (check this to skip email confirmation)
4. Click **Create user**

### Option B: Create via Sign Up (if you enable public signup)

1. Navigate to `/admin/login`
2. Use the email/password form to create an account
3. Note: You may need to enable email signup in Authentication → Settings

## Step 5: Environment Variables

Make sure your `.env.local` file includes:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Optional (for production):

```env
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

## Step 6: Test Authentication

1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:3000/admin`
3. You should be redirected to `/admin/login`
4. Test email/password login with your admin credentials
5. Test Google OAuth login (if configured)

## Troubleshooting

### Google OAuth Not Working - "redirect_uri_mismatch" Error

**This is the most common issue!** The error means the redirect URI in Google Cloud Console doesn't match what Supabase is sending.

**Solution:**

1. **Get your Supabase project reference ID:**
   - Go to Supabase Dashboard → **Settings** → **API**
   - Look for your project URL: `https://[your-project-ref].supabase.co`
   - Or check your project URL in the Supabase dashboard

2. **Add the exact redirect URI to Google Cloud Console:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to **APIs & Services** → **Credentials**
   - Click on your OAuth 2.0 Client ID
   - Under **Authorized redirect URIs**, add:
     - `https://[your-project-ref].supabase.co/auth/v1/callback`
     - Replace `[your-project-ref]` with your actual Supabase project reference
   - **Important:** The URI must match EXACTLY (including `https://`, no trailing slash)
   - Click **Save**

3. **Verify in Supabase:**
   - Go to Supabase Dashboard → **Authentication** → **Providers** → **Google**
   - Ensure your Google Client ID and Client Secret are correctly entered
   - Click **Save**

4. **Common mistakes to avoid:**
   - ❌ Don't add `http://localhost:3000/admin/auth/callback` to Google redirect URIs
   - ❌ Don't add your app's callback URL to Google
   - ✅ Only add the Supabase callback URL: `https://[your-project-ref].supabase.co/auth/v1/callback`
   - ✅ Make sure there's no trailing slash
   - ✅ Make sure you're using `https://` not `http://`

5. **After making changes:**
   - Wait a few minutes for changes to propagate
   - Clear your browser cache/cookies
   - Try signing in again

### Email/Password Login Not Working

- Verify email provider is enabled in Supabase
- Check that user exists in Authentication → Users
- Ensure password is correct
- Check server logs for authentication errors

### Session Not Persisting

- Verify cookies are enabled in your browser
- Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set correctly
- Ensure middleware is properly configured

## Security Recommendations

1. **Enable Row Level Security (RLS)** on your database tables
2. **Restrict admin access** using RLS policies that check `auth.uid()`
3. **Use environment variables** for all sensitive configuration
4. **Enable email confirmations** in production
5. **Set up rate limiting** for authentication endpoints
6. **Monitor authentication logs** in Supabase Dashboard

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth Setup Guide](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Next.js with Supabase Auth](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
