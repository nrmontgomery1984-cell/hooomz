# 🚀 Hooomz Buildz - Deployment Guide

## Quick Deploy to Vercel (Recommended)

### Prerequisites
- Vercel account (free): https://vercel.com/signup
- Vercel CLI installed: `npm i -g vercel`

### Deploy Steps

1. **Build the client**
```bash
cd client
npm install
npm run build
```

2. **Deploy to Vercel**
```bash
cd ..
vercel --prod
```

3. **Follow prompts:**
   - Link to existing project? → No
   - Project name? → hooomz-buildz (or your choice)
   - Directory? → `./` (root)
   - Override settings? → No

4. **Done!** You'll get a URL like: `https://hooomz-buildz.vercel.app`

### Environment Variables

If your app uses environment variables, add them in Vercel dashboard:

1. Go to your project on Vercel
2. Settings → Environment Variables
3. Add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - Any other variables from your `.env` file

### Custom Domain (Optional)

1. Buy a domain (Namecheap, Google Domains, etc.)
2. In Vercel: Settings → Domains
3. Add your domain
4. Update DNS records (Vercel will show you what to add)

## Alternative: Deploy to Netlify

### Option 1: Netlify CLI

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build
cd client
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

### Option 2: Netlify UI

1. Go to https://app.netlify.com
2. Drag & drop the `client/dist` folder
3. Done!

### Build Settings for Netlify
- Build command: `cd client && npm run build`
- Publish directory: `client/dist`

## Deploy Both Client + Server

If you want to deploy the full stack:

### Option 1: Separate Deployments
- **Frontend**: Vercel/Netlify (as above)
- **Backend**: Render/Railway

#### Deploy Backend to Render:
1. Go to https://render.com
2. New → Web Service
3. Connect your GitHub repo
4. Build command: `cd server && npm install`
5. Start command: `cd server && node src/index.js`
6. Add environment variables

### Option 2: Monorepo on Vercel
```json
// vercel.json
{
  "builds": [
    { "src": "client/package.json", "use": "@vercel/static-build" },
    { "src": "server/src/index.js", "use": "@vercel/node" }
  ]
}
```

## Post-Deployment Checklist

✅ **Test PWA Installation**
- Visit on mobile
- See "Add to Home Screen" prompt
- Install and test offline mode

✅ **Test Core Features**
- Login/Signup
- Create project
- Add task
- Track time
- Add expense

✅ **Check Service Worker**
- Open DevTools → Application
- Service Worker should be "activated"

✅ **Run Lighthouse Audit**
- Chrome DevTools → Lighthouse
- Check PWA score (target: 90+)

✅ **Update API URLs**
- Make sure frontend points to production backend
- Update CORS settings in backend

## Troubleshooting

### Build Fails
```bash
# Clear cache and reinstall
cd client
rm -rf node_modules package-lock.json
npm install
npm run build
```

### PWA Not Installing
- Must be HTTPS (Vercel provides this automatically)
- Check manifest.json is accessible
- Check service worker is registered

### API Calls Failing
- Update backend URL in frontend
- Check CORS settings
- Verify environment variables

## Monitoring

### Vercel Analytics (Free)
- Shows page views, performance
- Enable in Vercel dashboard

### Sentry (Error Tracking)
```bash
npm install @sentry/react
```

### Analytics
- Google Analytics
- Plausible (privacy-friendly)
- PostHog (self-hosted)

## Continuous Deployment

### Auto-deploy from GitHub:
1. Push code to GitHub
2. Connect repo to Vercel
3. Every push to `main` auto-deploys

```bash
# Setup
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/hooomz-buildz.git
git push -u origin main
```

## Cost Estimates

- **Vercel**: Free (hobby plan covers most needs)
- **Netlify**: Free (100GB bandwidth/month)
- **Render**: Free tier + $7/mo for backend
- **Supabase**: Free (500MB database, 2GB storage)

**Total for side project**: $0-7/month

---

**Need help?** Check Vercel docs: https://vercel.com/docs
