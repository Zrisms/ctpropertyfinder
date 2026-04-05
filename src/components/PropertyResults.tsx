import { FileDown, FileSpreadsheet, Building2, Loader2, Eye, Download, ExternalLink } from "lucide-react";
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
  isLLC: boolean;
  parcelId?: string;
  mblu?: string;
  bookPage?: string;
  // Values
  assessedValue?: string;
  totalAppraisal?: string;
  landValue?: string;
  buildingValue?: string;
  otherValue?: string;
  // Sale
  salePrice?: string;
  saleDate?: string;
  saleQualification?: string;
  grantor?: string;
  // Lot
  lotSize?: string;
  landUse?: string;
  zoning?: string;
  neighborhood?: string;
  // Building
  yearBuilt?: string;
  buildingStyle?: string;
  stories?: string;
  livingArea?: string;
  totalRooms?: string;
  bedrooms?: string;
  fullBaths?: string;
  halfBaths?: string;
  totalBaths?: string;
  basement?: string;
  basementFinished?: string;
  // Construction
  exteriorWall?: string;
  roofType?: string;
  roofStructure?: string;
  foundation?: string;
  interiorWall?: string;
  flooring?: string;
  framework?: string;
  // Systems
  heating?: string;
  heatingFuel?: string;
  cooling?: string;
  fireplaces?: string;
  water?: string;
  sewer?: string;
  // Garage
  garage?: string;
  garageCapacity?: string;
  // Other
  propertyClass?: string;
  grade?: string;
  condition?: string;
  taxDistrict?: string;
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
      {/* Header */}
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
      </Card>

      {/* Ownership & Identification */}
      <DetailSection title="Ownership & Identification">
        <TableRow label="Owner" value={data.owner} />
        {data.coOwner && <TableRow label="Co-Owner" value={data.coOwner} />}
        {data.parcelId && <TableRow label="Parcel ID" value={data.parcelId} />}
        {data.mblu && <TableRow label="MBLU (Map-Block-Lot-Unit)" value={data.mblu} />}
        {data.bookPage && <TableRow label="Book & Page" value={data.bookPage} />}
        {data.propertyClass && <TableRow label="Property Class" value={data.propertyClass} />}
        {data.landUse && <TableRow label="Land Use" value={data.landUse} />}
        {data.taxDistrict && <TableRow label="Tax District" value={data.taxDistrict} />}
      </DetailSection>

      {/* Valuation */}
      <DetailSection title="Valuation">
        {data.assessedValue && <TableRow label="Total Assessment" value={data.assessedValue} highlight />}
        {data.totalAppraisal && <TableRow label="Total Appraisal / Market Value" value={data.totalAppraisal} highlight />}
        {data.landValue && <TableRow label="Land Value" value={data.landValue} />}
        {data.buildingValue && <TableRow label="Building Value" value={data.buildingValue} />}
        {data.otherValue && <TableRow label="Other Value" value={data.otherValue} />}
        {!data.assessedValue && !data.totalAppraisal && <EmptyRow />}
      </DetailSection>

      {/* Sale History */}
      {(data.salePrice || data.saleDate || data.grantor) && (
        <DetailSection title="Last Sale">
          {data.salePrice && <TableRow label="Sale Price" value={data.salePrice} highlight />}
          {data.saleDate && <TableRow label="Sale Date" value={data.saleDate} />}
          {data.saleQualification && <TableRow label="Qualification" value={data.saleQualification} />}
          {data.grantor && <TableRow label="Grantor" value={data.grantor} />}
        </DetailSection>
      )}

      {/* Lot Details */}
      <DetailSection title="Lot Details">
        {data.lotSize && <TableRow label="Lot Size" value={data.lotSize} />}
        {data.zoning && <TableRow label="Zoning" value={data.zoning} />}
        {data.neighborhood && <TableRow label="Neighborhood" value={data.neighborhood} />}
        {!data.lotSize && !data.zoning && <EmptyRow />}
      </DetailSection>

      {/* Building Details */}
      <DetailSection title="Building Details">
        {data.yearBuilt && <TableRow label="Year Built" value={data.yearBuilt} />}
        {data.buildingStyle && <TableRow label="Style" value={data.buildingStyle} />}
        {data.stories && <TableRow label="Stories" value={data.stories} />}
        {data.livingArea && <TableRow label="Living Area" value={data.livingArea} />}
        {data.totalRooms && <TableRow label="Total Rooms" value={data.totalRooms} />}
        {data.bedrooms && <TableRow label="Bedrooms" value={data.bedrooms} />}
        {data.fullBaths && <TableRow label="Full Baths" value={data.fullBaths} />}
        {data.halfBaths && <TableRow label="Half Baths" value={data.halfBaths} />}
        {data.totalBaths && <TableRow label="Total Baths" value={data.totalBaths} />}
        {data.basement && <TableRow label="Basement" value={data.basement} />}
        {data.basementFinished && <TableRow label="Finished Basement" value={data.basementFinished} />}
        {data.grade && <TableRow label="Grade" value={data.grade} />}
        {data.condition && <TableRow label="Condition" value={data.condition} />}
        {!data.yearBuilt && !data.livingArea && <EmptyRow />}
      </DetailSection>

      {/* Construction */}
      {(data.exteriorWall || data.roofType || data.foundation || data.framework) && (
        <DetailSection title="Construction">
          {data.framework && <TableRow label="Framework" value={data.framework} />}
          {data.exteriorWall && <TableRow label="Exterior Wall" value={data.exteriorWall} />}
          {data.roofType && <TableRow label="Roof Cover" value={data.roofType} />}
          {data.roofStructure && <TableRow label="Roof Structure" value={data.roofStructure} />}
          {data.foundation && <TableRow label="Foundation" value={data.foundation} />}
          {data.interiorWall && <TableRow label="Interior Wall" value={data.interiorWall} />}
          {data.flooring && <TableRow label="Flooring" value={data.flooring} />}
        </DetailSection>
      )}

      {/* Systems & Utilities */}
      {(data.heating || data.cooling || data.water || data.sewer || data.fireplaces) && (
        <DetailSection title="Systems & Utilities">
          {data.heating && <TableRow label="Heating" value={data.heating} />}
          {data.heatingFuel && <TableRow label="Heating Fuel" value={data.heatingFuel} />}
          {data.cooling && <TableRow label="Cooling" value={data.cooling} />}
          {data.fireplaces && <TableRow label="Fireplaces" value={data.fireplaces} />}
          {data.water && <TableRow label="Water" value={data.water} />}
          {data.sewer && <TableRow label="Sewer" value={data.sewer} />}
        </DetailSection>
      )}

      {/* Garage / Parking */}
      {(data.garage || data.garageCapacity) && (
        <DetailSection title="Garage / Parking">
          {data.garage && <TableRow label="Garage Type" value={data.garage} />}
          {data.garageCapacity && <TableRow label="Capacity" value={data.garageCapacity} />}
        </DetailSection>
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
                {showRawDetails ? "Hide" : "View"} Full Details
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
            Printable business details not available. Try searching manually at{" "}
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
        <table className="w-full text-sm">
          <tbody>{children}</tbody>
        </table>
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
    <tr>
      <td colSpan={2} className="py-2.5 text-muted-foreground text-sm italic">No data available</td>
    </tr>
  );
}
