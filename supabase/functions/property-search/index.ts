const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Address abbreviation normalization
const ABBREVIATIONS: Record<string, string> = {
  street: "st",
  road: "rd",
  drive: "dr",
  avenue: "ave",
  lane: "ln",
  court: "ct",
  circle: "cir",
  boulevard: "blvd",
  place: "pl",
  terrace: "ter",
  way: "way",
  trail: "trl",
  highway: "hwy",
  parkway: "pkwy",
  turnpike: "tpke",
  extension: "ext",
  park: "pk",
};

// Reverse map: ST → STREET, LN → LANE etc.
const REVERSE_ABBR: Record<string, string> = {};
for (const [full, abbr] of Object.entries(ABBREVIATIONS)) {
  REVERSE_ABBR[abbr.toUpperCase()] = full.toUpperCase();
}

// Additional non-standard abbreviations used by some assessor databases
const EXTRA_SUFFIX_VARIANTS: Record<string, string[]> = {
  PARK: ["PK", "PRK"],
  PK: ["PARK", "PRK"],
  PRK: ["PARK", "PK"],
  PARKWAY: ["PKWY", "PKY", "PKWAY"],
  PKWY: ["PARKWAY", "PKY", "PKWAY"],
  DRIVE: ["DR", "DRV", "DRIV"],
  DR: ["DRIVE", "DRV"],
  STREET: ["ST", "STR"],
  ST: ["STREET", "STR"],
  ROAD: ["RD"],
  RD: ["ROAD"],
  AVENUE: ["AVE", "AV"],
  AVE: ["AVENUE", "AV"],
  LANE: ["LN", "LA"],
  LN: ["LANE", "LA"],
  COURT: ["CT", "CRT"],
  CT: ["COURT", "CRT"],
  CIRCLE: ["CIR", "CRCL", "CIRCL"],
  CIR: ["CIRCLE", "CRCL"],
  BOULEVARD: ["BLVD", "BLV"],
  BLVD: ["BOULEVARD", "BLV"],
  PLACE: ["PL", "PLC"],
  PL: ["PLACE", "PLC"],
  TERRACE: ["TER", "TERR", "TRCE"],
  TER: ["TERRACE", "TERR", "TRCE"],
  TRAIL: ["TRL", "TR"],
  TRL: ["TRAIL", "TR"],
  HIGHWAY: ["HWY", "HIWAY"],
  HWY: ["HIGHWAY"],
  TURNPIKE: ["TPKE", "TPK"],
  TPKE: ["TURNPIKE", "TPK"],
  EXTENSION: ["EXT", "EXTN"],
  EXT: ["EXTENSION", "EXTN"],
  WAY: ["WY"],
  WY: ["WAY"],
  RIDGE: ["RDG", "RDGE"],
  RDG: ["RIDGE"],
  CROSSING: ["XING", "XNG"],
  XING: ["CROSSING"],
  PATH: ["PTH"],
  PTH: ["PATH"],
  RUN: ["RN"],
};

function normalizeAddress(address: string): string {
  let normalized = address.trim();
  for (const [full, abbr] of Object.entries(ABBREVIATIONS)) {
    const re = new RegExp(`\\b${full}\\b`, "gi");
    normalized = normalized.replace(re, abbr.toUpperCase());
  }
  return normalized;
}

// Get ALL alternate address forms for matching
// e.g., "34 OWENOKE PARK" → ["34 OWENOKE PARK", "34 OWENOKE PK", "34 OWENOKE PRK"]
function getAddressVariants(address: string): string[] {
  const variants = new Set<string>([address]);
  const upper = address.toUpperCase();

  // Standard expansions/abbreviations
  for (const [abbr, full] of Object.entries(REVERSE_ABBR)) {
    const re = new RegExp(`\\b${abbr}\\.?\\b`, "g");
    if (re.test(upper)) variants.add(upper.replace(re, full));
  }
  for (const [full, abbr] of Object.entries(ABBREVIATIONS)) {
    const re = new RegExp(`\\b${full.toUpperCase()}\\b`, "g");
    if (re.test(upper)) variants.add(upper.replace(re, abbr.toUpperCase()));
  }

  // Extra suffix variants (PK ↔ PARK ↔ PRK, etc.)
  for (const [suffix, alts] of Object.entries(EXTRA_SUFFIX_VARIANTS)) {
    const re = new RegExp(`\\b${suffix}\\b`, "g");
    if (re.test(upper)) {
      for (const alt of alts) {
        variants.add(upper.replace(re, alt));
      }
    }
  }

  return [...variants];
}

// Verify extracted address matches the searched address (prevent wrong-property results)
function isAddressMatch(extractedAddr: string, searchAddr: string, houseNum: string): boolean {
  if (!extractedAddr) return true; // No address to check = assume ok
  const e = extractedAddr
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, " ")
    .trim();
  const s = searchAddr
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, " ")
    .trim();
  // Must contain the house number
  if (houseNum && !e.includes(houseNum)) return false;
  // Check if the street base name overlaps
  const searchWords = s
    .split(/\s+/)
    .filter((w) => w.length > 2 && !/^(ST|RD|DR|AVE|LN|CT|CIR|BLVD|PL|TER|WAY|TRL|HWY)$/.test(w));
  const matchCount = searchWords.filter((w) => e.includes(w)).length;
  return matchCount >= Math.min(2, searchWords.length);
}

// ========== PLATFORM TYPES ==========
type Platform = "vgs" | "mapxpress" | "qds" | "act" | "ias" | "equality" | "prc" | "avon_gis" | "arcgis_rest" | "custom";

interface TownConfig {
  platform: Platform;
  slug?: string; // VGS slug or MapXpress subdomain
  townCode?: string; // PropertyRecordCards.com town code
  url?: string; // Direct URL for custom/other platforms
  label?: string; // Human-readable platform name
}

// ========== COMPLETE CT TOWN DATABASE ==========
// All 169 CT towns mapped to their assessor database platform
const TOWN_DB: Record<string, TownConfig> = {
  // === VGS Towns (Vision Government Solutions) - from official vgsi.com list ===
  andover: { platform: "vgs", slug: "andoverct" },
  berlin: { platform: "vgs", slug: "berlinct" },
  bethlehem: { platform: "vgs", slug: "bethlehemct" },
  bolton: { platform: "vgs", slug: "BoltonCT" },
  branford: { platform: "vgs", slug: "branfordct" },
  bridgeport: { platform: "vgs", slug: "bridgeportct" },
  bridgewater: { platform: "vgs", slug: "bridgewaterct" },
  bristol: { platform: "vgs", slug: "bristolct" },
  brookfield: { platform: "vgs", slug: "brookfieldct" },
  brooklyn: { platform: "vgs", slug: "brooklynct" },
  burlington: { platform: "vgs", slug: "burlingtonct" },
  canterbury: { platform: "vgs", slug: "canterburyct" },
  canton: { platform: "vgs", slug: "cantonct" },
  chaplin: { platform: "vgs", slug: "chaplinct" },
  clinton: { platform: "vgs", slug: "clintonct" },
  cornwall: { platform: "vgs", slug: "CornwallCT" },
  coventry: { platform: "vgs", slug: "coventryct" },
  "deep river": { platform: "vgs", slug: "deepriverct" },
  "east granby": { platform: "vgs", slug: "EastGranbyCT" },
  "east haddam": { platform: "vgs", slug: "easthaddamct" },
  "east lyme": { platform: "vgs", slug: "eastlymect" },
  "east windsor": { platform: "vgs", slug: "eastwindsorct" },
  enfield: { platform: "vgs", slug: "EnfieldCT" },
  essex: { platform: "vgs", slug: "essexct" },
  fairfield: { platform: "vgs", slug: "fairfieldct" },
  glastonbury: { platform: "vgs", slug: "glastonburyct" },
  granby: { platform: "vgs", slug: "granbyct" },
  griswold: { platform: "vgs", slug: "griswoldct" },
  hamden: { platform: "vgs", slug: "hamdenct" },
  hampton: { platform: "vgs", slug: "hamptonct" },
  harwinton: { platform: "vgs", slug: "harwintonct" },
  lebanon: { platform: "vgs", slug: "LebanonCT" },
  ledyard: { platform: "vgs", slug: "LedyardCT" },
  lisbon: { platform: "vgs", slug: "LisbonCT" },
  lyme: { platform: "vgs", slug: "LymeCT" },
  madison: { platform: "vgs", slug: "madisonct" },
  manchester: { platform: "vgs", slug: "manchesterct" },
  mansfield: { platform: "vgs", slug: "mansfieldct" },
  meriden: { platform: "vgs", slug: "meridenct" },
  middlebury: { platform: "vgs", slug: "middleburyct" },
  middlefield: { platform: "vgs", slug: "MiddlefieldCT" },
  middletown: { platform: "vgs", slug: "MiddletownCT" },
  milford: { platform: "vgs", slug: "milfordct" },
  monroe: { platform: "vgs", slug: "monroect" },
  "new britain": { platform: "vgs", slug: "newbritainct" },
  "new fairfield": { platform: "vgs", slug: "newfairfieldct" },
  "new hartford": { platform: "vgs", slug: "newhartfordct" },
  "new haven": { platform: "vgs", slug: "newhavenct" },
  "new london": { platform: "vgs", slug: "newlondonct" },
  "new milford": { platform: "vgs", slug: "newmilfordct" },
  newtown: { platform: "vgs", slug: "newtownct" },
  "north branford": { platform: "vgs", slug: "northbranfordct" },
  norwich: { platform: "vgs", slug: "NorwichCT" },
  "old lyme": { platform: "vgs", slug: "oldlymect" },
  "old saybrook": { platform: "vgs", slug: "oldsaybrookct" },
  orange: { platform: "vgs", slug: "orangect" },
  plainfield: { platform: "vgs", slug: "PlainfieldCT" },
  pomfret: { platform: "vgs", slug: "pomfretct" },
  preston: { platform: "vgs", slug: "prestonct" },
  redding: { platform: "vgs", slug: "reddingct" },
  salem: { platform: "vgs", slug: "salemct" },
  salisbury: { platform: "vgs", slug: "salisburyct" },
  somers: { platform: "vgs", slug: "somersct" },
  "south windsor": { platform: "vgs", slug: "southwindsorct" },
  southbury: { platform: "vgs", slug: "southburyct" },
  southington: { platform: "vgs", slug: "southingtonct" },
  sprague: { platform: "vgs", slug: "spraguect" },
  stafford: { platform: "vgs", slug: "staffordct" },
  stamford: { platform: "vgs", slug: "stamfordct" },
  sterling: { platform: "vgs", slug: "sterlingct" },
  stonington: { platform: "vgs", slug: "stoningtonct" },
  stratford: { platform: "vgs", slug: "stratfordct" },
  thompson: { platform: "vgs", slug: "thompsonct" },
  tolland: { platform: "vgs", slug: "tollandct" },
  trumbull: { platform: "vgs", slug: "trumbullct" },
  union: { platform: "vgs", slug: "UnionCT" },
  wallingford: { platform: "vgs", slug: "wallingfordct" },
  waterford: { platform: "vgs", slug: "waterfordct" },
  westbrook: { platform: "vgs", slug: "westbrookct" },
  "west hartford": { platform: "vgs", slug: "westhartfordct" },
  "west haven": { platform: "vgs", slug: "westhavenct" },
  westport: { platform: "vgs", slug: "westportct" },
  willington: { platform: "vgs", slug: "WillingtonCT" },
  winchester: { platform: "vgs", slug: "WinchesterCT" },
  windham: { platform: "vgs", slug: "windhamCT" },

  // === ACT Data Scout Towns ===
  kent: { platform: "act", slug: "Kent", url: "https://www.actdatascout.com/RealProperty/Connecticut/Kent" },
  norwalk: { platform: "act", slug: "Norwalk", url: "https://www.actdatascout.com/RealProperty/Connecticut/Norwalk" },
  sharon: { platform: "act", slug: "Sharon", url: "https://www.actdatascout.com/RealProperty/Connecticut/Sharon" },

  // === PropertyRecordCards.com Towns (QDS/PRC platform) ===
  ansonia: { platform: "prc", townCode: "002" },
  ashford: { platform: "prc", townCode: "003" },
  bethany: { platform: "prc", townCode: "008" },
  bozrah: { platform: "prc", townCode: "013" },
  canaan: { platform: "prc", townCode: "021" },
  cheshire: { platform: "prc", townCode: "025" },
  chester: { platform: "prc", townCode: "026" },
  colebrook: { platform: "prc", townCode: "029" },
  columbia: { platform: "prc", townCode: "030" },
  danbury: { platform: "prc", townCode: "034" },
  derby: { platform: "prc", townCode: "037" },
  durham: { platform: "prc", townCode: "038" },
  "east hampton": { platform: "prc", townCode: "042" },
  "east haven": { platform: "prc", townCode: "044" },
  eastford: { platform: "prc", townCode: "039" },
  easton: { platform: "prc", townCode: "046" },
  ellington: { platform: "prc", townCode: "048" },
  farmington: { platform: "prc", townCode: "052" },
  franklin: { platform: "prc", townCode: "053" },
  guilford: { platform: "prc", townCode: "060" },
  haddam: { platform: "prc", townCode: "061" },
  hebron: { platform: "prc", townCode: "067" },
  killingly: { platform: "prc", townCode: "069" },
  killingworth: { platform: "prc", townCode: "070" },
  marlborough: { platform: "prc", townCode: "079" },
  montville: { platform: "prc", townCode: "086" },
  naugatuck: { platform: "prc", townCode: "088" },
  "new canaan": { platform: "prc", townCode: "090" },
  newington: { platform: "prc", townCode: "094" },
  norfolk: { platform: "prc", townCode: "098" },
  "north canaan": { platform: "prc", townCode: "100" },
  "north haven": { platform: "prc", townCode: "101" },
  "north stonington": { platform: "prc", townCode: "102" },
  oxford: { platform: "prc", townCode: "108" },
  plainville: { platform: "prc", townCode: "110" },
  plymouth: { platform: "prc", townCode: "111" },
  prospect: { platform: "prc", townCode: "115" },
  ridgefield: { platform: "prc", townCode: "118" },
  "rocky hill": { platform: "prc", townCode: "119" },
  roxbury: { platform: "prc", townCode: "120" },
  scotland: { platform: "prc", townCode: "123" },
  seymour: { platform: "prc", townCode: "124" },
  shelton: { platform: "prc", townCode: "126" },
  sherman: { platform: "prc", townCode: "127" },
  simsbury: { platform: "prc", townCode: "128" },
  suffield: { platform: "prc", townCode: "139" },
  torrington: { platform: "prc", townCode: "143" },
  voluntown: { platform: "prc", townCode: "147" },
  warren: { platform: "prc", townCode: "149" },
  washington: { platform: "prc", townCode: "150" },
  waterbury: { platform: "prc", townCode: "151" },
  watertown: { platform: "prc", townCode: "153" },
  weston: { platform: "prc", townCode: "157" },
  wilton: { platform: "prc", townCode: "161" },
  "windsor locks": { platform: "prc", townCode: "165" },
  woodbridge: { platform: "prc", townCode: "167" },
  woodbury: { platform: "prc", townCode: "168" },

  // === Avon GIS (Tighebond ArcGIS REST API) ===
  avon: {
    platform: "avon_gis",
    url: "https://hostingdata4.tighebond.com/arcgis/rest/services/AvonCT/AvonDynamic_Public/MapServer/0",
    label: "Town of Avon GIS",
  },

  // === IAS-CLT Towns ===
  bethel: { platform: "ias", url: "http://bethel.ias-clt.com/", label: "Bethel Assessor" },
  "east hartford": { platform: "ias", url: "https://easthartford.ias-clt.com/", label: "East Hartford Assessor" },
  hartford: { platform: "ias", url: "https://hartford.ias-clt.com/", label: "Hartford Assessor" },

  // === MapXpress Towns (direct ASP search + detail pages) ===
  bloomfield: { platform: "mapxpress", slug: "bloomfield", url: "https://bloomfield.mapxpress.net" },
  wethersfield: { platform: "mapxpress", slug: "wethersfield", url: "https://wethersfield.mapxpress.net" },
  windsor: { platform: "mapxpress", slug: "windsor", url: "https://windsor.mapxpress.net" },
  groton: { platform: "mapxpress", slug: "groton", url: "https://groton.mapxpress.net" },

  // === Towns with custom/dedicated assessment sites ===
  darien: { platform: "custom", url: "https://assessment.darienct.gov/Search/commonsearch.aspx?mode=address", label: "Darien Assessor" },

  // === Remaining custom towns ===
  barkhamsted: { platform: "custom", url: "https://www.barkhamsted.us/", label: "Barkhamsted Assessor" },
  "beacon falls": { platform: "custom", url: "https://www.beaconfalls-ct.org/", label: "Beacon Falls Assessor" },
  colchester: { platform: "custom", url: "https://colchesterct.gov/", label: "Colchester Assessor" },
  cromwell: { platform: "custom", url: "https://www.cromwellct.com/", label: "Cromwell Assessor" },
  goshen: { platform: "custom", url: "https://www.goshenct.gov/", label: "Goshen Assessor" },
  greenwich: { platform: "custom", url: "https://www.greenwichct.gov/349/Assessment", label: "Greenwich Assessor" },
  hartland: { platform: "custom", url: "https://www.hartlandct.org/", label: "Hartland Assessor" },
  litchfield: { platform: "custom", url: "https://www.townoflitchfield.org/", label: "Litchfield Assessor" },
  morris: { platform: "custom", url: "https://www.townofmorrisct.com/", label: "Morris Assessor" },
  portland: { platform: "custom", url: "https://www.portlandct.org/", label: "Portland Assessor" },
  putnam: { platform: "custom", url: "https://www.putnamct.us/", label: "Putnam Assessor" },
  thomaston: { platform: "custom", url: "https://www.thomastonct.org/", label: "Thomaston Assessor" },
  vernon: { platform: "custom", url: "https://www.vernon-ct.gov/", label: "Vernon Assessor" },
  wolcott: { platform: "custom", url: "https://www.wolcottct.org/", label: "Wolcott Assessor" },
  woodstock: { platform: "custom", url: "https://www.woodstockct.gov/", label: "Woodstock Assessor" },
};

