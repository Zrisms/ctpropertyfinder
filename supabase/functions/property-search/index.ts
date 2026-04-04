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
  // VGS markdown format: "OwnerNAME" or "| Owner | NAME |" or "Owner: NAME"
  const text = markdown;

  let owner = '';
  let parcelId = '';
  let assessedValue = '';
  let lotSize = '';
  let yearBuilt = '';
  let zoning = '';
  let propertyAddress = address;

  // Try table format first: | Owner | VALUE |
  const tableOwner = text.match(/\|\s*Owner\s*\|\s*([^|]+)\|/i);
  if (tableOwner) owner = tableOwner[1].trim();

  // Try inline format: OwnerVALUE (VGS concatenates label+value)
  if (!owner) {
    const inlineOwner = text.match(/Owner([A-Z][A-Z\s\+\.\,\-\']+?)(?:Total|Sale|Co-Owner|$)/m);
    if (inlineOwner) owner = inlineOwner[1].trim();
  }

  // Location/Address
  const locMatch = text.match(/Location([A-Z0-9][A-Z0-9\s]+?)(?:\n|Mblu)/i);
  if (locMatch) propertyAddress = locMatch[1].trim();

  // Parcel ID
  const parcelMatch = text.match(/Parcel\s*ID\s*([0-9][0-9\s]+)/i);
  if (parcelMatch) parcelId = parcelMatch[1].trim();

  // Assessed/Market Value
  const marketMatch = text.match(/Total\s*Market\s*Value\s*\$?([\d,]+)/i);
  if (marketMatch) assessedValue = `$${marketMatch[1]}`;
  if (!assessedValue) {
    const assessMatch = text.match(/Appraisal\s*\$?([\d,]+)/i);
    if (assessMatch) assessedValue = `$${assessMatch[1]}`;
  }

  // Year Built - VGS format: "Year Built: | 1927" or "Year Built:1927"
  const yearMatch = text.match(/Year\s*Built:?\s*\|?\s*(1[89]\d{2}|20[0-2]\d)/i);
  if (yearMatch) yearBuilt = yearMatch[1];

  // Lot Size - VGS format: "Size (Acres) | 0.3"
  const lotMatch = text.match(/Size\s*\(Acres\)\s*\|?\s*([\d\.]+)/i) || text.match(/(\d+\.?\d*)\s*acres/i);
  if (lotMatch) lotSize = `${lotMatch[1]} acres`;

  // Zoning
  const zoneMatch = text.match(/Zone\s*\|\s*([A-Z0-9\-]+)/i) || text.match(/Zone\s+([A-Z0-9\-]+)/i);
  if (zoneMatch) zoning = zoneMatch[1].trim();

  // Clean up
  owner = owner.replace(/[*#\[\]]/g, '').replace(/<br\/?>/gi, ' ').trim();
  if (!owner || owner.length < 2) return null;

  const isLLC = /\bLLC\b|\bL\.L\.C\b|\bLimited Liability\b/i.test(owner);

  return {
    address: propertyAddress,
    town,
    owner,
    isLLC,
    parcelId,
    assessedValue,
    lotSize,
    yearBuilt,
    zoning,
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

  const searchUrl = 'https://service.ct.gov/business/s/onlinebusinesssearch?language=en_US';

  // Step 1: Search for the business using Firecrawl actions
  try {
    console.log('Step 1: Performing business search on CT SOS');
    const searchResp = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: searchUrl,
        formats: ['markdown', 'links', 'html'],
        waitFor: 5000,
        actions: [
          { type: 'wait', milliseconds: 3000 },
          { type: 'click', selector: 'input[name*="businessNameSearch"], input[placeholder*="Business Name"], input[type="text"]' },
          { type: 'write', text: cleanName },
          { type: 'wait', milliseconds: 1000 },
          { type: 'click', selector: 'button[title="Search"], button.slds-button:not([title="Clear"]), input[type="submit"], button[type="submit"]' },
          { type: 'wait', milliseconds: 8000 },
        ],
      }),
    });

    if (!searchResp.ok) {
      const errText = await searchResp.text();
      console.error('CT SOS search failed:', errText.substring(0, 300));
      return makeFallbackLLC(cleanName);
    }

    const searchData = await searchResp.json();
    const markdown = searchData.data?.markdown || '';
    const html = searchData.data?.html || '';
    const links = searchData.data?.links || [];
    console.log(`Search results: markdown=${markdown.length}, links=${links.length}`);

    // Find the best matching business link
    let detailUrl = '';
    
    // Check links for business detail pages
    for (const link of links) {
      const href = typeof link === 'string' ? link : link?.url || link?.href || '';
      if (href.includes('/business/s/') && href.includes('Id=')) {
        detailUrl = href;
        break;
      }
    }

    // Also check HTML for detail links
    if (!detailUrl) {
      const linkMatch = (html + markdown).match(/href="([^"]*\/business\/s\/[^"]*Id=[^"]*)"/i);
      if (linkMatch) {
        detailUrl = linkMatch[1];
        if (detailUrl.startsWith('/')) detailUrl = `https://service.ct.gov${detailUrl}`;
      }
    }

    // Try to extract data directly from search results if detail URL not found
    const businessDetails = extractBusinessFromMarkdown(markdown, cleanName);
    
    if (detailUrl) {
      console.log(`Found detail URL: ${detailUrl}`);
      // Step 2: Scrape the detail page and click "Print Business Details"
      return await scrapeCTBusinessDetail(apiKey, detailUrl, cleanName);
    }

    if (businessDetails && businessDetails.mailingAddress !== 'N/A') {
      return businessDetails;
    }

    // Step 2 alternative: Try clicking on the first result row using actions
    console.log('Trying to click first result row');
    const clickResp = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: searchUrl,
        formats: ['markdown', 'links', 'html'],
        waitFor: 5000,
        actions: [
          { type: 'wait', milliseconds: 3000 },
          { type: 'click', selector: 'input[name*="businessNameSearch"], input[placeholder*="Business Name"], input[type="text"]' },
          { type: 'write', text: cleanName },
          { type: 'wait', milliseconds: 1000 },
          { type: 'click', selector: 'button[title="Search"], button.slds-button:not([title="Clear"]), input[type="submit"]' },
          { type: 'wait', milliseconds: 8000 },
          // Click first result link
          { type: 'click', selector: 'a[data-aura-rendered-by], table a, .slds-table a, a[href*="Id="]' },
          { type: 'wait', milliseconds: 5000 },
          // Click Print Business Details button
          { type: 'click', selector: 'button:has-text("Print"), a:has-text("Print Business Details"), button[title*="Print"]' },
          { type: 'wait', milliseconds: 5000 },
        ],
      }),
    });

    if (clickResp.ok) {
      const clickData = await clickResp.json();
      const detailMd = clickData.data?.markdown || '';
      console.log(`Detail page markdown length: ${detailMd.length}`);
      
      const details = extractBusinessFromMarkdown(detailMd, cleanName);
      if (details && details.mailingAddress !== 'N/A') {
        return details;
      }
    }

  } catch (e) {
    console.error('CT SOS search error:', e);
  }

  return makeFallbackLLC(cleanName);
}

