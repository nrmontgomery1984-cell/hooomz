# Hooomz Profile™ - Complete Setup Guide

This comprehensive guide will walk you through setting up the Hooomz Profile platform from scratch. Follow each step carefully to ensure a smooth setup.

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher): [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git**: [Download here](https://git-scm.com/)
- A **Supabase account**: [Sign up here](https://supabase.com/)

---

## Step 1: Clone and Install Dependencies

### 1.1 Navigate to Your Project

The project dependencies have already been installed for you. Verify by checking:

```bash
# Check root dependencies
npm list --depth=0

# Check client dependencies
cd client
npm list --depth=0

# Check server dependencies
cd ../server
npm list --depth=0

# Return to root
cd ..
```

If any dependencies are missing, you can reinstall:

```bash
# From project root
npm install
npm install --workspace=client
npm install --workspace=server
```

---

## Step 2: Create Your Supabase Project

### 2.1 Create a New Project

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Click **New Project**
3. Fill in the details:
   - **Name**: `hooomz-profile` (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Select the region closest to you
   - **Pricing Plan**: Free tier is fine for development
4. Click **Create new project**
5. Wait 2-3 minutes for project provisioning

### 2.2 Get Your Project Credentials

Once your project is ready:

1. Go to **Project Settings** (gear icon in left sidebar)
2. Click **API** in the settings menu
3. Copy the following values:
   - **Project URL** (e.g., `https://abcdefghijk.supabase.co`)
   - **anon public** key (starts with `eyJ...`)
   - **service_role** key (starts with `eyJ...`) - Click "Reveal" to see it

**IMPORTANT**: Keep the `service_role` key secret! Never commit it to version control.

---

## Step 3: Configure Environment Variables

Environment files have been created for you. Now you need to add your Supabase credentials.

### 3.1 Update Server Environment Variables

Open `server/.env` and replace the placeholder values:

```bash
NODE_ENV=development
PORT=3001

# Supabase - REPLACE THESE VALUES
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# CORS
CLIENT_URL=http://localhost:5173
```

**Replace**:
- `https://YOUR_PROJECT_ID.supabase.co` → Your Project URL from Step 2.2
- `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` → Your service_role key from Step 2.2

### 3.2 Update Client Environment Variables

Open `client/.env` and replace the placeholder values:

```bash
# Supabase - REPLACE THESE VALUES
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API
VITE_API_BASE_URL=http://localhost:3001/api
```

**Replace**:
- `https://YOUR_PROJECT_ID.supabase.co` → Your Project URL from Step 2.2
- `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` → Your anon public key from Step 2.2

### 3.3 Verify Environment Files

Double-check that:
- [ ] Both `.env` files exist (server and client)
- [ ] URLs and keys are copied correctly (no extra spaces)
- [ ] Service role key is in `server/.env` (NOT in client)
- [ ] Anon key is in `client/.env`

---

## Step 4: Set Up the Database

### 4.1 Run SQL Migrations

A complete SQL migration file has been generated for you at `scripts/supabase-migrations.sql`.

1. Go to your Supabase Dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New query**
4. Open `scripts/supabase-migrations.sql` in your code editor
5. **Copy the entire contents** of the file
6. **Paste** into the Supabase SQL Editor
7. Click **Run** (or press `Ctrl+Enter`)

You should see a success message. This creates:
- ✅ 8 database tables (homes, rooms, materials, systems, documents, maintenance, contractor_work, realtor_intake)
- ✅ All indexes for performance
- ✅ Row Level Security (RLS) policies
- ✅ Soft delete support

### 4.2 Verify Database Setup

To verify the tables were created:

1. In Supabase Dashboard, click **Table Editor** in the left sidebar
2. You should see all 8 tables listed:
   - homes
   - rooms
   - materials
   - systems
   - documents
   - maintenance
   - contractor_work
   - realtor_intake

---

## Step 5: Set Up Storage Buckets

Storage buckets are required for file uploads (photos, documents, etc.).

### 5.1 Create Storage Buckets

Follow the detailed instructions in [`scripts/storage-setup.md`](../scripts/storage-setup.md).

**Quick summary**:

1. Go to **Storage** in Supabase Dashboard
2. Create 4 buckets:
   - `documents` (Private)
   - `photos` (Public)
   - `materials` (Public)
   - `avatars` (Public)
3. Configure Storage Policies for each bucket (see storage-setup.md for SQL)

### 5.2 Verify Storage Setup

After creating buckets, verify:
- [ ] All 4 buckets visible in Storage tab
- [ ] Public/Private settings correct
- [ ] Storage policies applied (check Policies tab in each bucket)

---

## Step 6: Start the Development Servers

You're now ready to run the application!

### 6.1 Start Both Servers (Recommended)

From the project root, run:

```bash
npm run dev
```

This starts both the client and server concurrently:
- **Client**: http://localhost:5173 (React/Vite)
- **Server**: http://localhost:3001 (Express API)

### 6.2 Start Servers Individually (Alternative)

If you prefer to run them separately:

**Terminal 1 - Start the client:**
```bash
npm run dev:client
```

**Terminal 2 - Start the server:**
```bash
npm run dev:server
```

### 6.3 Verify Servers Are Running

You should see output similar to:

```
[client] VITE v5.x.x ready in xxx ms
[client] ➜ Local: http://localhost:5173/
[server] Server running on http://localhost:3001
```

---

## Step 7: Create Your First User

### 7.1 Open the Application

1. Open your browser to http://localhost:5173
2. You should see the Hooomz Profile login page

### 7.2 Sign Up

1. Click **Sign Up** (or navigate to signup page)
2. Enter your email and password
3. Click **Create Account**

**Note**: In development, Supabase email confirmation is typically disabled. Check your Supabase Dashboard → **Authentication** → **Settings** → **Email Auth** to configure.

### 7.3 Verify Authentication

After signing up:
- You should be redirected to the Dashboard
- Check the browser console for any errors
- Your user should appear in Supabase Dashboard → **Authentication** → **Users**

---

## Step 8: Test Core Functionality

### 8.1 Create Your First Home

1. On the Dashboard, click **Add Home** (or similar button)
2. Fill in the details:
   - Address: `123 Main St, Anytown, USA`
   - Year Built: `2015`
   - Square Footage: `2000`
3. Click **Save** or **Create Home**

### 8.2 Add a Material

1. Navigate to **Materials** from the dashboard
2. Click **Add Material**
3. Fill in the form:
   - Category: `Flooring`
   - Brand: `Armstrong`
   - Model: `Prime Harvest Oak`
   - Color: `Natural`
4. Click **Save**

### 8.3 Verify Data in Supabase

1. Go to Supabase Dashboard → **Table Editor**
2. Check the `homes` table - you should see your home
3. Check the `materials` table - you should see your material
4. Verify `owner_id` matches your user ID

---

## Step 9: Troubleshooting

### Common Issues

#### "Cannot connect to server"
- ✅ Check server is running on http://localhost:3001
- ✅ Verify `VITE_API_BASE_URL` in `client/.env` is correct
- ✅ Check for errors in server terminal

#### "Unauthorized" or 401 errors
- ✅ Verify Supabase credentials in `.env` files are correct
- ✅ Check that user is logged in (check browser console)
- ✅ Ensure JWT token is being sent with requests

#### "new row violates row-level security policy"
- ✅ Verify SQL migrations ran successfully
- ✅ Check RLS policies exist in Supabase → Table Editor → Policies tab
- ✅ Ensure `owner_id` matches authenticated user's ID

#### Database queries returning empty results
- ✅ Check that data exists in Supabase Table Editor
- ✅ Verify `deleted_at IS NULL` in queries (soft delete pattern)
- ✅ Ensure RLS policies allow user to read their data

#### File upload errors
- ✅ Verify storage buckets exist
- ✅ Check storage policies are configured correctly
- ✅ Ensure file size is within limits (see storage-setup.md)
- ✅ Check browser console for detailed error messages

#### CORS errors
- ✅ Verify `CLIENT_URL` in `server/.env` matches your client URL
- ✅ Check CORS middleware in `server/src/index.js`
- ✅ Ensure credentials are enabled in API requests

### Getting Help

If you encounter issues:

1. **Check browser console** for client-side errors
2. **Check server terminal** for backend errors
3. **Check Supabase logs** in Dashboard → Logs
4. **Review the docs**:
   - [docs/architecture.md](./architecture.md)
   - [docs/API_REFERENCE.md](./API_REFERENCE.md)
   - [docs/dev-setup.md](./dev-setup.md)

---

## Step 10: Next Steps

### Recommended Next Steps

1. **Explore the codebase**:
   - Review component structure in `client/src/components/`
   - Understand the layered backend architecture (repo → service → controller)
   - Check out the custom hooks in `client/src/hooks/`

2. **Customize the UI**:
   - Update colors in `client/src/index.css` (TailwindCSS config)
   - Add your logo and branding
   - Customize the dashboard layout

3. **Add more features**:
   - Implement Rooms CRUD (similar to Materials)
   - Build the Systems management feature
   - Create the Maintenance scheduling system
   - Add document upload functionality

4. **Set up production deployment**:
   - Deploy client to Vercel
   - Deploy server to Railway or Render
   - Configure production environment variables
   - Set up custom domain

5. **Implement additional functionality**:
   - Email notifications for maintenance
   - Photo gallery views
   - Export home profile as PDF
   - Sharing homes with contractors/realtors

---

## Verification Checklist

Before moving forward, ensure all these items are complete:

- [ ] Node.js and npm installed
- [ ] Project dependencies installed (root, client, server)
- [ ] Supabase project created
- [ ] Environment variables configured (both client and server)
- [ ] SQL migrations run successfully
- [ ] All 8 tables visible in Supabase Table Editor
- [ ] Storage buckets created with policies
- [ ] Development servers running
- [ ] First user account created
- [ ] First home created successfully
- [ ] First material added successfully
- [ ] Data visible in Supabase Dashboard

---

## Quick Reference

### Important URLs
- **Client**: http://localhost:5173
- **Server**: http://localhost:3001
- **Supabase Dashboard**: https://app.supabase.com/

### Important Files
- **Server .env**: `server/.env`
- **Client .env**: `client/.env`
- **SQL Migrations**: `scripts/supabase-migrations.sql`
- **Storage Setup**: `scripts/storage-setup.md`

### Common Commands
```bash
# Start both servers
npm run dev

# Start client only
npm run dev:client

# Start server only
npm run dev:server

# Install dependencies
npm install

# Run tests (when implemented)
npm test
```

---

## Success!

You've successfully set up Hooomz Profile™! Your platform is now ready for development.

**Remember**: This is an MVP setup. As you build more features, you'll need to:
- Add more database migrations
- Expand the API
- Build additional components
- Implement comprehensive testing
- Prepare for production deployment

Happy coding! 🏠✨