const TOWN_ALIASES: Record<string, string> = {
  "south glastonbury": "glastonbury",
  "east glastonbury": "glastonbury",
  "south norwalk": "norwalk",
  "cos cob": "greenwich",
  "old greenwich": "greenwich",
  riverside: "greenwich",
  glenville: "greenwich",
  "central village": "plainfield",
  moosup: "plainfield",
  wauregan: "plainfield",
  niantic: "east lyme",
  pawcatuck: "stonington",
  oakdale: "montville",
  uncasville: "montville",
  "quaker hill": "waterford",
  taftville: "norwich",
  greenville: "norwich",
  occum: "norwich",
  amston: "hebron",
  hadlyme: "east haddam",
  higganum: "haddam",
  "north grosvenordale": "thompson",
  grosvenordale: "thompson",
  thompsonville: "enfield",
  hazardville: "enfield",
};

function resolveTownLookup(town: string): { lookupTown: string; config?: TownConfig } {
  const townLower = town.toLowerCase().trim().replace(/\s+/g, " ");
  const exact = TOWN_DB[townLower];
  if (exact) return { lookupTown: townLower, config: exact };

  const aliasedTown = TOWN_ALIASES[townLower];
  if (aliasedTown && TOWN_DB[aliasedTown]) {
    return { lookupTown: aliasedTown, config: TOWN_DB[aliasedTown] };
  }

  const directionalMatch = townLower.match(/^(north|south|east|west)\s+(.+)$/);
  if (directionalMatch) {
    const baseTown = directionalMatch[2].trim();
    const directionalBase = TOWN_DB[baseTown];
    if (directionalBase) return { lookupTown: baseTown, config: directionalBase };
  }

  return { lookupTown: townLower, config: TOWN_DB[townLower] };
}

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
    const { lookupTown, config } = resolveTownLookup(town);
    console.log(`Searching: ${normalizedAddress}, ${town}, CT`);
    if (lookupTown !== town.toLowerCase().trim()) {
      console.log(`Resolved lookup town: ${town} -> ${lookupTown}`);
    }

    const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!apiKey) {
      return json({ success: false, error: "Scraping service not configured" }, 500);
    }

    if (!config) {
      console.log(`Town "${town}" not in DB — trying dynamic scrape`);
      // Even without config, try a dynamic scrape approach
      const dynamicResult = await scrapeDynamic(apiKey, normalizedAddress, lookupTown, town);
      return dynamicResult;
    }

    // For 'custom' platform towns, use dynamic interactive scraping
    if (config.platform === "custom") {
      console.log(`Custom platform for ${town}, using dynamic scraper on ${config.url}`);
      const dynamicResult = await scrapeCustomSite(apiKey, config.url!, normalizedAddress, town);
      return dynamicResult;
    }

    // Try platform-specific scraper using canonical lookup town
    let result: Response;
    try {
      switch (config.platform) {
        case "vgs":
          result = await scrapeVGS(apiKey, config.slug!, normalizedAddress, lookupTown);
          break;
        case "mapxpress":
          result = await scrapeMapXpress(apiKey, config.url!, normalizedAddress, lookupTown);
          break;
        case "qds":
          result = await scrapeQDS(apiKey, config.url!, normalizedAddress, lookupTown);
          break;
        case "act":
          result = await scrapeACTDataScout(apiKey, config.url!, normalizedAddress, lookupTown);
          break;
        case "ias":
          result = await scrapeIASCLT(apiKey, config.url!, normalizedAddress, lookupTown);
          break;
        case "prc":
          result = await scrapePRC(apiKey, config.townCode!, normalizedAddress, lookupTown);
          break;
        case "equality":
          result = await scrapeEqualityCama(apiKey, config.url!, normalizedAddress, lookupTown);
          break;
        case "avon_gis":
          result = await scrapeAvonGIS(apiKey, normalizedAddress, lookupTown);
          break;
        default:
          result = json({ success: false });
          break;
      }
    } catch (e) {
      console.error(`Platform ${config.platform} threw:`, e);
      result = json({ success: false });
    }

    try {
      const body = await result.clone().json();
      if (body.success) {
        if (lookupTown !== town.toLowerCase().trim() && body.property) {
          body.property.town = town;
        }
        return json(body);
      }
      console.log(`Platform ${config.platform} failed for ${town}`);
    } catch {
      console.log(`Could not parse platform response`);
    }

    return json({
      success: false,
      error: `Could not find property data for ${address} in ${town}. Try the assessor database directly.`,
      searchUrl: config.url || "",
    });
  } catch (error) {
    console.error("Error:", error);
    return json({ success: false, error: error instanceof Error ? error.message : "Search failed" }, 500);
  }
});

// ========== AVON GIS (Tighebond ArcGIS REST API) ==========
async function scrapeAvonGIS(apiKey: string, address: string, town: string): Promise<Response> {
  const AVON_GIS_URL =
    "https://hostingdata4.tighebond.com/arcgis/rest/services/AvonCT/AvonDynamic_Public/MapServer/0/query";

  const addrParts = address.match(/^(\d+)\s+(.+)$/i);
  const houseNum = addrParts?.[1] || "";
  const streetName = addrParts?.[2] || address;
  const streetBase = streetName
    .replace(
      /\s+(ST|RD|DR|AVE|LN|CT|CIR|BLVD|PL|PK|PRK|TER|WAY|TRL|HWY|PKWY|TPKE|EXT|STREET|ROAD|DRIVE|AVENUE|LANE|COURT|CIRCLE|BOULEVARD|PLACE|PARK|TERRACE|TRAIL|HIGHWAY)\.?$/i,
      "",
    )
    .trim();

  // Build all query variants
  const whereSet = new Set<string>();
  whereSet.add(`CAMA.STRLOC = '${address}'`);
  whereSet.add(`CAMA.STRLOC LIKE '${houseNum} ${streetName}%'`);
  if (streetBase !== streetName) whereSet.add(`CAMA.STRLOC LIKE '${houseNum} ${streetBase}%'`);
  for (const v of getAddressVariants(address)) {
    if (v !== address) whereSet.add(`CAMA.STRLOC LIKE '${v}%'`);
  }

  console.log(`Avon GIS: searching for ${address} with ${whereSet.size} parallel queries`);

  // Fire ALL queries in parallel
  const queryFn = async (where: string) => {
    const params = new URLSearchParams({ where, outFields: "*", f: "json", returnGeometry: "false" });
    const resp = await fetch(`${AVON_GIS_URL}?${params.toString()}`);
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.features?.length > 0 ? data.features : null;
  };

  const results = await Promise.all([...whereSet].map(queryFn));

  // Find first result with features
  let best: any = null;
  for (const features of results) {
    if (!features) continue;
    for (const f of features) {
      const strloc = (f.attributes["CAMA.STRLOC"] || "").toUpperCase();
      if (strloc.startsWith(houseNum + " ")) {
        best = f;
        break;
      }
    }
    if (best) break;
    best = features[0]; // fallback to first result
    break;
  }

  if (!best) {
    return json({
      success: false,
      error: `Could not find "${address}" in Avon GIS database.`,
      searchUrl: "https://hosting.tighebond.com/AvonCT_public/index.html",
    });
  }

  const a = best.attributes;
  const owner = (a["CAMA.NAME"] || "").trim();
  const coOwner = (a["CAMA.NDNA"] || "").trim();
  if (!owner || owner.length < 3) {
    return json({
      success: false,
      error: `Could not find "${address}" in Avon GIS database.`,
      searchUrl: "https://hosting.tighebond.com/AvonCT_public/index.html",
    });
  }

  console.log(`Avon GIS found: ${owner}, ${a["CAMA.STRLOC"]}`);
  const isLLC = /\bLLC\b|\bL\.L\.C\b|\bLimited Liability\b/i.test(owner + " " + coOwner);
  const recordCardUrl = a["CAMA.RecordCard"] || "";

  const prop: any = {
    address: a["CAMA.STRLOC"] || address,
    town: "Avon",
    owner,
    coOwner,
    ownerAddress: [a["CAMA.STREET"], a["CAMA.CITY"], a["CAMA.ST"], (a["CAMA.ZIP"] || "").trim()]
      .filter(Boolean)
      .join(", "),
    isLLC,
    parcelId: a["CAMA.GISPin"] || a["Cadastral_MDB_Parcels.PARNO"] || "",
    mblu: "",
    accountNumber: String(a["CAMA.ACCT"] || ""),
    buildingCount: "",
    bookPage: `Vol ${a["CAMA.VOL"] || ""} / Pg ${a["CAMA.PAGE"] || ""}`,
    certificate: "",
    instrument: "",
    assessedValue: a["CAMA.TOTVAL"] || "",
    totalAppraisal: a["CAMA.APRTOT"] || "",
    totalMarketValue: "",
    improvementsValue: a["CAMA.BLDVAL"] || "",
    landValue: a["CAMA.LNDVAL"] || "",
    assessImprovements: "",
    assessLand: "",
    assessTotal: a["CAMA.TOTVAL"] || "",
    salePrice: a["CAMA.SALEPR"] ? `$${Number(a["CAMA.SALEPR"]).toLocaleString()}` : "",
    saleDate: a["CAMA.SDATE"] || "",
    lotSize: a["CAMA.ACRES"] || "",
    frontage: "",
    depth: "",
    useCode: "",
    useDescription: a["Cadastral_MDB_Parcels.PROPERTYTYPE"] || "",
    zoning: a["CAMA.ZONE"] || "",
    neighborhood: "",
    totalMarketLand: "",
    landAppraisedValue: "",
    yearBuilt: a["CAMA.YRBUILT"] || "",
    buildingStyle: a["CAMA.STYLE"] || "",
    model: "",
    stories: a["CAMA.STORIES"] || "",
    livingArea: a["CAMA.SFLA"] || "",
    replacementCost: "",
    buildingPercentGood: "",
    occupancy: "",
    totalRooms: a["CAMA.RMTOT"] || "",
    bedrooms: a["CAMA.RMBED"] || "",
    totalBaths: a["CAMA.FIXBATH"] || "",
    halfBaths: a["CAMA.FIXHALF"] || "",
    totalXtraFixtures: "",
    bathStyle: "",
    kitchenStyle: "",
    interiorCondition: "",
    finBsmntArea: "",
    finBsmntQual: "",
    grade: a["CAMA.GRADE"] || "",
    exteriorWall: a["CAMA.EXTWALL"] || "",
    roofStructure: a["CAMA.ROOFTYP"] || "",
    roofCover: a["CAMA.ROOFMAT"] || "",
    interiorWall: "",
    flooring: "",
    heating: a["CAMA.HEAT"] || "",
    heatingFuel: a["CAMA.FUEL"] || "",
    cooling: a["CAMA.COOL"] || "",
    buildingPhoto: "",
    garage: "",
    pool: "",
    fireplace: a["CAMA.FIREPLC"] || "",
    foundation: "",
    taxAmount: "",
    water: a["CAMA.WATER"] || "",
    sewer: a["CAMA.SEWER"] || "",
    gas: a["CAMA.GAS"] || "",
    ownershipHistory: [],
    subAreas: [],
    valuationHistory: [],
    propertyCardUrl: recordCardUrl || "https://hosting.tighebond.com/AvonCT_public/index.html",
    llcDetails: undefined as any,
  };

  // LLC lookup removed - handled separately by frontend

  return json({ success: true, property: prop });
}

// Try to scrape the Avon assessor record card for building details
async function scrapeAvonRecordCard(apiKey: string, url: string): Promise<any> {
  try {
    const resp = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        formats: ["extract"],
        extract: {
          prompt: "Extract all property assessment data from this Avon CT property record card.",
          schema: {
            type: "object",
            properties: {
              assessedValue: { type: "string" },
              totalAppraisal: { type: "string" },
              totalMarketValue: { type: "string" },
              improvementsValue: { type: "string" },
              landValue: { type: "string" },
              yearBuilt: { type: "string" },
              livingArea: { type: "string" },
              lotSize: { type: "string" },
              bedrooms: { type: "string" },
              totalBaths: { type: "string" },
              halfBaths: { type: "string" },
              totalRooms: { type: "string" },
              stories: { type: "string" },
              buildingStyle: { type: "string" },
              exteriorWall: { type: "string" },
              roofStructure: { type: "string" },
              roofCover: { type: "string" },
              foundation: { type: "string" },
              heating: { type: "string" },
              heatingFuel: { type: "string" },
              cooling: { type: "string" },
              flooring: { type: "string" },
              garage: { type: "string" },
              pool: { type: "string" },
              fireplace: { type: "string" },
              basement: { type: "string" },
              grade: { type: "string" },
              propertyType: { type: "string" },
              taxAmount: { type: "string" },
            },
          },
        },
      }),
    });
    if (!resp.ok) return {};
    const ex = (await resp.json())?.data?.extract;
    return ex || {};
  } catch {
    return {};
  }
}