async function scrapeCTBusinessDetail(apiKey: string, detailUrl: string, businessName: string) {
  console.log(`Scraping CT business detail: ${detailUrl}`);
  
  try {
    // Scrape the detail page and try to click Print Business Details
    const resp = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: detailUrl,
        formats: ['markdown', 'html'],
        waitFor: 5000,
        actions: [
          { type: 'wait', milliseconds: 3000 },
          // Try clicking Print Business Details
          { type: 'click', selector: 'button:has-text("Print"), a:has-text("Print"), button[title*="Print"]' },
          { type: 'wait', milliseconds: 5000 },
        ],
      }),
    });

    if (resp.ok) {
      const data = await resp.json();
      const markdown = data.data?.markdown || '';
      console.log(`Business detail markdown length: ${markdown.length}`);
      
      const details = extractBusinessFromMarkdown(markdown, businessName);
      if (details) {
        details.rawMarkdown = markdown;
        return details;
      }
    }
  } catch (e) {
    console.error('Detail scrape error:', e);
  }

  // Fallback: just scrape without actions
  try {
    const markdown = await firecrawlScrape(apiKey, detailUrl);
    if (markdown) {
      const details = extractBusinessFromMarkdown(markdown, businessName);
      if (details) {
        details.rawMarkdown = markdown;
        return details;
      }
    }
  } catch (e) {
    console.error('Detail fallback error:', e);
  }

  return makeFallbackLLC(businessName);
}

