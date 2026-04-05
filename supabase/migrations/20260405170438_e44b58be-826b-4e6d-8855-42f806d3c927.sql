
CREATE TABLE public.property_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  address TEXT NOT NULL,
  town TEXT NOT NULL,
  property_data JSONB NOT NULL,
  searched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_property_cache_lookup ON public.property_cache (lower(address), lower(town));

ALTER TABLE public.property_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cached properties"
  ON public.property_cache FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert cached properties"
  ON public.property_cache FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update cached properties"
  ON public.property_cache FOR UPDATE
  USING (true);
