-- Update column names to use hyphens consistently
ALTER TABLE cape_town_competitors
  RENAME COLUMN current_price TO "current-price",
  RENAME COLUMN price_type TO "price-type",
  RENAME COLUMN property_type TO "property-type",
  RENAME COLUMN external_id TO "external-id",
  RENAME COLUMN max_guests TO "max-guests",
  RENAME COLUMN review_count TO "review-count",
  RENAME COLUMN location_score TO "location-score",
  RENAME COLUMN scan_date TO "scan-date";
