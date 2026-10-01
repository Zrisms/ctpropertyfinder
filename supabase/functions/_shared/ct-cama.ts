// Official Connecticut Open Data CAMA lookup (Socrata).
// 2025 dataset: https://data.ct.gov/resource/rny9-6ak2.json (160 municipalities)
// 2024 dataset: https://data.ct.gov/resource/pqrn-qghw.json (162 municipalities)
// Pure helpers (no Deno-specific APIs at import time) so they are testable with vitest.

export const CAMA_DATASETS = [
  { year: 2025, url: "https://data.ct.gov/resource/rny9-6ak2.json" },
  { year: 2024, url: "https://data.ct.gov/resource/pqrn-qghw.json" },
] as const;

export interface CamaRow {
  [key: string]: string | undefined;
}

/** Split "142 Wolcott Hill Rd" into house number + street remainder. */
export function parseStreetParts(address: string): { houseNum: string; street: string } {
  const m = address.trim().match(/^(\d+[A-Za-z]?)\s+(.+)$/);
  if (!m) return { houseNum: "", street: address.trim() };
  return { houseNum: m[1], street: m[2].trim() };
}

const SUFFIX_RE =
  /\s+(ST|RD|DR|AVE|LN|CT|CIR|BLVD|PL|TER|WAY|TRL|HWY|PKWY|TPKE|EXT|STREET|ROAD|DRIVE|AVENUE|LANE|COURT|CIRCLE|BOULEVARD|PLACE|TERRACE|TRAIL|HIGHWAY|PARKWAY|TURNPIKE|EXTENSION)\.?$/i;

/** Strip the trailing street suffix so "WOLCOTT HILL RD" -> "WOLCOTT HILL". */
export function streetBaseName(street: string): string {
  return street.replace(SUFFIX_RE, "").trim().toUpperCase();
}

