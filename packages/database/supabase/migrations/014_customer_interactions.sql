-- Migration 014: Customer Interactions
-- CRM interaction tracking for customer communications

CREATE TYPE interaction_type AS ENUM (
  'call', 'email', 'meeting', 'site_visit', 'estimate_sent', 'contract_signed', 'note'
);

CREATE TABLE customer_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  interaction_type interaction_type NOT NULL,
  notes TEXT NOT NULL,
  project_id UUID REFERENCES projects(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES team_members(id)
);

CREATE INDEX idx_interactions_customer ON customer_interactions(customer_id);
CREATE INDEX idx_interactions_org ON customer_interactions(organization_id);
CREATE INDEX idx_interactions_project ON customer_interactions(project_id);
CREATE INDEX idx_interactions_date ON customer_interactions(created_at DESC);

-- RLS
ALTER TABLE customer_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org interactions" ON customer_interactions
  FOR SELECT USING (organization_id = get_user_org_id());

CREATE POLICY "Users can insert own org interactions" ON customer_interactions
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "Users can update own org interactions" ON customer_interactions
  FOR UPDATE USING (organization_id = get_user_org_id());

CREATE POLICY "Users can delete own org interactions" ON customer_interactions
  FOR DELETE USING (organization_id = get_user_org_id());
