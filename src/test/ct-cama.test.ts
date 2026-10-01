import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  parseStreetParts,
  streetBaseName,
  canonicalTown,
  rowMatchesAddress,
  mapCamaRowToBasic,
  mapCamaRowToProperty,
  queryCamaParcel,
  CAMA_DATASETS,
  type CamaRow,
} from "../../supabase/functions/_shared/ct-cama";

const WETHERSFIELD_ROW: CamaRow = {
  pid: "169054",
  account_number: "169054",
  location: "142 WOLCOTT HILL RD",
  property_city: "Wethersfield",
  street_name: "WOLCOTT HILL RD",
  address_number: "142",
  owner: "DEFEO ITALO L/U & ELIZABETH",
  co_owner: "GREGOR TARSILLA REMAINDERMAN",
  mailing_address: "142 WOLCOTT HILL RD",
  mailing_city: "WETHERSFIELD",
  mailing_state: "CT",
  mailing_zip: "06109",
  assessed_total: "265770.0",
  assessed_building: "192940.0",
  assessed_land: "72830.0",
  appraised_total: "379664.0",
  appraised_land: "104040.0",
  land_acres: "0.32",
  state_use: "100",
  state_use_description: "Residential",
  style_desc: "Raised Ranch",
  grade_desc: "C+",
  ayb: "1973.0",
  living_area: "1448.0",
  stories: "1.0",
  total_rooms: "8.0",
  number_of_bedroom: "3.0",
  number_of_baths: "2.0",
  number_of_half_baths: "1.0",
  heat_type_description: "Hot Water",
  heat_fuel_description: "Natural Gas",
  roof_cover_description: "Asphalt",
  ext_wall1_description: "Aluminum Siding",
  cama_site_link: "https://example.com/card",
  sale_price: "0.0",
};

function mockFetchSequence(responses: CamaRow[][]) {
  const calls: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      calls.push(String(url));
      const rows = responses.shift() ?? [];
      return { ok: true, json: async () => rows } as Response;
    }),
  );
  return calls;
}

afterEach(() => vi.unstubAllGlobals());

describe("address parsing and normalization", () => {
  it("parses house number and street", () => {
    expect(parseStreetParts("142 Wolcott Hill Rd")).toEqual({ houseNum: "142", street: "Wolcott Hill Rd" });
    expect(parseStreetParts("88 Wild Wood Drive")).toEqual({ houseNum: "88", street: "Wild Wood Drive" });
  });

  it("strips common street suffixes", () => {
    expect(streetBaseName("WOLCOTT HILL RD")).toBe("WOLCOTT HILL");
    expect(streetBaseName("Wild Wood Drive")).toBe("WILD WOOD");
    expect(streetBaseName("Main Street")).toBe("MAIN");
    expect(streetBaseName("Park Rd.")).toBe("PARK");
    expect(streetBaseName("Fenwick Dr")).toBe("FENWICK");
  });

  it("canonicalizes town names for property_city", () => {
    expect(canonicalTown("wethersfield")).toBe("Wethersfield");
    expect(canonicalTown("north haven")).toBe("North Haven");
  });
});

describe("exact address matching", () => {
  it("matches the correct row", () => {
    expect(rowMatchesAddress(WETHERSFIELD_ROW, "142", "Wolcott Hill Rd")).toBe(true);
  });

  it("never matches a neighboring property (different house number)", () => {
    expect(rowMatchesAddress(WETHERSFIELD_ROW, "144", "Wolcott Hill Rd")).toBe(false);
  });

  it("never matches a different street with the same number", () => {
    expect(rowMatchesAddress(WETHERSFIELD_ROW, "142", "Main St")).toBe(false);
  });
});

