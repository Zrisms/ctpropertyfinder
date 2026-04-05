import { FileDown, FileSpreadsheet, Loader2, Eye, Download, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
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
    principals: { name: string; address: string }[];
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
    <div className="w-full max-w-5xl mx-auto space-y-3 animate-fade-in">
      {/* ── HEADER BAR ── */}
      <Card className="p-3 border-border bg-card shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            {data.buildingPhoto && (
              <img
                src={data.buildingPhoto}
                alt={data.address}
                className="w-20 h-14 object-cover rounded border border-border flex-shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <div className="min-w-0">
              <h2 className="font-display text-lg font-bold text-foreground truncate">{data.address}</h2>
              <p className="text-xs text-muted-foreground">{data.town}, CT {data.parcelId ? `• PID: ${data.parcelId}` : ''} {data.mblu ? `• MBLU: ${data.mblu}` : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {data.isLLC && <Badge className="bg-secondary text-secondary-foreground text-xs py-0">LLC</Badge>}
            {data.propertyCardUrl && (
              <a href={data.propertyCardUrl} target="_blank" rel="noopener noreferrer">
                <Badge variant="outline" className="cursor-pointer hover:bg-accent text-xs py-0">
                  <ExternalLink className="h-3 w-3 mr-1" /> Source
                </Badge>
              </a>
            )}
            <Button size="sm" onClick={onDownloadPdf} disabled={isExporting} className="h-7 text-xs bg-navy hover:bg-navy-light text-primary-foreground">
              {isExporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileDown className="h-3 w-3 mr-1" />} PDF
            </Button>
            <Button size="sm" variant="outline" onClick={onDownloadExcel} disabled={isExporting} className="h-7 text-xs">
              {isExporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileSpreadsheet className="h-3 w-3 mr-1" />} Excel
            </Button>
          </div>
        </div>
      </Card>

      {/* ── MAIN GRID: 2-column compact layout ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* LEFT COLUMN */}
        <div className="space-y-3">
          {/* Owner */}
          <FieldCard title="Owner Information">
            <Row label="Owner" value={data.owner} />
            {data.coOwner && <Row label="Co-Owner" value={data.coOwner} />}
            {data.ownerAddress && <Row label="Mailing" value={data.ownerAddress} />}
            {data.accountNumber && <Row label="Account #" value={data.accountNumber} />}
            {data.useCode && <Row label="Use" value={`${data.useCode}${data.useDescription ? ` – ${data.useDescription}` : ''}`} />}
            {data.buildingCount && <Row label="Buildings" value={data.buildingCount} />}
          </FieldCard>

          {/* Values */}
          <FieldCard title="Valuation">
            {data.totalAppraisal && <Row label="Appraised Total" value={data.totalAppraisal} bold />}
            {data.improvementsValue && <Row label="Improvements" value={data.improvementsValue} />}
            {data.landValue && <Row label="Land" value={data.landValue} />}
            {data.totalMarketValue && <Row label="Market Value" value={data.totalMarketValue} bold />}
            {data.assessTotal && <Row label="Assessment" value={data.assessTotal} />}
            {data.assessImprovements && <Row label="Assess. Impr." value={data.assessImprovements} />}
            {data.assessLand && <Row label="Assess. Land" value={data.assessLand} />}
            {!data.totalAppraisal && !data.totalMarketValue && !data.assessTotal && <p className="text-xs text-muted-foreground italic">No data</p>}
          </FieldCard>

          {/* Sale */}
          {(data.salePrice || data.saleDate) && (
            <FieldCard title="Last Sale">
              {data.salePrice && <Row label="Price" value={data.salePrice} bold />}
              {data.saleDate && <Row label="Date" value={data.saleDate} />}
              {data.bookPage && <Row label="Book/Page" value={data.bookPage} />}
              {data.certificate && <Row label="Certificate" value={data.certificate} />}
              {data.instrument && <Row label="Instrument" value={data.instrument} />}
            </FieldCard>
          )}

          {/* Lot */}
          <FieldCard title="Lot">
            {data.lotSize && <Row label="Size" value={data.lotSize} />}
            {data.frontage && <Row label="Frontage" value={data.frontage} />}
            {data.depth && <Row label="Depth" value={data.depth} />}
            {data.zoning && <Row label="Zone" value={data.zoning} />}
            {data.neighborhood && <Row label="Nbhd" value={data.neighborhood} />}
            {data.totalMarketLand && <Row label="Mkt Land" value={data.totalMarketLand} />}
            {data.landAppraisedValue && <Row label="Appr. Land" value={data.landAppraisedValue} />}
            {!data.lotSize && !data.zoning && <p className="text-xs text-muted-foreground italic">No data</p>}
          </FieldCard>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-3">
          {/* Building */}
          <FieldCard title="Building">
            <div className="grid grid-cols-2 gap-x-4">
              <div className="space-y-0">
                {data.yearBuilt && <Row label="Year" value={data.yearBuilt} />}
                {data.buildingStyle && <Row label="Style" value={data.buildingStyle} />}
                {data.model && <Row label="Model" value={data.model} />}
                {data.grade && <Row label="Grade" value={data.grade} />}
                {data.stories && <Row label="Stories" value={data.stories} />}
                {data.livingArea && <Row label="Living SF" value={data.livingArea} />}
                {data.occupancy && <Row label="Occupancy" value={data.occupancy} />}
              </div>
              <div className="space-y-0">
                {data.totalRooms && <Row label="Rooms" value={data.totalRooms} />}
                {data.bedrooms && <Row label="Beds" value={data.bedrooms} />}
                {data.totalBaths && <Row label="Full Bath" value={data.totalBaths} />}
                {data.halfBaths && <Row label="Half Bath" value={data.halfBaths} />}
                {data.kitchenStyle && <Row label="Kitchen" value={data.kitchenStyle} />}
                {data.bathStyle && <Row label="Bath Sty." value={data.bathStyle} />}
                {data.interiorCondition && <Row label="Int. Cond." value={data.interiorCondition} />}
              </div>
            </div>
            {data.finBsmntArea && <Row label="Fin. Bsmt SF" value={data.finBsmntArea} />}
            {data.finBsmntQual && <Row label="Bsmt Qual." value={data.finBsmntQual} />}
            {data.replacementCost && <Row label="Repl. Cost" value={data.replacementCost} />}
            {data.buildingPercentGood && <Row label="% Good" value={data.buildingPercentGood} />}
            {data.totalXtraFixtures && <Row label="Xtra Fix." value={data.totalXtraFixtures} />}
            {!data.yearBuilt && !data.livingArea && <p className="text-xs text-muted-foreground italic">No data</p>}
          </FieldCard>

          {/* Construction & Systems combined */}
          {(data.exteriorWall || data.roofCover || data.heating || data.cooling) && (
            <FieldCard title="Construction & Systems">
              <div className="grid grid-cols-2 gap-x-4">
                <div className="space-y-0">
                  {data.exteriorWall && <Row label="Ext. Wall" value={data.exteriorWall} />}
                  {data.roofStructure && <Row label="Roof Str." value={data.roofStructure} />}
                  {data.roofCover && <Row label="Roof Cvr." value={data.roofCover} />}
                </div>
                <div className="space-y-0">
                  {data.interiorWall && <Row label="Int. Wall" value={data.interiorWall} />}
                  {data.flooring && <Row label="Floor" value={data.flooring} />}
                  {data.heating && <Row label="Heat" value={data.heating} />}
                  {data.heatingFuel && <Row label="Fuel" value={data.heatingFuel} />}
                  {data.cooling && <Row label="AC" value={data.cooling} />}
                </div>
              </div>
            </FieldCard>
          )}

          {/* Sub-Areas */}
          {data.subAreas && data.subAreas.length > 0 && (
            <FieldCard title="Sub-Areas (SF)">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-0.5 text-left text-muted-foreground font-medium">Code</th>
                    <th className="py-0.5 text-left text-muted-foreground font-medium">Desc</th>
                    <th className="py-0.5 text-right text-muted-foreground font-medium">Gross</th>
                    <th className="py-0.5 text-right text-muted-foreground font-medium">Living</th>
                  </tr>
                </thead>
                <tbody>
                  {data.subAreas.map((s, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0">
                      <td className="py-0.5 font-mono text-foreground">{s.code}</td>
                      <td className="py-0.5 text-foreground">{s.description}</td>
                      <td className="py-0.5 text-right text-foreground">{s.grossArea}</td>
                      <td className="py-0.5 text-right text-foreground">{s.livingArea}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </FieldCard>
          )}
        </div>
      </div>

      {/* ── FULL-WIDTH TABLES ── */}
      {/* Ownership History */}
      {data.ownershipHistory && data.ownershipHistory.length > 0 && (
        <FieldCard title="Ownership History">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-border">
                <th className="py-0.5 text-left text-muted-foreground font-medium">Owner</th>
                <th className="py-0.5 text-left text-muted-foreground font-medium">Price</th>
                <th className="py-0.5 text-left text-muted-foreground font-medium">Book/Page</th>
                <th className="py-0.5 text-left text-muted-foreground font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.ownershipHistory.map((h, i) => (
                <tr key={i} className="border-b border-border/50 last:border-0">
                  <td className="py-0.5 text-foreground">{h.owner}</td>
                  <td className="py-0.5 text-foreground">{h.salePrice}</td>
                  <td className="py-0.5 text-foreground">{h.bookPage}</td>
                  <td className="py-0.5 text-foreground">{h.saleDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </FieldCard>
      )}

      {/* Valuation History */}
      {data.valuationHistory && data.valuationHistory.length > 0 && (
        <FieldCard title="Valuation History">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-border">
                <th className="py-0.5 text-left text-muted-foreground font-medium">Year</th>
                <th className="py-0.5 text-right text-muted-foreground font-medium">Improvements</th>
                <th className="py-0.5 text-right text-muted-foreground font-medium">Land</th>
                <th className="py-0.5 text-right text-muted-foreground font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.valuationHistory.map((v, i) => (
                <tr key={i} className="border-b border-border/50 last:border-0">
                  <td className="py-0.5 text-foreground">{v.year}</td>
                  <td className="py-0.5 text-right text-foreground">{v.improvements}</td>
                  <td className="py-0.5 text-right text-foreground">{v.land}</td>
                  <td className="py-0.5 text-right text-foreground font-semibold">{v.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </FieldCard>
      )}

      {/* ── LLC DETAILS ── */}
      {data.isLLC && data.llcDetails && (
        <FieldCard title={`Business Details — ${data.owner}`}>
          <div className="flex items-center justify-between mb-1">
            <Badge variant="outline" className="text-[10px] py-0">CT Secretary of State</Badge>
            <div className="flex gap-1">
              {data.llcDetails.rawMarkdown && (
                <Button variant="ghost" size="sm" onClick={() => setShowRawDetails(!showRawDetails)} className="h-6 text-[10px] px-2">
                  <Eye className="h-3 w-3 mr-1" /> {showRawDetails ? "Hide" : "Raw"}
                </Button>
              )}
              {onDownloadLLCPdf && (
                <Button size="sm" onClick={onDownloadLLCPdf} disabled={isExporting} className="h-6 text-[10px] px-2 bg-secondary text-secondary-foreground hover:bg-secondary/80">
                  {isExporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3 mr-1" />} LLC PDF
                </Button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-4">
            <div className="space-y-0">
              {data.llcDetails.status && <Row label="Status" value={data.llcDetails.status} />}
              <Row label="Type" value={data.llcDetails.businessType} />
              <Row label="Formed" value={data.llcDetails.dateFormed} />
              {data.llcDetails.formationPlace && <Row label="Place" value={data.llcDetails.formationPlace} />}
            </div>
            <div className="space-y-0">
              <Row label="Mailing" value={data.llcDetails.mailingAddress} />
              {data.llcDetails.accountNumber && <Row label="Acct #" value={data.llcDetails.accountNumber} />}
              {data.llcDetails.citizenship && <Row label="Citizenship" value={data.llcDetails.citizenship} />}
              {data.llcDetails.email && <Row label="Email" value={data.llcDetails.email} />}
              {data.llcDetails.naicsCode && <Row label="NAICS" value={data.llcDetails.naicsCode} />}
            </div>
          </div>
          {data.llcDetails.principals.length > 0 && (
            <div className="mt-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Principals</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {data.llcDetails.principals.map((p, i) => (
                  <div key={i} className="bg-muted rounded px-2 py-1">
                    <p className="text-xs font-medium text-foreground">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground break-all">{p.address}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {showRawDetails && data.llcDetails.rawMarkdown && (
            <pre className="mt-2 text-[10px] text-foreground bg-muted rounded p-2 max-h-48 overflow-y-auto whitespace-pre-wrap font-mono">{data.llcDetails.rawMarkdown}</pre>
          )}
        </FieldCard>
      )}

      {data.isLLC && !data.llcDetails && (
        <Card className="p-3 border-border bg-card shadow-sm">
          <p className="text-muted-foreground text-xs text-center">
            Business details not available. Try{" "}
            <a href="https://service.ct.gov/business/s/onlinebusinesssearch?language=en_US" target="_blank" rel="noopener noreferrer" className="text-primary underline">
              CT Secretary of State
            </a>
          </p>
        </Card>
      )}
    </div>
  );
}

/* ── Compact field card ── */
function FieldCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-3 border-border bg-card shadow-sm">
      <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 border-b border-border pb-1">{title}</h3>
      <div>{children}</div>
    </Card>
  );
}

/* ── Compact row ── */
function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-baseline py-[1px] gap-2">
      <span className="text-[11px] text-muted-foreground whitespace-nowrap flex-shrink-0">{label}</span>
      <span className={`text-[11px] text-foreground text-right truncate ${bold ? 'font-bold' : ''}`}>{value}</span>
    </div>
  );
}
