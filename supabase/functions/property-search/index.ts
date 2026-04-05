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
  const baseUrl = `https://gis.vgsi.com/${slug}`;

  // Strategy 1: Use Firecrawl search to find the property page via Google
  try {
    console.log(`Searching for property via Firecrawl search`);
    const searchResp = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `"${address}" "${town}" CT property vgsi.com`,
        limit: 5,
      }),
    });

    if (searchResp.ok) {
      const searchData = await searchResp.json();
      const results = searchData.data || [];
      console.log(`Search returned ${results.length} results`);

      for (const result of results) {
        const url = result.url || '';
        if (url.includes('vgsi.com') && url.includes('Parcel.aspx')) {
          console.log(`Found VGS parcel page: ${url}`);
          return await scrapePropertyDetail(apiKey, url, address, town);
        }
      }
    }
  } catch (e) {
    console.error("Search error:", e);
  }

  // Strategy 2: Use Firecrawl scrape with actions on VGS search
  // Use generic selectors that work with VGS ASP.NET pages
  try {
    console.log(`Trying VGS with actions`);
    const resp = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: searchUrl,
        formats: ['markdown', 'links', 'html'],
        waitFor: 2000,
        actions: [
          { type: 'wait', milliseconds: 1000 },
          // Use CSS selector for the search input
          { type: 'click', selector: 'input[id*="TextBox_Search"], input[id*="txtSearch"], input[type="text"]' },
          { type: 'write', text: address },
          { type: 'wait', milliseconds: 3000 },
          // Try clicking autocomplete suggestion
          { type: 'click', selector: '.ui-autocomplete li a, .ui-menu-item a, ul.ui-autocomplete li' },
          { type: 'wait', milliseconds: 5000 },
        ],
      }),
    });

    if (resp.ok) {
      const data = await resp.json();
      const markdown = data.data?.markdown || data.markdown || '';
      const html = data.data?.html || data.html || '';
      const finalUrl = data.data?.metadata?.url || data.data?.metadata?.sourceURL || '';
      console.log(`Actions result: len=${markdown.length}, url=${finalUrl}`);

      // If we navigated to a Parcel page
      if (finalUrl.includes('Parcel.aspx') || markdown.includes('Parcel ID')) {
        const extracted = extractVGSData(markdown, address, town);
        if (extracted && extracted.owner && !extracted.owner.includes('Enter an')) {
          extracted.propertyCardUrl = finalUrl;
          if (extracted.isLLC) {
            try { extracted.llcDetails = await searchCTBusiness(apiKey, extracted.owner); } catch (e) { console.error("LLC:", e); }
          }
          return json({ success: true, property: extracted });
        }
      }

      // Check for Parcel links in HTML or markdown
      const pidMatch = (html + markdown).match(/Parcel\.aspx\?[Pp]id=(\d+)/);
      if (pidMatch) {
        const detailUrl = `${baseUrl}/Parcel.aspx?Pid=${pidMatch[1]}`;
        return await scrapePropertyDetail(apiKey, detailUrl, address, town);
      }
    } else {
      const errText = await resp.text();
      console.error(`Actions error: ${errText.substring(0, 200)}`);
    }
  } catch (e) {
    console.error("Actions error:", e);
  }

  return json({
    success: false,
    error: `Could not find property in ${town}. Try the assessor database directly.`,
    searchUrl,
  });
}

