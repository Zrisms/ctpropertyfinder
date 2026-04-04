import { FileDown, FileSpreadsheet, Building2, Loader2, Eye, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

export interface PropertyData {
  address: string;
  town: string;
  owner: string;
  isLLC: boolean;
  parcelId?: string;
  assessedValue?: string;
  lotSize?: string;
  yearBuilt?: string;
  zoning?: string;
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
    <div className="w-full max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Property Info Card */}
      <Card className="p-6 border-border bg-card shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-display text-2xl text-foreground">{data.address}</h2>
            <p className="text-muted-foreground mt-1">{data.town}, CT</p>
          </div>
          {data.isLLC && (
            <Badge className="bg-secondary text-secondary-foreground font-semibold">
              LLC Owner
            </Badge>
          )}
        </div>

        <Separator className="my-4" />

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              <TableRow label="Owner" value={data.owner} />
              {data.parcelId && <TableRow label="Parcel ID" value={data.parcelId} />}
              {data.assessedValue && <TableRow label="Assessed Value" value={data.assessedValue} />}
              {data.lotSize && <TableRow label="Lot Size" value={data.lotSize} />}
              {data.yearBuilt && <TableRow label="Year Built" value={data.yearBuilt} />}
              {data.zoning && <TableRow label="Zoning" value={data.zoning} />}
              <TableRow label="LLC Status" value={data.isLLC ? "Yes" : "No"} />
            </tbody>
          </table>
        </div>
      </Card>

      {/* Official Business Details */}
      {data.isLLC && data.llcDetails && (
        <Card className="p-6 border-border bg-card shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <h3 className="font-display text-xl text-foreground">
              Official Business Details — {data.owner}
            </h3>
            <Badge variant="outline" className="text-xs">
              CT Secretary of State
            </Badge>
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

          {/* View / Download actions */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            {data.llcDetails.rawMarkdown && (
              <Button
                variant="outline"
                onClick={() => setShowRawDetails(!showRawDetails)}
                className="flex-1"
              >
                <Eye className="mr-2 h-4 w-4" />
                {showRawDetails ? "Hide" : "View"} Full Details
              </Button>
            )}
            {onDownloadLLCPdf && (
              <Button
                onClick={onDownloadLLCPdf}
                disabled={isExporting}
                className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/80"
              >
                {isExporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Download Business Details PDF
              </Button>
            )}
          </div>

          {/* Raw details view */}
          {showRawDetails && data.llcDetails.rawMarkdown && (
            <div className="mt-4 bg-muted rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="text-xs text-foreground whitespace-pre-wrap font-mono">
                {data.llcDetails.rawMarkdown}
              </pre>
            </div>
          )}
        </Card>
      )}

      {/* Printable details not available message */}
      {data.isLLC && !data.llcDetails && (
        <Card className="p-6 border-border bg-card shadow-sm">
          <p className="text-muted-foreground text-sm text-center">
            Printable business details not available. Try searching manually at{" "}
            <a
              href="https://service.ct.gov/business/s/onlinebusinesssearch?language=en_US"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              CT Secretary of State
            </a>
          </p>
        </Card>
      )}

      {/* Export Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={onDownloadPdf}
          disabled={isExporting}
          className="flex-1 h-12 bg-navy hover:bg-navy-light text-primary-foreground font-semibold"
        >
          {isExporting ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <FileDown className="mr-2 h-5 w-5" />
          )}
          Download Property Card (PDF)
        </Button>
        <Button
          onClick={onDownloadExcel}
          disabled={isExporting}
          variant="outline"
          className="flex-1 h-12 font-semibold border-secondary text-secondary-foreground hover:bg-secondary/10"
        >
          {isExporting ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <FileSpreadsheet className="mr-2 h-5 w-5" />
          )}
          Export to Excel
        </Button>
      </div>
    </div>
  );
}

function TableRow({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-2.5 pr-4 font-medium text-muted-foreground whitespace-nowrap">{label}</td>
      <td className="py-2.5 text-foreground">{value}</td>
    </tr>
  );
}
