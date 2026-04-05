const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { businessName } = await req.json();
    if (!businessName) return json({ success: false, error: 'businessName required' }, 400);

    const CT_BUSINESS_API = "https://data.ct.gov/resource/n7gp-d28j.json";
    const CT_AGENTS_API = "https://data.ct.gov/resource/qh2m-n44y.json";

    const cleanName = businessName.replace(/[^a-zA-Z0-9\s&]/g, "").trim();
    const shortName = cleanName.replace(/\s*(LLC|L\.?L\.?C\.?|Inc|Corp)\s*$/i, "").trim();
    console.log(`LLC lookup: ${cleanName}`);

    const fullQuery = encodeURIComponent(`upper(name) like '%${cleanName.toUpperCase()}%'`);
    const shortQuery = shortName !== cleanName
      ? encodeURIComponent(`upper(name) like '%${shortName.toUpperCase()}%'`)
      : null;

    const fetches = [fetch(`${CT_BUSINESS_API}?$where=${fullQuery}&$limit=5`)];
    if (shortQuery) fetches.push(fetch(`${CT_BUSINESS_API}?$where=${shortQuery}&$limit=5`));

    const responses = await Promise.all(fetches);
    let businesses: any[] = [];
    for (const resp of responses) {
      if (!resp.ok) continue;
      const data = await resp.json();
      if (Array.isArray(data) && data.length > 0) { businesses = data; break; }
    }

    if (businesses.length === 0) {
      return json({
        success: true,
        llcDetails: {
          mailingAddress: "Could not retrieve automatically",
          dateFormed: "N/A",
          businessType: "Limited Liability Company",
          status: "N/A",
          principals: [{ name: "See CT Secretary of State records", address: `https://service.ct.gov/business/s/onlinebusinesssearch (search: ${cleanName})` }],
          rawMarkdown: "",
        },
      });
    }

    // Build LLC details
    const biz = businesses.find(b => ((b.name as string) || "").toUpperCase().includes(cleanName.toUpperCase())) || businesses[0];
    const bizName = (biz.name as string) || cleanName;
    const bizKey = biz.id as string;
    const status = (biz.status as string) || "N/A";
    const subStatus = (biz.sub_status as string) || "";
    const businessType = (biz.business_type as string) || "LLC";
    const mailingAddress = (biz.mailing_address as string) ||
      [biz.billingstreet, biz.billingcity, biz.billingstate, biz.billingpostalcode].filter(Boolean).join(", ") || "N/A";
    const dateRegistration = (biz.date_registration as string) || "";
    const dateFormed = dateRegistration ? new Date(dateRegistration).toLocaleDateString("en-US") : "N/A";
    const accountNumber = (biz.accountnumber as string) || "";
    const citizenship = (biz.citizenship as string) || "";
    const formationPlace = (biz.formation_place as string) || "";
    const email = (biz.business_email_address as string) || "";
    const naicsCode = (biz.naics_code as string) || "";

    const principals: { name: string; title: string; address: string; residentialAddress: string }[] = [];
    if (bizKey) {
      try {
        const agentResp = await fetch(`${CT_AGENTS_API}?business_key=${encodeURIComponent(bizKey)}&$limit=20`);
        if (agentResp.ok) {
          const agents = await agentResp.json();
          if (Array.isArray(agents)) {
            for (const agent of agents) {
              const name = (agent.name__c as string) || [agent.firstname, agent.lastname].filter(Boolean).join(" ") || "Unknown";
              const title = (agent.type as string) || "Agent";
              const bizAddr = (agent.business_address as string) ||
                [agent.business_street_address_1, agent.business_city, agent.business_state, agent.business_zip_code].filter(Boolean).join(", ") || "";
              const resAddr = [agent.residence_street_address_1, agent.residence_city, agent.residence_state, agent.residence_zip_code].filter(Boolean).join(", ") || bizAddr;
              principals.push({ name, title, address: bizAddr, residentialAddress: resAddr });
            }
          }
        }
      } catch (e) { console.error("Agent lookup error:", e); }
    }

    const fullStatus = subStatus ? `${status} (${subStatus})` : status;
    const rawLines = [
      `Business Name: ${bizName}`, `Account Number: ${accountNumber}`, `Status: ${fullStatus}`,
      `Business Type: ${businessType}`, `Date Registered: ${dateFormed}`, `Citizenship: ${citizenship}`,
      `Formation Place: ${formationPlace}`, `Mailing Address: ${mailingAddress}`,
      email ? `Business Email: ${email}` : "", naicsCode ? `NAICS Code: ${naicsCode}` : "",
      "", "--- Principals/Agents ---",
      ...principals.map(p => `${p.name} (${p.title})\n  Business: ${p.address}\n  Residence: ${p.residentialAddress}`),
      "", `Source: CT Open Data Portal (data.ct.gov)`, `Retrieved: ${new Date().toLocaleDateString("en-US")}`,
    ].filter(l => l !== undefined);

    const businessProfileUrl = bizKey
      ? `https://service.ct.gov/business/s/onlinebusinesssearch?language=en_US&businessNameEng=${encodeURIComponent(bizName)}`
      : "";

    return json({
      success: true,
      llcDetails: {
        mailingAddress, dateFormed, businessType, status: fullStatus,
        accountNumber, citizenship, formationPlace, email, naicsCode, businessProfileUrl,
        principals: principals.length > 0
          ? principals.map(p => ({ name: p.name, title: p.title, address: p.address, residentialAddress: p.residentialAddress }))
          : [{ name: "No agents found in public records", title: "", address: "", residentialAddress: "" }],
        rawMarkdown: rawLines.join("\n"),
      },
    });
  } catch (error) {
    console.error("LLC search error:", error);
    return json({ success: false, error: error instanceof Error ? error.message : "LLC search failed" }, 500);
  }
});