describe("CAMA row mapping", () => {
  it("preserves owner, address, and valuation in the basic shape", () => {
    const basic = mapCamaRowToBasic(WETHERSFIELD_ROW, "142 Wolcott Hill Rd");
    expect(basic.owner).toBe("DEFEO ITALO L/U & ELIZABETH");
    expect(basic.address).toBe("142 WOLCOTT HILL RD");
    expect(basic.assessedValue).toBe("265770.0");
    expect(basic.parcelId).toBe("169054");
  });

  it("maps the full PropertyData shape without inventing values", () => {
    const p = mapCamaRowToProperty(WETHERSFIELD_ROW, "142 Wolcott Hill Rd", "Wethersfield");
    expect(p.owner).toBe("DEFEO ITALO L/U & ELIZABETH");
    expect(p.coOwner).toBe("GREGOR TARSILLA REMAINDERMAN");
    expect(p.assessedValue).toBe("$265,770");
    expect(p.totalAppraisal).toBe("$379,664");
    expect(p.landValue).toBe("$72,830");
    expect(p.lotSize).toBe("0.32 acres");
    expect(p.yearBuilt).toBe("1973");
    expect(p.buildingStyle).toBe("Raised Ranch");
    expect(p.bedrooms).toBe("3");
    expect(p.totalBaths).toBe("2");
    expect(p.halfBaths).toBe("1");
    expect(p.heating).toBe("Hot Water");
    expect(p.heatingFuel).toBe("Natural Gas");
    expect(p.roofCover).toBe("Asphalt");
    expect(p.exteriorWall).toBe("Aluminum Siding");
    expect(p.propertyCardUrl).toBe("https://example.com/card");
    // sale_price is 0 — must stay blank, never invented
    expect(p.salePrice).toBe("");
    expect(p.ownershipHistory).toEqual([]);
    expect(p.taxAmount).toBe("");
    expect(p.pool).toBe("");
  });
});

describe("statewide fallback ordering", () => {
  it("queries 2025 first, then 2024 only when 2025 has no match", async () => {
    const calls = mockFetchSequence([[], [], [WETHERSFIELD_ROW]]);
    const row = await queryCamaParcel("142 Wolcott Hill Rd", "Wethersfield");
    expect(row?.owner).toBe("DEFEO ITALO L/U & ELIZABETH");
    expect(calls[0]).toContain(CAMA_DATASETS[0].url); // 2025
    expect(calls.some((c) => c.includes(CAMA_DATASETS[1].url))).toBe(true); // 2024
    expect(calls[0]).toContain("property_city=Wethersfield");
    expect(calls[0]).toContain("address_number=142");
  });

  it("returns the 2025 match without querying 2024", async () => {
    const calls = mockFetchSequence([[WETHERSFIELD_ROW]]);
    const row = await queryCamaParcel("142 Wolcott Hill Rd", "Wethersfield");
    expect(row?.owner).toBe("DEFEO ITALO L/U & ELIZABETH");
    expect(calls).toHaveLength(1);
  });

  it("returns null when nothing matches (never a different property)", async () => {
    mockFetchSequence([[{ ...WETHERSFIELD_ROW, address_number: "999" }], []]);
    const row = await queryCamaParcel("142 Wolcott Hill Rd", "Wethersfield");
    expect(row).toBeNull();
  });
});

describe("municipality coverage", () => {
  const src = readFileSync(resolve(__dirname, "../../supabase/functions/property-search/index.ts"), "utf8");

  it("CT_TOWNS lists all 169 Connecticut municipalities", () => {
    const m = src.match(/const CT_TOWNS[^=]*=\s*\[([\s\S]*?)\];/);
    expect(m).toBeTruthy();
    const towns = m![1].match(/"[^"]+"/g) || [];
    expect(towns.length).toBe(169);
  });

  it("every CT_TOWNS entry has a TOWN_DB entry (directly or via alias)", () => {
    const townsMatch = src.match(/const CT_TOWNS[^=]*=\s*\[([\s\S]*?)\];/)!;
    const towns = (townsMatch[1].match(/"([^"]+)"/g) || []).map((t) => t.slice(1, -1).toLowerCase());
    const dbMatch = src.match(/const TOWN_DB[^{]*\{([\s\S]*?)\n\};/)!;
    const dbKeys = new Set((dbMatch[1].match(/^\s*([a-z_]+):/gm) || []).map((k) => k.trim().replace(":", "")));
    const aliasMatch = src.match(/const TOWN_ALIASES[^{]*\{([\s\S]*?)\n\};?/);
    const aliasKeys = new Set(
      aliasMatch ? (aliasMatch[1].match(/"([^"]+)"\s*:/g) || []).map((k) => k.replace(/[":\s]/g, "").toLowerCase()) : [],
    );
    const missing = towns.filter((t) => !dbKeys.has(t.replace(/\s+/g, "_")) && !dbKeys.has(t) && !aliasKeys.has(t));
    expect(missing).toEqual([]);
  });
});
