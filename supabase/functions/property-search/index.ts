const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Towns that use Vision Government Solutions (from vgsi.com/connecticut-online-database)
// Key = town name (lowercase), Value = URL slug (case-sensitive as on vgsi.com)
const VGS_TOWNS: Record<string, string> = {
  "andover": "andoverct", "berlin": "berlinct", "bethlehem": "bethlehemct",
  "bolton": "BoltonCT", "branford": "branfordct", "bridgeport": "bridgeportct",
  "bridgewater": "bridgewaterct", "bristol": "bristolct", "brookfield": "brookfieldct",
  "brooklyn": "brooklynct", "burlington": "burlingtonct", "canterbury": "canterburyct",
  "canton": "cantonct", "chaplin": "chaplinct", "clinton": "clintonct",
  "cornwall": "CornwallCT", "coventry": "coventryct", "deep river": "deepriverct",
  "east granby": "EastGranbyCT", "east haddam": "easthaddamct", "east lyme": "eastlymect",
  "east windsor": "eastwindsorct", "enfield": "EnfieldCT", "essex": "essexct",
  "fairfield": "fairfieldct", "glastonbury": "glastonburyct", "granby": "granbyct",
  "griswold": "griswoldct", "hamden": "hamdenct", "hampton": "hamptonct",
  "harwinton": "harwintonct", "lebanon": "LebanonCT", "ledyard": "LedyardCT",
  "lisbon": "LisbonCT", "lyme": "LymeCT", "madison": "madisonct",
  "manchester": "manchesterct", "mansfield": "mansfieldct", "meriden": "meridenct",
  "middlebury": "middleburyct", "middlefield": "MiddlefieldCT", "middletown": "MiddletownCT",
  "milford": "milfordct", "monroe": "monroect", "new britain": "newbritainct",
  "new fairfield": "newfairfieldct", "new hartford": "newhartfordct", "new haven": "newhavenct",
  "new london": "newlondonct", "new milford": "newmilfordct", "newtown": "newtownct",
  "north branford": "northbranfordct", "norwich": "NorwichCT", "old lyme": "oldlymect",
  "old saybrook": "oldsaybrookct", "orange": "orangect", "plainfield": "PlainfieldCT",
  "pomfret": "pomfretct", "preston": "prestonct", "redding": "reddingct",
  "salem": "salemct", "salisbury": "salisburyct", "somers": "somersct",
  "south windsor": "southwindsorct", "southbury": "southburyct", "southington": "southingtonct",
  "sprague": "spraguect", "stafford": "staffordct", "stamford": "stamfordct",
  "sterling": "sterlingct", "stonington": "stoningtonct", "stratford": "stratfordct",
  "thompson": "thompsonct", "tolland": "tollandct", "trumbull": "trumbullct",
  "union": "UnionCT", "wallingford": "wallingfordct", "waterford": "waterfordct",
  "westbrook": "westbrookct", "west hartford": "westhartfordct", "west haven": "westhavenct",
  "westport": "westportct", "willington": "WillingtonCT", "winchester": "WinchesterCT",
  "windham": "windhamCT",
};

