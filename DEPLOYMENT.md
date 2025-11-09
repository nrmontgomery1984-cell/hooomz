# Hooomz Deployment Guide

This guide will help you deploy Hooomz to make it accessible via a public URL.

## Prerequisites

1. GitHub account
2. Vercel account (free) - https://vercel.com
3. Render account (free) - https://render.com

## Step 1: Push Code to GitHub

If you haven't already, create a GitHub repository:

```bash
# Initialize git (if not done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Hooomz app with modern UI"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR-USERNAME/hooomz.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy Backend to Render

### 2.1 Create Render Account
1. Go to https://render.com
2. Sign up with GitHub

### 2.2 Deploy Backend
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name:** `hooomz-api`
   - **Region:** Oregon (or closest to you)
   - **Branch:** `main`
   - **Root Directory:** `server`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

### 2.3 Add Environment Variables
Click **"Environment"** and add:

- `NODE_ENV` = `production`
- `PORT` = `10000` (Render default)
- `SUPABASE_URL` = `your-supabase-url`
- `SUPABASE_SERVICE_ROLE_KEY` = `your-supabase-service-role-key`
- `CLIENT_URL` = (leave blank for now, will update after frontend deployment)

### 2.4 Deploy
1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Copy your backend URL (e.g., `https://hooomz-api.onrender.com`)

## Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub

### 3.2 Deploy Frontend
1. Click **"Add New..."** → **"Project"**
2. Import your GitHub repository
3. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

### 3.3 Add Environment Variable
Click **"Environment Variables"** and add:

- **Variable Name:** `VITE_API_BASE_URL`
- **Value:** `https://hooomz-api.onrender.com/api` (your Render backend URL)
- **Environment:** Production, Preview, Development (all checked)

### 3.4 Deploy
1. Click **"Deploy"**
2. Wait for deployment (2-3 minutes)
3. Copy your frontend URL (e.g., `https://hooomz.vercel.app`)

## Step 4: Update Backend Environment Variables

1. Go back to Render dashboard
2. Open your `hooomz-api` service
3. Go to **"Environment"**
4. Update `CLIENT_URL` to your Vercel URL (e.g., `https://hooomz.vercel.app`)
5. Save changes (this will trigger a redeploy)

## Step 5: Configure Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Add your Vercel URL to **Redirect URLs:**
   - `https://hooomz.vercel.app/*`
4. Update **Site URL** if needed

## Step 6: Test Your Deployment

Visit your Vercel URL: `https://hooomz.vercel.app`

You should now have:
- ✅ Frontend hosted on Vercel
- ✅ Backend API hosted on Render
- ✅ Automatic HTTPS
- ✅ Automatic deployments on git push

## Sharing Your App

Share this URL with anyone: `https://hooomz.vercel.app`

They can:
1. Sign up for an account
2. Create homes and projects
3. Use all features

## Custom Domain (Optional)

### On Vercel:
1. Go to Project Settings → Domains
2. Add your custom domain (e.g., `hooomz.com`)
3. Follow DNS instructions

### On Render:
1. Go to Service → Settings → Custom Domain
2. Add your API subdomain (e.g., `api.hooomz.com`)
3. Follow DNS instructions

## Free Tier Limitations

**Vercel:**
- ✅ Unlimited bandwidth
- ✅ Automatic HTTPS
- ✅ Fast CDN

**Render (Free Tier):**
- ⚠️ Spins down after 15 minutes of inactivity
- ⚠️ First request after sleep takes ~30 seconds
- ✅ 750 hours/month free
- 💡 Upgrade to Starter ($7/mo) for always-on service

## Monitoring & Logs

**Vercel:**
- Deployments: https://vercel.com/dashboard
- Logs: Click on your project → Deployments → View Function Logs

**Render:**
- Dashboard: https://dashboard.render.com
- Logs: Click on your service → Logs tab

## Updating Your App

Simply push to GitHub:

```bash
git add .
git commit -m "Update features"
git push
```

Both Vercel and Render will automatically redeploy! 🚀

## Alternative: Single Platform Deployment

### Option A: Railway (All-in-one)
- Deploy both frontend and backend together
- $5/month for hobby plan
- https://railway.app

### Option B: Render (Both services)
- Deploy both on Render
- Free tier for both
- Simpler configuration

## Troubleshooting

**"Cannot connect to API"**
- Check VITE_API_BASE_URL in Vercel environment variables
- Ensure Render service is running
- Check CORS settings in server/src/index.js

**"Authentication not working"**
- Verify Supabase redirect URLs include your Vercel domain
- Check Supabase environment variables on Render

**"API is slow"**
- Free Render services sleep after 15 min
- First request wakes it up (~30s delay)
- Consider upgrading to Starter plan ($7/mo)

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Render Docs: https://render.com/docs
- Supabase Docs: https://supabase.com/docs
