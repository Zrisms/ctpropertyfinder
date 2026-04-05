import { useState } from "react";
import { Building2, ExternalLink, Shield } from "lucide-react";
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
      const { data, error } = await supabase.functions.invoke("property-search", {
        body: { address, town },
      });

      if (error) throw error;

      if (data?.success) {
        setPropertyData(data.property);
        toast({ title: "Property Found", description: `Found data for ${data.property.address}` });
        return;
      }

      if (data?.searchUrl) {
        setSearchUrl(data.searchUrl);
      }

      toast({
        title: "Property Not Found",
        description: data?.error || "Could not find property data for this address.",
        variant: "destructive",
      });
    } catch (err) {
      console.error("Search error:", err);
      toast({
        title: "Search Error",
        description: "Failed to search for property. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!propertyData) return;
    setIsExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("property-pdf", {
        body: { property: propertyData },
      });
      if (error) throw error;
      if (data?.pdf) {
        const blob = base64ToBlob(data.pdf, "application/pdf");
        downloadBlob(blob, `${propertyData.address.replace(/\s+/g, "_")}_card.pdf`);
        toast({ title: "Success", description: "Property card downloaded." });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to generate PDF.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!propertyData) return;
    setIsExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("property-excel", {
        body: { property: propertyData },
      });
      if (error) throw error;
      if (data?.excel) {
        const blob = base64ToBlob(data.excel, "text/csv");
        downloadBlob(blob, `${propertyData.owner.replace(/\s+/g, "_")}_property_info.csv`);
        toast({ title: "Success", description: "Property data exported to Excel." });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to generate Excel.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadLLCPdf = async () => {
    if (!propertyData?.llcDetails) return;
    setIsExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("llc-detail-pdf", {
        body: { llcDetails: propertyData.llcDetails, ownerName: propertyData.owner },
      });
      if (error) throw error;
      if (data?.pdf) {
        const blob = base64ToBlob(data.pdf, "application/pdf");
        downloadBlob(blob, `${propertyData.owner.replace(/\s+/g, "_")}_business_details.pdf`);
        toast({ title: "Success", description: "Business details PDF downloaded." });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to generate LLC PDF.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Subtle grid pattern overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(220 60% 55% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(220 60% 55% / 0.3) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Header */}
      <header className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5" />
        <div className="relative max-w-4xl mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium tracking-wide uppercase mb-8 animate-fade-in">
            <Shield className="h-3.5 w-3.5" />
            Connecticut Property Intelligence
          </div>
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl tracking-tight leading-[1.1] mb-6 animate-fade-in" style={{ animationDelay: '0.1s', opacity: 0 }}>
            <span className="text-foreground">Property</span>
            <br />
            <span className="gradient-text">Lookup</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s', opacity: 0 }}>
            Instant access to field cards, owner records, valuations, and LLC details for any Connecticut property.
          </p>
        </div>
      </header>

      {/* Search Section */}
      <main className="relative px-4 -mt-8 z-10">
        <div className="max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
          <div className="glass-card rounded-2xl p-8 glow-primary">
            <AddressSearch onSearch={handleSearch} isLoading={isLoading} />
          </div>
        </div>

        {searchUrl && !propertyData && (
          <div className="max-w-2xl mx-auto mt-8 animate-fade-in">
            <div className="glass-card rounded-2xl p-8 text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Could not automatically extract data. Try the assessor's database directly:
              </p>
              <a
                href={searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/20"
              >
                <ExternalLink className="h-4 w-4" />
                Open Assessor Database
              </a>
            </div>
          </div>
        )}

        {propertyData && (
          <div className="mt-10 pb-16 animate-fade-in-up">
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
          <div className="text-center py-20 animate-fade-in" style={{ animationDelay: '0.5s', opacity: 0 }}>
            <div className="inline-flex items-center gap-3 text-muted-foreground/50">
              <div className="h-px w-12 bg-border" />
              <p className="text-sm tracking-wide">Enter an address to begin</p>
              <div className="h-px w-12 bg-border" />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 mt-auto">
        <div className="max-w-4xl mx-auto px-6 py-8 flex items-center justify-between text-xs text-muted-foreground/50">
          <span>CT Property Lookup</span>
          <span>Public records data</span>
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