async function scrapePropertyDetail(apiKey: string, url: string, address: string, town: string) {
  console.log(`Scraping property detail: ${url}`);
  const detailMd = await firecrawlScrape(apiKey, url);
  if (detailMd) {
    console.log(`Detail length: ${detailMd.length}`);
    const extracted = extractVGSData(detailMd, address, town);
    if (extracted && extracted.owner && !extracted.owner.includes('Enter an')) {
      extracted.propertyCardUrl = url;
      if (extracted.isLLC) {
        try { extracted.llcDetails = await searchCTBusiness(apiKey, extracted.owner); } catch (e) { console.error("LLC error:", e); }
      }
      return json({ success: true, property: extracted });
    }
  }

  return json({
    success: false,
    error: "Could not extract property data. Try the assessor database directly.",
    searchUrl: url,
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
  const text = markdown;

  // Helper: grab from table row "| Label | Value |" format
  const tableGrab = (label: string): string => {
    // Match "| Label | Value |" or "| Label: | Value |"
    const re = new RegExp(`\\|\\s*${label}:?\\s*\\|\\s*([^|]*?)\\s*\\|`, 'i');
    const m = text.match(re);
    return m?.[1]?.trim().replace(/<br\/?>/gi, ', ') || '';
  };

  // Helper: grab inline concatenated "LabelValue" format
  const inlineGrab = (label: string, stopWords: string[] = []): string => {
    const stops = stopWords.length ? stopWords.join('|') : '\\n';
    const re = new RegExp(`${label}\\s*([^\\n]+?)(?:${stops}|$)`, 'i');
    const m = text.match(re);
    return m?.[1]?.trim() || '';
  };

  // Helper: grab dollar value from inline format "Label$Value" or "Label$Value"
  const dollarGrab = (label: string): string => {
    const re = new RegExp(`${label}\\s*\\$([\\d,]+)`, 'i');
    const m = text.match(re);
    return m?.[1]?.trim() || '';
  };

  let owner = '';
  let propertyAddress = address;

  // Owner - table format first "| Owner | NAME |"
  owner = tableGrab('Owner');
  // Fallback: inline "OwnerNAME" 
  if (!owner) {
    const inlineOwner = text.match(/Owner([A-Z][A-Z\s\+\.\,\-\'&]+?)(?:Total|Sale|Co-Owner|Appraisal)/m);
    if (inlineOwner) owner = inlineOwner[1].trim();
  }

  // Co-Owner
  const coOwner = tableGrab('Co-Owner');

  // Location - inline "Location53 ADMIRAL ST"
  const locMatch = text.match(/Location(\d+[A-Z0-9\s]+?)(?:\n|Mblu)/i);
  if (locMatch) propertyAddress = locMatch[1].trim();

  // MBLU - inline "Mblu282/ 0347/ 02400/ /"
  const mbluMatch = text.match(/Mblu([\d\/\s]+?)(?:Acct|Owner|\n)/i);
  const mblu = mbluMatch?.[1]?.trim().replace(/\s+/g, '') || '';

  // Account number - inline "Acct#282 0347 02400"
  const acctMatch = text.match(/Acct#?([\d\s]+)/i);
  const accountNumber = acctMatch?.[1]?.trim() || '';

  // PID - inline "PID16971"
  const pidMatch = text.match(/PID(\d+)/i);
  const parcelId = pidMatch?.[1] || '';

  // Building Count - inline "Building Count1"
  const bldgCountMatch = text.match(/Building\s*Count\s*(\d+)/i);
  const buildingCount = bldgCountMatch?.[1] || '';

  // Owner mailing address from table "| Address | 53 ADMIRAL ST ... |"
  const ownerAddress = tableGrab('Address');

  // === VALUES ===
  // Inline: "Total Market Value$168,000"
  const totalMarketValue = dollarGrab('Total\\s*Market\\s*Value');
  // Inline: "Appraisal$240,000"  
  const totalAppraisal = dollarGrab('Appraisal');

  // From Current Value table: "| 2025 | $192,500 | $47,500 | $240,000 |"
  // Get the first data row from "Current Value" section
  let improvementsValue = '', landValueCV = '', totalValueCV = '';
  const cvMatch = text.match(/Current Value[\s\S]*?\|\s*\d{4}\s*\|\s*\$([\d,]+)\s*\|\s*\$([\d,]+)\s*\|\s*\$([\d,]+)\s*\|/i);
  if (cvMatch) {
    improvementsValue = cvMatch[1];
    landValueCV = cvMatch[2];
    totalValueCV = cvMatch[3];
  }

  // Assessment table values
  let assessImprovements = '', assessLand = '', assessTotal = '';
  const assessSection = text.match(/Assessment[\s\S]*?\|\s*\d{4}\s*\|\s*\$([\d,]+)\s*\|\s*\$([\d,]+)\s*\|\s*\$([\d,]+)\s*\|/i);
  if (assessSection) {
    assessImprovements = assessSection[1];
    assessLand = assessSection[2];
    assessTotal = assessSection[3];
  }

  // === SALE INFO === from table rows
  const salePrice = tableGrab('Sale Price');
  const saleDate = tableGrab('Sale Date');
  const certificate = tableGrab('Certificate');
  const bookPage = tableGrab('Book & Page') || tableGrab('Book \\& Page');
  const instrument = tableGrab('Instrument');

  // Ownership History - extract all rows
  const ownershipHistory: { owner: string; salePrice: string; bookPage: string; saleDate: string }[] = [];
  const historySection = text.match(/Ownership History[\s\S]*?\| Owner \| Sale Price[\s\S]*?\n([\s\S]*?)(?:\n\n|Ownership History|Building Information)/i);
  if (historySection) {
    const rows = historySection[1].split('\n').filter(r => r.includes('|') && !r.includes('---'));
    for (const row of rows) {
      const cols = row.split('|').map(c => c.trim()).filter(Boolean);
      if (cols.length >= 5) {
        ownershipHistory.push({
          owner: cols[0],
          salePrice: cols[1],
          bookPage: cols[2] || cols[3] || '',
          saleDate: cols[cols.length - 1],
        });
      }
    }
  }

  // === LOT INFO ===
  const lotSize = tableGrab('Size \\(Acres\\)');
  const frontage = tableGrab('Frontage');
  const depth = tableGrab('Depth');
  const useCode = tableGrab('Use Code');
  // Use Description comes right after Use Code in Land Use section
  const useDescMatch = text.match(/Use Code\s*\|\s*\d+[\s\S]*?\|\s*Description\s*\|\s*([^|]*?)\s*\|/i);
  const useDescription = useDescMatch?.[1]?.trim() || '';
  const zoning = tableGrab('Zone');
  const neighborhood = tableGrab('Neighborhood') || tableGrab('NBHD Code');
  const totalMarketLand = tableGrab('Total Market Land');
  const landAppraisedValue = tableGrab('Appraised Value');

  // === BUILDING INFO ===
  const yearBuilt = tableGrab('Year Built');
  const livingArea = tableGrab('Living Area');
  const replacementCost = tableGrab('Replacement Cost');
  const buildingPercentGood = tableGrab('Building Percent Good');
  const replacementCostLessDepr = tableGrab('Replacement Cost Less Depreciation');

  const buildingStyle = tableGrab('Style');
  const model = tableGrab('Model');
  const grade = tableGrab('Grade');
  const stories = tableGrab('Stories');
  const occupancy = tableGrab('Occupancy');
  const exteriorWall1 = tableGrab('Exterior Wall 1');
  const exteriorWall2 = tableGrab('Exterior Wall 2');
  const roofStructure = tableGrab('Roof Structure');
  const roofCover = tableGrab('Roof Cover');
  const interiorWall1 = tableGrab('Interior Wall 1');
  const interiorWall2 = tableGrab('Interior Wall 2');
  const interiorFlr1 = tableGrab('Interior Flr 1');
  const interiorFlr2 = tableGrab('Interior Flr 2');
  const heatFuel = tableGrab('Heat Fuel');
  const heatType = tableGrab('Heat Type');
  const acType = tableGrab('AC Type');
  const totalBedrooms = tableGrab('Total Bedrooms').replace(/\s*Bedrooms?/i, '');
  const totalBathrooms = tableGrab('Total Bthrms');
  const totalHalfBaths = tableGrab('Total Half Baths');
  const totalXtraFixtures = tableGrab('Total Xtra Fixtrs');
  const totalRooms = tableGrab('Total Rooms').replace(/\s*Rooms?/i, '');
  const bathStyle = tableGrab('Bath Style');
  const kitchenStyle = tableGrab('Kitchen Style');
  const interiorCondition = tableGrab('Interior Condition');
  const finBsmntArea = tableGrab('Fin Bsmnt Area');
  const finBsmntQual = tableGrab('Fin Bsmnt Qual');
  const nbhdCode = tableGrab('NBHD Code');

  // Building sub-areas
  const subAreas: { code: string; description: string; grossArea: string; livingArea: string }[] = [];
  const subAreaSection = text.match(/\| Code \| Description \| Gross[\s\S]*?\n([\s\S]*?)(?:\n\n|Building Sub-Areas)/i);
  if (subAreaSection) {
    const rows = subAreaSection[1].split('\n').filter(r => r.includes('|') && !r.includes('---'));
    for (const row of rows) {
      const cols = row.split('|').map(c => c.trim()).filter(Boolean);
      if (cols.length >= 4 && cols[0].match(/^[A-Z]/)) {
        subAreas.push({ code: cols[0], description: cols[1], grossArea: cols[2], livingArea: cols[3] });
      }
    }
  }

  // Building photo
  const photoMatch = text.match(/Building Photo\s*!\[.*?\]\((https?:\/\/[^\)]+)\)/i);
  const buildingPhoto = photoMatch?.[1] || '';

  // Valuation history
  const valuationHistory: { year: string; improvements: string; land: string; total: string }[] = [];
  const valSection = text.match(/Valuation History[\s\S]*?Current Value[\s\S]*?\n([\s\S]*?)(?:\n\nAppraisal|\n\n\(c\))/i);
  if (valSection) {
    const rows = valSection[1].split('\n').filter(r => r.includes('|') && !r.includes('---') && r.match(/\d{4}/));
    for (const row of rows) {
      const cols = row.split('|').map(c => c.trim()).filter(Boolean);
      if (cols.length >= 4) {
        valuationHistory.push({ year: cols[0], improvements: cols[1], land: cols[2], total: cols[3] });
      }
    }
  }

  // Clean owner
  owner = owner.replace(/[*#\[\]]/g, '').replace(/<br\/?>/gi, ' ').trim();
  if (!owner || owner.length < 2) return null;

  const isLLC = /\bLLC\b|\bL\.L\.C\b|\bLimited Liability\b/i.test(owner);
  const fmt$ = (v: string) => v ? `$${v}` : '';

  return {
    address: propertyAddress,
    town,
    owner,
    coOwner,
    ownerAddress,
    isLLC,
    parcelId,
    mblu,
    accountNumber,
    buildingCount,
    bookPage,
    certificate,
    instrument,
    // Values
    assessedValue: fmt$(assessTotal) || fmt$(totalMarketValue),
    totalAppraisal: fmt$(totalValueCV) || fmt$(totalAppraisal),
    totalMarketValue: fmt$(totalMarketValue),
    improvementsValue: fmt$(improvementsValue),
    landValue: fmt$(landValueCV),
    assessImprovements: fmt$(assessImprovements),
    assessLand: fmt$(assessLand),
    assessTotal: fmt$(assessTotal),
    // Sale
    salePrice,
    saleDate,
    // Lot
    lotSize: lotSize ? `${lotSize} acres` : '',
    frontage: frontage ? `${frontage} ft` : '',
    depth: depth ? `${depth} ft` : '',
    useCode,
    useDescription,
    zoning,
    neighborhood: nbhdCode || neighborhood,
    totalMarketLand,
    landAppraisedValue,
    // Building
    yearBuilt,
    buildingStyle,
    model,
    stories,
    livingArea: livingArea ? `${livingArea} sq ft` : '',
    replacementCost: replacementCost ? `$${replacementCost.replace(/[$]/g, '')}` : '',
    buildingPercentGood: buildingPercentGood ? `${buildingPercentGood}%` : '',
    occupancy,
    totalRooms,
    bedrooms: totalBedrooms,
    totalBaths: totalBathrooms,
    halfBaths: totalHalfBaths,
    totalXtraFixtures,
    bathStyle,
    kitchenStyle,
    interiorCondition,
    finBsmntArea,
    finBsmntQual,
    grade,
    // Construction
    exteriorWall: [exteriorWall1, exteriorWall2].filter(Boolean).join(', '),
    roofStructure,
    roofCover,
    interiorWall: [interiorWall1, interiorWall2].filter(Boolean).join(', '),
    flooring: [interiorFlr1, interiorFlr2].filter(Boolean).join(', '),
    // Systems
    heating: heatType,
    heatingFuel: heatFuel,
    cooling: acType,
    // Photo
    buildingPhoto,
    // History
    ownershipHistory,
    subAreas,
    valuationHistory,
    propertyCardUrl: '',
    llcDetails: undefined as any,
  };
}


function extractGenericData(markdown: string, address: string, town: string) {
  // Generic extractor - try to find owner info from any assessor page
  return extractVGSData(markdown, address, town); // Same heuristics work
}

async function searchCTBusiness(_apiKey: string, businessName: string) {
  // Use the official CT Open Data Portal APIs (no CAPTCHA, real data)
  const CT_BUSINESS_API = 'https://data.ct.gov/resource/n7gp-d28j.json';
  const CT_AGENTS_API = 'https://data.ct.gov/resource/qh2m-n44y.json';

  const cleanName = businessName.replace(/[^a-zA-Z0-9\s&]/g, '').trim();
  console.log(`Searching CT Open Data for: ${cleanName}`);

  try {
    // Step 1: Search Business Master
    const searchQuery = encodeURIComponent(`upper(name) like '%${cleanName.toUpperCase()}%'`);
    const bizUrl = `${CT_BUSINESS_API}?$where=${searchQuery}&$limit=5`;
    console.log(`Business API: ${bizUrl}`);

    const bizResp = await fetch(bizUrl);
    if (!bizResp.ok) {
      console.error(`Business API error: ${bizResp.status}`);
      return makeFallbackLLC(cleanName);
    }

    const businesses = await bizResp.json();
    if (!Array.isArray(businesses) || businesses.length === 0) {
      // Try without LLC suffix
      const shortName = cleanName.replace(/\s*(LLC|L\.?L\.?C\.?|Inc|Corp)\s*$/i, '').trim();
      const retryQuery = encodeURIComponent(`upper(name) like '%${shortName.toUpperCase()}%'`);
      const retryResp = await fetch(`${CT_BUSINESS_API}?$where=${retryQuery}&$limit=5`);
      if (retryResp.ok) {
        const retryData = await retryResp.json();
        if (!Array.isArray(retryData) || retryData.length === 0) {
          console.log('No business found in CT Open Data');
          return makeFallbackLLC(cleanName);
        }
        return await buildLLCDetails(retryData, cleanName, CT_AGENTS_API);
      }
      return makeFallbackLLC(cleanName);
    }

    return await buildLLCDetails(businesses, cleanName, CT_AGENTS_API);
  } catch (e) {
    console.error('CT Open Data error:', e);
    return makeFallbackLLC(cleanName);
  }
}

async function buildLLCDetails(businesses: Record<string, unknown>[], searchName: string, agentsApi: string) {
  // Pick best match
  const biz = businesses.find(b =>
    (b.name as string || '').toUpperCase().includes(searchName.toUpperCase())
  ) || businesses[0];

  const bizName = (biz.name as string) || searchName;
  const bizKey = biz.id as string;
  const status = (biz.status as string) || 'N/A';
  const subStatus = (biz.sub_status as string) || '';
  const businessType = (biz.business_type as string) || 'LLC';
  const mailingAddress = (biz.mailing_address as string) || 
    [biz.billingstreet, biz.billingcity, biz.billingstate, biz.billingpostalcode]
      .filter(Boolean).join(', ') || 'N/A';
  const dateRegistration = biz.date_registration as string || '';
  const dateFormed = dateRegistration ? new Date(dateRegistration).toLocaleDateString('en-US') : 'N/A';
  const accountNumber = (biz.accountnumber as string) || '';
  const citizenship = (biz.citizenship as string) || '';
  const formationPlace = (biz.formation_place as string) || '';
  const email = (biz.business_email_address as string) || '';
  const naicsCode = (biz.naics_code as string) || '';

  // Step 2: Fetch agents/principals
  const principals: { name: string; title: string; address: string; residentialAddress: string }[] = [];
  
  if (bizKey) {
    try {
      const agentResp = await fetch(`${agentsApi}?business_key=${encodeURIComponent(bizKey)}`);
      if (agentResp.ok) {
        const agents = await agentResp.json();
        if (Array.isArray(agents)) {
          for (const agent of agents) {
            const name = (agent.name__c as string) || 
              [agent.firstname, agent.lastname].filter(Boolean).join(' ') || 'Unknown';
            const title = (agent.type as string) || 'Agent';
            const bizAddr = (agent.business_address as string) || 
              [agent.business_street_address_1, agent.business_city, agent.business_state, agent.business_zip_code]
                .filter(Boolean).join(', ') || '';
            const resAddr = [agent.residence_street_address_1, agent.residence_city, agent.residence_state, agent.residence_zip_code]
              .filter(Boolean).join(', ') || bizAddr;

            principals.push({ name, title, address: bizAddr, residentialAddress: resAddr });
          }
        }
      }
    } catch (e) {
      console.error('Agent lookup error:', e);
    }
  }

  const fullStatus = subStatus ? `${status} (${subStatus})` : status;

  // Build raw details text
  const rawLines = [
    `Business Name: ${bizName}`,
    `Account Number: ${accountNumber}`,
    `Status: ${fullStatus}`,
    `Business Type: ${businessType}`,
    `Date Registered: ${dateFormed}`,
    `Citizenship: ${citizenship}`,
    `Formation Place: ${formationPlace}`,
    `Mailing Address: ${mailingAddress}`,
    email ? `Business Email: ${email}` : '',
    naicsCode ? `NAICS Code: ${naicsCode}` : '',
    '',
    '--- Principals/Agents ---',
    ...principals.map(p => `${p.name} (${p.title})\n  Business: ${p.address}\n  Residence: ${p.residentialAddress}`),
    '',
    `Source: CT Open Data Portal (data.ct.gov)`,
    `Retrieved: ${new Date().toLocaleDateString('en-US')}`,
  ].filter(l => l !== undefined);

  return {
    mailingAddress,
    dateFormed,
    businessType,
    status: fullStatus,
    accountNumber,
    citizenship,
    formationPlace,
    email,
    naicsCode,
    principals: principals.length > 0 
      ? principals.map(p => ({ name: `${p.name} (${p.title})`, address: p.residentialAddress || p.address }))
      : [{ name: 'No agents found in public records', address: '' }],
    rawMarkdown: rawLines.join('\n'),
  };
}

function makeFallbackLLC(cleanName: string) {
  return {
    mailingAddress: 'Could not retrieve automatically',
    dateFormed: 'N/A',
    businessType: 'Limited Liability Company',
    status: 'N/A',
    principals: [
      {
        name: 'See CT Secretary of State records',
        address: `https://service.ct.gov/business/s/onlinebusinesssearch (search: ${cleanName})`,
      },
    ],
    rawMarkdown: '',
  };
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
