const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const resp = await fetch("http://assessor.avonct.gov/propcards/Wstreet.html", {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const text = await resp.text();
    return new Response(JSON.stringify({ status: resp.status, length: text.length, sample: text.substring(0, 500) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
