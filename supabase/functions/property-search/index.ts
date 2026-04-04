import { corsHeaders } from "@supabase/supabase-js/cors";

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

    // Try Vision Government Solutions (most common CT assessor platform)
    const townSlug = town.toLowerCase().replace(/\s+/g, "");
    const visionUrl = `https://gis.vgsi.com/${townSlug}ct/Search.aspx`;

    // Attempt to search via Vision GIS
    let propertyData = null;

    try {
      // Search Vision GIS for the property
      const searchUrl = `https://gis.vgsi.com/${townSlug}ct/Search.aspx`;
      const searchResp = await fetch(searchUrl);

      if (searchResp.ok) {
        // Try the parcel search API
        const apiUrl = `https://gis.vgsi.com/${townSlug}ct/api/Parcel/Search?query=${encodeURIComponent(address)}&category=Address`;
        const apiResp = await fetch(apiUrl, {
          headers: { Accept: "application/json" },
        });

        if (apiResp.ok) {
          const results = await apiResp.json();

          if (results && results.length > 0) {
            const parcel = results[0];
            const parcelId = parcel.ParcelId || parcel.Pid || parcel.Id;

            // Get detailed parcel info
            let details: Record<string, unknown> = {};
            if (parcelId) {
              const detailUrl = `https://gis.vgsi.com/${townSlug}ct/api/Parcel/${parcelId}`;
              const detailResp = await fetch(detailUrl, {
                headers: { Accept: "application/json" },
              });
              if (detailResp.ok) {
                details = await detailResp.json();
              }
            }

            const ownerName = (details.Owner as string) || parcel.Owner || "Unknown";
            const isLLC =
              /\bLLC\b|\bL\.L\.C\b|\bLimited Liability\b/i.test(ownerName);

            propertyData = {
              address: (details.Location as string) || parcel.Description || address,
              town,
              owner: ownerName,
              isLLC,
              parcelId: (details.Pid as string) || parcelId?.toString() || "",
              assessedValue: (details.TotalAssessment as string) 
                ? `$${Number(details.TotalAssessment).toLocaleString()}`
                : "",
              lotSize: (details.LotSize as string) || "",
              yearBuilt: (details.YearBuilt as string)?.toString() || "",
              zoning: (details.Zone as string) || "",
              propertyCardUrl: parcelId
                ? `https://gis.vgsi.com/${townSlug}ct/Parcel.aspx?pid=${parcelId}`
                : "",
              llcDetails: undefined as {
                mailingAddress: string;
                dateFormed: string;
                businessType: string;
                principals: { name: string; address: string }[];
              } | undefined,
            };

            // If LLC, search CT business registry
            if (isLLC) {
              try {
                propertyData.llcDetails = await searchCTBusiness(ownerName);
              } catch (e) {
                console.error("LLC search error:", e);
              }
            }
          }
        }
      }
    } catch (e) {
      console.error("Vision GIS error:", e);
    }

    if (!propertyData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Could not find property "${address}" in ${town}, CT. The town's assessor database may use a different platform.`,
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
  // Clean up the name for searching
  const cleanName = businessName
    .replace(/,?\s*(LLC|L\.L\.C\.?|Limited Liability Company)\s*$/i, "")
    .trim();

  console.log(`Searching CT business registry for: ${cleanName}`);

  // The CT business search is a Salesforce Lightning app - we'll try their API
  const searchUrl = `https://service.ct.gov/business/s/sfsites/aura?r=1&aura.ApexAction.execute=1`;

  try {
    // Attempt direct search via the CT SOTS website
    const pageResp = await fetch(
      `https://service.ct.gov/business/s/onlinebusinesssearch?language=en_US`
    );
    
    if (pageResp.ok) {
      // For now, return placeholder - full Salesforce scraping requires more complex auth
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
