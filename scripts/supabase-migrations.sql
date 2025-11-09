-- Hooomz Profile™ Database Migrations
-- Run this in Supabase SQL Editor
-- Created: 2025-01-06

-- ============================================
-- 1. HOMES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS homes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  year_built INTEGER,
  sqft INTEGER,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for homes
CREATE INDEX IF NOT EXISTS idx_homes_owner ON homes(owner_id);
CREATE INDEX IF NOT EXISTS idx_homes_deleted ON homes(deleted_at);

-- Row Level Security for homes
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

-- ============================================
-- 2. ROOMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  floor INTEGER,
  notes TEXT,
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for rooms
CREATE INDEX IF NOT EXISTS idx_rooms_home ON rooms(home_id);
CREATE INDEX IF NOT EXISTS idx_rooms_deleted ON rooms(deleted_at);

-- Row Level Security for rooms
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage rooms in their homes"
  ON rooms FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM homes
      WHERE homes.id = rooms.home_id
      AND homes.owner_id = auth.uid()
    )
  );

-- ============================================
-- 3. MATERIALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  color TEXT,
  supplier TEXT,
  purchase_date DATE,
  purchase_price DECIMAL(10,2),
  notes TEXT,
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for materials
CREATE INDEX IF NOT EXISTS idx_materials_home ON materials(home_id);
CREATE INDEX IF NOT EXISTS idx_materials_room ON materials(room_id);
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
CREATE INDEX IF NOT EXISTS idx_materials_deleted ON materials(deleted_at);

-- Row Level Security for materials
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage materials in their homes"
  ON materials FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM homes
      WHERE homes.id = materials.home_id
      AND homes.owner_id = auth.uid()
    )
  );

-- ============================================
-- 4. SYSTEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  serial TEXT,
  install_date DATE,
  warranty_until DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for systems
CREATE INDEX IF NOT EXISTS idx_systems_home ON systems(home_id);
CREATE INDEX IF NOT EXISTS idx_systems_type ON systems(type);
CREATE INDEX IF NOT EXISTS idx_systems_deleted ON systems(deleted_at);

-- Row Level Security for systems
ALTER TABLE systems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage systems in their homes"
  ON systems FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM homes
      WHERE homes.id = systems.home_id
      AND homes.owner_id = auth.uid()
    )
  );

-- ============================================
-- 5. DOCUMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for documents
CREATE INDEX IF NOT EXISTS idx_documents_home ON documents(home_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_deleted ON documents(deleted_at);

-- Row Level Security for documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage documents in their homes"
  ON documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM homes
      WHERE homes.id = documents.home_id
      AND homes.owner_id = auth.uid()
    )
  );

-- ============================================
-- 6. MAINTENANCE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  frequency TEXT NOT NULL,
  next_due DATE NOT NULL,
  last_completed DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for maintenance
CREATE INDEX IF NOT EXISTS idx_maintenance_home ON maintenance(home_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_due ON maintenance(next_due);
CREATE INDEX IF NOT EXISTS idx_maintenance_deleted ON maintenance(deleted_at);

-- Row Level Security for maintenance
ALTER TABLE maintenance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage maintenance in their homes"
  ON maintenance FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM homes
      WHERE homes.id = maintenance.home_id
      AND homes.owner_id = auth.uid()
    )
  );

-- ============================================
-- 7. CONTRACTOR WORK TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS contractor_work (
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

-- Indexes for contractor_work
CREATE INDEX IF NOT EXISTS idx_contractor_work_home ON contractor_work(home_id);
CREATE INDEX IF NOT EXISTS idx_contractor_work_contractor ON contractor_work(contractor_id);

-- Row Level Security for contractor_work
ALTER TABLE contractor_work ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractors can manage their own work"
  ON contractor_work FOR ALL
  USING (auth.uid() = contractor_id);

CREATE POLICY "Homeowners can view work on their homes"
  ON contractor_work FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM homes
      WHERE homes.id = contractor_work.home_id
      AND homes.owner_id = auth.uid()
    )
  );

-- ============================================
-- 8. REALTOR INTAKE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS realtor_intake (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  realtor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for realtor_intake
CREATE INDEX IF NOT EXISTS idx_realtor_intake_home ON realtor_intake(home_id);
CREATE INDEX IF NOT EXISTS idx_realtor_intake_realtor ON realtor_intake(realtor_id);

-- Row Level Security for realtor_intake
ALTER TABLE realtor_intake ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Realtors can manage their own intake"
  ON realtor_intake FOR ALL
  USING (auth.uid() = realtor_id);

CREATE POLICY "Homeowners can view intake on their homes"
  ON realtor_intake FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM homes
      WHERE homes.id = realtor_intake.home_id
      AND homes.owner_id = auth.uid()
    )
  );

-- ============================================
-- COMPLETED!
-- ============================================
-- All tables created with Row Level Security enabled
-- Next steps:
-- 1. Create Storage buckets in Supabase Dashboard
-- 2. Configure environment variables
-- 3. Start your app!
