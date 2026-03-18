-- Migration 024: Add role column to user_profiles
--
-- Roles: owner, operator, installer, homeowner
-- Default: installer (safest — least privilege)

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'installer'
  CHECK (role IN ('owner', 'operator', 'installer', 'homeowner'));
