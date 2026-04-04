const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { llcDetails, ownerName } = await req.json();

    if (!llcDetails || !ownerName) {
      return new Response(
        JSON.stringify({ success: false, error: 'LLC details and owner name required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const pdfBytes = generateLLCPdf(llcDetails, ownerName);
    const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));

    return new Response(
      JSON.stringify({ success: true, pdf: base64Pdf }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('LLC PDF error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'PDF generation failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateLLCPdf(llc: Record<string, unknown>, ownerName: string): ArrayBuffer {
  const principals = (llc.principals || []) as { name: string; address: string }[];
  
  const lines = [
    'Connecticut Secretary of the State',
    'Official Business Details',
    '',
    `Business Name: ${ownerName}`,
    `Status: ${llc.status || 'N/A'}`,
    `Business Type: ${llc.businessType || 'N/A'}`,
    `Date Formed: ${llc.dateFormed || 'N/A'}`,
    `Mailing Address: ${llc.mailingAddress || 'N/A'}`,
    '',
    '--- Principals ---',
  ];

  for (const p of principals) {
    lines.push(`Name: ${p.name}`);
    lines.push(`Address: ${p.address}`);
    lines.push('');
  }

  lines.push('');
  lines.push(`Generated: ${new Date().toLocaleDateString('en-US')}`);
  lines.push('Source: CT Secretary of the State Business Registry');

  const streamContent = `BT\n/F1 11 Tf\n50 750 Td\n14 TL\n${lines.map(l => `(${escapePdf(l)}) '`).join('\n')}\nET`;

  const objects: string[] = [];
  let objNum = 1;

  objects.push(`${objNum} 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj`);
  objNum++;
  objects.push(`${objNum} 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj`);
  objNum++;
  objects.push(`${objNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj`);
  objNum++;

  const streamBytes = new TextEncoder().encode(streamContent);
  objects.push(`${objNum} 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n${streamContent}\nendstream\nendobj`);
  objNum++;

  objects.push(`${objNum} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj`);

  const body = objects.join('\n\n');
  const header = '%PDF-1.4\n';
  const xrefOffset = header.length + body.length + 2;

  let xref = `xref\n0 ${objNum + 1}\n0000000000 65535 f \n`;
  let offset = header.length;
  for (const obj of objects) {
    xref += `${String(offset).padStart(10, '0')} 00000 n \n`;
    offset += obj.length + 2;
  }

  const trailer = `trailer\n<< /Size ${objNum + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  const fullPdf = header + body + '\n\n' + xref + trailer;
  return new TextEncoder().encode(fullPdf).buffer;
}

function escapePdf(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}
