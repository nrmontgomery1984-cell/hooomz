# Development Setup

## Prerequisites

- **Node.js** 18+ and npm 9+
- **Git** for version control
- **Supabase account** (free tier is fine)
- **Code editor** (VS Code recommended)

## Installation

### 1. Clone Repository

```bash
git clone <repo-url>
cd hooomz
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install workspace dependencies
npm install --workspaces
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the database migrations (see [Database Setup](#database-setup))
3. Copy your project URL and keys

### 4. Configure Environment Variables

#### Client (.env)

```bash
cd client
cp .env.example .env
```

Edit `client/.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_BASE_URL=http://localhost:3001/api
```

#### Server (.env)

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
```
NODE_ENV=development
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CLIENT_URL=http://localhost:5173
```

### 5. Start Development Servers

From the root directory:

```bash
npm run dev
```

This starts:
- Client on `http://localhost:5173`
- Server on `http://localhost:3001`

Or start them individually:
```bash
npm run dev:client
npm run dev:server
```

## Database Setup

### Create Tables

In your Supabase dashboard, go to SQL Editor and run these migrations:

#### 1. Users (handled by Supabase Auth)

Supabase Auth creates the `auth.users` table automatically. We'll reference it.

#### 2. Homes

```sql
CREATE TABLE homes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  year_built INTEGER,
  sqft INTEGER,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_homes_owner ON homes(owner_id);
```

#### 3. Rooms

```sql
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  floor INTEGER,
  notes TEXT,
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rooms_home ON rooms(home_id);
```

#### 4. Materials

```sql
CREATE TYPE material_category AS ENUM (
  'flooring', 'paint', 'countertop', 'cabinet', 'fixture', 'tile', 'hardware', 'other'
);

CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  category material_category NOT NULL,
  brand TEXT,
  model TEXT,
  color TEXT,
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_materials_home ON materials(home_id);
CREATE INDEX idx_materials_room ON materials(room_id);
```

#### 5. Systems

```sql
CREATE TYPE system_type AS ENUM (
  'hvac', 'electrical', 'plumbing', 'roof', 'foundation', 'windows', 'insulation', 'appliance', 'other'
);

CREATE TABLE systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  type system_type NOT NULL,
  brand TEXT,
  model TEXT,
  serial TEXT,
  install_date DATE,
  warranty_until DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_systems_home ON systems(home_id);
```

#### 6. Documents

```sql
CREATE TYPE document_category AS ENUM (
  'warranty', 'manual', 'receipt', 'inspection', 'permit', 'contract', 'photo', 'other'
);

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  category document_category NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_documents_home ON documents(home_id);
```

#### 7. Maintenance

```sql
CREATE TYPE maintenance_frequency AS ENUM (
  'weekly', 'monthly', 'quarterly', 'annually', 'biannually'
);

CREATE TABLE maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  frequency maintenance_frequency NOT NULL,
  next_due DATE NOT NULL,
  last_completed DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_maintenance_home ON maintenance(home_id);
CREATE INDEX idx_maintenance_due ON maintenance(next_due);
```

#### 8. Contractor Work

```sql
CREATE TABLE contractor_work (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  details TEXT,
  materials_used TEXT,
  photos TEXT[] DEFAULT '{}',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_contractor_work_home ON contractor_work(home_id);
CREATE INDEX idx_contractor_work_contractor ON contractor_work(contractor_id);
```

#### 9. Realtor Intake

```sql
CREATE TABLE realtor_intake (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  realtor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_realtor_intake_home ON realtor_intake(home_id);
CREATE INDEX idx_realtor_intake_realtor ON realtor_intake(realtor_id);
```

### Set Up Row Level Security (RLS)

Enable RLS on all tables and create policies:

```sql
-- Example for homes table
ALTER TABLE homes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own homes"
  ON homes FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own homes"
  ON homes FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own homes"
  ON homes FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own homes"
  ON homes FOR DELETE
  USING (auth.uid() = owner_id);
```

Repeat similar policies for all other tables.

### Set Up Storage Buckets

1. Go to Storage in Supabase dashboard
2. Create a `documents` bucket
3. Set policies for authenticated uploads

## Testing

### Manual Testing

1. Sign up for a new account at `http://localhost:5173/signup`
2. Create a home
3. Add rooms, materials, systems, etc.
4. Test file uploads
5. Test maintenance scheduling

### API Testing

Use Postman or curl:

```bash
# Get homes (replace TOKEN with your JWT)
curl -H "Authorization: Bearer TOKEN" http://localhost:3001/api/homes
```

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 5173 (client)
npx kill-port 5173

# Kill process on port 3001 (server)
npx kill-port 3001
```

### Database Connection Issues

- Verify Supabase URL and keys in `.env`
- Check that RLS policies are set up correctly
- Ensure service role key is used on backend

### File Upload Issues

- Check Supabase Storage bucket exists
- Verify storage policies allow authenticated uploads
- Check file size limits

## Next Steps

- Read [architecture.md](architecture.md) to understand the system
- Review [API_REFERENCE.md](API_REFERENCE.md) for endpoint details
- Check [roadmap.md](roadmap.md) for upcoming features
