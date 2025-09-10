-- Add images column to cape_town_competitors table
ALTER TABLE cape_town_competitors
ADD COLUMN images TEXT[] DEFAULT '{}',
ADD COLUMN lat DECIMAL(10, 8),
ADD COLUMN lng DECIMAL(11, 8);
