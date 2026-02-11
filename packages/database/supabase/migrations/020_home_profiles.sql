-- Migration 020: Home Profiles & Lifecycle Tables
-- Extends properties to full home profiles with products, scans, and maintenance

-- =====================
-- EXTEND PROPERTIES TABLE
-- =====================
-- Add home profile columns to existing properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS square_footage INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS lot_size_sf INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS stories INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS bedrooms INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS bathrooms DECIMAL(3,1);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS construction_type TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS scan_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS original_project_id UUID REFERENCES projects(id);

-- =====================
-- PRODUCT CATEGORY ENUM
-- =====================
CREATE TYPE product_category AS ENUM (
  'hvac',           -- Furnaces, ACs, heat pumps, HRVs
  'plumbing',       -- Water heaters, fixtures, pumps
  'electrical',     -- Panels, generators, smart devices
  'roofing',        -- Shingles, membranes, flashing
  'windows_doors',  -- Windows, exterior doors
  'appliances',     -- Kitchen and laundry appliances
  'flooring',       -- Hardwood, tile, carpet, LVP
  'siding',         -- Exterior cladding
  'insulation',     -- Wall, attic, foundation insulation
  'finishes',       -- Paint, trim, cabinets
  'structural',     -- Beams, foundations, framing components
  'other'
);

-- =====================
-- INSTALLED PRODUCTS
-- =====================
CREATE TABLE installed_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id), -- Contractor who installed (if known)
  project_id UUID REFERENCES projects(id),           -- Project that installed (if known)

  -- Product identification
  category product_category NOT NULL,
  product_type TEXT NOT NULL,           -- e.g., 'furnace', 'water_heater', 'window'
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT,

  -- Installation details
  install_date DATE,
  location TEXT,                        -- e.g., 'Mechanical Room', 'Kitchen', 'Master Bath'
  location_id UUID REFERENCES loop_iterations(id), -- Link to project location if applicable

  -- Warranty tracking
  warranty_years INTEGER,
  warranty_expires DATE,
  warranty_document_id UUID REFERENCES documents(id),

  -- Maintenance
  maintenance_interval_months INTEGER,  -- e.g., 12 for annual, 3 for quarterly
  last_serviced DATE,
  next_service_due DATE,                -- Computed or manually set

  -- Additional data
  notes TEXT,
  specifications JSONB,                 -- Product-specific specs (BTU, efficiency, dimensions, etc.)

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_installed_products_property ON installed_products(property_id);
CREATE INDEX idx_installed_products_category ON installed_products(category);
CREATE INDEX idx_installed_products_warranty ON installed_products(warranty_expires)
  WHERE warranty_expires IS NOT NULL;
CREATE INDEX idx_installed_products_service ON installed_products(next_service_due)
  WHERE next_service_due IS NOT NULL;
CREATE INDEX idx_installed_products_org ON installed_products(organization_id)
  WHERE organization_id IS NOT NULL;

-- =====================
-- HOME SCANS (3D Reality Capture)
-- =====================
CREATE TYPE scan_stage AS ENUM (
  'existing_conditions', -- Pre-construction scan
  'framing',             -- After framing, before sheathing
  'rough_in',            -- After MEP rough-in, before drywall
  'final',               -- Substantial completion
  'other'
);

CREATE TABLE home_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  -- Scan details
  scan_date DATE NOT NULL,
  stage scan_stage NOT NULL,
  scan_provider TEXT,                   -- Partner company name

  -- Files
  point_cloud_path TEXT,                -- .e57, .rcp file location
  revit_model_path TEXT,                -- .rvt as-built model
  deviation_report_path TEXT,           -- PDF deviation analysis

  -- Analysis
  deviation_count INTEGER DEFAULT 0,    -- Number of flagged deviations
  deviations_resolved BOOLEAN DEFAULT FALSE,

  -- Metadata
  notes TEXT,
  scanned_by TEXT,                      -- Technician name

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_home_scans_property ON home_scans(property_id);
CREATE INDEX idx_home_scans_project ON home_scans(project_id)
  WHERE project_id IS NOT NULL;
CREATE INDEX idx_home_scans_stage ON home_scans(stage);
CREATE INDEX idx_home_scans_date ON home_scans(scan_date DESC);

-- =====================
-- MAINTENANCE RECORDS
-- =====================
CREATE TYPE maintenance_type AS ENUM (
  'scheduled',      -- Regular scheduled maintenance
  'repair',         -- Fix a problem
  'replacement',    -- Replace a component
  'inspection',     -- Check condition
  'emergency',      -- Urgent repair
  'upgrade'         -- Improvement/upgrade
);

CREATE TABLE maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  product_id UUID REFERENCES installed_products(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id), -- Contractor who performed

  -- Service details
  maintenance_type maintenance_type NOT NULL,
  description TEXT NOT NULL,
  performed_date DATE NOT NULL,
  performed_by TEXT,                    -- Person/company name

  -- Cost tracking
  cost DECIMAL(10,2),
  invoice_id UUID REFERENCES documents(id),

  -- Outcome
  outcome TEXT,                         -- Result/notes from the service
  next_recommended DATE,                -- When to do this again

  -- Photos taken during maintenance
  photo_ids UUID[] DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_maintenance_property ON maintenance_records(property_id);
CREATE INDEX idx_maintenance_product ON maintenance_records(product_id)
  WHERE product_id IS NOT NULL;
CREATE INDEX idx_maintenance_date ON maintenance_records(performed_date DESC);
CREATE INDEX idx_maintenance_type ON maintenance_records(maintenance_type);

