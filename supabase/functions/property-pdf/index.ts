const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { property } = await req.json();
    if (!property) {
      return new Response(JSON.stringify({ success: false, error: "Property data required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const pdfBytes = buildPdf(property);
    const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));

    return new Response(JSON.stringify({ success: true, pdf: base64Pdf }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("PDF error:", error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "PDF generation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

// ─── PDF builder ───────────────────────────────────────────────

interface PdfObj { id: number; content: string; }

function buildPdf(p: Record<string, any>): ArrayBuffer {
  const pages: string[][] = [];
  let currentPage: string[] = [];
  let y = 720; // start y position on page
  const PAGE_BOTTOM = 60;
  const LINE_H = 16;
  const SECTION_GAP = 28;

  function addLine(text: string, fontSize = 10, bold = false, indent = 0, color = "0 0 0") {
    if (y < PAGE_BOTTOM + LINE_H) { pages.push(currentPage); currentPage = []; y = 740; }
    const font = bold ? "/F2" : "/F1";
    const x = 50 + indent;
    currentPage.push(`BT ${color} rg ${font} ${fontSize} Tf ${x} ${y} Td (${esc(text)}) Tj ET`);
    y -= LINE_H;
  }

  function addSectionTitle(title: string) {
    if (y < PAGE_BOTTOM + SECTION_GAP + LINE_H * 2) { pages.push(currentPage); currentPage = []; y = 740; }
    y -= 8;
    // Divider line
    currentPage.push(`0.75 0.75 0.75 RG 0.5 w 50 ${y + 14} m 562 ${y + 14} l S`);
    addLine(title.toUpperCase(), 10, true, 0, "0.15 0.35 0.6");
    y -= 4;
  }

  function addRow(label: string, value: string | undefined | null, indent = 0) {
    if (!value) return;
    if (y < PAGE_BOTTOM + LINE_H) { pages.push(currentPage); currentPage = []; y = 740; }
    const x = 50 + indent;
    const labelW = 140;
    currentPage.push(`BT 0.4 0.4 0.4 rg /F1 9 Tf ${x} ${y} Td (${esc(label)}) Tj ET`);
    currentPage.push(`BT 0 0 0 rg /F2 9 Tf ${x + labelW} ${y} Td (${esc(value)}) Tj ET`);
    y -= LINE_H;
  }

  function addKeyValue(label: string, value: string | undefined | null) {
    addRow(label, value);
  }

  // ── HEADER ──
  // Blue header bar
  currentPage.push("0.15 0.35 0.6 rg 0 770 612 22 re f");
  currentPage.push(`BT 1 1 1 rg /F2 11 Tf 50 775 Td (FOYR  -  Property Intelligence Report) Tj ET`);

  // Date
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  currentPage.push(`BT 0.5 0.5 0.5 rg /F1 8 Tf 420 775 Td (Generated: ${esc(today)}) Tj ET`);

  y = 745;

  // ── PROPERTY ADDRESS (hero) ──
  addLine(p.address || "Unknown Address", 16, true);
  addLine(`${p.town || ""}, CT${p.parcelId ? `   |   Parcel ID: ${p.parcelId}` : ""}`, 10, false, 0, "0.4 0.4 0.4");
  y -= 6;

  // ── OWNER INFORMATION ──
  addSectionTitle("Owner Information");
  addKeyValue("Owner", p.owner);
  addKeyValue("Co-Owner", p.coOwner);
  addKeyValue("Mailing Address", p.ownerAddress);
  addKeyValue("Account #", p.accountNumber);
  addKeyValue("Use Code", p.useCode ? `${p.useCode}${p.useDescription ? ` — ${p.useDescription}` : ""}` : p.useDescription);
  addKeyValue("Building Count", p.buildingCount);
  if (p.isLLC) {
    addLine("⚠ Owner is a registered LLC", 9, true, 0, "0.8 0.4 0.1");
  }

  // ── VALUATION & ASSESSMENT ──
  addSectionTitle("Valuation & Assessment");
  addKeyValue("Total Appraisal", p.totalAppraisal);
  addKeyValue("Market Value", p.totalMarketValue);
  addKeyValue("Improvements Value", p.improvementsValue);
  addKeyValue("Land Value", p.landValue);
  addKeyValue("Replacement Cost", p.replacementCost);
  addKeyValue("Assessed Total", p.assessTotal);
  addKeyValue("Assessed Improvements", p.assessImprovements);
  addKeyValue("Assessed Land", p.assessLand);
  addKeyValue("Annual Tax", p.taxAmount);

  // ── SALE HISTORY ──
  if (p.salePrice || p.saleDate) {
    addSectionTitle("Last Sale");
    addKeyValue("Sale Price", p.salePrice);
    addKeyValue("Sale Date", p.saleDate);
    addKeyValue("Book / Page", p.bookPage);
    addKeyValue("Certificate", p.certificate);
    addKeyValue("Instrument", p.instrument);
  }

  // ── LOT DETAILS ──
  addSectionTitle("Lot Details");
  addKeyValue("Lot Size", p.lotSize);
  addKeyValue("Frontage", p.frontage);
  addKeyValue("Depth", p.depth);
  addKeyValue("Zoning", p.zoning);
  addKeyValue("Neighborhood", p.neighborhood);

  // ── BUILDING DETAILS ──
  addSectionTitle("Building Details");
  addKeyValue("Year Built", p.yearBuilt);
  addKeyValue("Style", p.buildingStyle);
  addKeyValue("Model", p.model);
  addKeyValue("Stories", p.stories);
  addKeyValue("Living Area (sq ft)", p.livingArea);
  addKeyValue("Total Rooms", p.totalRooms);
  addKeyValue("Bedrooms", p.bedrooms);
  addKeyValue("Full Baths", p.totalBaths);
  addKeyValue("Half Baths", p.halfBaths);
  addKeyValue("Extra Fixtures", p.totalXtraFixtures);
  addKeyValue("Grade / Quality", p.grade);
  addKeyValue("Occupancy", p.occupancy);
  addKeyValue("Interior Condition", p.interiorCondition);

  // ── CONSTRUCTION & SYSTEMS ──
  addSectionTitle("Construction & Systems");
  addKeyValue("Exterior Walls", p.exteriorWall);
  addKeyValue("Foundation", p.foundation);
  addKeyValue("Roof Structure", p.roofStructure);
  addKeyValue("Roof Cover", p.roofCover);
  addKeyValue("Interior Walls", p.interiorWall);
  addKeyValue("Flooring", p.flooring);
  addKeyValue("Heating System", p.heating);
  addKeyValue("Heating Fuel", p.heatingFuel);
  addKeyValue("Cooling System", p.cooling);
  addKeyValue("Kitchen Style", p.kitchenStyle);
  addKeyValue("Bath Style", p.bathStyle);

  // ── ADDITIONAL FEATURES ──
  if (p.garage || p.fireplace || p.pool || p.finBsmntArea) {
    addSectionTitle("Additional Features");
    addKeyValue("Garage", p.garage);
    addKeyValue("Fireplace", p.fireplace);
    addKeyValue("Pool", p.pool);
    addKeyValue("Finished Basement", p.finBsmntArea);
    addKeyValue("Basement Quality", p.finBsmntQual);
  }

  // ── SUB-AREAS TABLE ──
  const subAreas = p.subAreas as { code: string; description: string; grossArea: string; livingArea: string }[] | undefined;
  if (subAreas?.length) {
    addSectionTitle("Sub-Areas / Building Components");
    // Header row
    if (y < PAGE_BOTTOM + LINE_H) { pages.push(currentPage); currentPage = []; y = 740; }
    currentPage.push(`BT 0.3 0.3 0.3 rg /F2 8 Tf 50 ${y} Td (Code) Tj ET`);
    currentPage.push(`BT 0.3 0.3 0.3 rg /F2 8 Tf 120 ${y} Td (Description) Tj ET`);
    currentPage.push(`BT 0.3 0.3 0.3 rg /F2 8 Tf 350 ${y} Td (Gross Area) Tj ET`);
    currentPage.push(`BT 0.3 0.3 0.3 rg /F2 8 Tf 460 ${y} Td (Living Area) Tj ET`);
    y -= LINE_H;
    currentPage.push(`0.85 0.85 0.85 RG 0.5 w 50 ${y + 12} m 562 ${y + 12} l S`);
    for (const s of subAreas) {
      if (y < PAGE_BOTTOM + LINE_H) { pages.push(currentPage); currentPage = []; y = 740; }
      currentPage.push(`BT 0 0 0 rg /F1 8 Tf 50 ${y} Td (${esc(s.code)}) Tj ET`);
      currentPage.push(`BT 0 0 0 rg /F1 8 Tf 120 ${y} Td (${esc(s.description)}) Tj ET`);
      currentPage.push(`BT 0 0 0 rg /F1 8 Tf 350 ${y} Td (${esc(s.grossArea)}) Tj ET`);
      currentPage.push(`BT 0 0 0 rg /F1 8 Tf 460 ${y} Td (${esc(s.livingArea)}) Tj ET`);
      y -= LINE_H - 2;
    }
  }

  // ── OWNERSHIP HISTORY TABLE ──
  const history = p.ownershipHistory as { owner: string; salePrice: string; bookPage: string; saleDate: string }[] | undefined;
  if (history?.length) {
    addSectionTitle("Ownership History");
    currentPage.push(`BT 0.3 0.3 0.3 rg /F2 8 Tf 50 ${y} Td (Owner) Tj ET`);
    currentPage.push(`BT 0.3 0.3 0.3 rg /F2 8 Tf 250 ${y} Td (Sale Price) Tj ET`);
    currentPage.push(`BT 0.3 0.3 0.3 rg /F2 8 Tf 370 ${y} Td (Book/Page) Tj ET`);
    currentPage.push(`BT 0.3 0.3 0.3 rg /F2 8 Tf 480 ${y} Td (Date) Tj ET`);
    y -= LINE_H;
    currentPage.push(`0.85 0.85 0.85 RG 0.5 w 50 ${y + 12} m 562 ${y + 12} l S`);
    for (const h of history) {
      if (y < PAGE_BOTTOM + LINE_H) { pages.push(currentPage); currentPage = []; y = 740; }
      const ownerText = h.owner.length > 30 ? h.owner.substring(0, 28) + "..." : h.owner;
      currentPage.push(`BT 0 0 0 rg /F1 8 Tf 50 ${y} Td (${esc(ownerText)}) Tj ET`);
      currentPage.push(`BT 0 0 0 rg /F1 8 Tf 250 ${y} Td (${esc(h.salePrice)}) Tj ET`);
      currentPage.push(`BT 0 0 0 rg /F1 8 Tf 370 ${y} Td (${esc(h.bookPage)}) Tj ET`);
      currentPage.push(`BT 0 0 0 rg /F1 8 Tf 480 ${y} Td (${esc(h.saleDate)}) Tj ET`);
      y -= LINE_H - 2;
    }
  }

  // ── VALUATION HISTORY TABLE ──
  const valHist = p.valuationHistory as { year: string; improvements: string; land: string; total: string }[] | undefined;
  if (valHist?.length) {
    addSectionTitle("Valuation History");
    currentPage.push(`BT 0.3 0.3 0.3 rg /F2 8 Tf 50 ${y} Td (Year) Tj ET`);
    currentPage.push(`BT 0.3 0.3 0.3 rg /F2 8 Tf 150 ${y} Td (Improvements) Tj ET`);
    currentPage.push(`BT 0.3 0.3 0.3 rg /F2 8 Tf 300 ${y} Td (Land) Tj ET`);
    currentPage.push(`BT 0.3 0.3 0.3 rg /F2 8 Tf 430 ${y} Td (Total) Tj ET`);
    y -= LINE_H;
    currentPage.push(`0.85 0.85 0.85 RG 0.5 w 50 ${y + 12} m 562 ${y + 12} l S`);
    for (const v of valHist) {
      if (y < PAGE_BOTTOM + LINE_H) { pages.push(currentPage); currentPage = []; y = 740; }
      currentPage.push(`BT 0 0 0 rg /F1 8 Tf 50 ${y} Td (${esc(v.year)}) Tj ET`);
      currentPage.push(`BT 0 0 0 rg /F1 8 Tf 150 ${y} Td (${esc(v.improvements)}) Tj ET`);
      currentPage.push(`BT 0 0 0 rg /F1 8 Tf 300 ${y} Td (${esc(v.land)}) Tj ET`);
      currentPage.push(`BT 0 0 0 rg /F2 8 Tf 430 ${y} Td (${esc(v.total)}) Tj ET`);
      y -= LINE_H - 2;
    }
  }

  // ── LLC DETAILS ──
  const llc = p.llcDetails as Record<string, any> | undefined;
  if (p.isLLC && llc) {
    addSectionTitle("LLC / Business Entity Details");
    addKeyValue("Entity Name", p.owner);
    addKeyValue("Mailing Address", llc.mailingAddress);
    addKeyValue("Date Formed", llc.dateFormed);
    addKeyValue("Business Type", llc.businessType);
    addKeyValue("Status", llc.status);
    addKeyValue("Account #", llc.accountNumber);
    addKeyValue("Citizenship", llc.citizenship);
    addKeyValue("Formation Place", llc.formationPlace);
    addKeyValue("Email", llc.email);
    addKeyValue("NAICS Code", llc.naicsCode);

    const principals = llc.principals as { name: string; title?: string; address: string; residentialAddress?: string }[] | undefined;
    if (principals?.length) {
      y -= 6;
      addLine("Principals / Members:", 9, true, 0, "0.15 0.35 0.6");
      for (const pr of principals) {
        addKeyValue("  Name", pr.name);
        if (pr.title) addKeyValue("  Title", pr.title);
        addKeyValue("  Address", pr.address);
        if (pr.residentialAddress) addKeyValue("  Residential", pr.residentialAddress);
        y -= 4;
      }
    }
  }

  // ── FOOTER ──
  pages.push(currentPage);

  // Now build the actual PDF bytes from pages
  return assemblePdf(pages);
}

function assemblePdf(pages: string[][]): ArrayBuffer {
  const totalPages = pages.length;
  let objId = 0;
  const newObj = () => ++objId;

  const catalogId = newObj(); // 1
  const pagesId = newObj();   // 2
  const fontRegId = newObj(); // 3 - Helvetica
  const fontBoldId = newObj(); // 4 - Helvetica-Bold

  const pageObjIds: number[] = [];
  const contentObjIds: number[] = [];

  for (let i = 0; i < totalPages; i++) {
    pageObjIds.push(newObj());
    contentObjIds.push(newObj());
  }

  const objects: string[] = [];
  const offsets: number[] = [];
  let bodyStr = "";

  function writeObj(id: number, content: string) {
    const obj = `${id} 0 obj\n${content}\nendobj\n`;
    offsets[id] = 9 + bodyStr.length; // header is "%PDF-1.4\n" = 9 chars
    bodyStr += obj;
  }

  // Catalog
  writeObj(catalogId, `<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  // Pages
  const kids = pageObjIds.map(id => `${id} 0 R`).join(" ");
  writeObj(pagesId, `<< /Type /Pages /Kids [${kids}] /Count ${totalPages} >>`);

  // Fonts
  writeObj(fontRegId, `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`);
  writeObj(fontBoldId, `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`);

  // Pages + content streams
  for (let i = 0; i < totalPages; i++) {
    const streamContent = pages[i].join("\n");
    const streamBytes = new TextEncoder().encode(streamContent);

    writeObj(contentObjIds[i], `<< /Length ${streamBytes.length} >>\nstream\n${streamContent}\nendstream`);

    // Footer on each page
    const footerStream = [
      `BT 0.6 0.6 0.6 rg /F1 7 Tf 50 30 Td (Foyr Property Intelligence  |  Public Records  |  Page ${i + 1} of ${totalPages}) Tj ET`,
      `0.85 0.85 0.85 RG 0.5 w 50 42 m 562 42 l S`,
    ].join("\n");
    const footerId = newObj();
    const footerBytes = new TextEncoder().encode(footerStream);
    writeObj(footerId, `<< /Length ${footerBytes.length} >>\nstream\n${footerStream}\nendstream`);

    writeObj(pageObjIds[i], `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Contents [${contentObjIds[i]} 0 R ${footerId} 0 R] /Resources << /Font << /F1 ${fontRegId} 0 R /F2 ${fontBoldId} 0 R >> >> >>`);
  }

  // Build xref
  const header = "%PDF-1.4\n";
  const xrefOffset = header.length + bodyStr.length;
  let xref = `xref\n0 ${objId + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objId; i++) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }

  const trailer = `trailer\n<< /Size ${objId + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  const fullPdf = header + bodyStr + xref + trailer;
  return new TextEncoder().encode(fullPdf).buffer;
}

function esc(text: string): string {
  return (text || "").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}
