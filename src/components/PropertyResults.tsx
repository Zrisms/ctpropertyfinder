import { FileDown, FileSpreadsheet, Loader2, Eye, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export interface PropertyData {
  address: string;
  town: string;
  owner: string;
  coOwner?: string;
  ownerAddress?: string;
  isLLC: boolean;
  parcelId?: string;
  mblu?: string;
  accountNumber?: string;
  buildingCount?: string;
  bookPage?: string;
  certificate?: string;
  instrument?: string;
  assessedValue?: string;
  totalAppraisal?: string;
  totalMarketValue?: string;
  improvementsValue?: string;
  landValue?: string;
  assessImprovements?: string;
  assessLand?: string;
  assessTotal?: string;
  salePrice?: string;
  saleDate?: string;
  lotSize?: string;
  frontage?: string;
  depth?: string;
  useCode?: string;
  useDescription?: string;
  zoning?: string;
  neighborhood?: string;
  totalMarketLand?: string;
  landAppraisedValue?: string;
  yearBuilt?: string;
  buildingStyle?: string;
  model?: string;
  stories?: string;
  livingArea?: string;
  replacementCost?: string;
  buildingPercentGood?: string;
  occupancy?: string;
  totalRooms?: string;
  bedrooms?: string;
  totalBaths?: string;
  halfBaths?: string;
  totalXtraFixtures?: string;
  bathStyle?: string;
  kitchenStyle?: string;
  interiorCondition?: string;
  finBsmntArea?: string;
  finBsmntQual?: string;
  grade?: string;
  exteriorWall?: string;
  roofStructure?: string;
  roofCover?: string;
  interiorWall?: string;
  flooring?: string;
  heating?: string;
  heatingFuel?: string;
  cooling?: string;
  buildingPhoto?: string;
  ownershipHistory?: { owner: string; salePrice: string; bookPage: string; saleDate: string }[];
  subAreas?: { code: string; description: string; grossArea: string; livingArea: string }[];
  valuationHistory?: { year: string; improvements: string; land: string; total: string }[];
  propertyCardUrl?: string;
  llcDetails?: {
    mailingAddress: string;
    dateFormed: string;
    businessType: string;
    status?: string;
    principals: { name: string; title?: string; address: string; residentialAddress?: string }[];
    rawMarkdown?: string;
    accountNumber?: string;
    citizenship?: string;
    formationPlace?: string;
    email?: string;
    naicsCode?: string;
  };
}

interface PropertyResultsProps {
  data: PropertyData;
  onDownloadPdf: () => void;
  onDownloadExcel: () => void;
  onDownloadLLCPdf?: () => void;
  isExporting: boolean;
}

export function PropertyResults({ data, onDownloadPdf, onDownloadExcel, onDownloadLLCPdf, isExporting }: PropertyResultsProps) {
  const [showRawDetails, setShowRawDetails] = useState(false);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* ── HEADER ── */}
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div className="flex items-start gap-4 min-w-0">
          {data.buildingPhoto && (
            <img
              src={data.buildingPhoto}
              alt={data.address}
              className="w-24 h-16 object-cover rounded-xl flex-shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">{data.address}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {data.town}, CT
              {data.parcelId && <span className="ml-2 text-muted-foreground/60">PID {data.parcelId}</span>}
            </p>
            <div className="flex items-center gap-2 mt-2">
              {data.isLLC && <Badge className="bg-primary/10 text-primary border-0 text-xs font-medium rounded-full px-2.5">LLC</Badge>}
              {data.propertyCardUrl && (
                <a href={data.propertyCardUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" /> Source
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button size="sm" onClick={onDownloadPdf} disabled={isExporting} className="apple-button h-8 px-4 text-xs bg-foreground text-background hover:bg-foreground/90">
            {isExporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <><FileDown className="h-3.5 w-3.5 mr-1.5" /> PDF</>}
          </Button>
          <Button size="sm" variant="outline" onClick={onDownloadExcel} disabled={isExporting} className="apple-button h-8 px-4 text-xs border-border hover:bg-secondary">
            {isExporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <><FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" /> Excel</>}
          </Button>
          {onDownloadLLCPdf && (
            <Button size="sm" variant="outline" onClick={onDownloadLLCPdf} disabled={isExporting} className="apple-button h-8 px-4 text-xs border-border hover:bg-secondary">
              {isExporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <><FileDown className="h-3.5 w-3.5 mr-1.5" /> LLC</>}
            </Button>
          )}
        </div>
      </div>

      {/* ── GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Owner */}
        <Section title="Owner">
          <Row label="Owner" value={data.owner} />
          {data.coOwner && <Row label="Co-Owner" value={data.coOwner} />}
          {data.ownerAddress && <Row label="Mailing Address" value={data.ownerAddress} />}
          {data.accountNumber && <Row label="Account" value={data.accountNumber} />}
          {data.useCode && <Row label="Use" value={`${data.useCode}${data.useDescription ? ` — ${data.useDescription}` : ''}`} />}
          {data.buildingCount && <Row label="Buildings" value={data.buildingCount} />}
        </Section>

        {/* Valuation */}
        <Section title="Valuation">
          {data.totalAppraisal && <Row label="Appraised" value={data.totalAppraisal} bold />}
          {data.improvementsValue && <Row label="Improvements" value={data.improvementsValue} />}
          {data.landValue && <Row label="Land" value={data.landValue} />}
          {data.totalMarketValue && <Row label="Market Value" value={data.totalMarketValue} bold />}
          {data.assessTotal && <Row label="Assessment" value={data.assessTotal} />}
          {data.assessImprovements && <Row label="Assessed Impr." value={data.assessImprovements} />}
          {data.assessLand && <Row label="Assessed Land" value={data.assessLand} />}
        </Section>

        {/* Sale */}
        {(data.salePrice || data.saleDate) && (
          <Section title="Last Sale">
            {data.salePrice && <Row label="Price" value={data.salePrice} bold />}
            {data.saleDate && <Row label="Date" value={data.saleDate} />}
            {data.bookPage && <Row label="Book/Page" value={data.bookPage} />}
            {data.certificate && <Row label="Certificate" value={data.certificate} />}
          </Section>
        )}

        {/* Lot */}
        <Section title="Lot">
          {data.lotSize && <Row label="Size" value={data.lotSize} />}
          {data.frontage && <Row label="Frontage" value={data.frontage} />}
          {data.depth && <Row label="Depth" value={data.depth} />}
          {data.zoning && <Row label="Zoning" value={data.zoning} />}
          {data.neighborhood && <Row label="Neighborhood" value={data.neighborhood} />}
        </Section>

        {/* Building */}
        <Section title="Building">
          {data.yearBuilt && <Row label="Year Built" value={data.yearBuilt} />}
          {data.buildingStyle && <Row label="Style" value={data.buildingStyle} />}
          {data.stories && <Row label="Stories" value={data.stories} />}
          {data.livingArea && <Row label="Living Area" value={data.livingArea} />}
          {data.totalRooms && <Row label="Rooms" value={data.totalRooms} />}
          {data.bedrooms && <Row label="Bedrooms" value={data.bedrooms} />}
          {data.totalBaths && <Row label="Baths" value={data.totalBaths} />}
          {data.halfBaths && <Row label="Half Baths" value={data.halfBaths} />}
          {data.grade && <Row label="Grade" value={data.grade} />}
        </Section>

        {/* Construction */}
        <Section title="Construction">
          {data.exteriorWall && <Row label="Exterior" value={data.exteriorWall} />}
          {data.roofStructure && <Row label="Roof" value={data.roofStructure} />}
          {data.roofCover && <Row label="Roof Cover" value={data.roofCover} />}
          {data.interiorWall && <Row label="Interior" value={data.interiorWall} />}
          {data.flooring && <Row label="Flooring" value={data.flooring} />}
          {data.heating && <Row label="Heating" value={data.heating} />}
          {data.heatingFuel && <Row label="Fuel" value={data.heatingFuel} />}
          {data.cooling && <Row label="Cooling" value={data.cooling} />}
          {data.kitchenStyle && <Row label="Kitchen" value={data.kitchenStyle} />}
          {data.bathStyle && <Row label="Bath Style" value={data.bathStyle} />}
        </Section>
      </div>

      {/* Sub-Areas */}
      {data.subAreas && data.subAreas.length > 0 && (
        <Section title="Sub-Areas" full>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Code</th>
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Description</th>
                  <th className="text-right py-2 pr-4 font-medium text-muted-foreground">Gross</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Living</th>
                </tr>
              </thead>
              <tbody>
                {data.subAreas.map((s, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    <td className="py-1.5 pr-4 text-foreground">{s.code}</td>
                    <td className="py-1.5 pr-4 text-foreground">{s.description}</td>
                    <td className="py-1.5 pr-4 text-right text-foreground">{s.grossArea}</td>
                    <td className="py-1.5 text-right text-foreground">{s.livingArea}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* History tables */}
      {data.ownershipHistory && data.ownershipHistory.length > 0 && (
        <Section title="Ownership History" full>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Owner</th>
                  <th className="text-right py-2 pr-4 font-medium text-muted-foreground">Price</th>
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Book/Page</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.ownershipHistory.map((h, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    <td className="py-1.5 pr-4 text-foreground">{h.owner}</td>
                    <td className="py-1.5 pr-4 text-right text-foreground">{h.salePrice}</td>
                    <td className="py-1.5 pr-4 text-foreground">{h.bookPage}</td>
                    <td className="py-1.5 text-right text-foreground">{h.saleDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {data.valuationHistory && data.valuationHistory.length > 0 && (
        <Section title="Valuation History" full>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Year</th>
                  <th className="text-right py-2 pr-4 font-medium text-muted-foreground">Improvements</th>
                  <th className="text-right py-2 pr-4 font-medium text-muted-foreground">Land</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.valuationHistory.map((v, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    <td className="py-1.5 pr-4 text-foreground">{v.year}</td>
                    <td className="py-1.5 pr-4 text-right text-foreground">{v.improvements}</td>
                    <td className="py-1.5 pr-4 text-right text-foreground">{v.land}</td>
                    <td className="py-1.5 text-right font-medium text-foreground">{v.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* LLC Details */}
      {data.isLLC && data.llcDetails && (
        <Section title={`Business Details — ${data.owner}`} full>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground">CT Secretary of State</span>
            <div className="flex gap-1.5">
              {data.llcDetails.rawMarkdown && (
                <button onClick={() => setShowRawDetails(!showRawDetails)} className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                  <Eye className="h-3 w-3" /> {showRawDetails ? "Hide Raw" : "Show Raw"}
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-0">
            <div>
              {data.llcDetails.status && <Row label="Status" value={data.llcDetails.status} />}
              <Row label="Type" value={data.llcDetails.businessType} />
              <Row label="Formed" value={data.llcDetails.dateFormed} />
              {data.llcDetails.formationPlace && <Row label="Place" value={data.llcDetails.formationPlace} />}
            </div>
            <div>
              <Row label="Mailing" value={data.llcDetails.mailingAddress} />
              {data.llcDetails.accountNumber && <Row label="Account" value={data.llcDetails.accountNumber} />}
              {data.llcDetails.citizenship && <Row label="Citizenship" value={data.llcDetails.citizenship} />}
              {data.llcDetails.email && <Row label="Email" value={data.llcDetails.email} />}
              {data.llcDetails.naicsCode && <Row label="NAICS" value={data.llcDetails.naicsCode} />}
            </div>
          </div>

          {data.llcDetails.principals.length > 0 && (
            <div className="mt-4">
              <p className="apple-section-title mb-2">Principals / Agents</p>
              <div className="space-y-2">
                {data.llcDetails.principals.map((p, i) => (
                  <div key={i} className="bg-secondary/60 rounded-xl px-4 py-3 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{p.name}</p>
                      {p.title && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{p.title}</span>}
                    </div>
                    {p.address && (
                      <div>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Business Address</p>
                        <p className="text-xs text-foreground">{p.address}</p>
                      </div>
                    )}
                    {p.residentialAddress && p.residentialAddress !== p.address && (
                      <div>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Residence Address</p>
                        <p className="text-xs text-foreground">{p.residentialAddress}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {showRawDetails && data.llcDetails.rawMarkdown && (
            <pre className="mt-3 text-[11px] text-foreground bg-secondary/60 rounded-xl p-4 max-h-48 overflow-y-auto whitespace-pre-wrap font-mono">{data.llcDetails.rawMarkdown}</pre>
          )}
        </Section>
      )}

      {data.isLLC && !data.llcDetails && (
        <div className="apple-card p-6 text-center">
          <p className="text-muted-foreground text-sm">
            Business details unavailable.{" "}
            <a href="https://service.ct.gov/business/s/onlinebusinesssearch?language=en_US" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Search CT Secretary of State →
            </a>
          </p>
        </div>
      )}
    </div>
  );
}

function Section({ title, children, full }: { title: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`apple-card p-5 ${full ? 'col-span-full' : ''}`}>
      <h3 className="apple-section-title mb-3">{title}</h3>
      <div>{children}</div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-baseline py-1 gap-4">
      <span className="text-xs text-muted-foreground whitespace-nowrap">{label}</span>
      <span className={`text-xs text-foreground text-right ${bold ? 'font-semibold' : ''}`}>{value}</span>
    </div>
  );
}
