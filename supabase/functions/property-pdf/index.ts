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

    // If we have a property card URL from Vision GIS, fetch the actual page
    if (property.propertyCardUrl) {
      try {
        const resp = await fetch(property.propertyCardUrl);
        if (resp.ok) {
          const html = await resp.text();
          // For now, generate a simple text-based PDF representation
          // A full solution would use a PDF library in Deno
        }
      } catch (e) {
        console.error("Failed to fetch property card:", e);
      }
    }

    // Generate a simple PDF using basic text content
    const pdfContent = generateSimplePdf(property);
    const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(pdfContent)));

    return new Response(
      JSON.stringify({ success: true, pdf: base64Pdf }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("PDF error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "PDF generation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateSimplePdf(property: Record<string, unknown>): ArrayBuffer {
  // Minimal PDF generation without external libs
  const lines = [
    `Property Card - ${property.address}`,
    `Town: ${property.town}, CT`,
    `Owner: ${property.owner}`,
    property.parcelId ? `Parcel ID: ${property.parcelId}` : "",
    property.assessedValue ? `Assessed Value: ${property.assessedValue}` : "",
    property.lotSize ? `Lot Size: ${property.lotSize}` : "",
    property.yearBuilt ? `Year Built: ${property.yearBuilt}` : "",
    property.zoning ? `Zoning: ${property.zoning}` : "",
  ].filter(Boolean);

  const llc = property.llcDetails as { mailingAddress: string; dateFormed: string; businessType: string; principals: { name: string; address: string }[] } | undefined;
  if (property.isLLC && llc) {
    lines.push("");
    lines.push("--- LLC Details ---");
    lines.push(`Mailing Address: ${llc.mailingAddress}`);
    lines.push(`Date Formed: ${llc.dateFormed}`);
    lines.push(`Business Type: ${llc.businessType}`);
    if (llc.principals?.length) {
      lines.push("Principals:");
      for (const p of llc.principals) {
        lines.push(`  - ${p.name}: ${p.address}`);
      }
    }
  }

  // Build minimal PDF
  const textContent = lines.join("\n");
  const streamContent = `BT\n/F1 12 Tf\n50 750 Td\n14 TL\n${lines.map(l => `(${escapePdf(l)}) '`).join("\n")}\nET`;
  
  const objects: string[] = [];
  let objNum = 1;

  // Catalog
  objects.push(`${objNum} 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj`);
  objNum++;

  // Pages
  objects.push(`${objNum} 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj`);
  objNum++;

  // Page
  objects.push(`${objNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj`);
  objNum++;

  // Content stream
  const streamBytes = new TextEncoder().encode(streamContent);
  objects.push(`${objNum} 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n${streamContent}\nendstream\nendobj`);
  objNum++;

  // Font
  objects.push(`${objNum} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj`);

  const body = objects.join("\n\n");
  const header = "%PDF-1.4\n";
  const xrefOffset = header.length + body.length + 2;

  // Build xref
  let xref = `xref\n0 ${objNum + 1}\n0000000000 65535 f \n`;
  let offset = header.length;
  for (const obj of objects) {
    xref += `${String(offset).padStart(10, "0")} 00000 n \n`;
    offset += obj.length + 2;
  }

  const trailer = `trailer\n<< /Size ${objNum + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const fullPdf = header + body + "\n\n" + xref + trailer;
  return new TextEncoder().encode(fullPdf).buffer;
}

function escapePdf(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}
