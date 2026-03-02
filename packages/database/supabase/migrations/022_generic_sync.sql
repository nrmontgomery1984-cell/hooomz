-- Migration 022: Generic Sync Table
-- Stores serialized IndexedDB data for cross-device sync.
-- Each row = one entity from one IndexedDB store.
-- This is a pragmatic bridge until full schema alignment is done.

-- Drop RLS temporarily for this table (re-enable below)
CREATE TABLE IF NOT EXISTS sync_data (
  id TEXT NOT NULL,                      -- entity ID from IndexedDB
  store_name TEXT NOT NULL,              -- IndexedDB store name
  data JSONB NOT NULL,                   -- full entity as JSON
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  device_id TEXT,                        -- which device wrote this
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (store_name, id)
);

CREATE INDEX idx_sync_data_store ON sync_data(store_name);
CREATE INDEX idx_sync_data_updated ON sync_data(updated_at DESC);
CREATE INDEX idx_sync_data_store_updated ON sync_data(store_name, updated_at DESC);

-- Enable RLS
ALTER TABLE sync_data ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated and anonymous users (single-tenant for now)
CREATE POLICY "sync_data_all" ON sync_data
  FOR ALL
  USING (true)
  WITH CHECK (true);
