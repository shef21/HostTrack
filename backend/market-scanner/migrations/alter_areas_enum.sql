-- Begin transaction
BEGIN;

-- Add new values to the enum type
ALTER TYPE cape_town_area ADD VALUE IF NOT EXISTS 'Claremont';
ALTER TYPE cape_town_area ADD VALUE IF NOT EXISTS 'Rondebosch';
ALTER TYPE cape_town_area ADD VALUE IF NOT EXISTS 'Kenilworth';
ALTER TYPE cape_town_area ADD VALUE IF NOT EXISTS 'Gardens';
ALTER TYPE cape_town_area ADD VALUE IF NOT EXISTS 'Tamboerskloof';
ALTER TYPE cape_town_area ADD VALUE IF NOT EXISTS 'Bo-Kaap';
ALTER TYPE cape_town_area ADD VALUE IF NOT EXISTS 'Bantry Bay';
ALTER TYPE cape_town_area ADD VALUE IF NOT EXISTS 'Clifton';
ALTER TYPE cape_town_area ADD VALUE IF NOT EXISTS 'Fresnaye';
ALTER TYPE cape_town_area ADD VALUE IF NOT EXISTS 'Hout Bay';
ALTER TYPE cape_town_area ADD VALUE IF NOT EXISTS 'Constantia';
ALTER TYPE cape_town_area ADD VALUE IF NOT EXISTS 'Bellville';
ALTER TYPE cape_town_area ADD VALUE IF NOT EXISTS 'Durbanville';
ALTER TYPE cape_town_area ADD VALUE IF NOT EXISTS 'Muizenberg';
ALTER TYPE cape_town_area ADD VALUE IF NOT EXISTS 'Kalk Bay';
ALTER TYPE cape_town_area ADD VALUE IF NOT EXISTS 'Fish Hoek';

COMMIT;
