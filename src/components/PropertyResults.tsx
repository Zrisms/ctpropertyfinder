import { FileDown, FileSpreadsheet, Loader2, Eye, Download, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  // Values
  assessedValue?: string;
  totalAppraisal?: string;
  totalMarketValue?: string;
  improvementsValue?: string;
  landValue?: string;
  assessImprovements?: string;
  assessLand?: string;
  assessTotal?: string;
  // Sale
  salePrice?: string;
  saleDate?: string;
  // Lot
  lotSize?: string;
  frontage?: string;
  depth?: string;
  useCode?: string;
  useDescription?: string;
  zoning?: string;
  neighborhood?: string;
  totalMarketLand?: string;
  landAppraisedValue?: string;
  // Building
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
  // Construction
  exteriorWall?: string;
  roofStructure?: string;
  roofCover?: string;
  interiorWall?: string;
  flooring?: string;
  // Systems
  heating?: string;
  heatingFuel?: string;
  cooling?: string;
  // Photo
  buildingPhoto?: string;
  // History
  ownershipHistory?: { owner: string; salePrice: string; bookPage: string; saleDate: string }[];
  subAreas?: { code: string; description: string; grossArea: string; livingArea: string }[];
  valuationHistory?: { year: string; improvements: string; land: string; total: string }[];
  // Other
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
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header with Photo */}
      <Card className="p-6 border-border bg-card shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-display text-2xl text-foreground">{data.address}</h2>
            <p className="text-muted-foreground mt-1">{data.town}, CT</p>
          </div>
          <div className="flex gap-2">
            {data.isLLC && (
              <Badge className="bg-secondary text-secondary-foreground font-semibold">LLC Owner</Badge>
            )}
            {data.propertyCardUrl && (
              <a href={data.propertyCardUrl} target="_blank" rel="noopener noreferrer">
                <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                  <ExternalLink className="h-3 w-3 mr-1" /> View Source
                </Badge>
              </a>
            )}
          </div>
        </div>
        {data.buildingPhoto && (
          <img
            src={data.buildingPhoto}
            alt={`Building photo of ${data.address}`}
            className="w-full max-w-md rounded-lg border border-border mt-2"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
      </Card>

      {/* Ownership & Identification */}
      <DetailSection title="Ownership & Identification">
        <TableRow label="Owner" value={data.owner} />
        {data.coOwner && <TableRow label="Co-Owner" value={data.coOwner} />}
        {data.ownerAddress && <TableRow label="Owner Mailing Address" value={data.ownerAddress} />}
        {data.parcelId && <TableRow label="PID" value={data.parcelId} />}
        {data.mblu && <TableRow label="MBLU" value={data.mblu} />}
        {data.accountNumber && <TableRow label="Account #" value={data.accountNumber} />}
        {data.buildingCount && <TableRow label="Building Count" value={data.buildingCount} />}
        {data.useCode && <TableRow label="Use Code" value={data.useCode} />}
        {data.useDescription && <TableRow label="Use Description" value={data.useDescription} />}
      </DetailSection>

      {/* Current Value (Appraisal) */}
      <DetailSection title="Current Value">
        {data.totalAppraisal && <TableRow label="Total Current Value" value={data.totalAppraisal} highlight />}
        {data.improvementsValue && <TableRow label="Improvements" value={data.improvementsValue} />}
        {data.landValue && <TableRow label="Land" value={data.landValue} />}
        {data.totalMarketValue && <TableRow label="Total Market Value (Assessment)" value={data.totalMarketValue} highlight />}
        {data.assessTotal && <TableRow label="Assessment Total" value={`$${data.assessTotal}`} />}
        {data.assessImprovements && <TableRow label="Assessment - Improvements" value={`$${data.assessImprovements}`} />}
        {data.assessLand && <TableRow label="Assessment - Land" value={`$${data.assessLand}`} />}
        {!data.totalAppraisal && !data.totalMarketValue && <EmptyRow />}
      </DetailSection>

      {/* Last Sale */}
      {(data.salePrice || data.saleDate || data.bookPage) && (
        <DetailSection title="Last Sale">
          {data.salePrice && <TableRow label="Sale Price" value={data.salePrice} highlight />}
          {data.saleDate && <TableRow label="Sale Date" value={data.saleDate} />}
          {data.bookPage && <TableRow label="Book & Page" value={data.bookPage} />}
          {data.certificate && <TableRow label="Certificate" value={data.certificate} />}
          {data.instrument && <TableRow label="Instrument" value={data.instrument} />}
        </DetailSection>
      )}

      {/* Ownership History */}
      {data.ownershipHistory && data.ownershipHistory.length > 0 && (
        <Card className="p-6 border-border bg-card shadow-sm">
          <h3 className="font-display text-lg text-foreground mb-3">Ownership History</h3>
          <Separator className="mb-3" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 pr-3 text-left text-muted-foreground font-medium">Owner</th>
                  <th className="py-2 pr-3 text-left text-muted-foreground font-medium">Sale Price</th>
                  <th className="py-2 pr-3 text-left text-muted-foreground font-medium">Book & Page</th>
                  <th className="py-2 text-left text-muted-foreground font-medium">Sale Date</th>
                </tr>
              </thead>
              <tbody>
                {data.ownershipHistory.map((h, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="py-2 pr-3 text-foreground">{h.owner}</td>
                    <td className="py-2 pr-3 text-foreground">{h.salePrice}</td>
                    <td className="py-2 pr-3 text-foreground">{h.bookPage}</td>
                    <td className="py-2 text-foreground">{h.saleDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Lot Details */}
      <DetailSection title="Lot Details">
        {data.lotSize && <TableRow label="Lot Size" value={data.lotSize} />}
        {data.frontage && <TableRow label="Frontage" value={data.frontage} />}
        {data.depth && <TableRow label="Depth" value={data.depth} />}
        {data.zoning && <TableRow label="Zone" value={data.zoning} />}
        {data.neighborhood && <TableRow label="Neighborhood" value={data.neighborhood} />}
        {data.totalMarketLand && <TableRow label="Total Market Land" value={data.totalMarketLand} />}
        {data.landAppraisedValue && <TableRow label="Land Appraised Value" value={data.landAppraisedValue} />}
        {!data.lotSize && !data.zoning && <EmptyRow />}
      </DetailSection>

      {/* Building Details */}
      <DetailSection title="Building Details">
        {data.yearBuilt && <TableRow label="Year Built" value={data.yearBuilt} />}
        {data.buildingStyle && <TableRow label="Style" value={data.buildingStyle} />}
        {data.model && <TableRow label="Model" value={data.model} />}
        {data.grade && <TableRow label="Grade" value={data.grade} />}
        {data.stories && <TableRow label="Stories" value={data.stories} />}
        {data.occupancy && <TableRow label="Occupancy" value={data.occupancy} />}
        {data.livingArea && <TableRow label="Living Area" value={data.livingArea} />}
        {data.totalRooms && <TableRow label="Total Rooms" value={data.totalRooms} />}
        {data.bedrooms && <TableRow label="Bedrooms" value={data.bedrooms} />}
        {data.totalBaths && <TableRow label="Full Baths" value={data.totalBaths} />}
        {data.halfBaths && <TableRow label="Half Baths" value={data.halfBaths} />}
        {data.totalXtraFixtures && <TableRow label="Extra Fixtures" value={data.totalXtraFixtures} />}
        {data.bathStyle && <TableRow label="Bath Style" value={data.bathStyle} />}
        {data.kitchenStyle && <TableRow label="Kitchen Style" value={data.kitchenStyle} />}
        {data.interiorCondition && <TableRow label="Interior Condition" value={data.interiorCondition} />}
        {data.finBsmntArea && <TableRow label="Finished Basement Area" value={data.finBsmntArea} />}
        {data.finBsmntQual && <TableRow label="Finished Basement Quality" value={data.finBsmntQual} />}
        {data.replacementCost && <TableRow label="Replacement Cost" value={data.replacementCost} />}
        {data.buildingPercentGood && <TableRow label="Percent Good" value={data.buildingPercentGood} />}
        {!data.yearBuilt && !data.livingArea && <EmptyRow />}
      </DetailSection>

      {/* Building Sub-Areas */}
      {data.subAreas && data.subAreas.length > 0 && (
        <Card className="p-6 border-border bg-card shadow-sm">
          <h3 className="font-display text-lg text-foreground mb-3">Building Sub-Areas (sq ft)</h3>
          <Separator className="mb-3" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 pr-3 text-left text-muted-foreground font-medium">Code</th>
                  <th className="py-2 pr-3 text-left text-muted-foreground font-medium">Description</th>
                  <th className="py-2 pr-3 text-right text-muted-foreground font-medium">Gross Area</th>
                  <th className="py-2 text-right text-muted-foreground font-medium">Living Area</th>
                </tr>
              </thead>
              <tbody>
                {data.subAreas.map((s, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="py-2 pr-3 text-foreground font-mono text-xs">{s.code}</td>
                    <td className="py-2 pr-3 text-foreground">{s.description}</td>
                    <td className="py-2 pr-3 text-right text-foreground">{s.grossArea}</td>
                    <td className="py-2 text-right text-foreground">{s.livingArea}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Construction */}
      {(data.exteriorWall || data.roofCover || data.roofStructure || data.interiorWall || data.flooring) && (
        <DetailSection title="Construction">
          {data.exteriorWall && <TableRow label="Exterior Wall" value={data.exteriorWall} />}
          {data.roofStructure && <TableRow label="Roof Structure" value={data.roofStructure} />}
          {data.roofCover && <TableRow label="Roof Cover" value={data.roofCover} />}
          {data.interiorWall && <TableRow label="Interior Wall" value={data.interiorWall} />}
          {data.flooring && <TableRow label="Interior Floor" value={data.flooring} />}
        </DetailSection>
      )}

      {/* Systems & Utilities */}
      {(data.heating || data.cooling || data.heatingFuel) && (
        <DetailSection title="Systems & Utilities">
          {data.heating && <TableRow label="Heat Type" value={data.heating} />}
          {data.heatingFuel && <TableRow label="Heat Fuel" value={data.heatingFuel} />}
          {data.cooling && <TableRow label="AC Type" value={data.cooling} />}
        </DetailSection>
      )}

      {/* Valuation History */}
      {data.valuationHistory && data.valuationHistory.length > 0 && (
        <Card className="p-6 border-border bg-card shadow-sm">
          <h3 className="font-display text-lg text-foreground mb-3">Valuation History</h3>
          <Separator className="mb-3" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 pr-3 text-left text-muted-foreground font-medium">Year</th>
                  <th className="py-2 pr-3 text-right text-muted-foreground font-medium">Improvements</th>
                  <th className="py-2 pr-3 text-right text-muted-foreground font-medium">Land</th>
                  <th className="py-2 text-right text-muted-foreground font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.valuationHistory.map((v, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="py-2 pr-3 text-foreground">{v.year}</td>
                    <td className="py-2 pr-3 text-right text-foreground">{v.improvements}</td>
                    <td className="py-2 pr-3 text-right text-foreground">{v.land}</td>
                    <td className="py-2 text-right text-foreground font-semibold">{v.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Official Business Details */}
      {data.isLLC && data.llcDetails && (
        <Card className="p-6 border-border bg-card shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <h3 className="font-display text-xl text-foreground">
              Official Business Details — {data.owner}
            </h3>
            <Badge variant="outline" className="text-xs">CT Secretary of State</Badge>
          </div>
          <Separator className="mb-4" />

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                {data.llcDetails.status && <TableRow label="Status" value={data.llcDetails.status} />}
                <TableRow label="Business Type" value={data.llcDetails.businessType} />
                <TableRow label="Date Formed" value={data.llcDetails.dateFormed} />
                <TableRow label="Mailing Address" value={data.llcDetails.mailingAddress} />
                {data.llcDetails.accountNumber && <TableRow label="Account Number" value={data.llcDetails.accountNumber} />}
                {data.llcDetails.citizenship && <TableRow label="Citizenship" value={data.llcDetails.citizenship} />}
                {data.llcDetails.formationPlace && <TableRow label="Formation Place" value={data.llcDetails.formationPlace} />}
                {data.llcDetails.email && <TableRow label="Business Email" value={data.llcDetails.email} />}
                {data.llcDetails.naicsCode && <TableRow label="NAICS Code" value={data.llcDetails.naicsCode} />}
              </tbody>
            </table>
          </div>

          {data.llcDetails.principals.length > 0 && (
            <>
              <h4 className="font-semibold mt-6 mb-3 text-foreground">Principals</h4>
              <div className="space-y-3">
                {data.llcDetails.principals.map((p, i) => (
                  <div key={i} className="bg-muted rounded-lg p-3">
                    <p className="font-medium text-foreground">{p.name}</p>
                    <p className="text-sm text-muted-foreground break-all">{p.address}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            {data.llcDetails.rawMarkdown && (
              <Button variant="outline" onClick={() => setShowRawDetails(!showRawDetails)} className="flex-1">
                <Eye className="mr-2 h-4 w-4" />
                {showRawDetails ? "Hide" : "View"} Raw Data
              </Button>
            )}
            {onDownloadLLCPdf && (
              <Button onClick={onDownloadLLCPdf} disabled={isExporting} className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/80">
                {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Download Business Details PDF
              </Button>
            )}
          </div>

          {showRawDetails && data.llcDetails.rawMarkdown && (
            <div className="mt-4 bg-muted rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="text-xs text-foreground whitespace-pre-wrap font-mono">{data.llcDetails.rawMarkdown}</pre>
            </div>
          )}
        </Card>
      )}

      {data.isLLC && !data.llcDetails && (
        <Card className="p-6 border-border bg-card shadow-sm">
          <p className="text-muted-foreground text-sm text-center">
            Business details not available. Try{" "}
            <a href="https://service.ct.gov/business/s/onlinebusinesssearch?language=en_US" target="_blank" rel="noopener noreferrer" className="text-primary underline">
              CT Secretary of State
            </a>
          </p>
        </Card>
      )}

      {/* Export Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={onDownloadPdf} disabled={isExporting} className="flex-1 h-12 bg-navy hover:bg-navy-light text-primary-foreground font-semibold">
          {isExporting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <FileDown className="mr-2 h-5 w-5" />}
          Download Property Card (PDF)
        </Button>
        <Button onClick={onDownloadExcel} disabled={isExporting} variant="outline" className="flex-1 h-12 font-semibold border-secondary text-secondary-foreground hover:bg-secondary/10">
          {isExporting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <FileSpreadsheet className="mr-2 h-5 w-5" />}
          Export to Excel
        </Button>
      </div>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-6 border-border bg-card shadow-sm">
      <h3 className="font-display text-lg text-foreground mb-3">{title}</h3>
      <Separator className="mb-3" />
      <div className="overflow-x-auto">
        <table className="w-full text-sm"><tbody>{children}</tbody></table>
      </div>
    </Card>
  );
}

function TableRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-2.5 pr-4 font-medium text-muted-foreground whitespace-nowrap w-1/3">{label}</td>
      <td className={`py-2.5 ${highlight ? 'text-foreground font-semibold' : 'text-foreground'}`}>{value}</td>
    </tr>
  );
}

function EmptyRow() {
  return (
    <tr><td colSpan={2} className="py-2.5 text-muted-foreground text-sm italic">No data available</td></tr>
  );
}
