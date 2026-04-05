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

// ========== PLATFORM TYPES ==========
type Platform = 'vgs' | 'mapxpress' | 'qds' | 'act' | 'ias' | 'equality' | 'prc' | 'custom';

interface TownConfig {
  platform: Platform;
  slug?: string;       // VGS slug or MapXpress subdomain
  townCode?: string;   // PropertyRecordCards.com town code
  url?: string;        // Direct URL for custom/other platforms
  label?: string;      // Human-readable platform name
}

// ========== COMPLETE CT TOWN DATABASE ==========
// All 169 CT towns mapped to their assessor database platform
const TOWN_DB: Record<string, TownConfig> = {
  // === VGS Towns (Vision Government Solutions) - from official vgsi.com list ===
  "andover":        { platform: 'vgs', slug: 'andoverct' },
  "berlin":         { platform: 'vgs', slug: 'berlinct' },
  "bethlehem":      { platform: 'vgs', slug: 'bethlehemct' },
  "bolton":         { platform: 'vgs', slug: 'BoltonCT' },
  "branford":       { platform: 'vgs', slug: 'branfordct' },
  "bridgeport":     { platform: 'vgs', slug: 'bridgeportct' },
  "bridgewater":    { platform: 'vgs', slug: 'bridgewaterct' },
  "bristol":        { platform: 'vgs', slug: 'bristolct' },
  "brookfield":     { platform: 'vgs', slug: 'brookfieldct' },
  "brooklyn":       { platform: 'vgs', slug: 'brooklynct' },
  "burlington":     { platform: 'vgs', slug: 'burlingtonct' },
  "canterbury":     { platform: 'vgs', slug: 'canterburyct' },
  "canton":         { platform: 'vgs', slug: 'cantonct' },
  "chaplin":        { platform: 'vgs', slug: 'chaplinct' },
  "clinton":        { platform: 'vgs', slug: 'clintonct' },
  "cornwall":       { platform: 'vgs', slug: 'CornwallCT' },
  "coventry":       { platform: 'vgs', slug: 'coventryct' },
  "deep river":     { platform: 'vgs', slug: 'deepriverct' },
  "east granby":    { platform: 'vgs', slug: 'EastGranbyCT' },
  "east haddam":    { platform: 'vgs', slug: 'easthaddamct' },
  "east lyme":      { platform: 'vgs', slug: 'eastlymect' },
  "east windsor":   { platform: 'vgs', slug: 'eastwindsorct' },
  "enfield":        { platform: 'vgs', slug: 'EnfieldCT' },
  "essex":          { platform: 'vgs', slug: 'essexct' },
  "fairfield":      { platform: 'vgs', slug: 'fairfieldct' },
  "glastonbury":    { platform: 'vgs', slug: 'glastonburyct' },
  "granby":         { platform: 'vgs', slug: 'granbyct' },
  "griswold":       { platform: 'vgs', slug: 'griswoldct' },
  "hamden":         { platform: 'vgs', slug: 'hamdenct' },
  "hampton":        { platform: 'vgs', slug: 'hamptonct' },
  "harwinton":      { platform: 'vgs', slug: 'harwintonct' },
  "lebanon":        { platform: 'vgs', slug: 'LebanonCT' },
  "ledyard":        { platform: 'vgs', slug: 'LedyardCT' },
  "lisbon":         { platform: 'vgs', slug: 'LisbonCT' },
  "lyme":           { platform: 'vgs', slug: 'LymeCT' },
  "madison":        { platform: 'vgs', slug: 'madisonct' },
  "manchester":     { platform: 'vgs', slug: 'manchesterct' },
  "mansfield":      { platform: 'vgs', slug: 'mansfieldct' },
  "meriden":        { platform: 'vgs', slug: 'meridenct' },
  "middlebury":     { platform: 'vgs', slug: 'middleburyct' },
  "middlefield":    { platform: 'vgs', slug: 'MiddlefieldCT' },
  "middletown":     { platform: 'vgs', slug: 'MiddletownCT' },
  "milford":        { platform: 'vgs', slug: 'milfordct' },
  "monroe":         { platform: 'vgs', slug: 'monroect' },
  "new britain":    { platform: 'vgs', slug: 'newbritainct' },
  "new fairfield":  { platform: 'vgs', slug: 'newfairfieldct' },
  "new hartford":   { platform: 'vgs', slug: 'newhartfordct' },
  "new haven":      { platform: 'vgs', slug: 'newhavenct' },
  "new london":     { platform: 'vgs', slug: 'newlondonct' },
  "new milford":    { platform: 'vgs', slug: 'newmilfordct' },
  "newtown":        { platform: 'vgs', slug: 'newtownct' },
  "north branford": { platform: 'vgs', slug: 'northbranfordct' },
  "norwich":        { platform: 'vgs', slug: 'NorwichCT' },
  "old lyme":       { platform: 'vgs', slug: 'oldlymect' },
  "old saybrook":   { platform: 'vgs', slug: 'oldsaybrookct' },
  "orange":         { platform: 'vgs', slug: 'orangect' },
  "plainfield":     { platform: 'vgs', slug: 'PlainfieldCT' },
  "pomfret":        { platform: 'vgs', slug: 'pomfretct' },
  "preston":        { platform: 'vgs', slug: 'prestonct' },
  "redding":        { platform: 'vgs', slug: 'reddingct' },
  "salem":          { platform: 'vgs', slug: 'salemct' },
  "salisbury":      { platform: 'vgs', slug: 'salisburyct' },
  "somers":         { platform: 'vgs', slug: 'somersct' },
  "south windsor":  { platform: 'vgs', slug: 'southwindsorct' },
  "southbury":      { platform: 'vgs', slug: 'southburyct' },
  "southington":    { platform: 'vgs', slug: 'southingtonct' },
  "sprague":        { platform: 'vgs', slug: 'spraguect' },
  "stafford":       { platform: 'vgs', slug: 'staffordct' },
  "stamford":       { platform: 'vgs', slug: 'stamfordct' },
  "sterling":       { platform: 'vgs', slug: 'sterlingct' },
  "stonington":     { platform: 'vgs', slug: 'stoningtonct' },
  "stratford":      { platform: 'vgs', slug: 'stratfordct' },
  "thompson":       { platform: 'vgs', slug: 'thompsonct' },
  "tolland":        { platform: 'vgs', slug: 'tollandct' },
  "trumbull":       { platform: 'vgs', slug: 'trumbullct' },
  "union":          { platform: 'vgs', slug: 'UnionCT' },
  "wallingford":    { platform: 'vgs', slug: 'wallingfordct' },
  "waterford":      { platform: 'vgs', slug: 'waterfordct' },
  "westbrook":      { platform: 'vgs', slug: 'westbrookct' },
  "west hartford":  { platform: 'vgs', slug: 'westhartfordct' },
  "west haven":     { platform: 'vgs', slug: 'westhavenct' },
  "westport":       { platform: 'vgs', slug: 'westportct' },
  "willington":     { platform: 'vgs', slug: 'WillingtonCT' },
  "winchester":     { platform: 'vgs', slug: 'WinchesterCT' },
  "windham":        { platform: 'vgs', slug: 'windhamCT' },

  // === ACT Data Scout Towns ===
  "kent":           { platform: 'act', slug: 'Kent', url: 'https://www.actdatascout.com/RealProperty/Connecticut/Kent' },
  "norwalk":        { platform: 'act', slug: 'Norwalk', url: 'https://www.actdatascout.com/RealProperty/Connecticut/Norwalk' },
  "sharon":         { platform: 'act', slug: 'Sharon', url: 'https://www.actdatascout.com/RealProperty/Connecticut/Sharon' },

  // === PropertyRecordCards.com Towns (QDS/PRC platform) ===
  "ansonia":        { platform: 'prc', townCode: '002' },
  "ashford":        { platform: 'prc', townCode: '003' },
  "bethany":        { platform: 'prc', townCode: '008' },
  "bozrah":         { platform: 'prc', townCode: '013' },
  "canaan":         { platform: 'prc', townCode: '021' },
  "cheshire":       { platform: 'prc', townCode: '025' },
  "chester":        { platform: 'prc', townCode: '026' },
  "colebrook":      { platform: 'prc', townCode: '029' },
  "columbia":       { platform: 'prc', townCode: '030' },
  "danbury":        { platform: 'prc', townCode: '034' },
  "derby":          { platform: 'prc', townCode: '037' },
  "durham":         { platform: 'prc', townCode: '038' },
  "east hampton":   { platform: 'prc', townCode: '042' },
  "east haven":     { platform: 'prc', townCode: '044' },
  "eastford":       { platform: 'prc', townCode: '039' },
  "easton":         { platform: 'prc', townCode: '046' },
  "ellington":      { platform: 'prc', townCode: '048' },
  "farmington":     { platform: 'prc', townCode: '052' },
  "franklin":       { platform: 'prc', townCode: '053' },
  "guilford":       { platform: 'prc', townCode: '060' },
  "haddam":         { platform: 'prc', townCode: '061' },
  "hebron":         { platform: 'prc', townCode: '067' },
  "killingly":      { platform: 'prc', townCode: '069' },
  "killingworth":   { platform: 'prc', townCode: '070' },
  "marlborough":    { platform: 'prc', townCode: '079' },
  "montville":      { platform: 'prc', townCode: '086' },
  "naugatuck":      { platform: 'prc', townCode: '088' },
  "new canaan":     { platform: 'prc', townCode: '090' },
  "newington":      { platform: 'prc', townCode: '094' },
  "norfolk":        { platform: 'prc', townCode: '098' },
  "north canaan":   { platform: 'prc', townCode: '100' },
  "north haven":    { platform: 'prc', townCode: '101' },
  "north stonington": { platform: 'prc', townCode: '102' },
  "oxford":         { platform: 'prc', townCode: '108' },
  "plainville":     { platform: 'prc', townCode: '110' },
  "plymouth":       { platform: 'prc', townCode: '111' },
  "prospect":       { platform: 'prc', townCode: '115' },
  "ridgefield":     { platform: 'prc', townCode: '118' },
  "rocky hill":     { platform: 'prc', townCode: '119' },
  "roxbury":        { platform: 'prc', townCode: '120' },
  "scotland":       { platform: 'prc', townCode: '123' },
  "seymour":        { platform: 'prc', townCode: '124' },
  "shelton":        { platform: 'prc', townCode: '126' },
  "sherman":        { platform: 'prc', townCode: '127' },
  "simsbury":       { platform: 'prc', townCode: '128' },
  "suffield":       { platform: 'prc', townCode: '139' },
  "torrington":     { platform: 'prc', townCode: '143' },
  "voluntown":      { platform: 'prc', townCode: '147' },
  "warren":         { platform: 'prc', townCode: '149' },
  "washington":     { platform: 'prc', townCode: '150' },
  "waterbury":      { platform: 'prc', townCode: '151' },
  "watertown":      { platform: 'prc', townCode: '153' },
  "weston":         { platform: 'prc', townCode: '157' },
  "wilton":         { platform: 'prc', townCode: '161' },
  "windsor locks":  { platform: 'prc', townCode: '165' },
  "woodbridge":     { platform: 'prc', townCode: '167' },
  "woodbury":       { platform: 'prc', townCode: '168' },

  // === QDS Towns (custom assessor sites) ===
  "avon":           { platform: 'qds', url: 'http://assessor.avonct.gov/', label: 'Town of Avon Assessor' },

  // === IAS-CLT Towns ===
  "bethel":         { platform: 'ias', url: 'http://bethel.ias-clt.com/', label: 'Bethel Assessor' },
  "east hartford":  { platform: 'ias', url: 'https://easthartford.ias-clt.com/', label: 'East Hartford Assessor' },
  "hartford":       { platform: 'ias', url: 'https://hartford.ias-clt.com/', label: 'Hartford Assessor' },

  // === MapXpress Towns (only those confirmed working) ===
  "bloomfield":     { platform: 'mapxpress', slug: 'bloomfieldct', url: 'https://bloomfieldct.mapxpress.net/' },
  "darien":         { platform: 'mapxpress', slug: 'darien', url: 'https://darien.mapxpress.net/' },
  "groton":         { platform: 'mapxpress', slug: 'groton', url: 'https://groton.mapxpress.net/' },
  "wethersfield":   { platform: 'mapxpress', slug: 'wethersfield', url: 'https://wethersfield.mapxpress.net/' },
  "windsor":        { platform: 'mapxpress', slug: 'windsor', url: 'https://windsor.mapxpress.net/' },

  // === Remaining custom towns ===
  "barkhamsted":    { platform: 'custom', url: 'https://www.barkhamsted.us/', label: 'Barkhamsted Assessor' },
  "beacon falls":   { platform: 'custom', url: 'https://www.beaconfalls-ct.org/', label: 'Beacon Falls Assessor' },
  "colchester":     { platform: 'custom', url: 'https://colchesterct.gov/', label: 'Colchester Assessor' },
  "cromwell":       { platform: 'custom', url: 'https://www.cromwellct.com/', label: 'Cromwell Assessor' },
  "goshen":         { platform: 'custom', url: 'https://www.goshenct.gov/', label: 'Goshen Assessor' },
  "greenwich":      { platform: 'custom', url: 'https://www.greenwichct.gov/349/Assessment', label: 'Greenwich Assessor' },
  "hartland":       { platform: 'custom', url: 'https://www.hartlandct.org/', label: 'Hartland Assessor' },
  "litchfield":     { platform: 'custom', url: 'https://www.townoflitchfield.org/', label: 'Litchfield Assessor' },
  "morris":         { platform: 'custom', url: 'https://www.townofmorrisct.com/', label: 'Morris Assessor' },
  "portland":       { platform: 'custom', url: 'https://www.portlandct.org/', label: 'Portland Assessor' },
  "putnam":         { platform: 'custom', url: 'https://www.putnamct.us/', label: 'Putnam Assessor' },
  "thomaston":      { platform: 'custom', url: 'https://www.thomastonct.org/', label: 'Thomaston Assessor' },
  "vernon":         { platform: 'custom', url: 'https://www.vernon-ct.gov/', label: 'Vernon Assessor' },
  "wolcott":        { platform: 'custom', url: 'https://www.wolcottct.org/', label: 'Wolcott Assessor' },
  "woodstock":      { platform: 'custom', url: 'https://www.woodstockct.gov/', label: 'Woodstock Assessor' },
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

    const config = TOWN_DB[townLower];

    if (!config) {
      return json({
        success: false,
        error: `${town}, CT is not recognized as a Connecticut town.`,
        searchUrl: `https://www.google.com/search?q=${encodeURIComponent(`${town} CT property assessor database`)}`,
      });
    }

    switch (config.platform) {
      case 'vgs':
        return await scrapeVGS(apiKey, config.slug!, normalizedAddress, town);

      case 'mapxpress':
        return await scrapeMapXpress(apiKey, config.url!, normalizedAddress, town);

      case 'qds':
        return await scrapeQDS(apiKey, config.url!, normalizedAddress, town);

      case 'act':
        return await scrapeACTDataScout(apiKey, config.url!, normalizedAddress, town);

      case 'ias':
        return await scrapeIASCLT(apiKey, config.url!, normalizedAddress, town);

      case 'prc':
        return await scrapePRC(apiKey, config.townCode!, normalizedAddress, town);

      case 'equality':
        return await scrapeEqualityCama(apiKey, config.url!, normalizedAddress, town);

      case 'custom':
      default:
        return await scrapeGenericWithFallback(apiKey, config.url!, normalizedAddress, town, config.label || `${town} Assessor`);
    }
  } catch (error) {
    console.error("Error:", error);
    return json({ success: false, error: error instanceof Error ? error.message : "Search failed" }, 500);
  }
});