-- =====================
-- OWNERSHIP HISTORY
-- =====================
CREATE TABLE ownership_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),  -- The owner (uses existing customers table)

  start_date DATE NOT NULL,
  end_date DATE,                              -- NULL if current owner

  transfer_type ownership_transfer_type NOT NULL,  -- Uses existing enum
  transfer_notes TEXT,

  -- Profile access
  profile_access_granted BOOLEAN DEFAULT FALSE, -- Has access to home profile
  profile_access_granted_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ownership_property ON ownership_history(property_id);
CREATE INDEX idx_ownership_customer ON ownership_history(customer_id)
  WHERE customer_id IS NOT NULL;
CREATE INDEX idx_ownership_current ON ownership_history(property_id, end_date)
  WHERE end_date IS NULL;

-- =====================
-- HELPER FUNCTIONS
-- =====================

-- Get products with warranties expiring within N days
CREATE OR REPLACE FUNCTION get_expiring_warranties(
  p_property_id UUID,
  p_days_ahead INTEGER DEFAULT 90
)
RETURNS TABLE (
  product_id UUID,
  product_type TEXT,
  manufacturer TEXT,
  model TEXT,
  warranty_expires DATE,
  days_until_expiry INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ip.id,
    ip.product_type,
    ip.manufacturer,
    ip.model,
    ip.warranty_expires,
    (ip.warranty_expires - CURRENT_DATE)::INTEGER as days_until_expiry
  FROM installed_products ip
  WHERE ip.property_id = p_property_id
    AND ip.warranty_expires IS NOT NULL
    AND ip.warranty_expires <= CURRENT_DATE + p_days_ahead
    AND ip.warranty_expires >= CURRENT_DATE
  ORDER BY ip.warranty_expires ASC;
END;
$$ LANGUAGE plpgsql;

-- Get products due for maintenance
CREATE OR REPLACE FUNCTION get_maintenance_due(
  p_property_id UUID,
  p_days_ahead INTEGER DEFAULT 30
)
RETURNS TABLE (
  product_id UUID,
  product_type TEXT,
  location TEXT,
  last_serviced DATE,
  next_service_due DATE,
  days_overdue INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ip.id,
    ip.product_type,
    ip.location,
    ip.last_serviced,
    ip.next_service_due,
    GREATEST(0, (CURRENT_DATE - ip.next_service_due)::INTEGER) as days_overdue
  FROM installed_products ip
  WHERE ip.property_id = p_property_id
    AND ip.next_service_due IS NOT NULL
    AND ip.next_service_due <= CURRENT_DATE + p_days_ahead
  ORDER BY ip.next_service_due ASC;
END;
$$ LANGUAGE plpgsql;

-- Update scan_verified flag on property when scans added
CREATE OR REPLACE FUNCTION update_property_scan_verified()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE properties
  SET scan_verified = EXISTS (
    SELECT 1 FROM home_scans
    WHERE property_id = NEW.property_id
  )
  WHERE id = NEW.property_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_scan_verified
  AFTER INSERT OR DELETE ON home_scans
  FOR EACH ROW
  EXECUTE FUNCTION update_property_scan_verified();

-- =====================
-- RLS POLICIES
-- =====================
ALTER TABLE installed_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE ownership_history ENABLE ROW LEVEL SECURITY;

-- Installed Products RLS
CREATE POLICY "Users can view own org products" ON installed_products
  FOR SELECT USING (organization_id = get_user_org_id());

CREATE POLICY "Users can manage own org products" ON installed_products
  FOR ALL USING (organization_id = get_user_org_id());

CREATE POLICY "Homeowners can view their products" ON installed_products
  FOR SELECT USING (
    property_id IN (
      SELECT id FROM properties WHERE current_owner_id IN (
        SELECT id FROM customers WHERE portal_user_id = auth.uid()
      )
    )
  );

-- Home Scans RLS
CREATE POLICY "Users can view own org scans" ON home_scans
  FOR SELECT USING (organization_id = get_user_org_id());

CREATE POLICY "Users can manage own org scans" ON home_scans
  FOR ALL USING (organization_id = get_user_org_id());

CREATE POLICY "Homeowners can view their scans" ON home_scans
  FOR SELECT USING (
    property_id IN (
      SELECT id FROM properties WHERE current_owner_id IN (
        SELECT id FROM customers WHERE portal_user_id = auth.uid()
      )
    )
  );

-- Maintenance Records RLS
CREATE POLICY "Users can view own org maintenance" ON maintenance_records
  FOR SELECT USING (organization_id = get_user_org_id());

CREATE POLICY "Users can manage own org maintenance" ON maintenance_records
  FOR ALL USING (organization_id = get_user_org_id());

CREATE POLICY "Homeowners can view their maintenance" ON maintenance_records
  FOR SELECT USING (
    property_id IN (
      SELECT id FROM properties WHERE current_owner_id IN (
        SELECT id FROM customers WHERE portal_user_id = auth.uid()
      )
    )
  );

-- Ownership History RLS
CREATE POLICY "Org users can view ownership" ON ownership_history
  FOR SELECT USING (
    property_id IN (
      SELECT id FROM properties WHERE created_by_org_id = get_user_org_id()
    )
  );

CREATE POLICY "Homeowners can view their ownership history" ON ownership_history
  FOR SELECT USING (
    customer_id IN (
      SELECT id FROM customers WHERE portal_user_id = auth.uid()
    )
  );
