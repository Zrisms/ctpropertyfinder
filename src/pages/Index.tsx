import { useState } from "react";
import { Building2 } from "lucide-react";
import { AddressSearch } from "@/components/AddressSearch";
import { PropertyResults, type PropertyData } from "@/components/PropertyResults";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null);
  const { toast } = useToast();

  const handleSearch = async (address: string, town: string) => {
    setIsLoading(true);
    setPropertyData(null);

    try {
      const { data, error } = await supabase.functions.invoke("property-search", {
        body: { address, town },
      });

      if (error) throw error;

      if (!data?.success) {
        toast({
          title: "Not Found",
          description: data?.error || "Could not find property data for this address.",
          variant: "destructive",
        });
        return;
      }

      setPropertyData(data.property);
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

      // data should contain a base64 PDF
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
        const blob = base64ToBlob(data.excel, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        downloadBlob(blob, `${propertyData.owner.replace(/\s+/g, "_")}_LLC_info.xlsx`);
        toast({ title: "Success", description: "LLC info exported to Excel." });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to generate Excel.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="bg-navy text-primary-foreground py-16 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Building2 className="h-10 w-10 text-gold" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl tracking-tight">
            CT Property Lookup
          </h1>
          <p className="text-lg text-primary-foreground/70 max-w-xl mx-auto">
            Search any Connecticut property — get field cards, owner info, and LLC details instantly.
          </p>
        </div>
      </header>

      {/* Search Section */}
      <main className="px-4 -mt-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-card rounded-xl shadow-lg border border-border p-6">
            <AddressSearch onSearch={handleSearch} isLoading={isLoading} />
          </div>
        </div>

        {/* Results */}
        {propertyData && (
          <div className="mt-8 pb-12">
            <PropertyResults
              data={propertyData}
              onDownloadPdf={handleDownloadPdf}
              onDownloadExcel={handleDownloadExcel}
              isExporting={isExporting}
            />
          </div>
        )}

        {/* Empty state */}
        {!propertyData && !isLoading && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-sm">Enter an address and town to get started</p>
          </div>
        )}
      </main>
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
