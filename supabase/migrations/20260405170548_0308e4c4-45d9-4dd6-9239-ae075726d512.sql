
DROP INDEX IF EXISTS idx_property_cache_lookup;
CREATE UNIQUE INDEX idx_property_cache_lookup ON public.property_cache (address, town);
