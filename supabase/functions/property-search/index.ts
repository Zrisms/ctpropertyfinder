const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Towns that use Vision Government Solutions (from vgsi.com/connecticut-online-database)
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { address, town, vgsData } = await req.json();

    if (!address || !town) {
      return new Response(
        JSON.stringify({ success: false, error: "Address and town are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Searching property: ${address}, ${town}, CT`);

    const townLower = town.toLowerCase();
    const vgsSlug = VGS_TOWNS[townLower];

    // If client sent VGS scraped data, process it
    if (vgsData) {
      console.log("Processing client-provided VGS data");
      const ownerName = vgsData.owner || "Unknown";
      const isLLC = /\bLLC\b|\bL\.L\.C\b|\bLimited Liability\b/i.test(ownerName);

      const propertyData = {
        address: vgsData.address || address,
        town,
        owner: ownerName,
        isLLC,
        parcelId: vgsData.parcelId || "",
        assessedValue: vgsData.assessedValue || "",
        lotSize: vgsData.lotSize || "",
        yearBuilt: vgsData.yearBuilt || "",
        zoning: vgsData.zoning || "",
        propertyCardUrl: vgsData.propertyCardUrl || "",
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

      return new Response(
        JSON.stringify({ success: true, property: propertyData }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return VGS info so client can do the scraping (bypasses Deno TLS issue)
    if (vgsSlug) {
      return new Response(
        JSON.stringify({
          success: false,
          needsClientFetch: true,
          vgsSlug,
          autocompleteUrl: `https://gis.vgsi.com/${vgsSlug}/Search.aspx/AutoComplete`,
          searchUrl: `https://gis.vgsi.com/${vgsSlug}/Search.aspx`,
          address,
          town,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Town not on VGS
    return new Response(
      JSON.stringify({
        success: false,
        error: `${town}, CT does not use Vision Government Solutions. This town's assessor database uses a different platform not yet supported.`,
      }),
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
