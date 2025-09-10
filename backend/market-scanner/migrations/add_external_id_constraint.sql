-- Add unique constraint on external_id
ALTER TABLE cape_town_competitors
ADD CONSTRAINT unique_external_id UNIQUE (external_id);

-- Verify constraint
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'cape_town_competitors'
AND constraint_name = 'unique_external_id';
