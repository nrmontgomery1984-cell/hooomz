-- =====================================================
-- CONTACTS MODULE
-- Store vendors and subcontractors for easy reference
-- =====================================================

-- Contacts Table
-- Simple contact management for contractors and vendors
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  email TEXT,
  trade_specialty TEXT, -- e.g., "Electrical", "Plumbing", "Framing", "Lumber Supplier"
  contact_type TEXT DEFAULT 'contractor' CHECK (contact_type IN ('contractor', 'vendor')),
  notes TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_contacts_created_by ON contacts(created_by) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_type ON contacts(contact_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_trade ON contacts(trade_specialty) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_favorite ON contacts(is_favorite) WHERE is_favorite = TRUE AND deleted_at IS NULL;

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE contacts IS 'Vendors and subcontractors contact information';
COMMENT ON COLUMN contacts.trade_specialty IS 'Trade or category (Electrical, Plumbing, Lumber, Hardware, etc.)';
COMMENT ON COLUMN contacts.contact_type IS 'Either contractor (by trade) or vendor (by category)';
COMMENT ON COLUMN contacts.is_favorite IS 'Mark frequently used contacts as favorites';
