import { FileDown, FileSpreadsheet, Building2, User, Calendar, MapPin, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
    principals: { name: string; address: string }[];
  };
}

interface PropertyResultsProps {
  data: PropertyData;
  onDownloadPdf: () => void;
  onDownloadExcel: () => void;
  isExporting: boolean;
}

export function PropertyResults({ data, onDownloadPdf, onDownloadExcel, isExporting }: PropertyResultsProps) {
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

        {/* Data Table */}
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

      {/* LLC Details */}
      {data.isLLC && data.llcDetails && (
        <Card className="p-6 border-border bg-card shadow-sm">
          <h3 className="font-display text-xl text-foreground mb-4">LLC Details — {data.owner}</h3>
          <Separator className="mb-4" />

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                <TableRow label="Mailing Address" value={data.llcDetails.mailingAddress} />
                <TableRow label="Date Formed" value={data.llcDetails.dateFormed} />
                <TableRow label="Business Type" value={data.llcDetails.businessType} />
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
