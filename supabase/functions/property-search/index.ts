const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Address abbreviation normalization
const ABBREVIATIONS: Record<string, string> = {
  street: 'st', road: 'rd', drive: 'dr', avenue: 'ave', lane: 'ln',
  court: 'ct', circle: 'cir', boulevard: 'blvd', place: 'pl',
  terrace: 'ter', way: 'way', trail: 'trl', highway: 'hwy',
  parkway: 'pkwy', turnpike: 'tpke', extension: 'ext',
};

function normalizeAddress(address: string): string {
  let normalized = address.trim();
  for (const [full, abbr] of Object.entries(ABBREVIATIONS)) {
    const re = new RegExp(`\\b${full}\\b`, 'gi');
    normalized = normalized.replace(re, abbr.toUpperCase());
  }
  return normalized;
}

// VGS towns mapping
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

// Non-VGS towns and their assessor URLs
const OTHER_TOWNS: Record<string, string> = {
  "avon": "https://avon.mapxpress.net/",
  "bloomfield": "https://bloomfieldct.mapxpress.net/",
  "east hartford": "https://gis.easthartfordct.gov/assessment/",
  "farmington": "https://farmington.mapxpress.net/",
  "hartford": "https://www.hartfordct.gov/assessor",
  "new canaan": "https://newcanaan.mapxpress.net/",
  "newington": "https://newington.mapxpress.net/",
  "rocky hill": "https://rockyhill.mapxpress.net/",
  "simsbury": "https://simsbury.mapxpress.net/",
  "west hartford": "https://gis.vgsi.com/westhartfordct/",
  "wethersfield": "https://wethersfield.mapxpress.net/",
  "windsor": "https://windsor.mapxpress.net/",
  "windsor locks": "https://windsorlocks.mapxpress.net/",
  "groton": "https://groton.mapxpress.net/",
  "norwalk": "https://norwalk.mapxpress.net/",
  "greenwich": "https://www.greenwichct.gov/349/Assessment",
  "darien": "https://darien.mapxpress.net/",
  "shelton": "https://shelton.mapxpress.net/",
  "cheshire": "https://cheshire.mapxpress.net/",
  "guilford": "https://guilford.mapxpress.net/",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { address, town } = await req.json();

    if (!address || !town) {
      return json({ success: false, error: "Address and town are required" }, 400);
    }

    const normalizedAddress = normalizeAddress(address);
    const townLower = town.toLowerCase().trim();
    console.log(`Searching: ${normalizedAddress}, ${town}, CT`);

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return json({ success: false, error: "Scraping service not configured" }, 500);
    }

    const vgsSlug = VGS_TOWNS[townLower];

    if (vgsSlug) {
      // Use Firecrawl to scrape VGS
      return await scrapeVGS(apiKey, vgsSlug, normalizedAddress, town);
    }

    const otherUrl = OTHER_TOWNS[townLower];
    if (otherUrl) {
      // Try Firecrawl on non-VGS town
      return await scrapeGenericAssessor(apiKey, otherUrl, normalizedAddress, town);
    }

    // Unknown town - provide search suggestions
    return json({
      success: false,
      error: `${town}, CT assessor database is not yet mapped. Try searching manually.`,
      searchUrl: `https://www.google.com/search?q=${encodeURIComponent(`${town} CT property assessor database`)}`,
    });
  } catch (error) {
    console.error("Error:", error);
    return json({ success: false, error: error instanceof Error ? error.message : "Search failed" }, 500);
  }
});

async function scrapeVGS(apiKey: string, slug: string, address: string, town: string) {
  const searchUrl = `https://gis.vgsi.com/${slug}/Search.aspx`;

  // Use Firecrawl to scrape the search results page
  try {
    const queryUrl = `${searchUrl}?Query=${encodeURIComponent(address)}`;
    console.log(`Scraping VGS search: ${queryUrl}`);
    const scrapeResult = await firecrawlScrape(apiKey, queryUrl);

    if (scrapeResult) {
      console.log(`VGS scrape result length: ${scrapeResult.length}`);
      console.log(`VGS scrape preview: ${scrapeResult.substring(0, 500)}`);

      // Check if the result has actual property data (not just the search form)
      if (scrapeResult.includes('Owner') || scrapeResult.includes('OWNER') || 
          scrapeResult.includes('Parcel') || scrapeResult.includes('Assessment')) {
        const extracted = extractVGSData(scrapeResult, address, town);
        if (extracted && extracted.owner && !extracted.owner.includes('Enter an')) {
          if (extracted.isLLC) {
            try {
              extracted.llcDetails = await searchCTBusiness(apiKey, extracted.owner);
            } catch (e) {
              console.error("LLC lookup error:", e);
            }
          }
          return json({ success: true, property: extracted });
        }
      }

      // If the search page has links to property detail pages, try to find one
      const pidMatch = scrapeResult.match(/Parcel\.aspx\?pid=(\d+)/i) || 
                       scrapeResult.match(/pid=(\d+)/i);
      if (pidMatch) {
        const detailUrl = `https://gis.vgsi.com/${slug}/Parcel.aspx?pid=${pidMatch[1]}`;
        console.log(`Found property detail URL: ${detailUrl}`);
        const detailResult = await firecrawlScrape(apiKey, detailUrl);
        if (detailResult) {
          const extracted = extractVGSData(detailResult, address, town);
          if (extracted && extracted.owner && !extracted.owner.includes('Enter an')) {
            if (extracted.isLLC) {
              try {
                extracted.llcDetails = await searchCTBusiness(apiKey, extracted.owner);
              } catch (e) {
                console.error("LLC lookup error:", e);
              }
            }
            return json({ success: true, property: extracted });
          }
        }
      }
    }
  } catch (e) {
    console.error("VGS scrape error:", e);
  }

  return json({
    success: false,
    error: "Could not find property on VGS. Try the assessor database directly.",
    searchUrl,
  });
}