// ========== VGS SCRAPING ==========
async function scrapeVGS(apiKey: string, slug: string, address: string, town: string) {
  const searchUrl = `https://gis.vgsi.com/${slug}/Search.aspx`;
  const baseUrl = `https://gis.vgsi.com/${slug}`;

  // Strategy 1: Firecrawl web search to find the property page
  try {
    console.log(`Searching for property via Firecrawl search`);
    const searchResp = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: `"${address}" "${town}" CT property vgsi.com`, limit: 5 }),
    });

    if (searchResp.ok) {
      const searchData = await searchResp.json();
      const results = searchData.data || [];
      for (const result of results) {
        const url = result.url || '';
        if (url.includes('vgsi.com') && url.includes('Parcel.aspx')) {
          console.log(`Found VGS parcel page: ${url}`);
          return await scrapePropertyDetail(apiKey, url, address, town);
        }
      }
    }
  } catch (e) { console.error("Search error:", e); }

  // Strategy 2: Use Firecrawl actions on VGS search page
  try {
    console.log(`Trying VGS with actions`);
    const resp = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: searchUrl,
        formats: ['markdown', 'links', 'html'],
        waitFor: 2000,
        actions: [
          { type: 'wait', milliseconds: 1000 },
          { type: 'click', selector: 'input[id*="TextBox_Search"], input[id*="txtSearch"], input[type="text"]' },
          { type: 'write', text: address },
          { type: 'wait', milliseconds: 3000 },
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

      const pidMatch = (html + markdown).match(/Parcel\.aspx\?[Pp]id=(\d+)/);
      if (pidMatch) {
        return await scrapePropertyDetail(apiKey, `${baseUrl}/Parcel.aspx?Pid=${pidMatch[1]}`, address, town);
      }
    }
  } catch (e) { console.error("Actions error:", e); }

  return json({ success: false, error: `Could not find property in ${town}. Try the assessor database directly.`, searchUrl });
}

