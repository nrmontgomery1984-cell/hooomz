# Quick Deploy Guide - Step by Step

Your code is ready for deployment! Follow these exact steps:

## ✅ PREPARATION COMPLETE
- Git repository initialized
- Files staged and ready
- Build tested successfully
- Deployment configs created

## STEP 1: Create GitHub Repository (5 minutes)

1. Go to https://github.com/new
2. Repository name: `hooomz`
3. Description: `Modern home management and construction project tracking`
4. Keep it **Public** (required for free deployments)
5. Do NOT initialize with README (we already have files)
6. Click **"Create repository"**

## STEP 2: Push Your Code to GitHub

Copy and run these commands in your terminal:

```bash
# Make initial commit
git commit -m "Initial commit - Hooomz app with modern UI"

# Add GitHub as remote (REPLACE YOUR-USERNAME with your actual GitHub username)
git remote add origin https://github.com/YOUR-USERNAME/hooomz.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Example:**
If your GitHub username is `johndoe`, use:
```bash
git remote add origin https://github.com/johndoe/hooomz.git
```

## STEP 3: Deploy Backend to Render (10 minutes)

### 3.1 Sign Up for Render
1. Go to https://render.com
2. Click **"Get Started"**
3. Sign up with GitHub

### 3.2 Create Web Service
1. Click **"New +"** (top right)
2. Select **"Web Service"**
3. Click **"Build and deploy from a Git repository"**
4. Connect your `hooomz` repository
5. Click **"Connect"** next to your repository

### 3.3 Configure Service
Fill in these settings:

- **Name:** `hooomz-api` (or any name you like)
- **Region:** Choose closest to you (e.g., Oregon)
- **Branch:** `main`
- **Root Directory:** `server`
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Instance Type:** `Free`

### 3.4 Add Environment Variables
Scroll to **"Environment Variables"** section. Click **"Add Environment Variable"** for each:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `CLIENT_URL` | Leave blank for now |

**Finding Your Supabase Keys:**
1. Go to your Supabase project
2. Click Settings → API
3. Copy "Project URL" for SUPABASE_URL
4. Copy "service_role" key for SUPABASE_SERVICE_ROLE_KEY

### 3.5 Deploy
1. Click **"Create Web Service"** at the bottom
2. Wait 5-10 minutes for deployment
3. **COPY YOUR BACKEND URL** - it will look like:
   `https://hooomz-api.onrender.com`

## STEP 4: Deploy Frontend to Vercel (5 minutes)

### 4.1 Sign Up for Vercel
1. Go to https://vercel.com/signup
2. Click **"Continue with GitHub"**
3. Authorize Vercel

### 4.2 Import Project
1. Click **"Add New..."** → **"Project"**
2. Find and select your `hooomz` repository
3. Click **"Import"**

### 4.3 Configure Project
**Framework Preset:** Vite (should auto-detect)

**Root Directory:**
- Click **"Edit"**
- Enter: `client`
- Click **"Continue"**

**Build Settings:**
- Build Command: `npm run build` (should be auto-filled)
- Output Directory: `dist` (should be auto-filled)
- Install Command: `npm install` (should be auto-filled)

### 4.4 Add Environment Variable
Click **"Environment Variables"** dropdown:

| Key | Value |
|-----|-------|
| `VITE_API_BASE_URL` | `https://hooomz-api.onrender.com/api` |

**⚠️ IMPORTANT:** Replace `hooomz-api.onrender.com` with YOUR actual Render URL from Step 3.5

### 4.5 Deploy
1. Click **"Deploy"**
2. Wait 2-3 minutes
3. **COPY YOUR FRONTEND URL** - it will look like:
   `https://hooomz-abc123.vercel.app`

## STEP 5: Update Backend with Frontend URL (2 minutes)

1. Go back to Render: https://dashboard.render.com
2. Click on your `hooomz-api` service
3. Click **"Environment"** in left sidebar
4. Find `CLIENT_URL` variable
5. Click **"Edit"**
6. Paste your Vercel URL (e.g., `https://hooomz-abc123.vercel.app`)
7. Click **"Save Changes"**
8. Service will auto-redeploy (2-3 minutes)

## STEP 6: Configure Supabase (2 minutes)

1. Go to your Supabase project dashboard
2. Click **"Authentication"** → **"URL Configuration"**
3. Under **"Redirect URLs"**, add your Vercel URL with wildcard:
   ```
   https://hooomz-abc123.vercel.app/*
   ```
4. Update **"Site URL"** to your Vercel URL
5. Click **"Save"**

## STEP 7: Test Your Live App! 🎉

1. Visit your Vercel URL: `https://hooomz-abc123.vercel.app`
2. You should see the login page
3. Sign up for an account
4. Start using Hooomz!

## Share Your App

**Your live URL:** `https://hooomz-abc123.vercel.app`

Share this link with anyone! They can:
- ✅ Sign up and create accounts
- ✅ Create homes and add materials
- ✅ Create construction projects
- ✅ Track time and manage scope of work

## Automatic Updates

From now on, whenever you make changes:

```bash
git add .
git commit -m "Description of changes"
git push
```

Both Vercel and Render will automatically redeploy! 🚀

## Custom Domain (Optional - Later)

Want `hooomz.com` instead of `hooomz-abc123.vercel.app`?

1. Buy a domain (Namecheap, Google Domains, etc.)
2. In Vercel: Settings → Domains → Add
3. In Render: Settings → Custom Domain → Add
4. Follow DNS instructions

## Troubleshooting

### "Cannot connect to API"
- ✅ Check VITE_API_BASE_URL in Vercel environment variables
- ✅ Make sure Render service is running (check dashboard)
- ✅ Verify CLIENT_URL is set in Render

### "Authentication not working"
- ✅ Check Supabase redirect URLs include your Vercel domain
- ✅ Verify Supabase keys in Render are correct

### "API is slow on first request"
- ✅ Normal! Free Render services sleep after 15 minutes
- ✅ First request wakes it up (~30 seconds)
- ✅ Upgrade to Starter plan ($7/mo) for always-on

### "Build failed"
- ✅ Check build logs in Vercel/Render dashboard
- ✅ Verify all dependencies are in package.json
- ✅ Check environment variables are set correctly

## Cost Summary

- **Vercel:** FREE forever
- **Render:** FREE (with cold starts) or $7/mo for always-on
- **Supabase:** FREE (up to 500MB database)

**Total:** $0-7/month

## Next Steps

Want to improve your deployment?

1. **Add Analytics:** Vercel Analytics (free)
2. **Monitor Errors:** Sentry.io (free tier)
3. **Custom Domain:** $10-15/year
4. **Upgrade Render:** $7/mo for always-on backend
5. **Email Service:** For password resets (SendGrid free tier)

---

Need help? Check the logs:
- **Vercel:** Dashboard → Your Project → View Function Logs
- **Render:** Dashboard → Your Service → Logs tab