async function scrapeGenericAssessor(apiKey: string, baseUrl: string, address: string, town: string) {
  try {
    // Try scraping the assessor site with a search query
    const searchUrl = baseUrl.includes('?') ? `${baseUrl}&q=${encodeURIComponent(address)}` : baseUrl;
    const scrapeResult = await firecrawlScrape(apiKey, searchUrl);

    if (scrapeResult) {
      const extracted = extractGenericData(scrapeResult, address, town);
      if (extracted) {
        if (extracted.isLLC) {
          try {
            extracted.llcDetails = await searchCTBusiness(apiKey, extracted.owner);
          } catch (e) {
            console.error("LLC lookup error:", e);
          }
        }
        return json({ success: true, property: extracted });
      }
    }
  } catch (e) {
    console.error("Generic scrape error:", e);
  }

  return json({
    success: false,
    error: `Could not automatically search ${town} assessor database.`,
    searchUrl: baseUrl,
  });
}

async function firecrawlScrape(apiKey: string, url: string): Promise<string | null> {
  console.log(`Firecrawl scraping: ${url}`);
  try {
    const resp = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 5000,
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.error(`Firecrawl ${resp.status}:`, err);
      return null;
    }

    const data = await resp.json();
    return data.data?.markdown || data.markdown || null;
  } catch (e) {
    console.error("Firecrawl fetch error:", e);
    return null;
  }
}

function extractVGSData(markdown: string, address: string, town: string) {
  // Parse VGS property page markdown
  const lines = markdown.split('\n').map(l => l.trim()).filter(Boolean);

  let owner = '';
  let parcelId = '';
  let assessedValue = '';
  let lotSize = '';
  let yearBuilt = '';
  let zoning = '';
  let propertyAddress = address;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = lines[i + 1] || '';

    if (/owner/i.test(line) && !owner) {
      // Owner is often on the next line or after a colon
      const colonVal = line.split(':')[1]?.trim();
      owner = colonVal || nextLine;
    }
    if (/parcel\s*(id|#|number)/i.test(line) && !parcelId) {
      const colonVal = line.split(':')[1]?.trim();
      parcelId = colonVal || nextLine;
    }
    if (/assessed\s*value|total\s*assess/i.test(line) && !assessedValue) {
      const match = line.match(/\$[\d,]+/) || nextLine.match(/\$[\d,]+/);
      if (match) assessedValue = match[0];
    }
    if (/lot\s*size|acreage|acres/i.test(line) && !lotSize) {
      const colonVal = line.split(':')[1]?.trim();
      lotSize = colonVal || nextLine;
    }
    if (/year\s*built/i.test(line) && !yearBuilt) {
      const match = line.match(/\b(1[89]\d{2}|20[0-2]\d)\b/) || nextLine.match(/\b(1[89]\d{2}|20[0-2]\d)\b/);
      if (match) yearBuilt = match[0];
    }
    if (/zoning|zone/i.test(line) && !zoning) {
      const colonVal = line.split(':')[1]?.trim();
      zoning = colonVal || nextLine;
    }
    if (/location|address|property\s*address/i.test(line) && line.includes(':')) {
      const val = line.split(':').slice(1).join(':').trim();
      if (val && val.length > 5) propertyAddress = val;
    }
  }

  // Clean up owner
  owner = owner.replace(/[*#\[\]]/g, '').trim();
  if (!owner || owner.length < 2) return null;

  const isLLC = /\bLLC\b|\bL\.L\.C\b|\bLimited Liability\b/i.test(owner);

  return {
    address: propertyAddress,
    town,
    owner,
    isLLC,
    parcelId: parcelId.replace(/[*#\[\]]/g, '').trim(),
    assessedValue,
    lotSize: lotSize.replace(/[*#\[\]]/g, '').trim(),
    yearBuilt,
    zoning: zoning.replace(/[*#\[\]]/g, '').trim(),
    propertyCardUrl: '',
    llcDetails: undefined as any,
  };
}

function extractGenericData(markdown: string, address: string, town: string) {
  // Generic extractor - try to find owner info from any assessor page
  return extractVGSData(markdown, address, town); // Same heuristics work
}

async function searchCTBusiness(apiKey: string, businessName: string) {
  const cleanName = businessName
    .replace(/,?\s*(LLC|L\.L\.C\.?|Limited Liability Company)\s*$/i, "")
    .trim();

  console.log(`Searching CT SOS for: ${cleanName}`);

  // Try scraping CT Secretary of State business search
  try {
    const searchUrl = `https://service.ct.gov/business/s/onlinebusinesssearch?language=en_US`;
    const scrapeResult = await firecrawlScrape(apiKey, searchUrl);

    // The CT SOS site is a Salesforce app - very JS heavy
    // Firecrawl should handle JS rendering
    if (scrapeResult && scrapeResult.length > 100) {
      console.log("Got CT SOS page content, length:", scrapeResult.length);
      // Try to extract business info from the scraped content
      // Since we can't interact with the search form via scrape, provide the direct link
    }
  } catch (e) {
    console.error("CT SOS scrape error:", e);
  }

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

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