// ========== MAPXPRESS SCRAPING ==========
async function scrapeMapXpress(apiKey: string, baseUrl: string, address: string, town: string) {
  try {
    console.log(`Scraping MapXpress for ${town}: ${baseUrl}`);

    // MapXpress sites use a property card page with address search
    // Try Firecrawl search first
    const searchResp = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: `"${address}" "${town}" CT property mapxpress.net`, limit: 5 }),
    });

    if (searchResp.ok) {
      const data = await searchResp.json();
      const results = data.data || [];
      for (const result of results) {
        const url = result.url || '';
        if (url.includes('mapxpress.net') && (url.includes('Pid=') || url.includes('pid='))) {
          console.log(`Found MapXpress property: ${url}`);
          const md = await firecrawlScrape(apiKey, url);
          if (md) {
            const extracted = extractMapXpressData(md, address, town);
            if (extracted) {
              extracted.propertyCardUrl = url;
              if (extracted.isLLC) {
                try { extracted.llcDetails = await searchCTBusiness(apiKey, extracted.owner); } catch (e) { console.error("LLC:", e); }
              }
              return json({ success: true, property: extracted });
            }
          }
        }
      }
    }

    // Strategy 2: Use Firecrawl actions to search on the MapXpress site
    const resp = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: baseUrl,
        formats: ['markdown', 'html'],
        waitFor: 3000,
        actions: [
          { type: 'wait', milliseconds: 2000 },
          { type: 'click', selector: 'input[name*="Address"], input[name*="address"], #txtAddress, input[placeholder*="Address"]' },
          { type: 'write', text: address },
          { type: 'click', selector: 'input[type="submit"], button[type="submit"], #btnSearch' },
          { type: 'wait', milliseconds: 5000 },
        ],
      }),
    });

    if (resp.ok) {
      const data = await resp.json();
      const markdown = data.data?.markdown || data.markdown || '';
      if (markdown.length > 200) {
        const extracted = extractMapXpressData(markdown, address, town);
        if (extracted) {
          extracted.propertyCardUrl = data.data?.metadata?.url || baseUrl;
          if (extracted.isLLC) {
            try { extracted.llcDetails = await searchCTBusiness(apiKey, extracted.owner); } catch (e) { console.error("LLC:", e); }
          }
          return json({ success: true, property: extracted });
        }
      }
    }
  } catch (e) { console.error("MapXpress error:", e); }

  return json({ success: false, error: `Could not find property in ${town}. Try searching the MapXpress database directly.`, searchUrl: baseUrl });
}

// ========== QDS SCRAPING (Avon etc.) ==========
async function scrapeQDS(apiKey: string, baseUrl: string, address: string, town: string) {
  try {
    console.log(`Scraping QDS for ${town}: ${baseUrl}`);

    // QDS sites like Avon have a structured URL pattern:
    // 1. Streets listing: /propcards/streets.html
    // 2. Street page: /propcards/Xstreet.html (where X = first letter)
    // 3. Property card: /propcards/N/admin/aNNNNNNNNN.html
    // 4. PDF field card: /cards/N/NNNNNNNNN.pdf

    // Parse the address to get street name and house number
    const addrMatch = address.match(/^(\d+)\s+(.+)$/i);
    if (!addrMatch) {
      return json({ success: false, error: `Could not parse address: ${address}`, searchUrl: baseUrl });
    }

    const houseNum = addrMatch[1];
    const streetName = addrMatch[2].toUpperCase().replace(/\s+(ST|RD|DR|AVE|LN|CT|CIR|BLVD|PL|TER|WAY|TRL|HWY|PKWY|TPKE)\.?$/i, '').trim();
    const fullStreetName = addrMatch[2].toUpperCase();
    const firstLetter = streetName.charAt(0).toLowerCase();

    console.log(`Looking for house #${houseNum} on ${fullStreetName} (first letter: ${firstLetter})`);

    // Step 1: Fetch the street listing page to find our street
    const streetPageUrl = `${baseUrl.replace(/\/$/, '')}/propcards/${firstLetter.toUpperCase()}street.html`;
    const streetPageMd = await firecrawlScrape(apiKey, streetPageUrl);

    if (!streetPageMd) {
      // Try alternate format
      const altUrl = `${baseUrl.replace(/\/$/, '')}/propcards/streets.html#${firstLetter}`;
      return await scrapeQDSViaSearch(apiKey, baseUrl, address, town);
    }

    // Step 2: Find the matching property link in the street page
    // Links look like: [00100 FISHER DRIVE](http://assessor.avonct.gov/propcards/2/admin/a228010001.html)
    const paddedNum = houseNum.padStart(5, '0');
    const lines = streetPageMd.split('\n');

    let propertyUrl = '';
    for (const line of lines) {
      // Match on padded house number + street name
      const linkMatch = line.match(/\[(\d+)\s+([^\]]+)\]\((https?:\/\/[^\)]+)\)/i);
      if (linkMatch) {
        const linkNum = linkMatch[1].replace(/^0+/, '');
        const linkStreet = linkMatch[2].trim().toUpperCase();
        if (linkNum === houseNum && (linkStreet.includes(streetName) || fullStreetName.includes(linkStreet.replace(/\s+\d+$/, '').trim()))) {
          propertyUrl = linkMatch[3];
          console.log(`Found QDS property: ${propertyUrl}`);
          break;
        }
      }
    }

    if (!propertyUrl) {
      console.log(`Property not found in street listing, trying search fallback`);
      return await scrapeQDSViaSearch(apiKey, baseUrl, address, town);
    }

    // Step 3: Fetch the property card page
    const cardMd = await firecrawlScrape(apiKey, propertyUrl);
    if (!cardMd) {
      return json({ success: false, error: `Could not load property card for ${address}`, searchUrl: propertyUrl });
    }

    // Step 4: Extract data from QDS card format
    const extracted = extractQDSCardData(cardMd, address, town);
    if (extracted) {
      extracted.propertyCardUrl = propertyUrl;

      // Try to find the PDF field card URL
      const pdfMatch = cardMd.match(/\[Street Card\]\((https?:\/\/[^\)]+\.pdf)\)/i);
      if (pdfMatch) {
        extracted.fieldCardPdfUrl = pdfMatch[1];
      }

      if (extracted.isLLC) {
        try { extracted.llcDetails = await searchCTBusiness(apiKey, extracted.owner); } catch (e) { console.error("LLC:", e); }
      }
      return json({ success: true, property: extracted });
    }

    return json({ success: false, error: `Could not extract property data from ${town} assessor.`, searchUrl: propertyUrl });
  } catch (e) {
    console.error("QDS error:", e);
    return json({ success: false, error: `Error searching ${town} assessor database.`, searchUrl: baseUrl });
  }
}

async function scrapeQDSViaSearch(apiKey: string, baseUrl: string, address: string, town: string) {
  // Fallback: try Firecrawl web search
  try {
    const searchResp = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: `"${address}" "${town}" CT assessor property`, limit: 5 }),
    });

    if (searchResp.ok) {
      const data = await searchResp.json();
      const results = data.data || [];
      for (const result of results) {
        const url = result.url || '';
        if (url.includes('assessor') || url.includes('propcard')) {
          const md = await firecrawlScrape(apiKey, url);
          if (md) {
            const extracted = extractQDSCardData(md, address, town) || extractGenericPropertyData(md, address, town);
            if (extracted) {
              extracted.propertyCardUrl = url;
              if (extracted.isLLC) {
                try { extracted.llcDetails = await searchCTBusiness(apiKey, extracted.owner); } catch (e) { console.error("LLC:", e); }
              }
              return json({ success: true, property: extracted });
            }
          }
        }
      }
    }
  } catch (e) { console.error("QDS search fallback error:", e); }

  return json({ success: false, error: `Could not find property in ${town}. Try the assessor database directly.`, searchUrl: baseUrl });
}

