-- Migration 003: Customer Tables

CREATE TYPE customer_source AS ENUM (
  'referral', 'website', 'social', 'repeat', 'other'
);

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  portal_access BOOLEAN DEFAULT FALSE,
  portal_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  tags TEXT[] DEFAULT '{}',
  source customer_source
);

CREATE INDEX idx_customers_org ON customers(organization_id);
CREATE INDEX idx_customers_email ON customers(email);

-- Now add FK to properties
ALTER TABLE properties
  ADD CONSTRAINT fk_properties_owner
  FOREIGN KEY (current_owner_id) REFERENCES customers(id);

-- Property ownership history
CREATE TABLE property_ownership_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id),
  owner_id UUID NOT NULL REFERENCES customers(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  transfer_type ownership_transfer_type NOT NULL
);

CREATE INDEX idx_ownership_property ON property_ownership_history(property_id);
