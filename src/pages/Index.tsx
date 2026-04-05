import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { AddressSearch } from "@/components/AddressSearch";
import { PropertyResults, type PropertyData } from "@/components/PropertyResults";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null);
  const [searchUrl, setSearchUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSearch = async (address: string, town: string) => {
    setIsLoading(true);
    setPropertyData(null);
    setSearchUrl(null);
    try {
      const { data, error } = await supabase.functions.invoke("property-search", { body: { address, town } });
      if (error) throw error;
      if (data?.success) {
        setPropertyData(data.property);
        toast({ title: "Property Found", description: `Found data for ${data.property.address}` });
        return;
      }
      if (data?.searchUrl) setSearchUrl(data.searchUrl);
      toast({ title: "Property Not Found", description: data?.error || "Could not find property data.", variant: "destructive" });
    } catch (err) {
      console.error("Search error:", err);
      toast({ title: "Search Error", description: "Failed to search. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!propertyData) return;
    setIsExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("property-pdf", { body: { property: propertyData } });
      if (error) throw error;
      if (data?.pdf) {
        downloadBlob(base64ToBlob(data.pdf, "application/pdf"), `${propertyData.address.replace(/\s+/g, "_")}_card.pdf`);
        toast({ title: "Downloaded", description: "Property card saved." });
      }
    } catch { toast({ title: "Error", description: "Failed to generate PDF.", variant: "destructive" }); }
    finally { setIsExporting(false); }
  };

  const handleDownloadExcel = async () => {
    if (!propertyData) return;
    setIsExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("property-excel", { body: { property: propertyData } });
      if (error) throw error;
      if (data?.excel) {
        downloadBlob(base64ToBlob(data.excel, "text/csv"), `${propertyData.owner.replace(/\s+/g, "_")}_property_info.csv`);
        toast({ title: "Downloaded", description: "Property data exported." });
      }
    } catch { toast({ title: "Error", description: "Failed to generate Excel.", variant: "destructive" }); }
    finally { setIsExporting(false); }
  };

  const handleDownloadLLCPdf = async () => {
    if (!propertyData?.llcDetails) return;
    setIsExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("llc-detail-pdf", { body: { llcDetails: propertyData.llcDetails, ownerName: propertyData.owner } });
      if (error) throw error;
      if (data?.pdf) {
        downloadBlob(base64ToBlob(data.pdf, "application/pdf"), `${propertyData.owner.replace(/\s+/g, "_")}_business.pdf`);
        toast({ title: "Downloaded", description: "Business details saved." });
      }
    } catch { toast({ title: "Error", description: "Failed to generate LLC PDF.", variant: "destructive" }); }
    finally { setIsExporting(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative pt-20 pb-28 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-primary font-semibold text-sm tracking-wide mb-4 animate-fade-in" style={{ animationDelay: '0s', opacity: 0 }}>
            Connecticut Property Records
          </p>
          <h1 className="text-5xl md:text-6xl lg:text-[4.25rem] font-semibold tracking-tight leading-[1.05] text-foreground mb-5 animate-fade-in" style={{ animationDelay: '0.1s', opacity: 0 }}>
            Property Lookup.
          </h1>
          <p className="text-xl text-muted-foreground font-normal leading-relaxed max-w-xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s', opacity: 0 }}>
            Search any address. Get owner info, valuations, building details, and LLC records — instantly.
          </p>
        </div>
      </header>

      {/* Search */}
      <main className="px-6 -mt-10 relative z-10">
        <div className="max-w-xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
          <div className="apple-card-elevated p-8">
            <AddressSearch onSearch={handleSearch} isLoading={isLoading} />
          </div>
        </div>

        {searchUrl && !propertyData && (
          <div className="max-w-xl mx-auto mt-6 animate-fade-in">
            <div className="apple-card p-6 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Couldn't extract data automatically.
              </p>
              <a
                href={searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="apple-button inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm hover:brightness-110"
              >
                <ExternalLink className="h-4 w-4" />
                Open Assessor Database
              </a>
            </div>
          </div>
        )}

        {propertyData && (
          <div className="mt-12 pb-20 animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
            <PropertyResults
              data={propertyData}
              onDownloadPdf={handleDownloadPdf}
              onDownloadExcel={handleDownloadExcel}
              onDownloadLLCPdf={propertyData.isLLC && propertyData.llcDetails ? handleDownloadLLCPdf : undefined}
              isExporting={isExporting}
            />
          </div>
        )}

        {!propertyData && !isLoading && !searchUrl && (
          <div className="text-center pt-16 pb-32 animate-fade-in" style={{ animationDelay: '0.6s', opacity: 0 }}>
            <p className="text-sm text-muted-foreground/60">Enter an address to get started</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-muted-foreground/50">
          <span className="font-medium">CT Property Lookup</span>
          <span>Public records</span>
        </div>
      </footer>
    </div>
  );
};

function base64ToBlob(base64: string, mimeType: string): Blob {
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mimeType });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default Index;