// ========== PROPERTY RECORD CARDS (PRC) SCRAPING ==========
async function scrapePRC(apiKey: string, townCode: string, address: string, town: string) {
  const baseUrl = `https://www.propertyrecordcards.com/SearchMaster.aspx?towncode=${townCode}`;
  try {
    console.log(`Scraping PRC for ${town} (code=${townCode}): ${baseUrl}`);

    // Strategy 1: Use Firecrawl actions to search on PRC
    const resp = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: baseUrl,
        formats: ['markdown', 'html', 'links'],
        waitFor: 3000,
        actions: [
          { type: 'wait', milliseconds: 2000 },
          { type: 'click', selector: '#ContentPlaceHolder1_txtLocation' },
          { type: 'write', text: address.replace(/\b(ST|RD|DR|AVE|LN|CT|CIR|BLVD|PL|TER|WAY|TRL)\b/gi, '').trim() },
          { type: 'click', selector: '#ContentPlaceHolder1_btnSearch' },
          { type: 'wait', milliseconds: 5000 },
        ],
      }),
    });

    if (resp.ok) {
      const data = await resp.json();
      const markdown = data.data?.markdown || data.markdown || '';
      const html = data.data?.html || data.html || '';
      const links = data.data?.links || data.links || [];

      // Check if we got search results with links to PropertyResults
      const uniqueIdMatch = (html + markdown + JSON.stringify(links)).match(/PropertyResults\.aspx\?towncode=\d+&uniqueid=(\d+)/i)
        || (html + markdown + JSON.stringify(links)).match(/PrintPage\.aspx\?towncode=\d+&uniqueid=(\d+)/i);

      if (uniqueIdMatch) {
        const detailUrl = `https://www.propertyrecordcards.com/PrintPage.aspx?towncode=${townCode}&uniqueid=${uniqueIdMatch[1]}`;
        console.log(`Found PRC detail page: ${detailUrl}`);
        const detailMd = await firecrawlScrape(apiKey, detailUrl);
        if (detailMd) {
          const extracted = extractPRCData(detailMd, address, town);
          if (extracted) {
            extracted.propertyCardUrl = `https://www.propertyrecordcards.com/PropertyResults.aspx?towncode=${townCode}&uniqueid=${uniqueIdMatch[1]}`;
            if (extracted.isLLC) {
              try { extracted.llcDetails = await searchCTBusiness(apiKey, extracted.owner); } catch (e) { console.error("LLC:", e); }
            }
            return json({ success: true, property: extracted });
          }
        }
      }

      // Maybe we landed directly on results - try extracting from markdown
      if (markdown.includes('Parcel Information') || markdown.includes('Owner')) {
        const extracted = extractPRCData(markdown, address, town);
        if (extracted) {
          extracted.propertyCardUrl = baseUrl;
          if (extracted.isLLC) {
            try { extracted.llcDetails = await searchCTBusiness(apiKey, extracted.owner); } catch (e) { console.error("LLC:", e); }
          }
          return json({ success: true, property: extracted });
        }
      }
    }

    // Strategy 2: Firecrawl web search
    try {
      const searchResp = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: `"${address}" "${town}" CT propertyrecordcards.com`, limit: 5 }),
      });
      if (searchResp.ok) {
        const sData = await searchResp.json();
        const results = sData.data || [];
        for (const result of results) {
          const url = result.url || '';
          const uidMatch = url.match(/uniqueid=(\d+)/i);
          if (uidMatch && url.includes('propertyrecordcards.com')) {
            const detailUrl = `https://www.propertyrecordcards.com/PrintPage.aspx?towncode=${townCode}&uniqueid=${uidMatch[1]}`;
            const detailMd = await firecrawlScrape(apiKey, detailUrl);
            if (detailMd) {
              const extracted = extractPRCData(detailMd, address, town);
              if (extracted) {
                extracted.propertyCardUrl = url;
                if (extracted.isLLC) {
                  try { extracted.llcDetails = await searchCTBusiness(apiKey, extracted.owner); } catch (e) { console.error("LLC:", e); }
                }
                return json({ success: true, property: extracted });
              }
            }
          }
        }
      }
    } catch (e) { console.error("PRC search fallback error:", e); }
  } catch (e) { console.error("PRC error:", e); }

  return json({ success: false, error: `Could not find property in ${town}. Try the Property Record Cards database directly.`, searchUrl: baseUrl });
}

function extractPRCData(markdown: string, address: string, town: string) {
  const text = markdown;

  const tableGrab = (label: string): string => {
    const re = new RegExp(`\\|\\s*${label}:?\\s*\\|\\s*([^|]*?)\\s*\\|`, 'i');
    const m = text.match(re);
    return m?.[1]?.trim() || '';
  };

  let propertyAddress = tableGrab('Location') || address;
  const propertyUse = tableGrab('Property Use');
  const primaryUse = tableGrab('Primary Use');
  const uniqueId = tableGrab('Unique ID');
  const mapBlockLot = tableGrab('Map Block Lot');
  const acres = tableGrab('Acres');
  const zone = tableGrab('Zone');
  const volPage = tableGrab('Volume / Page') || tableGrab('Volume\\/Page');

  // Value Information
  let landAppraised = '', landAssessed = '', bldgAppraised = '', bldgAssessed = '', totalAppraised = '', totalAssessed = '';
  const landRow = text.match(/\|\s*Land\s*\|\s*([\d,]+)\s*\|\s*([\d,]+)\s*\|/i);
  if (landRow) { landAppraised = landRow[1]; landAssessed = landRow[2]; }
  const bldgRow = text.match(/\|\s*Buildings?\s*\|\s*([\d,]+)\s*\|\s*([\d,]+)\s*\|/i);
  if (bldgRow) { bldgAppraised = bldgRow[1]; bldgAssessed = bldgRow[2]; }
  const totalRow = text.match(/\|\s*Total\s*\|\s*([\d,]+)\s*\|\s*([\d,]+)\s*\|/i);
  if (totalRow) { totalAppraised = totalRow[1]; totalAssessed = totalRow[2]; }

  // Owner from "Owner's Data" cell (uses <br> separators)
  let owner = '', coOwner = '', ownerAddress = '';
  const ownerMatch = text.match(/Owner'?s?\s*Data[\s|]*\n?\|?\s*([^|]+)\|/i);
  if (ownerMatch) {
    const parts = ownerMatch[1].replace(/<br\/?>/gi, '\n').split('\n').map(s => s.trim()).filter(Boolean);
    owner = parts[0] || '';
    if (parts.length > 2) {
      coOwner = parts[1] || '';
      ownerAddress = parts.slice(2).join(', ');
    } else {
      ownerAddress = parts.slice(1).join(', ');
    }
  }

  // Building info
  const yearBuilt = tableGrab('Year Built');
  const livingArea = tableGrab('Living Area') || tableGrab('Total Living Area');
  const buildingStyle = tableGrab('Style') || tableGrab('Building Style');
  const stories = tableGrab('Stories');
  const totalRooms = tableGrab('Total Rooms') || tableGrab('Rooms');
  const bedrooms = tableGrab('Bedrooms') || tableGrab('Total Bedrooms');
  const totalBaths = tableGrab('Full Baths') || tableGrab('Total Baths');
  const halfBaths = tableGrab('Half Baths');
  const exteriorWall = tableGrab('Exterior Wall') || tableGrab('Ext Wall');
  const roofCover = tableGrab('Roof Cover') || tableGrab('Roof');
  const heating = tableGrab('Heat Type') || tableGrab('Heating');
  const heatingFuel = tableGrab('Heat Fuel') || tableGrab('Fuel');
  const cooling = tableGrab('AC Type') || tableGrab('Air Conditioning');
  const grade = tableGrab('Grade');
  const condition = tableGrab('Condition') || tableGrab('Overall Condition');

  // Sales
  const salePrice = tableGrab('Sale Price');
  const saleDate = tableGrab('Sale Date');

  owner = owner.replace(/[*#\[\]|]/g, '').replace(/\s+/g, ' ').trim();
  if (!owner || owner.length < 2) return null;

  const isLLC = /\bLLC\b|\bL\.L\.C\b|\bLimited Liability\b|\bLP\b|\bL\.P\b/i.test(owner);
  const fmt$ = (v: string) => v ? `$${v}` : '';

  return {
    address: propertyAddress, town, owner, coOwner, ownerAddress, isLLC,
    parcelId: uniqueId, mblu: mapBlockLot, accountNumber: '', buildingCount: '',
    bookPage: volPage, certificate: '', instrument: '',
    assessedValue: fmt$(totalAssessed), totalAppraisal: fmt$(totalAppraised),
    totalMarketValue: fmt$(totalAppraised), improvementsValue: fmt$(bldgAppraised),
    landValue: fmt$(landAppraised), assessImprovements: fmt$(bldgAssessed),
    assessLand: fmt$(landAssessed), assessTotal: fmt$(totalAssessed),
    salePrice, saleDate,
    lotSize: acres ? `${acres} acres` : '', frontage: '', depth: '',
    useCode: '', useDescription: propertyUse || primaryUse, zoning: zone, neighborhood: '',
    totalMarketLand: '', landAppraisedValue: fmt$(landAppraised),
    yearBuilt, buildingStyle, model: '', stories,
    livingArea: livingArea ? `${livingArea} sq ft` : '',
    replacementCost: '', buildingPercentGood: '',
    occupancy: '', totalRooms, bedrooms, totalBaths, halfBaths,
    totalXtraFixtures: '', bathStyle: '', kitchenStyle: '',
    interiorCondition: condition, finBsmntArea: '', finBsmntQual: '', grade,
    exteriorWall, roofStructure: '', roofCover,
    interiorWall: '', flooring: '',
    heating, heatingFuel, cooling,
    buildingPhoto: '',
    ownershipHistory: [] as { owner: string; salePrice: string; bookPage: string; saleDate: string }[],
    subAreas: [] as { code: string; description: string; grossArea: string; livingArea: string }[],
    valuationHistory: [] as { year: string; improvements: string; land: string; total: string }[],
    propertyCardUrl: '', llcDetails: undefined as any,
  };
}


async function scrapeACTDataScout(apiKey: string, baseUrl: string, address: string, town: string) {
  try {
    console.log(`Scraping ACT Data Scout for ${town}: ${baseUrl}`);

    // ACT Data Scout has a structured search
    const searchResp = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: `"${address}" "${town}" CT property actdatascout.com`, limit: 5 }),
    });

    if (searchResp.ok) {
      const data = await searchResp.json();
      const results = data.data || [];
      for (const result of results) {
        const url = result.url || '';
        if (url.includes('actdatascout.com')) {
          const md = await firecrawlScrape(apiKey, url);
          if (md) {
            const extracted = extractGenericPropertyData(md, address, town);
            if (extracted) {
              extracted.propertyCardUrl = url;
              if (extracted.isLLC) {
                try { extracted.llcDetails = await searchCTBusiness(apiKey, extracted.owner); } catch (e) { console.error("LLC:", e); }
              }
              return json({ success: true, property: extracted });
            }
          }
        }
      }
    }

    // Try with actions
    const resp = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: baseUrl,
        formats: ['markdown', 'html'],
        waitFor: 3000,
        actions: [
          { type: 'wait', milliseconds: 2000 },
          { type: 'click', selector: 'input[name*="street"], input[name*="addr"], input[placeholder*="Address"], input[type="text"]' },
          { type: 'write', text: address },
          { type: 'click', selector: 'button[type="submit"], input[type="submit"], button:contains("Search")' },
          { type: 'wait', milliseconds: 5000 },
        ],
      }),
    });

    if (resp.ok) {
      const data = await resp.json();
      const markdown = data.data?.markdown || data.markdown || '';
      if (markdown.length > 200) {
        const extracted = extractGenericPropertyData(markdown, address, town);
        if (extracted) {
          extracted.propertyCardUrl = baseUrl;
          if (extracted.isLLC) {
            try { extracted.llcDetails = await searchCTBusiness(apiKey, extracted.owner); } catch (e) { console.error("LLC:", e); }
          }
          return json({ success: true, property: extracted });
        }
      }
    }
  } catch (e) { console.error("ACT error:", e); }

  return json({ success: false, error: `Could not find property in ${town}. Try the assessor database directly.`, searchUrl: baseUrl });
}

