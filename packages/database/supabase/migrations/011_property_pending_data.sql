-- Migration 011: Property Pending Data Bridge
-- Queues data for transfer to Homeowner module on project completion

CREATE TYPE pending_data_type AS ENUM (
  'material', 'photo', 'contractor', 'loop_structure', 'document'
);

CREATE TABLE property_pending_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  data_type pending_data_type NOT NULL,
  source_entity_type TEXT NOT NULL,
  source_entity_id UUID NOT NULL,
  data_snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_pending_property ON property_pending_data(property_id);
CREATE INDEX idx_pending_unprocessed ON property_pending_data(property_id) WHERE processed_at IS NULL;