// Proxy fetch to bypass Deno TLS issues with VGS certificates
async function proxyFetch(url: string, opts: RequestInit = {}): Promise<Response> {
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  return fetch(proxyUrl, opts);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { address, town } = await req.json();

    if (!address || !town) {
      return new Response(
        JSON.stringify({ success: false, error: "Address and town are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Searching property: ${address}, ${town}, CT`);

    const townLower = town.toLowerCase();
    const vgsSlug = VGS_TOWNS[townLower];

    let propertyData = null;

    if (vgsSlug) {
      // Town uses Vision Government Solutions
      try {
        // VGS jQuery autocomplete endpoint
        const autocompleteUrl = `https://gis.vgsi.com/${vgsSlug}/Search.aspx/AutoComplete`;
        console.log(`Trying VGS autocomplete: ${autocompleteUrl}`);

        const searchResp = await proxyFetch(autocompleteUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            prefixText: address,
            count: 10,
            contextKey: "Address",
          }),
        });

        console.log(`VGS autocomplete status: ${searchResp.status}`);

        if (searchResp.ok) {
          const text = await searchResp.text();
          console.log(`VGS response: ${text.substring(0, 500)}`);

          let results: string[] = [];
          try {
            const parsed = JSON.parse(text);
            results = parsed.d || parsed || [];
          } catch {
            console.log("Could not parse VGS response as JSON");
          }

          if (results.length > 0) {
            // First result typically looks like "123 MAIN ST (PID: 12345)"
            const firstResult = results[0];
            const pidMatch = firstResult.match(/\(PID:\s*(\d+)\)/i) || firstResult.match(/~~(\d+)$/);
            const cleanAddress = firstResult.replace(/\s*\(PID:\s*\d+\)/, "").replace(/~~\d+$/, "").trim();

            let parcelId = pidMatch ? pidMatch[1] : "";
            let ownerName = "Unknown";
            let assessedValue = "";
            let lotSize = "";
            let yearBuilt = "";
            let zoning = "";

            // Try to get parcel details page
            if (parcelId) {
              try {
                const parcelUrl = `https://gis.vgsi.com/${vgsSlug}/Parcel.aspx?pid=${parcelId}`;
                const parcelResp = await proxyFetch(parcelUrl);

                if (parcelResp.ok) {
                  const html = await parcelResp.text();

                  // Parse owner from the parcel page
                  const ownerMatch = html.match(/MainContent_lblOwner[^>]*>([^<]+)/);
                  if (ownerMatch) ownerName = ownerMatch[1].trim();

                  const assessMatch = html.match(/MainContent_lblTotalAssessment[^>]*>([^<]+)/);
                  if (assessMatch) assessedValue = assessMatch[1].trim();

                  const lotMatch = html.match(/MainContent_lblLotSize[^>]*>([^<]+)/);
                  if (lotMatch) lotSize = lotMatch[1].trim();

                  const yearMatch = html.match(/MainContent_lblYearBuilt[^>]*>([^<]+)/);
                  if (yearMatch) yearBuilt = yearMatch[1].trim();

                  const zoneMatch = html.match(/MainContent_lblZone[^>]*>([^<]+)/);
                  if (zoneMatch) zoning = zoneMatch[1].trim();

                  // Also try alternate patterns
                  if (ownerName === "Unknown") {
                    const ownerAlt = html.match(/Owner[:\s]*<\/[^>]+>\s*<[^>]+>([^<]+)/i);
                    if (ownerAlt) ownerName = ownerAlt[1].trim();
                  }
                }
              } catch (e) {
                console.error("Parcel detail error:", e);
              }
            }

            const isLLC = /\bLLC\b|\bL\.L\.C\b|\bLimited Liability\b/i.test(ownerName);

            propertyData = {
              address: cleanAddress || address,
              town,
              owner: ownerName,
              isLLC,
              parcelId,
              assessedValue,
              lotSize,
              yearBuilt,
              zoning,
              propertyCardUrl: parcelId
                ? `https://gis.vgsi.com/${vgsSlug}/Parcel.aspx?pid=${parcelId}`
                : `https://gis.vgsi.com/${vgsSlug}/Search.aspx`,
              llcDetails: undefined as {
                mailingAddress: string;
                dateFormed: string;
                businessType: string;
                principals: { name: string; address: string }[];
              } | undefined,
            };

            if (isLLC) {
              try {
                propertyData.llcDetails = await searchCTBusiness(ownerName);
              } catch (e) {
                console.error("LLC search error:", e);
              }
            }
          }
        }
      } catch (e) {
        console.error("VGS error:", e);
      }
    }

    // If no data found, provide helpful info
    if (!propertyData) {
      const searchUrl = vgsSlug
        ? `https://gis.vgsi.com/${vgsSlug}/Search.aspx`
        : null;

      return new Response(
        JSON.stringify({
          success: false,
          error: vgsSlug
            ? `Could not find "${address}" in ${town}, CT. Try searching directly at the assessor's database.`
            : `${town}, CT does not use Vision Government Solutions. This town's assessor database uses a different platform not yet supported.`,
          searchUrl,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, property: propertyData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Search failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function searchCTBusiness(businessName: string) {
  const cleanName = businessName
    .replace(/,?\s*(LLC|L\.L\.C\.?|Limited Liability Company)\s*$/i, "")
    .trim();

  console.log(`Searching CT business registry for: ${cleanName}`);

  try {
    const pageResp = await fetch(
      `https://service.ct.gov/business/s/onlinebusinesssearch?language=en_US`
    );

    if (pageResp.ok) {
      return {
        mailingAddress: "Search CT Secretary of State for details",
        dateFormed: "N/A",
        businessType: "Limited Liability Company",
        principals: [
          {
            name: "See CT Secretary of State records",
            address: `https://service.ct.gov/business/s/onlinebusinesssearch?language=en_US (search: ${cleanName})`,
          },
        ],
      };
    }
  } catch (e) {
    console.error("CT SOTS search error:", e);
  }

  return {
    mailingAddress: "Unable to retrieve",
    dateFormed: "N/A",
    businessType: "LLC",
    principals: [],
  };
}