// ========== IAS-CLT SCRAPING ==========
async function scrapeIASCLT(apiKey: string, baseUrl: string, address: string, town: string) {
  try {
    console.log(`Scraping IAS-CLT for ${town}: ${baseUrl}`);

    // IAS-CLT sites have address dropdowns - use search + scrape
    const searchResp = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: `"${address}" "${town}" CT property ias-clt.com`, limit: 5 }),
    });

    if (searchResp.ok) {
      const data = await searchResp.json();
      const results = data.data || [];
      for (const result of results) {
        const url = result.url || '';
        if (url.includes('ias-clt.com') || url.includes(town.toLowerCase())) {
          const md = await firecrawlScrape(apiKey, url);
          if (md) {
            const extracted = extractGenericPropertyData(md, address, town);
            if (extracted) {
              extracted.propertyCardUrl = url;
              if (extracted.isLLC) {
                try { extracted.llcDetails = await searchCTBusiness(apiKey, extracted.owner); } catch (e) { console.error("LLC:", e); }
              }
              return json({ success: true, property: extracted });
            }
          }
        }
      }
    }
  } catch (e) { console.error("IAS error:", e); }

  return json({ success: false, error: `Could not find property in ${town}. Try the assessor database directly.`, searchUrl: baseUrl });
}

// ========== EQUALITY CAMA SCRAPING ==========
async function scrapeEqualityCama(apiKey: string, baseUrl: string, address: string, town: string) {
  try {
    console.log(`Scraping eQuality for ${town}: ${baseUrl}`);

    const searchResp = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: `"${address}" "${town}" CT property equalitycama.com`, limit: 5 }),
    });

    if (searchResp.ok) {
      const data = await searchResp.json();
      const results = data.data || [];
      for (const result of results) {
        const url = result.url || '';
        if (url.includes('equalitycama') || url.includes(town.toLowerCase())) {
          const md = await firecrawlScrape(apiKey, url);
          if (md) {
            const extracted = extractGenericPropertyData(md, address, town);
            if (extracted) {
              extracted.propertyCardUrl = url;
              if (extracted.isLLC) {
                try { extracted.llcDetails = await searchCTBusiness(apiKey, extracted.owner); } catch (e) { console.error("LLC:", e); }
              }
              return json({ success: true, property: extracted });
            }
          }
        }
      }
    }
  } catch (e) { console.error("eQuality error:", e); }

  return json({ success: false, error: `Could not find property in ${town}. Try the assessor database directly.`, searchUrl: baseUrl });
}

// ========== GENERIC / CUSTOM SCRAPING ==========
async function scrapeGenericWithFallback(apiKey: string, baseUrl: string, address: string, town: string, label: string) {
  try {
    console.log(`Scraping generic for ${town} (${label}): ${baseUrl}`);

    // First try Google search to find the specific property page
    const searchResp = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: `"${address}" "${town}" CT property assessor`, limit: 5 }),
    });

    if (searchResp.ok) {
      const data = await searchResp.json();
      const results = data.data || [];
      for (const result of results) {
        const url = result.url || '';
        // Skip generic listing sites
        if (url.includes('zillow') || url.includes('realtor') || url.includes('trulia') || url.includes('redfin')) continue;
        if (url.includes(town.toLowerCase().replace(/\s+/g, '')) || url.includes('assessor') || url.includes('property')) {
          const md = await firecrawlScrape(apiKey, url);
          if (md && md.length > 300) {
            const extracted = extractGenericPropertyData(md, address, town);
            if (extracted) {
              extracted.propertyCardUrl = url;
              if (extracted.isLLC) {
                try { extracted.llcDetails = await searchCTBusiness(apiKey, extracted.owner); } catch (e) { console.error("LLC:", e); }
              }
              return json({ success: true, property: extracted });
            }
          }
        }
      }
    }

    // Fallback: Try scraping the base URL directly
    const md = await firecrawlScrape(apiKey, baseUrl);
    if (md) {
      const extracted = extractGenericPropertyData(md, address, town);
      if (extracted) {
        extracted.propertyCardUrl = baseUrl;
        if (extracted.isLLC) {
          try { extracted.llcDetails = await searchCTBusiness(apiKey, extracted.owner); } catch (e) { console.error("LLC:", e); }
        }
        return json({ success: true, property: extracted });
      }
    }
  } catch (e) { console.error("Generic error:", e); }

  return json({ success: false, error: `Could not find property in ${town}. Try the assessor database directly.`, searchUrl: baseUrl });
}

// ========== SHARED HELPERS ==========
async function scrapePropertyDetail(apiKey: string, url: string, address: string, town: string) {
  console.log(`Scraping property detail: ${url}`);
  const detailMd = await firecrawlScrape(apiKey, url);
  if (detailMd) {
    const extracted = extractVGSData(detailMd, address, town);
    if (extracted && extracted.owner && !extracted.owner.includes('Enter an')) {
      extracted.propertyCardUrl = url;
      if (extracted.isLLC) {
        try { extracted.llcDetails = await searchCTBusiness(apiKey, extracted.owner); } catch (e) { console.error("LLC error:", e); }
      }
      return json({ success: true, property: extracted });
    }
  }
  return json({ success: false, error: "Could not extract property data.", searchUrl: url });
}

