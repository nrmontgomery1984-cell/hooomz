-- Create Initial Projects
-- Run this in Supabase SQL Editor to create the initial projects

-- Insert projects only if they don't already exist
INSERT INTO projects (name, address, status, created_at, updated_at)
SELECT '222 Whitney', '222 Whitney', 'active', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = '222 Whitney');

INSERT INTO projects (name, address, status, created_at, updated_at)
SELECT '44 Teesdale', '44 Teesdale', 'active', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = '44 Teesdale');

INSERT INTO projects (name, address, status, created_at, updated_at)
SELECT '67 Woodhaven', '67 Woodhaven', 'active', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = '67 Woodhaven');

INSERT INTO projects (name, address, status, created_at, updated_at)
SELECT '222 Whitney - Garage', '222 Whitney', 'active', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = '222 Whitney - Garage');

INSERT INTO projects (name, address, status, created_at, updated_at)
SELECT '290 Shediac Rd.', '290 Shediac Rd.', 'active', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = '290 Shediac Rd.');

-- Show all projects
SELECT id, name, address, status, created_at
FROM projects
ORDER BY name;
