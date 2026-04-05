import { FileDown, FileSpreadsheet, Loader2, Eye, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export interface PropertyData {
  address: string; town: string; owner: string; coOwner?: string; ownerAddress?: string; isLLC: boolean;
  parcelId?: string; mblu?: string; accountNumber?: string; buildingCount?: string; bookPage?: string;
  certificate?: string; instrument?: string; assessedValue?: string; totalAppraisal?: string;
  totalMarketValue?: string; improvementsValue?: string; landValue?: string; assessImprovements?: string;
  assessLand?: string; assessTotal?: string; salePrice?: string; saleDate?: string; lotSize?: string;
  frontage?: string; depth?: string; useCode?: string; useDescription?: string; zoning?: string;
  neighborhood?: string; totalMarketLand?: string; landAppraisedValue?: string; yearBuilt?: string;
  buildingStyle?: string; model?: string; stories?: string; livingArea?: string; replacementCost?: string;
  buildingPercentGood?: string; occupancy?: string; totalRooms?: string; bedrooms?: string;
  totalBaths?: string; halfBaths?: string; totalXtraFixtures?: string; bathStyle?: string;
  kitchenStyle?: string; interiorCondition?: string; finBsmntArea?: string; finBsmntQual?: string;
  grade?: string; exteriorWall?: string; roofStructure?: string; roofCover?: string; interiorWall?: string;
  flooring?: string; heating?: string; heatingFuel?: string; cooling?: string; buildingPhoto?: string;
  ownershipHistory?: { owner: string; salePrice: string; bookPage: string; saleDate: string }[];
  subAreas?: { code: string; description: string; grossArea: string; livingArea: string }[];
  valuationHistory?: { year: string; improvements: string; land: string; total: string }[];
  propertyCardUrl?: string;
  llcDetails?: {
    mailingAddress: string; dateFormed: string; businessType: string; status?: string;
    principals: { name: string; title?: string; address: string; residentialAddress?: string }[];
    rawMarkdown?: string; accountNumber?: string; citizenship?: string; formationPlace?: string;
    email?: string; naicsCode?: string;
  };
}

interface Props { data: PropertyData; onDownloadPdf: () => void; onDownloadExcel: () => void; onDownloadLLCPdf?: () => void; isExporting: boolean; }

export function PropertyResults({ data, onDownloadPdf, onDownloadExcel, onDownloadLLCPdf, isExporting }: Props) {
  const [showRaw, setShowRaw] = useState(false);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div className="flex items-start gap-4 min-w-0">
          {data.buildingPhoto && (
            <img src={data.buildingPhoto} alt={data.address}
              className="w-28 h-20 object-cover rounded-2xl flex-shrink-0 border border-border/30"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          )}
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">{data.address}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{data.town}, CT{data.parcelId && <span className="ml-2 opacity-50">PID {data.parcelId}</span>}</p>
            <div className="flex items-center gap-2 mt-2">
              {data.isLLC && <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-accent/15 text-accent font-semibold tracking-wide uppercase">LLC</span>}
              {data.propertyCardUrl && (
                <a href={data.propertyCardUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" /> Source
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Btn onClick={onDownloadPdf} disabled={isExporting} primary><FileDown className="h-3.5 w-3.5 mr-1.5" /> PDF</Btn>
          <Btn onClick={onDownloadExcel} disabled={isExporting}><FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" /> Excel</Btn>
          {onDownloadLLCPdf && <Btn onClick={onDownloadLLCPdf} disabled={isExporting}><FileDown className="h-3.5 w-3.5 mr-1.5" /> LLC</Btn>}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
        <Section title="Owner">
          <Row l="Owner" v={data.owner} />
          {data.coOwner && <Row l="Co-Owner" v={data.coOwner} />}
          {data.ownerAddress && <Row l="Mailing" v={data.ownerAddress} />}
          {data.accountNumber && <Row l="Account" v={data.accountNumber} />}
          {data.useCode && <Row l="Use" v={`${data.useCode}${data.useDescription ? ` — ${data.useDescription}` : ''}`} />}
          {data.buildingCount && <Row l="Buildings" v={data.buildingCount} />}
        </Section>

        <Section title="Valuation">
          {data.totalAppraisal && <Row l="Appraised" v={data.totalAppraisal} accent />}
          {data.improvementsValue && <Row l="Improvements" v={data.improvementsValue} />}
          {data.landValue && <Row l="Land" v={data.landValue} />}
          {data.totalMarketValue && <Row l="Market Value" v={data.totalMarketValue} accent />}
          {data.assessTotal && <Row l="Assessment" v={data.assessTotal} />}
          {data.assessImprovements && <Row l="Assessed Impr." v={data.assessImprovements} />}
          {data.assessLand && <Row l="Assessed Land" v={data.assessLand} />}
        </Section>

        {(data.salePrice || data.saleDate) && (
          <Section title="Last Sale">
            {data.salePrice && <Row l="Price" v={data.salePrice} accent />}
            {data.saleDate && <Row l="Date" v={data.saleDate} />}
            {data.bookPage && <Row l="Book/Page" v={data.bookPage} />}
            {data.certificate && <Row l="Certificate" v={data.certificate} />}
          </Section>
        )}

        <Section title="Lot">
          {data.lotSize && <Row l="Size" v={data.lotSize} />}
          {data.frontage && <Row l="Frontage" v={data.frontage} />}
          {data.depth && <Row l="Depth" v={data.depth} />}
          {data.zoning && <Row l="Zoning" v={data.zoning} />}
          {data.neighborhood && <Row l="Neighborhood" v={data.neighborhood} />}
        </Section>

        <Section title="Building">
          {data.yearBuilt && <Row l="Year Built" v={data.yearBuilt} />}
          {data.buildingStyle && <Row l="Style" v={data.buildingStyle} />}
          {data.stories && <Row l="Stories" v={data.stories} />}
          {data.livingArea && <Row l="Living Area" v={data.livingArea} />}
          {data.totalRooms && <Row l="Rooms" v={data.totalRooms} />}
          {data.bedrooms && <Row l="Bedrooms" v={data.bedrooms} />}
          {data.totalBaths && <Row l="Baths" v={data.totalBaths} />}
          {data.halfBaths && <Row l="Half Baths" v={data.halfBaths} />}
          {data.grade && <Row l="Grade" v={data.grade} />}
        </Section>

        <Section title="Construction">
          {data.exteriorWall && <Row l="Exterior" v={data.exteriorWall} />}
          {data.roofStructure && <Row l="Roof" v={data.roofStructure} />}
          {data.roofCover && <Row l="Roof Cover" v={data.roofCover} />}
          {data.interiorWall && <Row l="Interior" v={data.interiorWall} />}
          {data.flooring && <Row l="Flooring" v={data.flooring} />}
          {data.heating && <Row l="Heating" v={data.heating} />}
          {data.heatingFuel && <Row l="Fuel" v={data.heatingFuel} />}
          {data.cooling && <Row l="Cooling" v={data.cooling} />}
          {data.kitchenStyle && <Row l="Kitchen" v={data.kitchenStyle} />}
          {data.bathStyle && <Row l="Bath Style" v={data.bathStyle} />}
        </Section>
      </div>

      {/* Tables */}
      {data.subAreas && data.subAreas.length > 0 && (
        <Section title="Sub-Areas" full>
          <Table heads={["Code", "Description", "Gross", "Living"]}
            rows={data.subAreas.map(s => [s.code, s.description, s.grossArea, s.livingArea])}
            rightAlign={[2, 3]} />
        </Section>
      )}
      {data.ownershipHistory && data.ownershipHistory.length > 0 && (
        <Section title="Ownership History" full>
          <Table heads={["Owner", "Price", "Book/Page", "Date"]}
            rows={data.ownershipHistory.map(h => [h.owner, h.salePrice, h.bookPage, h.saleDate])}
            rightAlign={[1, 3]} />
        </Section>
      )}
      {data.valuationHistory && data.valuationHistory.length > 0 && (
        <Section title="Valuation History" full>
          <Table heads={["Year", "Improvements", "Land", "Total"]}
            rows={data.valuationHistory.map(v => [v.year, v.improvements, v.land, v.total])}
            rightAlign={[1, 2, 3]} boldCol={3} />
        </Section>
      )}

      {/* LLC */}
      {data.isLLC && data.llcDetails && (
        <Section title={`Business Details — ${data.owner}`} full>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground/60">CT Secretary of State</span>
            {data.llcDetails.rawMarkdown && (
              <button onClick={() => setShowRaw(!showRaw)} className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                <Eye className="h-3 w-3" /> {showRaw ? "Hide" : "Raw"}
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-8">
            <div>
              {data.llcDetails.status && <Row l="Status" v={data.llcDetails.status} />}
              <Row l="Type" v={data.llcDetails.businessType} />
              <Row l="Formed" v={data.llcDetails.dateFormed} />
              {data.llcDetails.formationPlace && <Row l="Place" v={data.llcDetails.formationPlace} />}
            </div>
            <div>
              <Row l="Mailing" v={data.llcDetails.mailingAddress} />
              {data.llcDetails.accountNumber && <Row l="Account" v={data.llcDetails.accountNumber} />}
              {data.llcDetails.citizenship && <Row l="Citizenship" v={data.llcDetails.citizenship} />}
              {data.llcDetails.email && <Row l="Email" v={data.llcDetails.email} />}
              {data.llcDetails.naicsCode && <Row l="NAICS" v={data.llcDetails.naicsCode} />}
            </div>
          </div>
          {data.llcDetails.principals.length > 0 && (
            <div className="mt-5">
              <p className="apple-section-title mb-3">Principals / Agents</p>
              <div className="space-y-2">
                {data.llcDetails.principals.map((p, i) => (
                  <div key={i} className="glass rounded-xl px-4 py-3 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{p.name}</p>
                      {p.title && <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold uppercase tracking-wide">{p.title}</span>}
                    </div>
                    {p.address && (
                      <div><p className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wider">Business Address</p><p className="text-xs text-foreground">{p.address}</p></div>
                    )}
                    {p.residentialAddress && p.residentialAddress !== p.address && (
                      <div><p className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wider">Residence Address</p><p className="text-xs text-foreground">{p.residentialAddress}</p></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {showRaw && data.llcDetails.rawMarkdown && (
            <pre className="mt-3 text-[11px] text-foreground/70 glass rounded-xl p-4 max-h-48 overflow-y-auto whitespace-pre-wrap font-mono">{data.llcDetails.rawMarkdown}</pre>
          )}
        </Section>
      )}
      {data.isLLC && !data.llcDetails && (
        <div className="glass rounded-2xl p-6 text-center">
          <p className="text-sm text-muted-foreground">Business details unavailable. <a href="https://service.ct.gov/business/s/onlinebusinesssearch?language=en_US" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Search CT SOS →</a></p>
        </div>
      )}
    </div>
  );
}

function Section({ title, children, full }: { title: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`glass rounded-2xl p-5 ${full ? 'col-span-full' : ''}`}>
      <h3 className="apple-section-title mb-3">{title}</h3>
      <div>{children}</div>
    </div>
  );
}

function Row({ l, v, accent }: { l: string; v: string; accent?: boolean }) {
  return (
    <div className="flex justify-between items-baseline py-1 gap-4">
      <span className="text-xs text-muted-foreground whitespace-nowrap">{l}</span>
      <span className={`text-xs text-right ${accent ? 'text-accent font-semibold' : 'text-foreground'}`}>{v}</span>
    </div>
  );
}

function Btn({ children, onClick, disabled, primary }: { children: React.ReactNode; onClick: () => void; disabled: boolean; primary?: boolean }) {
  return (
    <Button size="sm" onClick={onClick} disabled={disabled}
      className={`rounded-full h-8 px-4 text-xs font-medium transition-all active:scale-[0.97] ${primary ? 'bg-primary text-primary-foreground hover:brightness-110 border-0' : 'glass hover:bg-secondary/60 text-foreground border-0'}`}>
      {disabled ? <Loader2 className="h-3 w-3 animate-spin" /> : children}
    </Button>
  );
}

function Table({ heads, rows, rightAlign = [], boldCol }: { heads: string[]; rows: string[][]; rightAlign?: number[]; boldCol?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border/40">
            {heads.map((h, i) => (
              <th key={i} className={`py-2 pr-4 last:pr-0 font-medium text-muted-foreground/60 ${rightAlign.includes(i) ? 'text-right' : 'text-left'}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b border-border/20 last:border-0">
              {row.map((cell, ci) => (
                <td key={ci} className={`py-1.5 pr-4 last:pr-0 text-foreground ${rightAlign.includes(ci) ? 'text-right' : ''} ${boldCol === ci ? 'font-medium' : ''}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