async function firecrawlScrape(apiKey: string, url: string): Promise<string | null> {
  console.log(`Firecrawl scraping: ${url}`);
  try {
    const resp = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: true, waitFor: 5000 }),
    });
    if (!resp.ok) { console.error(`Firecrawl ${resp.status}`); return null; }
    const data = await resp.json();
    return data.data?.markdown || data.markdown || null;
  } catch (e) { console.error("Firecrawl fetch error:", e); return null; }
}

// ========== VGS DATA EXTRACTOR ==========
function extractVGSData(markdown: string, address: string, town: string) {
  const text = markdown;

  const tableGrab = (label: string): string => {
    const re = new RegExp(`\\|\\s*${label}:?\\s*\\|\\s*([^|]*?)\\s*\\|`, 'i');
    const m = text.match(re);
    return m?.[1]?.trim().replace(/<br\/?>/gi, ', ') || '';
  };

  const dollarGrab = (label: string): string => {
    const re = new RegExp(`${label}\\s*\\$([\\d,]+)`, 'i');
    const m = text.match(re);
    return m?.[1]?.trim() || '';
  };

  let owner = '';
  let propertyAddress = address;

  owner = tableGrab('Owner');
  if (!owner) {
    const inlineOwner = text.match(/Owner([A-Z][A-Z\s\+\.\,\-\'&]+?)(?:Total|Sale|Co-Owner|Appraisal)/m);
    if (inlineOwner) owner = inlineOwner[1].trim();
  }

  const coOwner = tableGrab('Co-Owner');
  const locMatch = text.match(/Location(\d+[A-Z0-9\s]+?)(?:\n|Mblu)/i);
  if (locMatch) propertyAddress = locMatch[1].trim();

  const mbluMatch = text.match(/Mblu([\d\/\s]+?)(?:Acct|Owner|\n)/i);
  const mblu = mbluMatch?.[1]?.trim().replace(/\s+/g, '') || '';

  const acctMatch = text.match(/Acct#?([\d\s]+)/i);
  const accountNumber = acctMatch?.[1]?.trim() || '';

  const pidMatch = text.match(/PID(\d+)/i);
  const parcelId = pidMatch?.[1] || '';

  const bldgCountMatch = text.match(/Building\s*Count\s*(\d+)/i);
  const buildingCount = bldgCountMatch?.[1] || '';

  const ownerAddress = tableGrab('Address');

  const totalMarketValue = dollarGrab('Total\\s*Market\\s*Value');
  const totalAppraisal = dollarGrab('Appraisal');

  let improvementsValue = '', landValueCV = '', totalValueCV = '';
  const cvMatch = text.match(/Current Value[\s\S]*?\|\s*\d{4}\s*\|\s*\$([\d,]+)\s*\|\s*\$([\d,]+)\s*\|\s*\$([\d,]+)\s*\|/i);
  if (cvMatch) { improvementsValue = cvMatch[1]; landValueCV = cvMatch[2]; totalValueCV = cvMatch[3]; }

  let assessImprovements = '', assessLand = '', assessTotal = '';
  const assessSection = text.match(/Assessment[\s\S]*?\|\s*\d{4}\s*\|\s*\$([\d,]+)\s*\|\s*\$([\d,]+)\s*\|\s*\$([\d,]+)\s*\|/i);
  if (assessSection) { assessImprovements = assessSection[1]; assessLand = assessSection[2]; assessTotal = assessSection[3]; }

  const salePrice = tableGrab('Sale Price');
  const saleDate = tableGrab('Sale Date');
  const certificate = tableGrab('Certificate');
  const bookPage = tableGrab('Book & Page') || tableGrab('Book \\& Page');
  const instrument = tableGrab('Instrument');

  const ownershipHistory: { owner: string; salePrice: string; bookPage: string; saleDate: string }[] = [];
  const historySection = text.match(/Ownership History[\s\S]*?\| Owner \| Sale Price[\s\S]*?\n([\s\S]*?)(?:\n\n|Ownership History|Building Information)/i);
  if (historySection) {
    const rows = historySection[1].split('\n').filter(r => r.includes('|') && !r.includes('---'));
    for (const row of rows) {
      const cols = row.split('|').map(c => c.trim()).filter(Boolean);
      if (cols.length >= 5) {
        ownershipHistory.push({ owner: cols[0], salePrice: cols[1], bookPage: cols[2] || cols[3] || '', saleDate: cols[cols.length - 1] });
      }
    }
  }

  const lotSize = tableGrab('Size \\(Acres\\)');
  const frontage = tableGrab('Frontage');
  const depth = tableGrab('Depth');
  const useCode = tableGrab('Use Code');
  const useDescMatch = text.match(/Use Code\s*\|\s*\d+[\s\S]*?\|\s*Description\s*\|\s*([^|]*?)\s*\|/i);
  const useDescription = useDescMatch?.[1]?.trim() || '';
  const zoning = tableGrab('Zone');
  const neighborhood = tableGrab('Neighborhood') || tableGrab('NBHD Code');
  const totalMarketLand = tableGrab('Total Market Land');
  const landAppraisedValue = tableGrab('Appraised Value');

  const yearBuilt = tableGrab('Year Built');
  const livingArea = tableGrab('Living Area');
  const replacementCost = tableGrab('Replacement Cost');
  const buildingPercentGood = tableGrab('Building Percent Good');
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

  const photoMatch = text.match(/Building Photo\s*!\[.*?\]\((https?:\/\/[^\)]+)\)/i);
  const buildingPhoto = photoMatch?.[1] || '';

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

  owner = owner.replace(/[*#\[\]]/g, '').replace(/<br\/?>/gi, ' ').trim();
  if (!owner || owner.length < 2) return null;

  const isLLC = /\bLLC\b|\bL\.L\.C\b|\bLimited Liability\b/i.test(owner);
  const fmt$ = (v: string) => v ? `$${v}` : '';

  return {
    address: propertyAddress, town, owner, coOwner, ownerAddress, isLLC,
    parcelId, mblu, accountNumber, buildingCount, bookPage, certificate, instrument,
    assessedValue: fmt$(assessTotal) || fmt$(totalMarketValue),
    totalAppraisal: fmt$(totalValueCV) || fmt$(totalAppraisal),
    totalMarketValue: fmt$(totalMarketValue),
    improvementsValue: fmt$(improvementsValue),
    landValue: fmt$(landValueCV),
    assessImprovements: fmt$(assessImprovements),
    assessLand: fmt$(assessLand),
    assessTotal: fmt$(assessTotal),
    salePrice, saleDate,
    lotSize: lotSize ? `${lotSize} acres` : '',
    frontage: frontage ? `${frontage} ft` : '',
    depth: depth ? `${depth} ft` : '',
    useCode, useDescription, zoning,
    neighborhood: nbhdCode || neighborhood,
    totalMarketLand, landAppraisedValue,
    yearBuilt, buildingStyle, model, stories,
    livingArea: livingArea ? `${livingArea} sq ft` : '',
    replacementCost: replacementCost ? `$${replacementCost.replace(/[$]/g, '')}` : '',
    buildingPercentGood: buildingPercentGood ? `${buildingPercentGood}%` : '',
    occupancy, totalRooms, bedrooms: totalBedrooms, totalBaths: totalBathrooms,
    halfBaths: totalHalfBaths, totalXtraFixtures, bathStyle, kitchenStyle,
    interiorCondition, finBsmntArea, finBsmntQual, grade,
    exteriorWall: [exteriorWall1, exteriorWall2].filter(Boolean).join(', '),
    roofStructure, roofCover,
    interiorWall: [interiorWall1, interiorWall2].filter(Boolean).join(', '),
    flooring: [interiorFlr1, interiorFlr2].filter(Boolean).join(', '),
    heating: heatType, heatingFuel: heatFuel, cooling: acType,
    buildingPhoto, ownershipHistory, subAreas, valuationHistory,
    propertyCardUrl: '', llcDetails: undefined as any,
  };
}

// ========== MAPXPRESS DATA EXTRACTOR ==========
function extractMapXpressData(markdown: string, address: string, town: string) {
  // MapXpress uses a similar table format
  return extractGenericPropertyData(markdown, address, town);
}

// ========== QDS CARD DATA EXTRACTOR (Avon-style) ==========
function extractQDSCardData(markdown: string, address: string, town: string) {
  const text = markdown;

  // Extract owner from "Owner name: NAME" format
  const ownerMatch = text.match(/Owner\s*name:\s*(.+)/i);
  let owner = ownerMatch?.[1]?.trim() || '';

  // Second name (co-owner)
  const secondMatch = text.match(/Second\s*name:\s*(.+)/i);
  const coOwner = secondMatch?.[1]?.trim() || '';

  // Mailing address
  const addrMatch = text.match(/Address:\s*(.+)/i);
  const cityMatch = text.match(/City\/state:\s*(.+?)(?:Zip:|$)/i);
  const zipMatch = text.match(/Zip:\s*(\S+)/i);
  const ownerAddress = [addrMatch?.[1]?.trim(), cityMatch?.[1]?.trim(), zipMatch?.[1]?.trim()].filter(Boolean).join(', ');

  // Location info
  const mapMatch = text.match(/Map:\s*(\S+)/i);
  const lotMatch = text.match(/Lot:\s*(\S+)/i);
  const neighMatch = text.match(/Neigh\.?:\s*(\S*)/i);
  const zoneMatch = text.match(/Zone:\s*(\S+)/i);
  const volMatch = text.match(/Vol:\s*(\S+)/i);
  const pageMatch = text.match(/Page:\s*(\S+)/i);
  const bookPage = volMatch?.[1] && pageMatch?.[1] ? `${volMatch[1]}/${pageMatch[1]}` : '';

  // Assessments
  const assessments: { category: string; qty: string; amount: string }[] = [];
  const assessRegex = /\|([\w\s]+?)\s+([\d.]+)\s+([\d,]+)\|/g;
  let am;
  while ((am = assessRegex.exec(text)) !== null) {
    if (!am[1].includes('Exempt') && !am[1].includes('Total') && !am[1].includes('Net')) {
      assessments.push({ category: am[1].trim(), qty: am[2], amount: am[3] });
    }
  }

  // Total assessment
  const totalAssessMatch = text.match(/Total\s*assessments\s+([\d,]+)/i);
  const totalAssessment = totalAssessMatch?.[1] || '';

  // Net assessment
  const netAssessMatch = text.match(/Net\s*assessment\s+([\d,]+)/i);
  const netAssessment = netAssessMatch?.[1] || '';

  // Sale info
  const saleDateMatch = text.match(/Sale\s*date:\s*([\w\-]+)/i);
  const salePriceMatch = text.match(/Sale\s*price:\s*([\d,]+)/i);
  const saleDate = saleDateMatch?.[1] || '';
  const salePrice = salePriceMatch?.[1] ? `$${salePriceMatch[1]}` : '';

  // Values
  const mktValueMatch = text.match(/Mkt\s*value\s*:\s*([\d,]+)/i);
  const costValueMatch = text.match(/Cost\s*value:\s*([\d,]+)/i);
  const mktValue = mktValueMatch?.[1] || '';
  const costValue = costValueMatch?.[1] || '';

  // Utilities
  const waterMatch = text.match(/Water\s+([\w\s]+?)(?:\||\n)/i);
  const sewerMatch = text.match(/Sewer\s+([\w\s]+?)(?:\||\n)/i);
  const gasMatch = text.match(/Gas\s+([\w\s]+?)(?:\||\n)/i);

  // Property ID from title
  const pidMatch = text.match(/Prop\s*ID\s*(\d+)/i);
  const parcelId = pidMatch?.[1] || lotMatch?.[1] || '';

  // PDF field card link
  const pdfMatch = text.match(/\[Street Card\]\((https?:\/\/[^\)]+\.pdf)\)/i);

  // Land vs building values from assessments
  let landValue = '', improvementsValue = '';
  for (const a of assessments) {
    if (a.category.toLowerCase().includes('land')) landValue = a.amount;
    if (a.category.toLowerCase().includes('building')) improvementsValue = a.amount;
  }

  owner = owner.replace(/[*#\[\]|]/g, '').replace(/<br\/?>/gi, ' ').replace(/\s+/g, ' ').trim();
  // Clean trailing pipes from all extracted fields
  const cleanPipe = (v: string) => v.replace(/\s*\|\s*$/g, '').trim();
  if (!owner || owner.length < 2) return null;

  const isLLC = /\bLLC\b|\bL\.L\.C\b|\bLimited Liability\b|\bLP\b|\bL\.P\b/i.test(owner);
  const fmt$ = (v: string) => v ? `$${v}` : '';

  return {
    address, town, owner, coOwner: cleanPipe(coOwner), ownerAddress: cleanPipe(ownerAddress), isLLC,
    parcelId, mblu: mapMatch?.[1] ? `${mapMatch[1]}/${lotMatch?.[1] || ''}` : '',
    accountNumber: '', buildingCount: String(assessments.filter(a => a.category.toLowerCase().includes('building')).length || ''),
    bookPage, certificate: '', instrument: '',
    bookPage, certificate: '', instrument: '',
    assessedValue: fmt$(netAssessment || totalAssessment),
    totalAppraisal: fmt$(costValue || mktValue),
    totalMarketValue: fmt$(mktValue),
    improvementsValue: fmt$(improvementsValue),
    landValue: fmt$(landValue),
    assessImprovements: '', assessLand: '',
    assessTotal: fmt$(netAssessment || totalAssessment),
    salePrice, saleDate,
    lotSize: assessments.find(a => a.category.toLowerCase().includes('land'))?.qty
      ? `${assessments.find(a => a.category.toLowerCase().includes('land'))!.qty} acres` : '',
    frontage: '', depth: '',
    useCode: '', useDescription: assessments.map(a => a.category).join(', '),
    zoning: zoneMatch?.[1] || '', neighborhood: neighMatch?.[1] || '',
    totalMarketLand: '', landAppraisedValue: '',
    yearBuilt: '', buildingStyle: '', model: '', stories: '',
    livingArea: '', replacementCost: '', buildingPercentGood: '',
    occupancy: '', totalRooms: '', bedrooms: '', totalBaths: '',
    halfBaths: '', totalXtraFixtures: '', bathStyle: '', kitchenStyle: '',
    interiorCondition: '', finBsmntArea: '', finBsmntQual: '', grade: '',
    exteriorWall: '', roofStructure: '', roofCover: '',
    interiorWall: '', flooring: '',
    heating: '', heatingFuel: gasMatch?.[1]?.trim() || '',
    cooling: '',
    buildingPhoto: '',
    ownershipHistory: [] as { owner: string; salePrice: string; bookPage: string; saleDate: string }[],
    subAreas: assessments.map(a => ({ code: a.category, description: a.category, grossArea: '', livingArea: a.amount })),
    valuationHistory: [] as { year: string; improvements: string; land: string; total: string }[],
    utilities: {
      water: waterMatch?.[1]?.trim() || '',
      sewer: sewerMatch?.[1]?.trim() || '',
      gas: gasMatch?.[1]?.trim() || '',
    },
    propertyCardUrl: '', fieldCardPdfUrl: pdfMatch?.[1] || '',
    llcDetails: undefined as any,
  };
}

// ========== QDS DATA EXTRACTOR (fallback) ==========
function extractQDSData(markdown: string, address: string, town: string) {
  return extractQDSCardData(markdown, address, town) || extractGenericPropertyData(markdown, address, town);
}

// ========== GENERIC PROPERTY DATA EXTRACTOR ==========
function extractGenericPropertyData(markdown: string, address: string, town: string) {
  const text = markdown;

  // Generic field grabber - tries multiple formats
  const grab = (labels: string[]): string => {
    for (const label of labels) {
      // Try table format "| Label | Value |"
      const tableRe = new RegExp(`\\|\\s*${label}:?\\s*\\|\\s*([^|]*?)\\s*\\|`, 'i');
      const tm = text.match(tableRe);
      if (tm?.[1]?.trim()) return tm[1].trim();

      // Try "Label: Value" format
      const colonRe = new RegExp(`${label}:?\\s+([^\\n]+)`, 'i');
      const cm = text.match(colonRe);
      if (cm?.[1]?.trim()) return cm[1].trim();

      // Try "**Label** Value" format
      const boldRe = new RegExp(`\\*\\*${label}\\*\\*\\s*:?\\s*([^\\n]+)`, 'i');
      const bm = text.match(boldRe);
      if (bm?.[1]?.trim()) return bm[1].trim();
    }
    return '';
  };

  const dollarGrab = (labels: string[]): string => {
    for (const label of labels) {
      const re = new RegExp(`${label}[:\\s]*\\$?([\\d,]+)`, 'i');
      const m = text.match(re);
      if (m?.[1]) return m[1].trim();
    }
    return '';
  };

  let owner = grab(['Owner', 'Owner Name', 'Property Owner', 'Owner/Taxpayer']);
  const coOwner = grab(['Co-Owner', 'Co Owner', 'Additional Owner']);

  let propertyAddress = grab(['Location', 'Property Location', 'Property Address', 'Street Address', 'Address']);
  if (!propertyAddress) propertyAddress = address;

  const parcelId = grab(['Parcel ID', 'Parcel', 'PID', 'Map/Block/Lot', 'MBL', 'MBLU', 'Account']);
  const accountNumber = grab(['Account', 'Acct', 'Account Number', 'Account #']);
  const ownerAddress = grab(['Mailing Address', 'Mail Address', 'Owner Address']);

  const assessedValue = dollarGrab(['Assessed Value', 'Total Assessment', 'Assessment', 'Net Assessment']);
  const totalAppraisal = dollarGrab(['Appraised Value', 'Total Appraisal', 'Appraisal', 'Market Value', 'Total Value']);
  const landValue = dollarGrab(['Land Value', 'Land Assessment', 'Land']);
  const improvementsValue = dollarGrab(['Improvements', 'Building Value', 'Building Assessment', 'Improvement Value']);

  const salePrice = grab(['Sale Price', 'Last Sale Price', 'Sales Price']);
  const saleDate = grab(['Sale Date', 'Last Sale Date', 'Date of Sale']);
  const bookPage = grab(['Book & Page', 'Book/Page', 'Volume/Page']);

  const lotSize = grab(['Lot Size', 'Acreage', 'Acres', 'Land Area', 'Size \\(Acres\\)']);
  const zoning = grab(['Zoning', 'Zone', 'Zoning District']);
  const useCode = grab(['Use Code', 'Property Use', 'Use', 'Land Use']);
  const useDescription = grab(['Use Description', 'Description', 'Property Type', 'Class']);
  const neighborhood = grab(['Neighborhood', 'NBHD', 'NBHD Code']);

  const yearBuilt = grab(['Year Built', 'Year Blt', 'Built']);
  const livingArea = grab(['Living Area', 'Total Living Area', 'Total Area', 'Square Feet', 'Sq Ft', 'GLA']);
  const buildingStyle = grab(['Style', 'Building Style', 'Design']);
  const stories = grab(['Stories', 'Number of Stories', 'Floors']);
  const totalRooms = grab(['Total Rooms', 'Rooms']);
  const bedrooms = grab(['Bedrooms', 'Total Bedrooms', 'BR']);
  const totalBaths = grab(['Total Bthrms', 'Full Baths', 'Bathrooms', 'Total Bathrooms']);
  const halfBaths = grab(['Half Baths', 'Total Half Baths']);

  const exteriorWall = grab(['Exterior Wall', 'Exterior', 'Ext Wall', 'Exterior Wall 1']);
  const roofCover = grab(['Roof Cover', 'Roof', 'Roof Material']);
  const heating = grab(['Heat Type', 'Heating', 'Heat System']);
  const heatingFuel = grab(['Heat Fuel', 'Fuel', 'Fuel Type']);
  const cooling = grab(['AC Type', 'Air Conditioning', 'Cooling', 'AC']);

  owner = owner.replace(/[*#\[\]]/g, '').replace(/<br\/?>/gi, ' ').trim();
  if (!owner || owner.length < 2) return null;

  const isLLC = /\bLLC\b|\bL\.L\.C\b|\bLimited Liability\b/i.test(owner);
  const fmt$ = (v: string) => v ? `$${v}` : '';

  return {
    address: propertyAddress, town, owner, coOwner, ownerAddress, isLLC,
    parcelId, mblu: '', accountNumber, buildingCount: '', bookPage, certificate: '', instrument: '',
    assessedValue: fmt$(assessedValue),
    totalAppraisal: fmt$(totalAppraisal),
    totalMarketValue: fmt$(totalAppraisal),
    improvementsValue: fmt$(improvementsValue),
    landValue: fmt$(landValue),
    assessImprovements: '', assessLand: '', assessTotal: fmt$(assessedValue),
    salePrice, saleDate,
    lotSize: lotSize && !lotSize.includes('acre') ? `${lotSize} acres` : lotSize,
    frontage: '', depth: '',
    useCode, useDescription, zoning, neighborhood,
    totalMarketLand: '', landAppraisedValue: '',
    yearBuilt, buildingStyle, model: '', stories,
    livingArea: livingArea && !livingArea.includes('sq') ? `${livingArea} sq ft` : livingArea,
    replacementCost: '', buildingPercentGood: '',
    occupancy: '', totalRooms, bedrooms, totalBaths, halfBaths,
    totalXtraFixtures: '', bathStyle: '', kitchenStyle: '',
    interiorCondition: '', finBsmntArea: '', finBsmntQual: '', grade: '',
    exteriorWall, roofStructure: '', roofCover,
    interiorWall: '', flooring: '',
    heating, heatingFuel, cooling,
    buildingPhoto: '',
    ownershipHistory: [] as { owner: string; salePrice: string; bookPage: string; saleDate: string }[],
    subAreas: [] as { code: string; description: string; grossArea: string; livingArea: string }[],
    valuationHistory: [] as { year: string; improvements: string; land: string; total: string }[],
    propertyCardUrl: '', llcDetails: undefined as any,
  };
}

// ========== LLC LOOKUP ==========
async function searchCTBusiness(_apiKey: string, businessName: string) {
  const CT_BUSINESS_API = 'https://data.ct.gov/resource/n7gp-d28j.json';
  const CT_AGENTS_API = 'https://data.ct.gov/resource/qh2m-n44y.json';

  const cleanName = businessName.replace(/[^a-zA-Z0-9\s&]/g, '').trim();
  console.log(`Searching CT Open Data for: ${cleanName}`);

  try {
    const searchQuery = encodeURIComponent(`upper(name) like '%${cleanName.toUpperCase()}%'`);
    const bizUrl = `${CT_BUSINESS_API}?$where=${searchQuery}&$limit=5`;
    const bizResp = await fetch(bizUrl);
    if (!bizResp.ok) return makeFallbackLLC(cleanName);

    const businesses = await bizResp.json();
    if (!Array.isArray(businesses) || businesses.length === 0) {
      const shortName = cleanName.replace(/\s*(LLC|L\.?L\.?C\.?|Inc|Corp)\s*$/i, '').trim();
      const retryQuery = encodeURIComponent(`upper(name) like '%${shortName.toUpperCase()}%'`);
      const retryResp = await fetch(`${CT_BUSINESS_API}?$where=${retryQuery}&$limit=5`);
      if (retryResp.ok) {
        const retryData = await retryResp.json();
        if (!Array.isArray(retryData) || retryData.length === 0) return makeFallbackLLC(cleanName);
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
    } catch (e) { console.error('Agent lookup error:', e); }
  }

  const fullStatus = subStatus ? `${status} (${subStatus})` : status;

  const rawLines = [
    `Business Name: ${bizName}`, `Account Number: ${accountNumber}`,
    `Status: ${fullStatus}`, `Business Type: ${businessType}`,
    `Date Registered: ${dateFormed}`, `Citizenship: ${citizenship}`,
    `Formation Place: ${formationPlace}`, `Mailing Address: ${mailingAddress}`,
    email ? `Business Email: ${email}` : '', naicsCode ? `NAICS Code: ${naicsCode}` : '',
    '', '--- Principals/Agents ---',
    ...principals.map(p => `${p.name} (${p.title})\n  Business: ${p.address}\n  Residence: ${p.residentialAddress}`),
    '', `Source: CT Open Data Portal (data.ct.gov)`, `Retrieved: ${new Date().toLocaleDateString('en-US')}`,
  ].filter(l => l !== undefined);

  return {
    mailingAddress, dateFormed, businessType, status: fullStatus,
    accountNumber, citizenship, formationPlace, email, naicsCode,
    principals: principals.length > 0
      ? principals.map(p => ({ name: `${p.name} (${p.title})`, address: p.residentialAddress || p.address }))
      : [{ name: 'No agents found in public records', address: '' }],
    rawMarkdown: rawLines.join('\n'),
  };
}

function makeFallbackLLC(cleanName: string) {
  return {
    mailingAddress: 'Could not retrieve automatically',
    dateFormed: 'N/A', businessType: 'Limited Liability Company', status: 'N/A',
    principals: [{ name: 'See CT Secretary of State records', address: `https://service.ct.gov/business/s/onlinebusinesssearch (search: ${cleanName})` }],
    rawMarkdown: '',
  };
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