// ========== VGS SCRAPING ==========
async function scrapeVGS(apiKey: string, slug: string, address: string, town: string) {
  const searchUrl = `https://gis.vgsi.com/${slug}/Search.aspx`;
  const baseUrl = `https://gis.vgsi.com/${slug}`;

  const addrParts = address.match(/^(\d+)\s+(.+)$/i);
  const houseNum = addrParts?.[1] || "";
  const streetFull = addrParts?.[2] || address;
  const streetBase = streetFull
    .replace(
      /\s+(ST|RD|DR|AVE|LN|CT|CIR|BLVD|PL|PK|PRK|TER|WAY|TRL|HWY|PKWY|TPKE|EXT|PARK|STREET|ROAD|DRIVE|AVENUE|LANE|COURT|CIRCLE|BOULEVARD|PLACE|TERRACE|TRAIL|HIGHWAY)\.?$/i,
      "",
    )
    .trim();

  const allVariants = getAddressVariants(address);
  const searchTexts = new Set<string>();
  searchTexts.add(houseNum ? `${houseNum} ${streetBase.toLowerCase()}` : address.toLowerCase());
  for (const v of allVariants) {
    const parts = v.match(/^(\d+)\s+(.+)$/i);
    if (parts) searchTexts.add(`${parts[1]} ${parts[2].toLowerCase()}`);
  }

  console.log(`VGS: ${allVariants.length} address variants, ${searchTexts.size} search texts`);

  const searchTextArr = [...searchTexts];
  for (const searchText of searchTextArr) {
    try {
      console.log(`Trying VGS with actions (search: "${searchText}")`);
      const resp = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          url: searchUrl,
          formats: ["markdown", "links", "html"],
          waitFor: 1500,
          actions: [
            { type: "wait", milliseconds: 500 },
            { type: "click", selector: 'input[id*="TextBox_Search"], input[id*="txtSearch"], input[type="text"]' },
            { type: "write", text: searchText },
            { type: "wait", milliseconds: 2500 },
            {
              type: "click",
              selector:
                ".ui-autocomplete li:first-child a, .ui-menu-item:first-child a, ul.ui-autocomplete li:first-child",
            },
            { type: "wait", milliseconds: 3000 },
          ],
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const markdown = data.data?.markdown || data.markdown || "";
        const html = data.data?.html || data.html || "";
        const finalUrl = data.data?.metadata?.url || data.data?.metadata?.sourceURL || "";

        // Extract PID from URL or page content
        let pid = "";
        const pidFromUrl = finalUrl.match(/[Pp]id=(\d+)/);
        if (pidFromUrl) pid = pidFromUrl[1];
        if (!pid) {
          const pidFromContent = (html + markdown).match(/Parcel\.aspx\?[Pp]id=(\d+)/);
          if (pidFromContent) pid = pidFromContent[1];
        }

        if (pid) {
          // STEP 1: Scrape the full property card print view (shows ALL data on one page)
          const printUrl = `${baseUrl}/Parcel.aspx?Pid=${pid}`;
          console.log(`VGS: Scraping full property detail: ${printUrl}`);
          const fullMd = await firecrawlScrapeFullPage(apiKey, printUrl);
          if (fullMd) {
            const extracted = extractVGSData(fullMd, address, town);
            if (extracted && extracted.owner && !extracted.owner.includes("Enter an")) {
              extracted.propertyCardUrl = printUrl;

              // STEP 2: Try to get additional data from tabbed sections
              // Scrape with tab clicks to get Building, Land, and Ownership History tabs
              try {
                const tabResp = await fetch("https://api.firecrawl.dev/v1/scrape", {
                  method: "POST",
                  headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
                  body: JSON.stringify({
                    url: printUrl,
                    formats: ["markdown"],
                    onlyMainContent: false,
                    waitFor: 1000,
                    actions: [
                      { type: "wait", milliseconds: 500 },
                      // Click "Building" tab
                      { type: "click", selector: 'a[href*="Building"], a:has-text("Building Information"), #tabBuilding, [data-tab="building"]' },
                      { type: "wait", milliseconds: 1500 },
                    ],
                  }),
                });
                if (tabResp.ok) {
                  const tabData = await tabResp.json();
                  const tabMd = tabData.data?.markdown || tabData.markdown || "";
                  if (tabMd.length > 200) {
                    // Merge any missing building fields from tab data
                    const tabExtracted = extractVGSData(tabMd, address, town);
                    if (tabExtracted) {
                      mergeVGSFields(extracted, tabExtracted);
                    }
                  }
                }
              } catch (e) {
                console.log("Tab scraping optional, continuing:", e);
              }

              return json({ success: true, property: extracted });
            }
          }

          // Fallback: scrape the basic detail page
          return await scrapePropertyDetail(apiKey, `${baseUrl}/Parcel.aspx?Pid=${pid}`, address, town);
        }

        // If we landed on the detail page directly
        if (
          finalUrl.includes("Parcel.aspx") ||
          markdown.includes("Parcel ID") ||
          markdown.includes("Total Market Value")
        ) {
          const extracted = extractVGSData(markdown, address, town);
          if (extracted && extracted.owner && !extracted.owner.includes("Enter an")) {
            extracted.propertyCardUrl = finalUrl;
            return json({ success: true, property: extracted });
          }
        }
      }
    } catch (e) {
      console.error("Actions error:", e);
    }
  }

  return json({
    success: false,
    error: `Could not find property in ${town}. Try the assessor database directly.`,
    searchUrl,
  });
}

// Merge missing fields from secondary VGS scrape into primary
function mergeVGSFields(primary: any, secondary: any) {
  const fields = [
    'yearBuilt', 'buildingStyle', 'stories', 'livingArea', 'totalRooms', 'bedrooms',
    'totalBaths', 'halfBaths', 'grade', 'exteriorWall', 'roofStructure', 'roofCover',
    'interiorWall', 'flooring', 'heating', 'heatingFuel', 'cooling', 'garage', 'pool',
    'fireplace', 'foundation', 'finBsmntArea', 'finBsmntQual', 'bathStyle', 'kitchenStyle',
    'interiorCondition', 'replacementCost', 'buildingPercentGood', 'buildingPhoto',
    'occupancy', 'totalXtraFixtures', 'model',
  ];
  for (const f of fields) {
    if (!primary[f] && secondary[f]) primary[f] = secondary[f];
  }
  if ((!primary.subAreas || primary.subAreas.length === 0) && secondary.subAreas?.length > 0) {
    primary.subAreas = secondary.subAreas;
  }
  if ((!primary.ownershipHistory || primary.ownershipHistory.length === 0) && secondary.ownershipHistory?.length > 0) {
    primary.ownershipHistory = secondary.ownershipHistory;
  }
  if ((!primary.valuationHistory || primary.valuationHistory.length === 0) && secondary.valuationHistory?.length > 0) {
    primary.valuationHistory = secondary.valuationHistory;
  }
}

// ========== MAPXPRESS SCRAPING (Direct ASP API) ==========
async function scrapeMapXpress(apiKey: string, baseUrl: string, address: string, town: string) {
  try {
    const addrParts = address.match(/^(\d+)\s+(.+)$/i);
    const houseNum = addrParts?.[1] || "";
    const streetFull = addrParts?.[2] || address;
    const streetBase = streetFull
      .replace(/\s+(ST|RD|DR|AVE|LN|CT|CIR|BLVD|PL|PK|PRK|TER|WAY|TRL|HWY|PKWY|TPKE|EXT|STREET|ROAD|DRIVE|AVENUE|LANE|COURT|CIRCLE|BOULEVARD|PLACE|PARK|TERRACE|TRAIL|HIGHWAY)\.?$/i, "")
      .trim();

    console.log(`MapXpress direct: searching ${baseUrl} for #${houseNum} on ${streetBase}`);

    // STEP 1: POST to search.asp to find the UNIQUE_ID
    const searchUrl = `${baseUrl.replace(/\/$/, "")}/PAGES/search.asp`;
    const searchBody = `searchname=&houseno=${encodeURIComponent(houseNum)}&street=${encodeURIComponent(streetBase)}&unique_id=&go.x=1&go.y=1`;

    const searchResp = await fetch(searchUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": `${baseUrl}/portal.asp`,
      },
      body: searchBody,
    });

    if (!searchResp.ok) {
      console.log(`MapXpress search POST failed: ${searchResp.status}`);
      // Fallback to Firecrawl scraping of detail page
      return await scrapeMapXpressFallback(apiKey, baseUrl, address, town, houseNum, streetBase);
    }

    const searchHtml = await searchResp.text();
    console.log(`MapXpress search response: ${searchHtml.length} chars`);

    // Parse search results to find matching UNIQUE_ID
    // Format: UNIQUE_ID<br>ACCOUNT<br>OWNER<br>ADDRESS
    const resultPattern = /(\d+)<br>\s*(R?\d+)<br>\s*([^<]+)<br>\s*(\d+\s+[^<]+)<br>/gi;
    const matches: { uniqueId: string; account: string; owner: string; addr: string }[] = [];
    let m;
    while ((m = resultPattern.exec(searchHtml)) !== null) {
      matches.push({ uniqueId: m[1], account: m[2].trim(), owner: m[3].trim(), addr: m[4].trim() });
    }

    console.log(`MapXpress: found ${matches.length} results`);

    // Find the best matching result
    let bestMatch = matches[0]; // default to first
    if (matches.length > 1) {
      const streetUpper = streetBase.toUpperCase();
      const found = matches.find(r => {
        const addrUpper = r.addr.toUpperCase();
        return addrUpper.startsWith(houseNum) && addrUpper.includes(streetUpper);
      });
      if (found) bestMatch = found;
    }

    if (!bestMatch) {
      console.log(`MapXpress: no results for ${address}`);
      return json({
        success: false,
        error: `Could not find "${address}" in ${town} MapXpress database.`,
        searchUrl: baseUrl,
      });
    }

    console.log(`MapXpress: best match UNIQUE_ID=${bestMatch.uniqueId}, addr=${bestMatch.addr}`);

    // STEP 2: Scrape the detail page using Firecrawl (detail.asp requires session/cookies)
    const detailUrl = `${baseUrl.replace(/\/$/, "")}/PAGES/detail.asp?UNIQUE_ID=${bestMatch.uniqueId}`;
    console.log(`MapXpress: scraping detail page: ${detailUrl}`);

    const detailMd = await firecrawlScrapeFullPage(apiKey, detailUrl);
    if (detailMd && detailMd.length > 200) {
      const extracted = extractMapXpressDetailData(detailMd, address, town, bestMatch);
      if (extracted) {
        extracted.propertyCardUrl = detailUrl;
        // Also try summary card for additional data
        const summaryUrl = `${baseUrl.replace(/\/$/, "")}/ags_map/property_card.asp?UNIQUE_ID=${bestMatch.uniqueId}`;
        extracted.summaryCardUrl = summaryUrl;
        return json({ success: true, property: extracted });
      }
    }

    // STEP 3: Even if detail scrape fails, return basic data from search results
    const isLLC = /\bLLC\b|\bL\.L\.C\b|\bLimited Liability\b/i.test(bestMatch.owner);
    return json({
      success: true,
      property: {
        address: bestMatch.addr,
        town,
        owner: bestMatch.owner,
        coOwner: "",
        ownerAddress: "",
        isLLC,
        parcelId: bestMatch.uniqueId,
        mblu: "",
        accountNumber: bestMatch.account,
        buildingCount: "", bookPage: "", certificate: "", instrument: "",
        assessedValue: "", totalAppraisal: "", totalMarketValue: "",
        improvementsValue: "", landValue: "",
        assessImprovements: "", assessLand: "", assessTotal: "",
        salePrice: "", saleDate: "", lotSize: "", frontage: "", depth: "",
        useCode: "", useDescription: "", zoning: "", neighborhood: "",
        totalMarketLand: "", landAppraisedValue: "",
        yearBuilt: "", buildingStyle: "", model: "", stories: "",
        livingArea: "", replacementCost: "", buildingPercentGood: "",
        occupancy: "", totalRooms: "", bedrooms: "", totalBaths: "", halfBaths: "",
        totalXtraFixtures: "", bathStyle: "", kitchenStyle: "", interiorCondition: "",
        finBsmntArea: "", finBsmntQual: "", grade: "",
        exteriorWall: "", roofStructure: "", roofCover: "", interiorWall: "", flooring: "",
        heating: "", heatingFuel: "", cooling: "", buildingPhoto: "",
        garage: "", pool: "", fireplace: "", foundation: "", taxAmount: "",
        ownershipHistory: [], subAreas: [], valuationHistory: [],
        propertyCardUrl: detailUrl,
        llcDetails: undefined as any,
      },
    });
  } catch (e) {
    console.error("MapXpress error:", e);
    return json({
      success: false,
      error: `Could not find property in ${town}. Try the MapXpress database directly.`,
      searchUrl: baseUrl,
    });
  }
}

// Fallback if direct POST fails (e.g. session required)
async function scrapeMapXpressFallback(apiKey: string, baseUrl: string, address: string, town: string, houseNum: string, streetBase: string): Promise<Response> {
  console.log(`MapXpress fallback: using Firecrawl actions for ${town}`);
  const portalUrl = `${baseUrl.replace(/\/$/, "")}/`;
  try {
    const resp = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        url: portalUrl,
        formats: ["html"],
        onlyMainContent: false,
        waitFor: 2000,
        actions: [
          { type: "wait", milliseconds: 500 },
          { type: "click", selector: "a[href*='portal'], a:has-text('Accept'), a:has-text('Enter'), a:has-text('Agree')" },
          { type: "wait", milliseconds: 800 },
          { type: "click", selector: "input[name='houseno'], input[name*='house'], input[name*='number']" },
          { type: "write", text: houseNum },
          { type: "click", selector: "input[name='street'], input[name*='street']" },
          { type: "write", text: streetBase },
          { type: "click", selector: "input[name*='go'], input[type='image'], input[type='submit'], button[type='submit']" },
          { type: "wait", milliseconds: 2000 },
        ],
      }),
    });
    if (resp.ok) {
      const data = await resp.json();
      const html = data.data?.html || data.html || "";
      // Extract UNIQUE_ID from detail links
      const uidMatch = html.match(/detail\.asp\?UNIQUE_ID=(\d+)/i);
      if (uidMatch) {
        const detailUrl = `${baseUrl.replace(/\/$/, "")}/PAGES/detail.asp?UNIQUE_ID=${uidMatch[1]}`;
        const detailMd = await firecrawlScrapeFullPage(apiKey, detailUrl);
        if (detailMd && detailMd.length > 200) {
          const extracted = extractMapXpressDetailData(detailMd, address, town, null);
          if (extracted) {
            extracted.propertyCardUrl = detailUrl;
            return json({ success: true, property: extracted });
          }
        }
      }
    }
  } catch (e) {
    console.error("MapXpress fallback error:", e);
  }
  return json({ success: false, error: `Could not find property in ${town}.`, searchUrl: baseUrl });
}

