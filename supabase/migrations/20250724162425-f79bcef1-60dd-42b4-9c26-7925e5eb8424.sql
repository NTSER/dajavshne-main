-- Add latitude and longitude fields to venues table for precise map positioning
ALTER TABLE public.venues 
ADD COLUMN latitude NUMERIC,
ADD COLUMN longitude NUMERIC;

-- Add index for geospatial queries (helpful for map bounds filtering)
CREATE INDEX idx_venues_coordinates ON public.venues (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;