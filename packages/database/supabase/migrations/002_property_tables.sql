-- Migration 002: Property Tables
-- The Property entity is the anchor for all home data

CREATE TYPE property_type AS ENUM (
  'single_family', 'semi_detached', 'townhouse', 'condo', 'multi_unit', 'other'
);

CREATE TYPE ownership_transfer_type AS ENUM (
  'initial', 'sale', 'inheritance', 'other'
);

CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'CA',
  current_owner_id UUID,  -- FK added after customers table
  ownership_transferred_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_org_id UUID NOT NULL REFERENCES organizations(id),
  year_built INTEGER,
  property_type property_type
);

CREATE INDEX idx_properties_address ON properties(address_line1, city, province);
CREATE INDEX idx_properties_owner ON properties(current_owner_id);
CREATE INDEX idx_properties_org ON properties(created_by_org_id);