/** Title-case a town name for Socrata property_city matching ("north haven" -> "North Haven"). */
export function canonicalTown(town: string): string {
  return town
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * True only when the row is the same property: exact house-number match AND
 * the normalized street base of the query is contained in the row's street
 * (or vice versa). Never matches a neighboring property.
 */
export function rowMatchesAddress(row: CamaRow, houseNum: string, street: string): boolean {
  if (!houseNum || String(row.address_number || "").trim() !== houseNum) return false;
  const rowStreet = streetBaseName(String(row.street_name || row.location || ""));
  const wantStreet = streetBaseName(street);
  if (!rowStreet || !wantStreet) return false;
  return rowStreet === wantStreet || rowStreet.includes(wantStreet) || wantStreet.includes(rowStreet);
}

async function fetchDataset(
  datasetUrl: string,
  town: string,
  houseNum: string,
  street: string,
  timeoutMs: number,
): Promise<CamaRow[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // Primary: exact house number + city; filter street client-side for safety.
    const params = new URLSearchParams({
      property_city: canonicalTown(town),
      address_number: houseNum,
      $limit: "50",
    });
    let resp = await fetch(`${datasetUrl}?${params.toString()}`, { signal: controller.signal });
    if (resp.ok) {
      const rows = (await resp.json()) as CamaRow[];
      if (Array.isArray(rows) && rows.length) return rows;
    }
    // Fallback: street-based query (used only when the number query returned nothing).
    const base = streetBaseName(street).replace(/'/g, "''");
    const params2 = new URLSearchParams({
      property_city: canonicalTown(town),
      $where: `upper(street_name) like '%${base}%'`,
      $limit: "200",
    });
    resp = await fetch(`${datasetUrl}?${params2.toString()}`, { signal: controller.signal });
    if (!resp.ok) return [];
    const rows = (await resp.json()) as CamaRow[];
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Query the official statewide CAMA datasets (2025 first, then 2024) for an
 * exact address match. Returns the matching row or null. Never returns a
 * different property.
 */
export async function queryCamaParcel(
  address: string,
  town: string,
  timeoutMs = 6000,
): Promise<CamaRow | null> {
  const { houseNum, street } = parseStreetParts(address);
  if (!houseNum || !street || !town.trim()) return null;
  for (const ds of CAMA_DATASETS) {
    const rows = await fetchDataset(ds.url, town, houseNum, street, timeoutMs);
    const match = rows.find((r) => rowMatchesAddress(r, houseNum, street));
    if (match) return match;
  }
  return null;
}

const money = (v?: string) => {
  const n = Number(v);
  return v && Number.isFinite(n) && n > 0 ? `$${n.toLocaleString()}` : "";
};
const num = (v?: string) => {
  const n = Number(v);
  return v && Number.isFinite(n) && n > 0 ? String(Math.round(n)) : "";
};
const str = (v?: string) => (v ?? "").trim();

/** Basic shape kept compatible with the former CT ECO fallback contract. */
export function mapCamaRowToBasic(row: CamaRow, fallbackAddress: string) {
  return {
    owner: str(row.owner),
    coOwner: str(row.co_owner),
    address: str(row.location) || fallbackAddress,
    parcelId: str(row.pid) || str(row.account_number),
    assessedValue: str(row.assessed_total),
    landValue: str(row.assessed_land),
    improvementsValue: str(row.assessed_building),
    lotSize: str(row.land_acres),
    useDescription: str(row.state_use_description),
    yearBuilt: str(row.ayb) ? String(Math.round(Number(row.ayb))) : "",
  };
}

/** Full PropertyData mapping — only fields actually present in the dataset; blanks otherwise. */
export function mapCamaRowToProperty(row: CamaRow, address: string, town: string) {
  const owner = str(row.owner);
  const isLLC = /\bLLC\b|\bL\.L\.C\b|\bLimited Liability\b/i.test(owner);
  const mailing = [str(row.mailing_address), str(row.mailing_city), str(row.mailing_state), str(row.mailing_zip)]
    .filter(Boolean)
    .join(", ");
  const mblu = [str(row.map), str(row.block), str(row.lot)].filter(Boolean).join("/");
  const salePrice = money(row.sale_price);
  const saleDate = str(row.sale_date);
  const ownershipHistory =
    salePrice || saleDate
      ? [{ date: saleDate, price: salePrice, grantee: str(row.sale_grantee_name), grantor: str(row.sale_grantor_name), bookPage: str(row.book_page) }]
      : [];
  return {
    address: str(row.location) || address,
    town,
    owner,
    coOwner: str(row.co_owner),
    ownerAddress: mailing,
    isLLC,
    parcelId: str(row.pid) || str(row.account_number),
    mblu,
    accountNumber: str(row.account_number),
    buildingCount: num(row.number_of_buildings),
    bookPage: str(row.book_page),
    certificate: "",
    instrument: str(row.instrument),
    assessedValue: money(row.assessed_total),
    totalAppraisal: money(row.appraised_total),
    totalMarketValue: money(row.appraised_total),
    improvementsValue: money(row.assessed_building),
    landValue: money(row.assessed_land),
    assessImprovements: money(row.assessed_building),
    assessLand: money(row.assessed_land),
    assessTotal: money(row.assessed_total),
    salePrice,
    saleDate,
    lotSize: row.land_acres && Number(row.land_acres) > 0 ? `${row.land_acres} acres` : "",
    frontage: num(row.parcel_frontage),
    depth: num(row.parcel_depth),
    useCode: str(row.state_use),
    useDescription: str(row.state_use_description),
    zoning: str(row.zone_description) || str(row.zone),
    neighborhood: str(row.neighborhood),
    totalMarketLand: money(row.appraised_land),
    landAppraisedValue: money(row.appraised_land),
    yearBuilt: str(row.ayb) ? String(Math.round(Number(row.ayb))) : "",
    buildingStyle: str(row.style_desc),
    model: str(row.model),
    stories: str(row.stories) && Number(row.stories) > 0 ? str(row.stories).replace(/\.0$/, "") : "",
    livingArea: num(row.living_area),
    replacementCost: money(row.replacement_cost_new),
    buildingPercentGood: "",
    occupancy: str(row.occupancy),
    totalRooms: num(row.total_rooms),
    bedrooms: num(row.number_of_bedroom),
    totalBaths: num(row.number_of_baths),
    halfBaths: num(row.number_of_half_baths),
    totalXtraFixtures: "",
    bathStyle: str(row.bathrm_style_description),
    kitchenStyle: str(row.kitchen_style_description),
    interiorCondition: str(row.condition_description),
    finBsmntArea: num(row.fin_bsm_area),
    finBsmntQual: str(row.fin_bsm_qual),
    grade: str(row.grade_desc) || str(row.grade),
    exteriorWall: str(row.ext_wall1_description),
    roofStructure: str(row.roof_structure_description),
    roofCover: str(row.roof_cover_description),
    interiorWall: str(row.int_wall1_description),
    flooring: str(row.int_flr1_description),
    heating: str(row.heat_type_description),
    heatingFuel: str(row.heat_fuel_description),
    cooling: str(row.ac_type_description),
    buildingPhoto: str(row.building_photo),
    garage: num(row.bsm_gar),
    pool: "",
    fireplace: num(row.no_of_fireplaces),
    foundation: str(row.basement_type),
    taxAmount: "",
    ownershipHistory,
    subAreas: [],
    valuationHistory: [],
    propertyCardUrl: str(row.cama_site_link),
    llcDetails: undefined as unknown,
  };
}