function extractBusinessFromMarkdown(markdown: string, businessName: string) {
  const text = markdown;
  
  let status = 'N/A';
  let dateFormed = 'N/A';
  let businessType = 'Limited Liability Company';
  let mailingAddress = 'N/A';
  const principals: { name: string; address: string }[] = [];

  // Status
  const statusMatch = text.match(/Status[:\s|]*([A-Za-z\s]+?)(?:\n|\||$)/i);
  if (statusMatch) status = statusMatch[1].trim();

  // Date Formed / Formation Date / Date of Formation
  const dateMatch = text.match(/(?:Date\s*(?:of\s*)?Form(?:ed|ation)|Formation\s*Date)[:\s|]*(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i);
  if (dateMatch) dateFormed = dateMatch[1].trim();

  // Business Type
  const typeMatch = text.match(/(?:Business\s*Type|Entity\s*Type|Type)[:\s|]*([A-Za-z\s]+?)(?:\n|\||$)/i);
  if (typeMatch) businessType = typeMatch[1].trim();

  // Mailing Address
  const mailMatch = text.match(/(?:Mailing\s*Address|Business\s*Address|Principal\s*Office)[:\s|]*([^\n|]+(?:\n[^\n|]{5,})?)/i);
  if (mailMatch) mailingAddress = mailMatch[1].trim().replace(/\n/g, ', ');

  // Principals - look for name/title/address patterns
  const principalSection = text.match(/(?:Principal|Agent|Manager|Member|Organizer)s?\s*(?:Name|Info|Details)?[:\s]*\n?([\s\S]*?)(?:\n\n|\*\*|---|\|---|$)/i);
  if (principalSection) {
    const section = principalSection[1];
    // Try name-address pairs
    const nameMatches = section.matchAll(/(?:^|\n)\s*([A-Z][A-Za-z\s\.\,]+?)(?:\n\s*(.+(?:CT|NY|MA|NJ|PA)\s*\d{5}[^\n]*))?/gm);
    for (const m of nameMatches) {
      const name = m[1].trim();
      if (name.length > 2 && name.length < 60 && !/^(name|title|address|type)/i.test(name)) {
        principals.push({
          name,
          address: m[2]?.trim() || 'See business record',
        });
      }
    }
  }

  // Also try table-style extraction: | Name | Address |
  const tableRows = text.matchAll(/\|\s*([A-Z][A-Za-z\s\.]+?)\s*\|\s*([^|]+?(?:CT|NY|MA)\s*\d{5}[^|]*)\s*\|/gi);
  for (const row of tableRows) {
    const name = row[1].trim();
    if (name.length > 2 && !principals.some(p => p.name === name)) {
      principals.push({ name, address: row[2].trim() });
    }
  }

  return {
    mailingAddress,
    dateFormed,
    businessType,
    status,
    principals: principals.length > 0 ? principals : [{ name: 'See CT Secretary of State records', address: `Search: ${businessName}` }],
    rawMarkdown: '',
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