// Extract structured data from MapXpress detail.asp page
function extractMapXpressDetailData(markdown: string, address: string, town: string, searchResult: { uniqueId: string; account: string; owner: string; addr: string } | null) {
  const text = markdown;

  const grab = (labels: string[]): string => {
    for (const label of labels) {
      const tableRe = new RegExp(`\\|\\s*${label}:?\\s*\\|\\s*([^|]*?)\\s*\\|`, "i");
      const tm = text.match(tableRe);
      if (tm?.[1]?.trim()) return tm[1].trim();
      const colonRe = new RegExp(`${label}[:\\s]+([^\\n|]+)`, "i");
      const cm = text.match(colonRe);
      if (cm?.[1]?.trim()) return cm[1].trim();
      const boldRe = new RegExp(`\\*\\*${label}\\*\\*[:\\s]*([^\\n|]+)`, "i");
      const bm = text.match(boldRe);
      if (bm?.[1]?.trim()) return bm[1].trim();
    }
    return "";
  };

  const dollarGrab = (labels: string[]): string => {
    for (const label of labels) {
      const re = new RegExp(`${label}[:\\s]*\\$?([\\d,]+)`, "i");
      const m = text.match(re);
      if (m?.[1]) return m[1].trim();
    }
    return "";
  };

  let owner = grab(["Owner", "Owner Name"]) || searchResult?.owner || "";
  const coOwner = grab(["Co-Owner", "Second Name", "Second name"]);
  let propertyAddress = grab(["Location", "Property Location", "Address"]) || searchResult?.addr || address;
  const ownerAddress = grab(["Mailing Address", "Mail Address", "MAILING ADDRESS"]);
  const parcelId = grab(["Unique ID", "Unique_ID", "PID"]) || searchResult?.uniqueId || "";
  const accountNumber = grab(["Account", "Acct"]) || searchResult?.account || "";
  const mbl = grab(["MBL", "Map/Block/Lot"]);

  // Values
  const bldgAppraised = dollarGrab(["Buildings Appraised", "Building Appraised", "Bldg Appraised"]);
  const bldgAssessed = dollarGrab(["Buildings Assessed", "Building Assessed", "Bldg Assessed"]);
  const landAppraised = dollarGrab(["Land Appraised"]);
  const landAssessed = dollarGrab(["Land Assessed"]);
  const totalAppraised = dollarGrab(["Total Appraised", "TOTAL Appraised"]);
  const totalAssessed = dollarGrab(["Total Assessed", "TOTAL Assessed"]);

  // Property info
  const lotSize = grab(["Total Acres", "Lot Size", "Acres"]);
  const landUse = grab(["Land Use", "Property Type", "Use"]);
  const zoning = grab(["Zoning", "Zone"]);
  const neighborhood = grab(["Neighborhood", "NBHD"]);
  const foundation = grab(["Foundation"]);

  // Sale info
  const saleDate = grab(["Sale Date"]);
  const salePrice = dollarGrab(["Sale Price"]);
  const bookPage = grab(["Book / Page", "Book/Page", "Book \\/ Page"]);

  // Building
  const buildingGross = grab(["Building Gross", "Gross.*sqft"]);
  const livingArea = grab(["Living Area", "Living.*sqft"]);
  const buildingStyle = grab(["Building Style", "Style"]);
  const buildingCondition = grab(["Building Condition", "Condition"]);
  const totalRooms = grab(["Number of Rooms", "Rooms"]);
  const bedrooms = grab(["Number of Bedrooms", "Bedrooms"]);
  const totalBaths = grab(["Number of Bathrooms", "Bathrooms", "Baths"]);
  const stories = grab(["Stories"]);
  const roofStructure = grab(["Roof Structure", "Roof"]);
  const exteriorWall = grab(["Primary Exterior", "Exterior Wall", "Exterior"]);
  const heating = grab(["Heating/Cooling Type", "Heating", "Heat Type"]);
  const heatingFuel = grab(["Heating Fuel", "Fuel"]);
  const cooling = grab(["AC_Type", "AC Type", "Cooling"]);
  const yearBuilt = grab(["Year Built"]);
  const garage = grab(["Garage"]);
  const pool = grab(["Pool"]);
  const fireplace = grab(["Fireplace", "Fireplaces"]);

  owner = owner.replace(/[*#\[\]|]/g, "").replace(/<br\/?>/gi, " ").replace(/\s+/g, " ").trim();
  if (!owner || owner.length < 2) return null;

  const isLLC = /\bLLC\b|\bL\.L\.C\b|\bLimited Liability\b/i.test(owner);
  const fmt$ = (v: string) => (v ? `$${v}` : "");

  return {
    address: propertyAddress,
    town,
    owner,
    coOwner,
    ownerAddress,
    isLLC,
    parcelId,
    mblu: mbl,
    accountNumber,
    buildingCount: "",
    bookPage,
    certificate: "",
    instrument: "",
    assessedValue: fmt$(totalAssessed),
    totalAppraisal: fmt$(totalAppraised),
    totalMarketValue: fmt$(totalAppraised),
    improvementsValue: fmt$(bldgAppraised),
    landValue: fmt$(landAppraised),
    assessImprovements: fmt$(bldgAssessed),
    assessLand: fmt$(landAssessed),
    assessTotal: fmt$(totalAssessed),
    salePrice: salePrice ? `$${salePrice}` : "",
    saleDate,
    lotSize: lotSize ? `${lotSize} acres` : "",
    frontage: "",
    depth: "",
    useCode: "",
    useDescription: landUse,
    zoning,
    neighborhood,
    totalMarketLand: "",
    landAppraisedValue: fmt$(landAppraised),
    yearBuilt,
    buildingStyle,
    model: "",
    stories,
    livingArea: livingArea ? `${livingArea} sq ft` : "",
    replacementCost: "",
    buildingPercentGood: "",
    occupancy: "",
    totalRooms,
    bedrooms,
    totalBaths,
    halfBaths: "",
    totalXtraFixtures: "",
    bathStyle: "",
    kitchenStyle: "",
    interiorCondition: buildingCondition,
    finBsmntArea: "",
    finBsmntQual: "",
    grade: "",
    exteriorWall,
    roofStructure,
    roofCover: "",
    interiorWall: "",
    flooring: "",
    heating,
    heatingFuel,
    cooling,
    buildingPhoto: "",
    garage,
    pool,
    fireplace,
    foundation,
    taxAmount: "",
    ownershipHistory: [] as { owner: string; salePrice: string; bookPage: string; saleDate: string }[],
    subAreas: [] as { code: string; description: string; grossArea: string; livingArea: string }[],
    valuationHistory: [] as { year: string; improvements: string; land: string; total: string }[],
    propertyCardUrl: "",
    summaryCardUrl: "",
    llcDetails: undefined as any,
  };
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
    const streetName = addrMatch[2]
      .toUpperCase()
      .replace(/\s+(ST|RD|DR|AVE|LN|CT|CIR|BLVD|PL|TER|WAY|TRL|HWY|PKWY|TPKE)\.?$/i, "")
      .trim();
    const fullStreetName = addrMatch[2].toUpperCase();
    const firstLetter = streetName.charAt(0).toLowerCase();

    console.log(`Looking for house #${houseNum} on ${fullStreetName} (first letter: ${firstLetter})`);

    // Step 1: Fetch the street listing page to find our street
    const streetPageUrl = `${baseUrl.replace(/\/$/, "")}/propcards/${firstLetter.toUpperCase()}street.html`;
    const streetPageMd = await firecrawlScrape(apiKey, streetPageUrl);

    if (!streetPageMd) {
      // Try alternate format
      const altUrl = `${baseUrl.replace(/\/$/, "")}/propcards/streets.html#${firstLetter}`;
      return json({
        success: false,
        error: `Could not find property in ${town}. Try the assessor database directly.`,
        searchUrl: baseUrl,
      });
    }

    // Step 2: Find the matching property link in the street page
    // Links look like: [00100 FISHER DRIVE](http://assessor.avonct.gov/propcards/2/admin/a228010001.html)
    const paddedNum = houseNum.padStart(5, "0");
    const lines = streetPageMd.split("\n");

    let propertyUrl = "";
    for (const line of lines) {
      // Match on padded house number + street name
      const linkMatch = line.match(/\[(\d+)\s+([^\]]+)\]\((https?:\/\/[^\)]+)\)/i);
      if (linkMatch) {
        const linkNum = linkMatch[1].replace(/^0+/, "");
        const linkStreet = linkMatch[2].trim().toUpperCase();
        if (
          linkNum === houseNum &&
          (linkStreet.includes(streetName) || fullStreetName.includes(linkStreet.replace(/\s+\d+$/, "").trim()))
        ) {
          propertyUrl = linkMatch[3];
          console.log(`Found QDS property: ${propertyUrl}`);
          break;
        }
      }
    }

    if (!propertyUrl) {
      console.log(`Property not found in street listing, trying search fallback`);
      return json({
        success: false,
        error: `Could not find property in ${town}. Try the assessor database directly.`,
        searchUrl: baseUrl,
      });
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

// LLC lookup removed - handled separately by frontend
      return json({ success: true, property: extracted });
    }

    return json({
      success: false,
      error: `Could not extract property data from ${town} assessor.`,
      searchUrl: propertyUrl,
    });
  } catch (e) {
    console.error("QDS error:", e);
    return json({ success: false, error: `Error searching ${town} assessor database.`, searchUrl: baseUrl });
  }
}

// QDS search fallback removed — direct scraping only

// ========== PROPERTY RECORD CARDS (PRC) SCRAPING ==========
async function scrapePRC(apiKey: string, townCode: string, address: string, town: string) {
  const baseUrl = `https://www.propertyrecordcards.com/SearchMaster.aspx?towncode=${townCode}`;
  try {
    console.log(`Scraping PRC for ${town} (code=${townCode})`);

    // Parse address into number + street name
    const addrMatch = address.match(/^(\d+)\s+(.+)$/i);
    if (!addrMatch) {
      return json({ success: false, error: `Could not parse address: ${address}`, searchUrl: baseUrl });
    }
    const houseNum = addrMatch[1];
    const streetPart = addrMatch[2].toUpperCase().trim();

    // Step 1: Fetch the search page HTML to get the street name options
    console.log(`Fetching PRC page to find street names...`);
    const pageResp = await fetch(baseUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    });
    if (!pageResp.ok) {
      console.error(`PRC page fetch failed: ${pageResp.status}`);
      return json({ success: false, error: `Could not load ${town} property records.`, searchUrl: baseUrl });
    }
    const pageHtml = await pageResp.text();

    // Extract street names from the <select> options
    const streetRegex = /<option value="([^"]+)">[^<]+<\/option>/g;
    const streets: string[] = [];
    let sm;
    while ((sm = streetRegex.exec(pageHtml)) !== null) {
      if (
        sm[1] &&
        sm[1].length > 1 &&
        ![
          "Apartment",
          "Automotive",
          "Church",
          "Condos",
          "Elderly",
          "Entertainment",
          "Farms/Barns",
          "Industrial",
          "Lodging",
          "Marina",
          "Office",
          "Public Use",
          "Residential",
          "Restaurant",
          "Retail",
          "School",
          "Special Use",
          "Vacant Land",
        ].includes(sm[1])
      ) {
        streets.push(sm[1]);
      }
    }
    console.log(`Found ${streets.length} streets for ${town}`);

    // Match user's street against the dropdown options
    let matchedStreet = "";
    // Try exact match first
    matchedStreet = streets.find((s) => s === streetPart) || "";
    // Try without suffix abbreviation
    if (!matchedStreet) {
      const streetBase = streetPart
        .replace(/\s+(ST|RD|DR|AVE|LN|CT|CIR|BLVD|PL|PK|PRK|TER|WAY|TRL|HWY|PKWY|TPKE|EXT|PARK)\.?$/i, "")
        .trim();
      matchedStreet = streets.find((s) => s.startsWith(streetBase)) || "";
    }
    // Try contains match
    if (!matchedStreet) {
      const streetWords = streetPart.split(/\s+/);
      const mainWord = streetWords[0];
      matchedStreet = streets.find((s) => s.includes(mainWord)) || "";
    }

    if (!matchedStreet) {
      console.log(`Street "${streetPart}" not found in ${town} PRC database`);
      return json({
        success: false,
        error: `Street "${streetPart}" not found in ${town}. Try the Property Record Cards database directly.`,
        searchUrl: baseUrl,
      });
    }
    console.log(`Matched street: "${matchedStreet}"`);

    // Step 2: Extract ASP.NET form fields for direct POST submission
    const viewState = (pageHtml.match(/id="__VIEWSTATE"\s+value="([^"]*)"/) || [])[1] || "";
    const viewStateGen = (pageHtml.match(/id="__VIEWSTATEGENERATOR"\s+value="([^"]*)"/) || [])[1] || "";
    const eventValidation = (pageHtml.match(/id="__EVENTVALIDATION"\s+value="([^"]*)"/) || [])[1] || "";

    // Build form data for POST submission
    const formData = new URLSearchParams();
    formData.set("__VIEWSTATE", viewState);
    formData.set("__VIEWSTATEGENERATOR", viewStateGen);
    formData.set("__EVENTVALIDATION", eventValidation);
    formData.set("ctl00$MainContent$tbPropertySearchStreetNumber", houseNum);
    formData.set("ctl00$MainContent$cbPropertySearchStreetName", matchedStreet);
    formData.set("ctl00$MainContent$btnPropertySearch", "Search");

    console.log(`Submitting PRC form: num=${houseNum}, street=${matchedStreet}`);
    const postResp = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Content-Type": "application/x-www-form-urlencoded",
        Referer: baseUrl,
      },
      body: formData.toString(),
      redirect: "follow",
    });

    if (postResp.ok) {
      const resultHtml = await postResp.text();
      console.log(`PRC POST response length: ${resultHtml.length}`);

      // Look for uniqueid in the results — PRC uses alphanumeric IDs like R04533
      const allIds = [...resultHtml.matchAll(/uniqueid=([A-Za-z0-9]+)/gi)].map((m) => m[1]);
      const uniqueIds = [...new Set(allIds)];
      console.log(`PRC POST: found ${uniqueIds.length} unique IDs`);

      for (const uid of uniqueIds.slice(0, 3)) {
        const detailUrl = `https://www.propertyrecordcards.com/PrintPage.aspx?towncode=${townCode}&uniqueid=${uid}`;
        console.log(`Checking PRC detail: ${detailUrl}`);
        const detailMd = await firecrawlScrape(apiKey, detailUrl);
        if (detailMd) {
          const extracted = extractPRCData(detailMd, address, town);
          if (extracted && isAddressMatch(extracted.address, address, houseNum)) {
            extracted.propertyCardUrl = `https://www.propertyrecordcards.com/PropertyResults.aspx?towncode=${townCode}&uniqueid=${uid}`;
// LLC lookup removed - handled separately by frontend
            return json({ success: true, property: extracted });
          }
        }
      }
    }

    // Fallback: Try Firecrawl actions with JavaScript to set dropdown value directly
    console.log(`PRC POST failed, trying Firecrawl actions with JS...`);
    const resp = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        url: baseUrl,
        formats: ["html", "links"],
        waitFor: 2000,
        actions: [
          { type: "wait", milliseconds: 1000 },
          {
            type: "execute_javascript",
            code: `
            document.getElementById('MainContent_tbPropertySearchStreetNumber').value = '${houseNum}';
            var sel = document.getElementById('MainContent_cbPropertySearchStreetName');
            for (var i = 0; i < sel.options.length; i++) {
              if (sel.options[i].value === '${matchedStreet.replace(/'/g, "\\'")}') {
                sel.selectedIndex = i;
                sel.dispatchEvent(new Event('change'));
                break;
              }
            }
          `,
          },
          { type: "wait", milliseconds: 500 },
          { type: "click", selector: "#MainContent_btnPropertySearch" },
          { type: "wait", milliseconds: 3000 },
        ],
      }),
    });

    if (resp.ok) {
      const data = await resp.json();
      const html = data.data?.html || data.html || "";
      const links = data.data?.links || data.links || [];
      const combined = html + JSON.stringify(links);

      const allIds2 = [...combined.matchAll(/uniqueid=([A-Za-z0-9]+)/gi)].map((m) => m[1]);
      const uniqueIds2 = [...new Set(allIds2)];
      console.log(`PRC actions: found ${uniqueIds2.length} unique IDs`);

      for (const uid of uniqueIds2.slice(0, 3)) {
        const detailUrl = `https://www.propertyrecordcards.com/PrintPage.aspx?towncode=${townCode}&uniqueid=${uid}`;
        const detailMd = await firecrawlScrape(apiKey, detailUrl);
        if (detailMd) {
          const extracted = extractPRCData(detailMd, address, town);
          if (extracted && isAddressMatch(extracted.address, address, houseNum)) {
            extracted.propertyCardUrl = `https://www.propertyrecordcards.com/PropertyResults.aspx?towncode=${townCode}&uniqueid=${uid}`;
// LLC lookup removed - handled separately by frontend
            return json({ success: true, property: extracted });
          }
        }
      }
    }
  } catch (e) {
    console.error("PRC error:", e);
  }

  return json({
    success: false,
    error: `Could not find property in ${town}. Try the Property Record Cards database directly.`,
    searchUrl: baseUrl,
  });
}

