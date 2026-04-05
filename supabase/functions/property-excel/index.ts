const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { property } = await req.json();
    if (!property) {
      return new Response(
        JSON.stringify({ success: false, error: "Property data required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const csvContent = buildCsv(property);
    // Add BOM for Excel UTF-8 detection
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const body = new TextEncoder().encode(csvContent);
    const combined = new Uint8Array(bom.length + body.length);
    combined.set(bom, 0);
    combined.set(body, bom.length);
    const base64 = btoa(String.fromCharCode(...combined));

    return new Response(
      JSON.stringify({ success: true, excel: base64 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Excel error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Excel generation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function esc(v: string): string {
  if (!v) return "";
  if (v.includes('"') || v.includes(',') || v.includes('\n') || v.includes('\r')) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

function row(...cells: string[]): string {
  return cells.map(c => esc(c ?? "")).join(",");
}

function buildCsv(p: Record<string, unknown>): string {
  const lines: string[] = [];
  const llc = p.llcDetails as { mailingAddress?: string; dateFormed?: string; businessType?: string; status?: string; accountNumber?: string; citizenship?: string; formationPlace?: string; email?: string; naicsCode?: string; principals?: { name: string; address: string }[] } | undefined;
  const history = p.ownershipHistory as { owner: string; salePrice: string; bookPage: string; saleDate: string }[] | undefined;
  const subAreas = p.subAreas as { code: string; description: string; grossArea: string; livingArea: string }[] | undefined;
  const valHistory = p.valuationHistory as { year: string; improvements: string; land: string; total: string }[] | undefined;

  // ── PROPERTY OVERVIEW ──
  lines.push(row("PROPERTY CARD", ""));
  lines.push(row("Address", s(p.address)));
  lines.push(row("Town", `${s(p.town)}, CT`));
  lines.push(row(""));

  // ── OWNERSHIP ──
  lines.push(row("OWNERSHIP & IDENTIFICATION", ""));
  lines.push(row("Owner", s(p.owner)));
  if (p.coOwner) lines.push(row("Co-Owner", s(p.coOwner)));
  if (p.ownerAddress) lines.push(row("Owner Mailing Address", s(p.ownerAddress)));
  lines.push(row("LLC Owner", p.isLLC ? "Yes" : "No"));
  if (p.parcelId) lines.push(row("Parcel ID (PID)", s(p.parcelId)));
  if (p.mblu) lines.push(row("MBLU", s(p.mblu)));
  if (p.accountNumber) lines.push(row("Account Number", s(p.accountNumber)));
  if (p.buildingCount) lines.push(row("Building Count", s(p.buildingCount)));
  if (p.useCode) lines.push(row("Use Code", s(p.useCode)));
  if (p.useDescription) lines.push(row("Use Description", s(p.useDescription)));
  lines.push(row(""));

  // ── VALUATION ──
  lines.push(row("CURRENT VALUE", ""));
  if (p.totalAppraisal) lines.push(row("Total Appraised Value", s(p.totalAppraisal)));
  if (p.improvementsValue) lines.push(row("Improvements Value", s(p.improvementsValue)));
  if (p.landValue) lines.push(row("Land Value", s(p.landValue)));
  if (p.totalMarketValue) lines.push(row("Total Market Value", s(p.totalMarketValue)));
  if (p.assessTotal) lines.push(row("Assessment Total", s(p.assessTotal)));
  if (p.assessImprovements) lines.push(row("Assessment - Improvements", s(p.assessImprovements)));
  if (p.assessLand) lines.push(row("Assessment - Land", s(p.assessLand)));
  lines.push(row(""));

  // ── LAST SALE ──
  if (p.salePrice || p.saleDate || p.bookPage) {
    lines.push(row("LAST SALE", ""));
    if (p.salePrice) lines.push(row("Sale Price", s(p.salePrice)));
    if (p.saleDate) lines.push(row("Sale Date", s(p.saleDate)));
    if (p.bookPage) lines.push(row("Book & Page", s(p.bookPage)));
    if (p.certificate) lines.push(row("Certificate", s(p.certificate)));
    if (p.instrument) lines.push(row("Instrument", s(p.instrument)));
    lines.push(row(""));
  }

  // ── LOT ──
  lines.push(row("LOT DETAILS", ""));
  if (p.lotSize) lines.push(row("Lot Size", s(p.lotSize)));
  if (p.frontage) lines.push(row("Frontage", s(p.frontage)));
  if (p.depth) lines.push(row("Depth", s(p.depth)));
  if (p.zoning) lines.push(row("Zoning", s(p.zoning)));
  if (p.neighborhood) lines.push(row("Neighborhood", s(p.neighborhood)));
  if (p.totalMarketLand) lines.push(row("Total Market Land", s(p.totalMarketLand)));
  if (p.landAppraisedValue) lines.push(row("Land Appraised Value", s(p.landAppraisedValue)));
  lines.push(row(""));

  // ── BUILDING ──
  lines.push(row("BUILDING DETAILS", ""));
  if (p.yearBuilt) lines.push(row("Year Built", s(p.yearBuilt)));
  if (p.buildingStyle) lines.push(row("Style", s(p.buildingStyle)));
  if (p.model) lines.push(row("Model", s(p.model)));
  if (p.grade) lines.push(row("Grade", s(p.grade)));
  if (p.stories) lines.push(row("Stories", s(p.stories)));
  if (p.occupancy) lines.push(row("Occupancy", s(p.occupancy)));
  if (p.livingArea) lines.push(row("Living Area (SF)", s(p.livingArea)));
  if (p.totalRooms) lines.push(row("Total Rooms", s(p.totalRooms)));
  if (p.bedrooms) lines.push(row("Bedrooms", s(p.bedrooms)));
  if (p.totalBaths) lines.push(row("Full Baths", s(p.totalBaths)));
  if (p.halfBaths) lines.push(row("Half Baths", s(p.halfBaths)));
  if (p.totalXtraFixtures) lines.push(row("Extra Fixtures", s(p.totalXtraFixtures)));
  if (p.bathStyle) lines.push(row("Bath Style", s(p.bathStyle)));
  if (p.kitchenStyle) lines.push(row("Kitchen Style", s(p.kitchenStyle)));
  if (p.interiorCondition) lines.push(row("Interior Condition", s(p.interiorCondition)));
  if (p.finBsmntArea) lines.push(row("Finished Basement Area", s(p.finBsmntArea)));
  if (p.finBsmntQual) lines.push(row("Finished Basement Quality", s(p.finBsmntQual)));
  if (p.replacementCost) lines.push(row("Replacement Cost", s(p.replacementCost)));
  if (p.buildingPercentGood) lines.push(row("Percent Good", s(p.buildingPercentGood)));
  lines.push(row(""));

  // ── CONSTRUCTION ──
  if (p.exteriorWall || p.roofStructure || p.roofCover || p.interiorWall || p.flooring) {
    lines.push(row("CONSTRUCTION", ""));
    if (p.exteriorWall) lines.push(row("Exterior Wall", s(p.exteriorWall)));
    if (p.roofStructure) lines.push(row("Roof Structure", s(p.roofStructure)));
    if (p.roofCover) lines.push(row("Roof Cover", s(p.roofCover)));
    if (p.interiorWall) lines.push(row("Interior Wall", s(p.interiorWall)));
    if (p.flooring) lines.push(row("Interior Floor", s(p.flooring)));
    lines.push(row(""));
  }

  // ── SYSTEMS ──
  if (p.heating || p.heatingFuel || p.cooling) {
    lines.push(row("SYSTEMS & UTILITIES", ""));
    if (p.heating) lines.push(row("Heat Type", s(p.heating)));
    if (p.heatingFuel) lines.push(row("Heat Fuel", s(p.heatingFuel)));
    if (p.cooling) lines.push(row("AC Type", s(p.cooling)));
    lines.push(row(""));
  }

  // ── SUB-AREAS TABLE ──
  if (subAreas && subAreas.length > 0) {
    lines.push(row("BUILDING SUB-AREAS", "", "", ""));
    lines.push(row("Code", "Description", "Gross Area (SF)", "Living Area (SF)"));
    for (const sa of subAreas) {
      lines.push(row(sa.code, sa.description, sa.grossArea, sa.livingArea));
    }
    lines.push(row(""));
  }

  // ── OWNERSHIP HISTORY ──
  if (history && history.length > 0) {
    lines.push(row("OWNERSHIP HISTORY", "", "", ""));
    lines.push(row("Owner", "Sale Price", "Book & Page", "Sale Date"));
    for (const h of history) {
      lines.push(row(h.owner, h.salePrice, h.bookPage, h.saleDate));
    }
    lines.push(row(""));
  }

  // ── VALUATION HISTORY ──
  if (valHistory && valHistory.length > 0) {
    lines.push(row("VALUATION HISTORY", "", "", ""));
    lines.push(row("Year", "Improvements", "Land", "Total"));
    for (const v of valHistory) {
      lines.push(row(v.year, v.improvements, v.land, v.total));
    }
    lines.push(row(""));
  }

  // ── LLC DETAILS ──
  if (p.isLLC && llc) {
    lines.push(row("OFFICIAL BUSINESS DETAILS", ""));
    if (llc.status) lines.push(row("Status", llc.status));
    lines.push(row("Business Type", s(llc.businessType)));
    lines.push(row("Date Formed", s(llc.dateFormed)));
    lines.push(row("Mailing Address", s(llc.mailingAddress)));
    if (llc.accountNumber) lines.push(row("Account Number", llc.accountNumber));
    if (llc.citizenship) lines.push(row("Citizenship", llc.citizenship));
    if (llc.formationPlace) lines.push(row("Formation Place", llc.formationPlace));
    if (llc.email) lines.push(row("Business Email", llc.email));
    if (llc.naicsCode) lines.push(row("NAICS Code", llc.naicsCode));
    lines.push(row(""));

    if (llc.principals && llc.principals.length > 0) {
      lines.push(row("PRINCIPALS", ""));
      lines.push(row("Name", "Address"));
      for (const pr of llc.principals) {
        lines.push(row(pr.name, pr.address));
      }
    }
  }

  return lines.join("\r\n");
}

function s(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v);
}
