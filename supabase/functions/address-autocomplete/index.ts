const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory cache to reduce Nominatim calls
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 300_000; // 5 minutes

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    if (!query || query.length < 3) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cacheKey = query.trim().toLowerCase();
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const params = new URLSearchParams({
      q: `${query}, Connecticut, USA`,
      format: 'json',
      addressdetails: '1',
      limit: '8',
      countrycodes: 'us',
      viewbox: '-73.7278,42.0505,-71.7868,40.9509',
      bounded: '1',
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: {
          'User-Agent': 'CTPropertyLookup/1.0 (property-search-app)',
          'Accept': 'application/json',
        },
      }
    );

    // Handle rate limiting gracefully
    if (response.status === 429) {
      const result = { suggestions: [] };
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!response.ok) {
      throw new Error(`Nominatim error: ${response.status}`);
    }

    const results = await response.json();

    const suggestions = results
      .filter((r: any) => r.address?.state === 'Connecticut')
      .map((r: any) => {
        const a = r.address;
        const houseNumber = a.house_number || '';
        const road = a.road || '';
        const town = a.city || a.town || a.village || a.hamlet || '';
        const street = [houseNumber, road].filter(Boolean).join(' ');
        return {
          street,
          town,
          display: [street, town].filter(Boolean).join(', ') + (town ? ', CT' : ''),
        };
      })
      .filter((s: any) => s.street && s.town);

    const result = { suggestions };
    cache.set(cacheKey, { data: result, ts: Date.now() });

    // Prune old cache entries
    if (cache.size > 200) {
      const now = Date.now();
      for (const [k, v] of cache) {
        if (now - v.ts > CACHE_TTL) cache.delete(k);
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Autocomplete error:', error);
    return new Response(
      JSON.stringify({ suggestions: [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