function extractPRCData(markdown: string, address: string, town: string) {
  const text = markdown;

  const tableGrab = (label: string): string => {
    const re = new RegExp(`\\|\\s*${label}:?\\s*\\|\\s*([^|]*?)\\s*\\|`, "i");
    const m = text.match(re);
    return m?.[1]?.trim() || "";
  };

  let propertyAddress = tableGrab("Location") || address;
  const propertyUse = tableGrab("Property Use");
  const primaryUse = tableGrab("Primary Use");
  const uniqueId = tableGrab("Unique ID");
  const mapBlockLot = tableGrab("Map Block Lot");
  const acres = tableGrab("Acres");
  const zone = tableGrab("Zone");
  const volPage = tableGrab("Volume / Page") || tableGrab("Volume\\/Page");

  // Value Information
  let landAppraised = "",
    landAssessed = "",
    bldgAppraised = "",
    bldgAssessed = "",
    totalAppraised = "",
    totalAssessed = "";
  const landRow = text.match(/\|\s*Land\s*\|\s*([\d,]+)\s*\|\s*([\d,]+)\s*\|/i);
  if (landRow) {
    landAppraised = landRow[1];
    landAssessed = landRow[2];
  }
  const bldgRow = text.match(/\|\s*Buildings?\s*\|\s*([\d,]+)\s*\|\s*([\d,]+)\s*\|/i);
  if (bldgRow) {
    bldgAppraised = bldgRow[1];
    bldgAssessed = bldgRow[2];
  }
  const totalRow = text.match(/\|\s*Total\s*\|\s*([\d,]+)\s*\|\s*([\d,]+)\s*\|/i);
  if (totalRow) {
    totalAppraised = totalRow[1];
    totalAssessed = totalRow[2];
  }

  // Owner from "Owner's Data" cell - format: "| NAME<br>ADDRESS<br>CITY, ST ZIP |"
  let owner = "",
    coOwner = "",
    ownerAddress = "";
  const ownerMatch = text.match(/Owner'?s?\s*Data\s*\|[\s\n]*\|[\s-]*\|[\s\n]*\|\s*([^|]+)\|/i);
  if (ownerMatch) {
    const raw = ownerMatch[1].replace(/<br\s*\/?>/gi, "\n").trim();
    const parts = raw
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    owner = parts[0] || "";
    // Check if second line looks like a co-owner (contains & or name-like pattern)
    if (parts.length > 2) {
      ownerAddress = parts.slice(1).join(", ");
    } else if (parts.length === 2) {
      ownerAddress = parts[1];
    }
  }
  // Fallback: try simpler pattern
  if (!owner || owner === "---") {
    const simpleFallback = text.match(/\|\s*([A-Z][A-Z\s&,.']+?)<br/i);
    if (simpleFallback) {
      owner = simpleFallback[1].trim();
    }
  }

  // Building info
  const yearBuilt = tableGrab("Year Built");
  const livingArea = tableGrab("Living Area") || tableGrab("Total Living Area");
  const buildingStyle = tableGrab("Style") || tableGrab("Building Style");
  const stories = tableGrab("Stories");
  const totalRooms = tableGrab("Total Rooms") || tableGrab("Rooms");
  const bedrooms = tableGrab("Bedrooms") || tableGrab("Total Bedrooms");
  const totalBaths = tableGrab("Full Baths") || tableGrab("Total Baths");
  const halfBaths = tableGrab("Half Baths");
  const exteriorWall = tableGrab("Exterior Wall") || tableGrab("Ext Wall");
  const roofCover = tableGrab("Roof Cover") || tableGrab("Roof");
  const heating = tableGrab("Heat Type") || tableGrab("Heating");
  const heatingFuel = tableGrab("Heat Fuel") || tableGrab("Fuel");
  const cooling = tableGrab("AC Type") || tableGrab("Air Conditioning");
  const grade = tableGrab("Grade");
  const condition = tableGrab("Condition") || tableGrab("Overall Condition");

  // Sales
  const salePrice = tableGrab("Sale Price");
  const saleDate = tableGrab("Sale Date");

  owner = owner
    .replace(/[*#\[\]|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!owner || owner.length < 2) return null;

  const isLLC = /\bLLC\b|\bL\.L\.C\b|\bLimited Liability\b|\bLP\b|\bL\.P\b/i.test(owner);
  const fmt$ = (v: string) => (v ? `$${v}` : "");

  return {
    address: propertyAddress,
    town,
    owner,
    coOwner,
    ownerAddress,
    isLLC,
    parcelId: uniqueId,
    mblu: mapBlockLot,
    accountNumber: "",
    buildingCount: "",
    bookPage: volPage,
    certificate: "",
    instrument: "",
    assessedValue: fmt$(totalAssessed),
    totalAppraisal: fmt$(totalAppraised),
    totalMarketValue: fmt$(totalAppraised),
    improvementsValue: fmt$(bldgAppraised),
    landValue: fmt$(landAppraised),
    assessImprovements: fmt$(bldgAssessed),
    assessLand: fmt$(landAssessed),
    assessTotal: fmt$(totalAssessed),
    salePrice,
    saleDate,
    lotSize: acres ? `${acres} acres` : "",
    frontage: "",
    depth: "",
    useCode: "",
    useDescription: propertyUse || primaryUse,
    zoning: zone,
    neighborhood: "",
    totalMarketLand: "",
    landAppraisedValue: fmt$(landAppraised),
    yearBuilt,
    buildingStyle,
    model: "",
    stories,
    livingArea: livingArea ? `${livingArea} sq ft` : "",
    replacementCost: "",
    buildingPercentGood: "",
    occupancy: "",
    totalRooms,
    bedrooms,
    totalBaths,
    halfBaths,
    totalXtraFixtures: "",
    bathStyle: "",
    kitchenStyle: "",
    interiorCondition: condition,
    finBsmntArea: "",
    finBsmntQual: "",
    grade,
    exteriorWall,
    roofStructure: "",
    roofCover,
    interiorWall: "",
    flooring: "",
    heating,
    heatingFuel,
    cooling,
    buildingPhoto: "",
    ownershipHistory: [] as { owner: string; salePrice: string; bookPage: string; saleDate: string }[],
    subAreas: [] as { code: string; description: string; grossArea: string; livingArea: string }[],
    valuationHistory: [] as { year: string; improvements: string; land: string; total: string }[],
    propertyCardUrl: "",
    llcDetails: undefined as any,
  };
}

async function scrapeACTDataScout(apiKey: string, baseUrl: string, address: string, town: string) {
  try {
    console.log(`Scraping ACT Data Scout for ${town}: ${baseUrl}`);
    const addrParts = address.match(/^(\d+)\s+(.+)$/i);
    const houseNum = addrParts?.[1] || "";
    const streetBase = (addrParts?.[2] || address)
      .replace(/\s+(ST|RD|DR|AVE|LN|CT|CIR|BLVD|PL|TER|WAY|TRL|HWY)\.?$/i, "").trim();

    // ACT Data Scout: use Firecrawl actions to search
    const resp = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        url: baseUrl,
        formats: ["markdown", "html", "links"],
        onlyMainContent: false,
        waitFor: 2000,
        actions: [
          { type: "wait", milliseconds: 1000 },
          { type: "click", selector: 'input[name*="StreetNumber"], input[name*="streetNumber"], input[id*="StreetNumber"], input[placeholder*="Number"], input[placeholder*="number"]' },
          { type: "write", text: houseNum },
          { type: "click", selector: 'input[name*="StreetName"], input[name*="streetName"], input[id*="StreetName"], input[placeholder*="Street"], input[placeholder*="street"]' },
          { type: "write", text: streetBase },
          { type: "click", selector: 'button[type="submit"], input[type="submit"], button:has-text("Search"), a:has-text("Search"), input[value="Search"]' },
          { type: "wait", milliseconds: 3000 },
        ],
      }),
    });

    if (resp.ok) {
      const data = await resp.json();
      const markdown = data.data?.markdown || data.markdown || "";
      const html = data.data?.html || data.html || "";
      const links = data.data?.links || data.links || [];

      if (markdown.length > 300) {
        // Look for property detail links
        const detailLink = links.find((l: string) => l.includes("PropertyDetail") || l.includes("parcel") || l.includes("detail"));
        if (detailLink) {
          console.log(`ACT: Following detail link: ${detailLink}`);
          const detailMd = await firecrawlScrapeFullPage(apiKey, detailLink);
          if (detailMd) {
            const extracted = extractGenericPropertyData(detailMd, address, town);
            if (extracted) {
              extracted.propertyCardUrl = detailLink;
              return json({ success: true, property: extracted });
            }
          }
        }
        const extracted = extractGenericPropertyData(markdown, address, town);
        if (extracted) {
          extracted.propertyCardUrl = data.data?.metadata?.url || baseUrl;
          return json({ success: true, property: extracted });
        }
      }
    }
  } catch (e) {
    console.error("ACT error:", e);
  }
  return json({
    success: false,
    error: `Could not find property in ${town}. Try the assessor database directly.`,
    searchUrl: baseUrl,
  });
}

// ========== IAS-CLT SCRAPING ==========
async function scrapeIASCLT(apiKey: string, baseUrl: string, address: string, town: string) {
  try {
    console.log(`Scraping IAS-CLT for ${town}: ${baseUrl}`);
    const addrParts = address.match(/^(\d+)\s+(.+)$/i);
    const houseNum = addrParts?.[1] || "";
    const streetBase = (addrParts?.[2] || address)
      .replace(/\s+(ST|RD|DR|AVE|LN|CT|CIR|BLVD|PL|TER|WAY|TRL|HWY)\.?$/i, "").trim();

    // IAS-CLT: use Firecrawl actions to search for address
    const resp = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        url: baseUrl,
        formats: ["markdown", "html", "links"],
        onlyMainContent: false,
        waitFor: 2000,
        actions: [
          { type: "wait", milliseconds: 1000 },
          { type: "click", selector: 'input[name*="addr"], input[name*="street"], input[id*="txtStreet"], input[id*="txtAddress"], input[type="text"]' },
          { type: "write", text: `${houseNum} ${streetBase}` },
          { type: "click", selector: 'input[type="submit"], button[type="submit"], input[value="Search"], input[value="Go"], button:has-text("Search")' },
          { type: "wait", milliseconds: 3000 },
        ],
      }),
    });

    if (resp.ok) {
      const data = await resp.json();
      const markdown = data.data?.markdown || data.markdown || "";
      const links = data.data?.links || data.links || [];
      const finalUrl = data.data?.metadata?.url || "";

      if (markdown.length > 300) {
        // Check for property detail links
        const detailLinks = links.filter((l: string) =>
          l.includes("parcel") || l.includes("detail") || l.includes("property") || l.includes("account")
        );
        for (const link of detailLinks.slice(0, 3)) {
          console.log(`IAS: Following detail link: ${link}`);
          const detailMd = await firecrawlScrapeFullPage(apiKey, link);
          if (detailMd && detailMd.length > 300) {
            const extracted = extractGenericPropertyData(detailMd, address, town);
            if (extracted) {
              extracted.propertyCardUrl = link;
              return json({ success: true, property: extracted });
            }
          }
        }
        const extracted = extractGenericPropertyData(markdown, address, town);
        if (extracted) {
          extracted.propertyCardUrl = finalUrl || baseUrl;
          return json({ success: true, property: extracted });
        }
      }
    }

    // Fallback: simple scrape
    const md = await firecrawlScrapeFullPage(apiKey, baseUrl);
    if (md) {
      const extracted = extractGenericPropertyData(md, address, town);
      if (extracted) {
        extracted.propertyCardUrl = baseUrl;
        return json({ success: true, property: extracted });
      }
    }
  } catch (e) {
    console.error("IAS error:", e);
  }
  return json({
    success: false,
    error: `Could not find property in ${town}. Try the assessor database directly.`,
    searchUrl: baseUrl,
  });
}

// ========== EQUALITY CAMA SCRAPING ==========
async function scrapeEqualityCama(apiKey: string, baseUrl: string, address: string, town: string) {
  try {
    console.log(`Scraping eQuality for ${town}: ${baseUrl}`);
    const md = await firecrawlScrape(apiKey, baseUrl);
    if (md) {
      const extracted = extractGenericPropertyData(md, address, town);
      if (extracted) {
        extracted.propertyCardUrl = baseUrl;
// LLC lookup removed - handled separately by frontend
        return json({ success: true, property: extracted });
      }
    }
  } catch (e) {
    console.error("eQuality error:", e);
  }
  return json({
    success: false,
    error: `Could not find property in ${town}. Try the assessor database directly.`,
    searchUrl: baseUrl,
  });
}

