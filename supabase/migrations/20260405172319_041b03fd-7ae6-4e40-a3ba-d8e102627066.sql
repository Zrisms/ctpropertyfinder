DROP POLICY IF EXISTS "Anyone can read cached properties" ON public.property_cache;
DROP POLICY IF EXISTS "Service role can insert cached properties" ON public.property_cache;
DROP POLICY IF EXISTS "Service role can update cached properties" ON public.property_cache;
DROP TABLE IF EXISTS public.property_cache;