const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Use Nominatim with CT bounding box for Connecticut-specific results
    const params = new URLSearchParams({
      q: `${query}, Connecticut, USA`,
      format: 'json',
      addressdetails: '1',
      limit: '8',
      countrycodes: 'us',
      // CT bounding box
      viewbox: '-73.7278,42.0505,-71.7868,40.9509',
      bounded: '1',
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: {
          'User-Agent': 'CTPropertyLookup/1.0',
          'Accept': 'application/json',
        },
      }
    );

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
          street: street,
          town: town,
          display: [street, town].filter(Boolean).join(', ') + (town ? ', CT' : ''),
          lat: r.lat,
          lon: r.lon,
        };
      })
      .filter((s: any) => s.street && s.town);

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Autocomplete error:', error);
    return new Response(
      JSON.stringify({ suggestions: [], error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