// ========== GENERIC / CUSTOM SCRAPING ==========
async function scrapeGenericWithFallback(
  apiKey: string,
  baseUrl: string,
  address: string,
  town: string,
  label: string,
) {
  try {
    console.log(`Scraping generic for ${town} (${label}): ${baseUrl}`);
    const md = await firecrawlScrape(apiKey, baseUrl);
    if (md) {
      const extracted = extractGenericPropertyData(md, address, town);
      if (extracted) {
        extracted.propertyCardUrl = baseUrl;
// LLC lookup removed - handled separately by frontend
        return json({ success: true, property: extracted });
      }
    }
  } catch (e) {
    console.error("Generic error:", e);
  }

  return json({
    success: false,
    error: `Could not find property in ${town}. Try the assessor database directly.`,
    searchUrl: baseUrl,
  });
}

// ========== DYNAMIC / CUSTOM SITE SCRAPING ==========
async function scrapeCustomSite(apiKey: string, siteUrl: string, address: string, town: string): Promise<Response> {
  const addrParts = address.match(/^(\d+)\s+(.+)$/i);
  const houseNum = addrParts?.[1] || "";
  const streetPart = addrParts?.[2] || address;
  const streetBase = streetPart.replace(/\s+(ST|RD|DR|AVE|LN|CT|CIR|BLVD|PL|TER|WAY|TRL|HWY|PKWY|TPKE|EXT)\.?$/i, "").trim();

  console.log(`Dynamic scrape: ${siteUrl} for "${address}" in ${town}`);

  // Single Firecrawl call with actions to search + extract
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 22000);
    const resp = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        url: siteUrl,
        formats: ["markdown", "links"],
        onlyMainContent: false,
        waitFor: 2000,
        actions: [
          { type: "wait", milliseconds: 800 },
          { type: "click", selector: [
            'input[name*="address" i]', 'input[name*="street" i]', 'input[name*="search" i]',
            'input[name*="addr" i]', 'input[placeholder*="address" i]', 'input[placeholder*="search" i]',
            'input[id*="address" i]', 'input[id*="street" i]', 'input[id*="search" i]',
            'input[type="text"]', 'input[type="search"]',
          ].join(", ") },
          { type: "write", text: `${houseNum} ${streetBase}` },
          { type: "wait", milliseconds: 400 },
          { type: "click", selector: [
            'input[type="submit"]', 'button[type="submit"]',
            'button:has-text("Search")', 'button:has-text("Go")', 'button:has-text("Find")',
            'input[value="Search"]', 'input[value="Go"]', 'input[value="Find"]',
            'a:has-text("Search")', '.search-btn', '#btnSearch',
          ].join(", ") },
          { type: "wait", milliseconds: 2000 },
        ],
      }),
    });
    clearTimeout(timeout);

    if (resp.ok) {
      const data = await resp.json();
      const markdown = data.data?.markdown || data.markdown || "";
      const links: string[] = data.data?.links || data.links || [];
      const finalUrl = data.data?.metadata?.url || data.data?.metadata?.sourceURL || siteUrl;

      console.log(`Custom scrape: ${markdown.length} chars, ${links.length} links`);

      if (markdown.length > 300) {
        // Filter to real property detail links (not images, css, js)
        const detailLinks = links.filter((l: string) =>
          /parcel|detail|property|account|card|print|record|assess|Parcel|Print/i.test(l) &&
          !/#/.test(l) && !/\.(png|jpg|gif|css|js|ico)$/i.test(l)
        );

        // Follow up to 2 detail links
        for (const link of detailLinks.slice(0, 2)) {
          console.log(`Custom: Following: ${link}`);
          try {
            const ctrl2 = new AbortController();
            const t2 = setTimeout(() => ctrl2.abort(), 12000);
            const detailResp = await fetch("https://api.firecrawl.dev/v1/scrape", {
              method: "POST",
              headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
              signal: ctrl2.signal,
              body: JSON.stringify({ url: link, formats: ["markdown"], onlyMainContent: false, waitFor: 2000 }),
            });
            clearTimeout(t2);
            if (detailResp.ok) {
              const dd = await detailResp.json();
              const detailMd = dd.data?.markdown || dd.markdown || "";
              if (detailMd.length > 300) {
                const extracted = extractGenericPropertyData(detailMd, address, town);
                if (extracted) {
                  extracted.propertyCardUrl = link;
                  return json({ success: true, property: extracted });
                }
              }
            }
          } catch { /* timeout on detail link */ }
        }

        // Try extracting from the search results page itself
        const extracted = extractGenericPropertyData(markdown, address, town);
        if (extracted) {
          extracted.propertyCardUrl = finalUrl;
          return json({ success: true, property: extracted });
        }
      }
    }
  } catch (e) {
    console.error("Custom site error:", (e as Error).message || e);
  }

  return json({
    success: false,
    error: `Could not find property data for ${address} in ${town}. Try the assessor database directly.`,
    searchUrl: siteUrl,
  });
}

// Inner helper for following assessor links found on custom sites
async function scrapeCustomSiteInner(
  apiKey: string, url: string, houseNum: string, streetBase: string, address: string, town: string
): Promise<Response | null> {
  try {
    const resp = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        formats: ["markdown", "html", "links"],
        onlyMainContent: false,
        waitFor: 3000,
        actions: [
          { type: "wait", milliseconds: 1500 },
          { type: "click", selector: 'input[type="text"], input[type="search"], input[name*="address" i], input[name*="street" i], input[name*="search" i]' },
          { type: "write", text: `${houseNum} ${streetBase}` },
          { type: "wait", milliseconds: 500 },
          { type: "click", selector: 'input[type="submit"], button[type="submit"], button:has-text("Search"), input[value="Search"]' },
          { type: "wait", milliseconds: 3000 },
        ],
      }),
    });

    if (resp.ok) {
      const data = await resp.json();
      const markdown = data.data?.markdown || data.markdown || "";
      const links = data.data?.links || data.links || [];

      if (markdown.length > 300) {
        // Follow detail links
        const detailLinks = links.filter((l: string) =>
          /parcel|detail|property|account|card|print|record/i.test(l) && !/#/.test(l)
        );
        for (const link of detailLinks.slice(0, 2)) {
          const detailMd = await firecrawlScrapeFullPage(apiKey, link);
          if (detailMd && detailMd.length > 300) {
            const extracted = extractGenericPropertyData(detailMd, address, town);
            if (extracted) {
              extracted.propertyCardUrl = link;
              return json({ success: true, property: extracted });
            }
          }
        }

        const extracted = extractGenericPropertyData(markdown, address, town);
        if (extracted) {
          extracted.propertyCardUrl = data.data?.metadata?.url || url;
          return json({ success: true, property: extracted });
        }
      }
    }
  } catch (e) {
    console.error("Custom inner scrape error:", e);
  }
  return null;
}

// Dynamic scrape for towns not in DB at all
async function scrapeDynamic(apiKey: string, address: string, town: string, originalTown: string): Promise<Response> {
  console.log(`Dynamic scrape for unknown town: ${town}`);
  // Try common CT assessor URL patterns
  const townSlug = town.replace(/\s+/g, "").toLowerCase();
  const townDash = town.replace(/\s+/g, "-").toLowerCase();

  const candidateUrls = [
    `https://gis.vgsi.com/${townSlug}ct/Search.aspx`,
    `https://www.propertyrecordcards.com/SearchMaster.aspx?towncode=`,
    `https://${townSlug}.mapxpress.net/`,
    `https://www.${townSlug}ct.gov/`,
    `https://www.${townDash}-ct.gov/`,
  ];

  // Try VGS first (most common)
  try {
    const vgsResp = await fetch(candidateUrls[0], { method: "HEAD", redirect: "follow" });
    if (vgsResp.ok) {
      console.log(`Found VGS site for ${town}`);
      return await scrapeVGS(apiKey, `${townSlug}ct`, address, originalTown);
    }
  } catch { /* not VGS */ }

  // Try MapXpress
  try {
    const mapResp = await fetch(candidateUrls[2], { method: "HEAD", redirect: "follow" });
    if (mapResp.ok && mapResp.status !== 404) {
      console.log(`Found MapXpress site for ${town}`);
      return await scrapeCustomSite(apiKey, candidateUrls[2], address, originalTown);
    }
  } catch { /* not MapXpress */ }

  return json({
    success: false,
    error: `No assessor database found for ${originalTown}, CT. This town may not have an online assessor database.`,
  });
}

// ========== SHARED HELPERS ==========
async function scrapePropertyDetail(apiKey: string, url: string, address: string, town: string) {
  console.log(`Scraping property detail: ${url}`);
  const detailMd = await firecrawlScrapeFullPage(apiKey, url);
  if (detailMd) {
    const extracted = extractVGSData(detailMd, address, town);
    if (extracted && extracted.owner && !extracted.owner.includes("Enter an")) {
      extracted.propertyCardUrl = url;
      return json({ success: true, property: extracted });
    }
  }
  return json({ success: false, error: "Could not extract property data.", searchUrl: url });
}

async function firecrawlScrape(apiKey: string, url: string): Promise<string | null> {
  console.log(`Firecrawl scraping: ${url}`);
  try {
    const resp = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true, waitFor: 2000 }),
    });
    if (!resp.ok) {
      console.error(`Firecrawl ${resp.status}`);
      return null;
    }
    const data = await resp.json();
    return data.data?.markdown || data.markdown || null;
  } catch (e) {
    console.error("Firecrawl fetch error:", e);
    return null;
  }
}

// Full page scrape (includes headers, sidebars, all content — better for property detail pages)
async function firecrawlScrapeFullPage(apiKey: string, url: string): Promise<string | null> {
  console.log(`Firecrawl full-page scraping: ${url}`);
  try {
    const resp = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: false, waitFor: 3000 }),
    });
    if (!resp.ok) {
      console.error(`Firecrawl full-page ${resp.status}`);
      return null;
    }
    const data = await resp.json();
    return data.data?.markdown || data.markdown || null;
  } catch (e) {
    console.error("Firecrawl full-page fetch error:", e);
    return null;
  }
}

// ========== VGS DATA EXTRACTOR ==========
function extractVGSData(markdown: string, address: string, town: string) {
  const text = markdown;

  const tableGrab = (label: string): string => {
    const re = new RegExp(`\\|\\s*${label}:?\\s*\\|\\s*([^|]*?)\\s*\\|`, "i");
    const m = text.match(re);
    return m?.[1]?.trim().replace(/<br\/?>/gi, ", ") || "";
  };

  const dollarGrab = (label: string): string => {
    const re = new RegExp(`${label}\\s*\\$([\\d,]+)`, "i");
    const m = text.match(re);
    return m?.[1]?.trim() || "";
  };

  let owner = "";
  let propertyAddress = address;

  owner = tableGrab("Owner");
  if (!owner) {
    const inlineOwner = text.match(/Owner([A-Z][A-Z\s\+\.\,\-\'&]+?)(?:Total|Sale|Co-Owner|Appraisal)/m);
    if (inlineOwner) owner = inlineOwner[1].trim();
  }

  const coOwner = tableGrab("Co-Owner");
  const locMatch = text.match(/Location(\d+[A-Z0-9\s]+?)(?:\n|Mblu)/i);
  if (locMatch) propertyAddress = locMatch[1].trim();

  const mbluMatch = text.match(/Mblu([\d\/\s]+?)(?:Acct|Owner|\n)/i);
  const mblu = mbluMatch?.[1]?.trim().replace(/\s+/g, "") || "";

  const acctMatch = text.match(/Acct#?([\d\s]+)/i);
  const accountNumber = acctMatch?.[1]?.trim() || "";

  const pidMatch = text.match(/PID(\d+)/i);
  const parcelId = pidMatch?.[1] || "";

  const bldgCountMatch = text.match(/Building\s*Count\s*(\d+)/i);
  const buildingCount = bldgCountMatch?.[1] || "";

  const ownerAddress = tableGrab("Address");

  const totalMarketValue = dollarGrab("Total\\s*Market\\s*Value");
  const totalAppraisal = dollarGrab("Appraisal");

  let improvementsValue = "",
    landValueCV = "",
    totalValueCV = "";
  const cvMatch = text.match(
    /Current Value[\s\S]*?\|\s*\d{4}\s*\|\s*\$([\d,]+)\s*\|\s*\$([\d,]+)\s*\|\s*\$([\d,]+)\s*\|/i,
  );
  if (cvMatch) {
    improvementsValue = cvMatch[1];
    landValueCV = cvMatch[2];
    totalValueCV = cvMatch[3];
  }

  let assessImprovements = "",
    assessLand = "",
    assessTotal = "";
  const assessSection = text.match(
    /Assessment[\s\S]*?\|\s*\d{4}\s*\|\s*\$([\d,]+)\s*\|\s*\$([\d,]+)\s*\|\s*\$([\d,]+)\s*\|/i,
  );
  if (assessSection) {
    assessImprovements = assessSection[1];
    assessLand = assessSection[2];
    assessTotal = assessSection[3];
  }

  const salePrice = tableGrab("Sale Price");
  const saleDate = tableGrab("Sale Date");
  const certificate = tableGrab("Certificate");
  const bookPage = tableGrab("Book & Page") || tableGrab("Book \\& Page");
  const instrument = tableGrab("Instrument");

  const ownershipHistory: { owner: string; salePrice: string; bookPage: string; saleDate: string }[] = [];
  const historySection = text.match(
    /Ownership History[\s\S]*?\| Owner \| Sale Price[\s\S]*?\n([\s\S]*?)(?:\n\n|Ownership History|Building Information)/i,
  );
  if (historySection) {
    const rows = historySection[1].split("\n").filter((r) => r.includes("|") && !r.includes("---"));
    for (const row of rows) {
      const cols = row
        .split("|")
        .map((c) => c.trim())
        .filter(Boolean);
      if (cols.length >= 5) {
        ownershipHistory.push({
          owner: cols[0],
          salePrice: cols[1],
          bookPage: cols[2] || cols[3] || "",
          saleDate: cols[cols.length - 1],
        });
      }
    }
  }

  const lotSize = tableGrab("Size \\(Acres\\)");
  const frontage = tableGrab("Frontage");
  const depth = tableGrab("Depth");
  const useCode = tableGrab("Use Code");
  const useDescMatch = text.match(/Use Code\s*\|\s*\d+[\s\S]*?\|\s*Description\s*\|\s*([^|]*?)\s*\|/i);
  const useDescription = useDescMatch?.[1]?.trim() || "";
  const zoning = tableGrab("Zone");
  const neighborhood = tableGrab("Neighborhood") || tableGrab("NBHD Code");
  const totalMarketLand = tableGrab("Total Market Land");
  const landAppraisedValue = tableGrab("Appraised Value");

  const yearBuilt = tableGrab("Year Built");
  const livingArea = tableGrab("Living Area");
  const replacementCost = tableGrab("Replacement Cost");
  const buildingPercentGood = tableGrab("Building Percent Good");
  const buildingStyle = tableGrab("Style");
  const model = tableGrab("Model");
  const grade = tableGrab("Grade");
  const stories = tableGrab("Stories");
  const occupancy = tableGrab("Occupancy");
  const exteriorWall1 = tableGrab("Exterior Wall 1");
  const exteriorWall2 = tableGrab("Exterior Wall 2");
  const roofStructure = tableGrab("Roof Structure");
  const roofCover = tableGrab("Roof Cover");
  const interiorWall1 = tableGrab("Interior Wall 1");
  const interiorWall2 = tableGrab("Interior Wall 2");
  const interiorFlr1 = tableGrab("Interior Flr 1");
  const interiorFlr2 = tableGrab("Interior Flr 2");
  const heatFuel = tableGrab("Heat Fuel");
  const heatType = tableGrab("Heat Type");
  const acType = tableGrab("AC Type");
  const totalBedrooms = tableGrab("Total Bedrooms").replace(/\s*Bedrooms?/i, "");
  const totalBathrooms = tableGrab("Total Bthrms");
  const totalHalfBaths = tableGrab("Total Half Baths");
  const totalXtraFixtures = tableGrab("Total Xtra Fixtrs");
  const totalRooms = tableGrab("Total Rooms").replace(/\s*Rooms?/i, "");
  const bathStyle = tableGrab("Bath Style");
  const kitchenStyle = tableGrab("Kitchen Style");
  const interiorCondition = tableGrab("Interior Condition");
  const finBsmntArea = tableGrab("Fin Bsmnt Area");
  const finBsmntQual = tableGrab("Fin Bsmnt Qual");
  const nbhdCode = tableGrab("NBHD Code");

  // Additional building features
  const garage = tableGrab("Garage") || tableGrab("Garage Type") || tableGrab("Garage Capacity");
  const pool = tableGrab("Pool") || tableGrab("Pool Type");
  const fireplace = tableGrab("Fireplace") || tableGrab("# Fireplaces") || tableGrab("Fireplaces");
  const foundation = tableGrab("Foundation") || tableGrab("Foundation Type");
  const taxAmount = tableGrab("Tax Amount") || tableGrab("Total Tax") || tableGrab("Annual Tax") || dollarGrab("Tax\\s*Amount") || dollarGrab("Total\\s*Tax");

  const subAreas: { code: string; description: string; grossArea: string; livingArea: string }[] = [];
  const subAreaSection = text.match(/\| Code \| Description \| Gross[\s\S]*?\n([\s\S]*?)(?:\n\n|Building Sub-Areas)/i);
  if (subAreaSection) {
    const rows = subAreaSection[1].split("\n").filter((r) => r.includes("|") && !r.includes("---"));
    for (const row of rows) {
      const cols = row
        .split("|")
        .map((c) => c.trim())
        .filter(Boolean);
      if (cols.length >= 4 && cols[0].match(/^[A-Z]/)) {
        subAreas.push({ code: cols[0], description: cols[1], grossArea: cols[2], livingArea: cols[3] });
      }
    }
  }

  const photoMatch = text.match(/Building Photo\s*!\[.*?\]\((https?:\/\/[^\)]+)\)/i);
  const buildingPhoto = photoMatch?.[1] || "";

  const valuationHistory: { year: string; improvements: string; land: string; total: string }[] = [];
  const valSection = text.match(
    /Valuation History[\s\S]*?Current Value[\s\S]*?\n([\s\S]*?)(?:\n\nAppraisal|\n\n\(c\))/i,
  );
  if (valSection) {
    const rows = valSection[1].split("\n").filter((r) => r.includes("|") && !r.includes("---") && r.match(/\d{4}/));
    for (const row of rows) {
      const cols = row
        .split("|")
        .map((c) => c.trim())
        .filter(Boolean);
      if (cols.length >= 4) {
        valuationHistory.push({ year: cols[0], improvements: cols[1], land: cols[2], total: cols[3] });
      }
    }
  }

  owner = owner
    .replace(/[*#\[\]]/g, "")
    .replace(/<br\/?>/gi, " ")
    .trim();
  if (!owner || owner.length < 2) return null;

  const isLLC = /\bLLC\b|\bL\.L\.C\b|\bLimited Liability\b/i.test(owner);
  const fmt$ = (v: string) => (v ? `$${v}` : "");

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
    assessedValue: fmt$(assessTotal) || fmt$(totalMarketValue),
    totalAppraisal: fmt$(totalValueCV) || fmt$(totalAppraisal),
    totalMarketValue: fmt$(totalMarketValue),
    improvementsValue: fmt$(improvementsValue),
    landValue: fmt$(landValueCV),
    assessImprovements: fmt$(assessImprovements),
    assessLand: fmt$(assessLand),
    assessTotal: fmt$(assessTotal),
    salePrice,
    saleDate,
    lotSize: lotSize ? `${lotSize} acres` : "",
    frontage: frontage ? `${frontage} ft` : "",
    depth: depth ? `${depth} ft` : "",
    useCode,
    useDescription,
    zoning,
    neighborhood: nbhdCode || neighborhood,
    totalMarketLand,
    landAppraisedValue,
    yearBuilt,
    buildingStyle,
    model,
    stories,
    livingArea: livingArea ? `${livingArea} sq ft` : "",
    replacementCost: replacementCost ? `$${replacementCost.replace(/[$]/g, "")}` : "",
    buildingPercentGood: buildingPercentGood ? `${buildingPercentGood}%` : "",
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
    exteriorWall: [exteriorWall1, exteriorWall2].filter(Boolean).join(", "),
    roofStructure,
    roofCover,
    interiorWall: [interiorWall1, interiorWall2].filter(Boolean).join(", "),
    flooring: [interiorFlr1, interiorFlr2].filter(Boolean).join(", "),
    heating: heatType,
    heatingFuel: heatFuel,
    cooling: acType,
    buildingPhoto,
    garage,
    pool,
    fireplace,
    foundation,
    taxAmount: taxAmount ? `$${taxAmount.replace(/[$]/g, "")}` : "",
    ownershipHistory,
    subAreas,
    valuationHistory,
    propertyCardUrl: "",
    llcDetails: undefined as any,
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
  let owner = ownerMatch?.[1]?.trim() || "";

  // Second name (co-owner)
  const secondMatch = text.match(/Second\s*name:\s*(.+)/i);
  const coOwner = secondMatch?.[1]?.trim() || "";

  // Mailing address
  const addrMatch = text.match(/Address:\s*(.+)/i);
  const cityMatch = text.match(/City\/state:\s*(.+?)(?:Zip:|$)/i);
  const zipMatch = text.match(/Zip:\s*(\S+)/i);
  const ownerAddress = [addrMatch?.[1]?.trim(), cityMatch?.[1]?.trim(), zipMatch?.[1]?.trim()]
    .filter(Boolean)
    .join(", ");

  // Location info
  const mapMatch = text.match(/Map:\s*(\S+)/i);
  const lotMatch = text.match(/Lot:\s*(\S+)/i);
  const neighMatch = text.match(/Neigh\.?:\s*(\S*)/i);
  const zoneMatch = text.match(/Zone:\s*(\S+)/i);
  const volMatch = text.match(/Vol:\s*(\S+)/i);
  const pageMatch = text.match(/Page:\s*(\S+)/i);
  const bookPage = volMatch?.[1] && pageMatch?.[1] ? `${volMatch[1]}/${pageMatch[1]}` : "";

  // Assessments
  const assessments: { category: string; qty: string; amount: string }[] = [];
  const assessRegex = /\|([\w\s]+?)\s+([\d.]+)\s+([\d,]+)\|/g;
  let am;
  while ((am = assessRegex.exec(text)) !== null) {
    if (!am[1].includes("Exempt") && !am[1].includes("Total") && !am[1].includes("Net")) {
      assessments.push({ category: am[1].trim(), qty: am[2], amount: am[3] });
    }
  }

  // Total assessment
  const totalAssessMatch = text.match(/Total\s*assessments\s+([\d,]+)/i);
  const totalAssessment = totalAssessMatch?.[1] || "";

  // Net assessment
  const netAssessMatch = text.match(/Net\s*assessment\s+([\d,]+)/i);
  const netAssessment = netAssessMatch?.[1] || "";

  // Sale info
  const saleDateMatch = text.match(/Sale\s*date:\s*([\w\-]+)/i);
  const salePriceMatch = text.match(/Sale\s*price:\s*([\d,]+)/i);
  const saleDate = saleDateMatch?.[1] || "";
  const salePrice = salePriceMatch?.[1] ? `$${salePriceMatch[1]}` : "";

  // Values
  const mktValueMatch = text.match(/Mkt\s*value\s*:\s*([\d,]+)/i);
  const costValueMatch = text.match(/Cost\s*value:\s*([\d,]+)/i);
  const mktValue = mktValueMatch?.[1] || "";
  const costValue = costValueMatch?.[1] || "";

  // Utilities
  const waterMatch = text.match(/Water\s+([\w\s]+?)(?:\||\n)/i);
  const sewerMatch = text.match(/Sewer\s+([\w\s]+?)(?:\||\n)/i);
  const gasMatch = text.match(/Gas\s+([\w\s]+?)(?:\||\n)/i);

  // Property ID from title
  const pidMatch = text.match(/Prop\s*ID\s*(\d+)/i);
  const parcelId = pidMatch?.[1] || lotMatch?.[1] || "";

  // PDF field card link
  const pdfMatch = text.match(/\[Street Card\]\((https?:\/\/[^\)]+\.pdf)\)/i);

  // Land vs building values from assessments
  let landValue = "",
    improvementsValue = "";
  for (const a of assessments) {
    if (a.category.toLowerCase().includes("land")) landValue = a.amount;
    if (a.category.toLowerCase().includes("building")) improvementsValue = a.amount;
  }

  owner = owner
    .replace(/[*#\[\]|]/g, "")
    .replace(/<br\/?>/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  // Clean trailing pipes from all extracted fields
  const cleanPipe = (v: string) => v.replace(/\s*\|\s*$/g, "").trim();
  if (!owner || owner.length < 2) return null;

  const isLLC = /\bLLC\b|\bL\.L\.C\b|\bLimited Liability\b|\bLP\b|\bL\.P\b/i.test(owner);
  const fmt$ = (v: string) => (v ? `$${v}` : "");

  return {
    address,
    town,
    owner,
    coOwner: cleanPipe(coOwner),
    ownerAddress: cleanPipe(ownerAddress),
    isLLC,
    parcelId,
    mblu: mapMatch?.[1] ? `${mapMatch[1]}/${lotMatch?.[1] || ""}` : "",
    accountNumber: "",
    buildingCount: String(assessments.filter((a) => a.category.toLowerCase().includes("building")).length || ""),
    bookPage,
    certificate: "",
    instrument: "",
    assessedValue: fmt$(netAssessment || totalAssessment),
    totalAppraisal: fmt$(costValue || mktValue),
    totalMarketValue: fmt$(mktValue),
    improvementsValue: fmt$(improvementsValue),
    landValue: fmt$(landValue),
    assessImprovements: "",
    assessLand: "",
    assessTotal: fmt$(netAssessment || totalAssessment),
    salePrice,
    saleDate,
    lotSize: assessments.find((a) => a.category.toLowerCase().includes("land"))?.qty
      ? `${assessments.find((a) => a.category.toLowerCase().includes("land"))!.qty} acres`
      : "",
    frontage: "",
    depth: "",
    useCode: "",
    useDescription: assessments.map((a) => a.category).join(", "),
    zoning: zoneMatch?.[1] || "",
    neighborhood: neighMatch?.[1] || "",
    totalMarketLand: "",
    landAppraisedValue: "",
    yearBuilt: "",
    buildingStyle: "",
    model: "",
    stories: "",
    livingArea: "",
    replacementCost: "",
    buildingPercentGood: "",
    occupancy: "",
    totalRooms: "",
    bedrooms: "",
    totalBaths: "",
    halfBaths: "",
    totalXtraFixtures: "",
    bathStyle: "",
    kitchenStyle: "",
    interiorCondition: "",
    finBsmntArea: "",
    finBsmntQual: "",
    grade: "",
    exteriorWall: "",
    roofStructure: "",
    roofCover: "",
    interiorWall: "",
    flooring: "",
    heating: "",
    heatingFuel: gasMatch?.[1]?.trim() || "",
    cooling: "",
    buildingPhoto: "",
    ownershipHistory: [] as { owner: string; salePrice: string; bookPage: string; saleDate: string }[],
    subAreas: assessments.map((a) => ({
      code: a.category,
      description: a.category,
      grossArea: "",
      livingArea: a.amount,
    })),
    valuationHistory: [] as { year: string; improvements: string; land: string; total: string }[],
    utilities: {
      water: waterMatch?.[1]?.trim() || "",
      sewer: sewerMatch?.[1]?.trim() || "",
      gas: gasMatch?.[1]?.trim() || "",
    },
    propertyCardUrl: "",
    fieldCardPdfUrl: pdfMatch?.[1] || "",
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
      const tableRe = new RegExp(`\\|\\s*${label}:?\\s*\\|\\s*([^|]*?)\\s*\\|`, "i");
      const tm = text.match(tableRe);
      if (tm?.[1]?.trim()) return tm[1].trim();

      // Try "Label: Value" format
      const colonRe = new RegExp(`${label}:?\\s+([^\\n]+)`, "i");
      const cm = text.match(colonRe);
      if (cm?.[1]?.trim()) return cm[1].trim();

      // Try "**Label** Value" format
      const boldRe = new RegExp(`\\*\\*${label}\\*\\*\\s*:?\\s*([^\\n]+)`, "i");
      const bm = text.match(boldRe);
      if (bm?.[1]?.trim()) return bm[1].trim();
    }
    return "";
  };

  const dollarGrab = (labels: string[]): string => {
    for (const label of labels) {
      const re = new RegExp(`${label}[:\\s]*\\$?([\\d,]+)`, "i");
      const m = text.match(re);
      if (m?.[1]) return m[1].trim();
    }
    return "";
  };

  let owner = grab(["Owner", "Owner Name", "Property Owner", "Owner/Taxpayer"]);
  const coOwner = grab(["Co-Owner", "Co Owner", "Additional Owner"]);

  let propertyAddress = grab(["Location", "Property Location", "Property Address", "Street Address", "Address"]);
  if (!propertyAddress) propertyAddress = address;

  const parcelId = grab(["Parcel ID", "Parcel", "PID", "Map/Block/Lot", "MBL", "MBLU", "Account"]);
  const accountNumber = grab(["Account", "Acct", "Account Number", "Account #"]);
  const ownerAddress = grab(["Mailing Address", "Mail Address", "Owner Address"]);

  const assessedValue = dollarGrab(["Assessed Value", "Total Assessment", "Assessment", "Net Assessment"]);
  const totalAppraisal = dollarGrab(["Appraised Value", "Total Appraisal", "Appraisal", "Market Value", "Total Value"]);
  const landValue = dollarGrab(["Land Value", "Land Assessment", "Land"]);
  const improvementsValue = dollarGrab(["Improvements", "Building Value", "Building Assessment", "Improvement Value"]);

  const salePrice = grab(["Sale Price", "Last Sale Price", "Sales Price"]);
  const saleDate = grab(["Sale Date", "Last Sale Date", "Date of Sale"]);
  const bookPage = grab(["Book & Page", "Book/Page", "Volume/Page"]);

  const lotSize = grab(["Lot Size", "Acreage", "Acres", "Land Area", "Size \\(Acres\\)"]);
  const zoning = grab(["Zoning", "Zone", "Zoning District"]);
  const useCode = grab(["Use Code", "Property Use", "Use", "Land Use"]);
  const useDescription = grab(["Use Description", "Description", "Property Type", "Class"]);
  const neighborhood = grab(["Neighborhood", "NBHD", "NBHD Code"]);

  const yearBuilt = grab(["Year Built", "Year Blt", "Built"]);
  const livingArea = grab(["Living Area", "Total Living Area", "Total Area", "Square Feet", "Sq Ft", "GLA"]);
  const buildingStyle = grab(["Style", "Building Style", "Design"]);
  const stories = grab(["Stories", "Number of Stories", "Floors"]);
  const totalRooms = grab(["Total Rooms", "Rooms"]);
  const bedrooms = grab(["Bedrooms", "Total Bedrooms", "BR"]);
  const totalBaths = grab(["Total Bthrms", "Full Baths", "Bathrooms", "Total Bathrooms"]);
  const halfBaths = grab(["Half Baths", "Total Half Baths"]);

  const exteriorWall = grab(["Exterior Wall", "Exterior", "Ext Wall", "Exterior Wall 1"]);
  const roofCover = grab(["Roof Cover", "Roof", "Roof Material"]);
  const heating = grab(["Heat Type", "Heating", "Heat System"]);
  const heatingFuel = grab(["Heat Fuel", "Fuel", "Fuel Type"]);
  const cooling = grab(["AC Type", "Air Conditioning", "Cooling", "AC"]);

  owner = owner
    .replace(/[*#\[\]]/g, "")
    .replace(/<br\/?>/gi, " ")
    .trim();
  // Reject if owner looks like garbage (too long = scraped paragraph, or too short)
  if (!owner || owner.length < 4 || owner.length > 100) return null;
  if (/https?:\/\/|\.com|\.org|\.net|\[.*\]\(/.test(owner)) return null;
  if (/^(Sold|For Sale|Pending|Active|Price|View|Details|Home|House|Property|Contact|Agent|N\/A|Unknown)$/i.test(owner))
    return null;

  const isLLC = /\bLLC\b|\bL\.L\.C\b|\bLimited Liability\b/i.test(owner);
  const fmt$ = (v: string) => (v ? `$${v}` : "");

  return {
    address: propertyAddress,
    town,
    owner,
    coOwner,
    ownerAddress,
    isLLC,
    parcelId,
    mblu: "",
    accountNumber,
    buildingCount: "",
    bookPage,
    certificate: "",
    instrument: "",
    assessedValue: fmt$(assessedValue),
    totalAppraisal: fmt$(totalAppraisal),
    totalMarketValue: fmt$(totalAppraisal),
    improvementsValue: fmt$(improvementsValue),
    landValue: fmt$(landValue),
    assessImprovements: "",
    assessLand: "",
    assessTotal: fmt$(assessedValue),
    salePrice,
    saleDate,
    lotSize: lotSize && !lotSize.includes("acre") ? `${lotSize} acres` : lotSize,
    frontage: "",
    depth: "",
    useCode,
    useDescription,
    zoning,
    neighborhood,
    totalMarketLand: "",
    landAppraisedValue: "",
    yearBuilt,
    buildingStyle,
    model: "",
    stories,
    livingArea: livingArea && !livingArea.includes("sq") ? `${livingArea} sq ft` : livingArea,
    replacementCost: "",
    buildingPercentGood: "",
    occupancy: "",
    totalRooms,
    bedrooms,
    totalBaths,
    halfBaths,
    totalXtraFixtures: "",
    bathStyle: "",
    kitchenStyle: "",
    interiorCondition: "",
    finBsmntArea: "",
    finBsmntQual: "",
    grade: "",
    exteriorWall,
    roofStructure: "",
    roofCover,
    interiorWall: "",
    flooring: "",
    heating,
    heatingFuel,
    cooling,
    buildingPhoto: "",
    ownershipHistory: [] as { owner: string; salePrice: string; bookPage: string; saleDate: string }[],
    subAreas: [] as { code: string; description: string; grossArea: string; livingArea: string }[],
    valuationHistory: [] as { year: string; improvements: string; land: string; total: string }[],
    propertyCardUrl: "",
    llcDetails: undefined as any,
  };
}

// ========== AGGREGATOR DATA EXTRACTOR ==========
function extractAggregatorData(markdown: string, address: string, town: string) {
  const text = markdown;

  const grab = (patterns: RegExp[]): string => {
    for (const re of patterns) {
      const m = text.match(re);
      if (m?.[1]?.trim()) return m[1].trim();
    }
    return "";
  };

  // Try to find owner
  let owner = grab([
    /(?:Owner|Owned\s+by|Property\s+Owner)[:\s]*\**\s*([A-Z][A-Za-z\s\-\.',&]+?)(?:\n|\||\*)/i,
    /(?:owner)\s*[:\|]\s*([^\n|*]+)/i,
  ]);

  // From realtor.com style: "Owner: NAME"
  if (!owner) {
    const ownerMatch = text.match(/owner[:\s]+([A-Z][A-Za-z\s\-']+(?:LLC|Trust|Inc)?)/i);
    if (ownerMatch) owner = ownerMatch[1].trim();
  }

  owner = owner.replace(/[*#\[\]]/g, "").trim();
  if (!owner || owner.length < 4 || owner.length > 100) return null;
  if (/https?:\/\/|\.com|\.org/.test(owner)) return null;
  // Reject single common words that aren't real owner names
  if (/^(Sold|For Sale|Pending|Active|Price|View|Details|Home|House|Property|Contact|Agent|N\/A|Unknown)$/i.test(owner))
    return null;

  const dollarMatch = (labels: string[]): string => {
    for (const label of labels) {
      const re = new RegExp(`${label}[:\\s]*\\$?([\\d,]+)`, "i");
      const m = text.match(re);
      if (m?.[1]) return m[1].trim();
    }
    return "";
  };

  const grabText = (labels: string[]): string => {
    for (const label of labels) {
      const re = new RegExp(`${label}[:\\s|]+([^\\n|]+)`, "i");
      const m = text.match(re);
      if (m?.[1]?.trim()) return m[1].trim();
    }
    return "";
  };

  const assessedValue = dollarMatch(["Assessed Value", "Tax Assessment", "Assessment"]);
  const totalAppraisal = dollarMatch(["Market Value", "Appraised Value", "Estimated Value", "Est\\. Value"]);
  const landValue = dollarMatch(["Land Value", "Land"]);
  const improvementsValue = dollarMatch(["Improvement", "Building Value", "Structure Value"]);
  const yearBuilt = grabText(["Year Built", "Built"]);
  const livingArea = grabText(["Living Area", "Square Feet", "Sq Ft", "Size", "Total Area"]);
  const lotSize = grabText(["Lot Size", "Lot Area", "Acreage", "Acres"]);
  const bedrooms = grabText(["Bedrooms", "Beds"]);
  const totalBaths = grabText(["Bathrooms", "Baths", "Full Bath"]);
  const salePrice = grabText(["Last Sold", "Sale Price", "Last Sale"]);
  const saleDate = grabText(["Sale Date", "Sold On", "Last Sale Date"]);
  const zoning = grabText(["Zoning", "Zone"]);
  const buildingStyle = grabText(["Style", "Type", "Property Type"]);
  const parcelId = grabText(["Parcel", "APN", "PID", "Tax Map"]);

  const isLLC = /\bLLC\b|\bL\.L\.C\b|\bLimited Liability\b/i.test(owner);
  const fmt$ = (v: string) => (v ? `$${v}` : "");

  return {
    address: address || town,
    town,
    owner,
    coOwner: "",
    ownerAddress: "",
    isLLC,
    parcelId,
    mblu: "",
    accountNumber: "",
    buildingCount: "",
    bookPage: "",
    certificate: "",
    instrument: "",
    assessedValue: fmt$(assessedValue),
    totalAppraisal: fmt$(totalAppraisal),
    totalMarketValue: fmt$(totalAppraisal),
    improvementsValue: fmt$(improvementsValue),
    landValue: fmt$(landValue),
    assessImprovements: "",
    assessLand: "",
    assessTotal: fmt$(assessedValue),
    salePrice,
    saleDate,
    lotSize,
    frontage: "",
    depth: "",
    useCode: "",
    useDescription: buildingStyle,
    zoning,
    neighborhood: "",
    totalMarketLand: "",
    landAppraisedValue: "",
    yearBuilt,
    buildingStyle,
    model: "",
    stories: "",
    livingArea,
    replacementCost: "",
    buildingPercentGood: "",
    occupancy: "",
    totalRooms: "",
    bedrooms,
    totalBaths,
    halfBaths: "",
    totalXtraFixtures: "",
    bathStyle: "",
    kitchenStyle: "",
    interiorCondition: "",
    finBsmntArea: "",
    finBsmntQual: "",
    grade: "",
    exteriorWall: "",
    roofStructure: "",
    roofCover: "",
    interiorWall: "",
    flooring: "",
    heating: "",
    heatingFuel: "",
    cooling: "",
    buildingPhoto: "",
    ownershipHistory: [] as { owner: string; salePrice: string; bookPage: string; saleDate: string }[],
    subAreas: [] as { code: string; description: string; grossArea: string; livingArea: string }[],
    valuationHistory: [] as { year: string; improvements: string; land: string; total: string }[],
    propertyCardUrl: "",
    llcDetails: undefined as any,
  };
}

// ========== LLC LOOKUP ==========
async function searchCTBusiness(_apiKey: string, businessName: string) {
  const CT_BUSINESS_API = "https://data.ct.gov/resource/n7gp-d28j.json";
  const CT_AGENTS_API = "https://data.ct.gov/resource/qh2m-n44y.json";

  const cleanName = businessName.replace(/[^a-zA-Z0-9\s&]/g, "").trim();
  const shortName = cleanName.replace(/\s*(LLC|L\.?L\.?C\.?|Inc|Corp)\s*$/i, "").trim();
  console.log(`LLC lookup: ${cleanName}`);

  try {
    // Fire both full-name and short-name queries in parallel
    const fullQuery = encodeURIComponent(`upper(name) like '%${cleanName.toUpperCase()}%'`);
    const shortQuery =
      shortName !== cleanName ? encodeURIComponent(`upper(name) like '%${shortName.toUpperCase()}%'`) : null;

    const fetches = [fetch(`${CT_BUSINESS_API}?$where=${fullQuery}&$limit=5`)];
    if (shortQuery) fetches.push(fetch(`${CT_BUSINESS_API}?$where=${shortQuery}&$limit=5`));

    const responses = await Promise.all(fetches);
    let businesses: any[] = [];

    for (const resp of responses) {
      if (!resp.ok) continue;
      const data = await resp.json();
      if (Array.isArray(data) && data.length > 0) {
        businesses = data;
        break;
      }
    }

    if (businesses.length === 0) return makeFallbackLLC(cleanName);
    return await buildLLCDetails(businesses, cleanName, CT_AGENTS_API);
  } catch (e) {
    console.error("CT Open Data error:", e);
    return makeFallbackLLC(cleanName);
  }
}

async function buildLLCDetails(businesses: Record<string, unknown>[], searchName: string, agentsApi: string) {
  const biz =
    businesses.find((b) => ((b.name as string) || "").toUpperCase().includes(searchName.toUpperCase())) ||
    businesses[0];

  const bizName = (biz.name as string) || searchName;
  const bizKey = biz.id as string;
  const status = (biz.status as string) || "N/A";
  const subStatus = (biz.sub_status as string) || "";
  const businessType = (biz.business_type as string) || "LLC";
  const mailingAddress =
    (biz.mailing_address as string) ||
    [biz.billingstreet, biz.billingcity, biz.billingstate, biz.billingpostalcode].filter(Boolean).join(", ") ||
    "N/A";
  const dateRegistration = (biz.date_registration as string) || "";
  const dateFormed = dateRegistration ? new Date(dateRegistration).toLocaleDateString("en-US") : "N/A";
  const accountNumber = (biz.accountnumber as string) || "";
  const citizenship = (biz.citizenship as string) || "";
  const formationPlace = (biz.formation_place as string) || "";
  const email = (biz.business_email_address as string) || "";
  const naicsCode = (biz.naics_code as string) || "";

  // Fetch agents in parallel (already started building response)
  const principals: { name: string; title: string; address: string; residentialAddress: string }[] = [];

  if (bizKey) {
    try {
      const agentResp = await fetch(`${agentsApi}?business_key=${encodeURIComponent(bizKey)}&$limit=20`);
      if (agentResp.ok) {
        const agents = await agentResp.json();
        if (Array.isArray(agents)) {
          for (const agent of agents) {
            const name =
              (agent.name__c as string) || [agent.firstname, agent.lastname].filter(Boolean).join(" ") || "Unknown";
            const title = (agent.type as string) || "Agent";
            const bizAddr =
              (agent.business_address as string) ||
              [agent.business_street_address_1, agent.business_city, agent.business_state, agent.business_zip_code]
                .filter(Boolean)
                .join(", ") ||
              "";
            const resAddr =
              [agent.residence_street_address_1, agent.residence_city, agent.residence_state, agent.residence_zip_code]
                .filter(Boolean)
                .join(", ") || bizAddr;
            principals.push({ name, title, address: bizAddr, residentialAddress: resAddr });
          }
        }
      }
    } catch (e) {
      console.error("Agent lookup error:", e);
    }
  }

  const fullStatus = subStatus ? `${status} (${subStatus})` : status;

  const rawLines = [
    `Business Name: ${bizName}`,
    `Account Number: ${accountNumber}`,
    `Status: ${fullStatus}`,
    `Business Type: ${businessType}`,
    `Date Registered: ${dateFormed}`,
    `Citizenship: ${citizenship}`,
    `Formation Place: ${formationPlace}`,
    `Mailing Address: ${mailingAddress}`,
    email ? `Business Email: ${email}` : "",
    naicsCode ? `NAICS Code: ${naicsCode}` : "",
    "",
    "--- Principals/Agents ---",
    ...principals.map((p) => `${p.name} (${p.title})\n  Business: ${p.address}\n  Residence: ${p.residentialAddress}`),
    "",
    `Source: CT Open Data Portal (data.ct.gov)`,
    `Retrieved: ${new Date().toLocaleDateString("en-US")}`,
  ].filter((l) => l !== undefined);

  const businessProfileUrl = bizKey
    ? `https://service.ct.gov/business/s/onlinebusinesssearch?language=en_US&businessNameEng=${encodeURIComponent(bizName)}`
    : "";

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
    businessProfileUrl,
    principals:
      principals.length > 0
        ? principals.map((p) => ({
            name: p.name,
            title: p.title,
            address: p.address,
            residentialAddress: p.residentialAddress,
          }))
        : [{ name: "No agents found in public records", title: "", address: "", residentialAddress: "" }],
    rawMarkdown: rawLines.join("\n"),
  };
}

function makeFallbackLLC(cleanName: string) {
  return {
    mailingAddress: "Could not retrieve automatically",
    dateFormed: "N/A",
    businessType: "Limited Liability Company",
    status: "N/A",
    principals: [
      {
        name: "See CT Secretary of State records",
        address: `https://service.ct.gov/business/s/onlinebusinesssearch (search: ${cleanName})`,
      },
    ],
    rawMarkdown: "",
  };
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
