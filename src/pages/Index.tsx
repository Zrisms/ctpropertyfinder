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
      // Step 1: Ask edge function what to do
      const { data, error } = await supabase.functions.invoke("property-search", {
        body: { address, town },
      });

      if (error) throw error;

      if (data?.success) {
        setPropertyData(data.property);
        return;
      }

      // Step 2: If edge function says we need client-side fetch (VGS TLS workaround)
      if (data?.needsClientFetch) {
        const vgsData = await fetchVGSFromBrowser(data.vgsSlug, address);

        if (vgsData) {
          // Step 3: Send scraped data back to edge function for LLC processing
          const { data: processed, error: err2 } = await supabase.functions.invoke("property-search", {
            body: { address, town, vgsData },
          });

          if (err2) throw err2;

          if (processed?.success) {
            setPropertyData(processed.property);
            return;
          }
        }

        // If VGS fetch failed, show the direct link
        toast({
          title: "Could not auto-fetch",
          description: `Try searching directly at the assessor's database.`,
        });
        
        // Open VGS in new tab as fallback
        window.open(data.searchUrl, "_blank");
        return;
      }

      toast({
        title: "Not Found",
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

  const fetchVGSFromBrowser = async (vgsSlug: string, address: string) => {
    try {
      // Use the VGS autocomplete endpoint from the browser (no TLS issues)
      const autocompleteUrl = `https://gis.vgsi.com/${vgsSlug}/Search.aspx/AutoComplete`;
      
      const resp = await fetch(autocompleteUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prefixText: address,
          count: 10,
          contextKey: "Address",
        }),
      });

      if (!resp.ok) {
        console.error("VGS autocomplete failed:", resp.status);
        return null;
      }

      const result = await resp.json();
      const items: string[] = result.d || result || [];

      if (items.length === 0) {
        console.log("No VGS results found");
        return null;
      }

      // Parse the first result - format varies but often includes PID
      const firstResult = items[0];
      console.log("VGS first result:", firstResult);

      // Extract PID from result (format: "123 MAIN ST~~12345" or "123 MAIN ST (PID: 12345)")
      const pidMatch = firstResult.match(/~~(\d+)$/) || firstResult.match(/\(PID:\s*(\d+)\)/i);
      const cleanAddress = firstResult.replace(/\s*~~\d+$/, "").replace(/\s*\(PID:\s*\d+\)/, "").trim();
      const parcelId = pidMatch ? pidMatch[1] : "";

      // Now fetch the parcel detail page
      let owner = "Unknown";
      let assessedValue = "";
      let lotSize = "";
      let yearBuilt = "";
      let zoning = "";

      if (parcelId) {
        try {
          const parcelUrl = `https://gis.vgsi.com/${vgsSlug}/Parcel.aspx?pid=${parcelId}`;
          const parcelResp = await fetch(parcelUrl);

          if (parcelResp.ok) {
            const html = await parcelResp.text();

            // Parse data from VGS parcel page HTML
            const ownerMatch = html.match(/MainContent_lblOwner[^>]*>([^<]+)/);
            if (ownerMatch) owner = ownerMatch[1].trim();

            const assessMatch = html.match(/MainContent_lblTotalAssessment[^>]*>([^<]+)/);
            if (assessMatch) assessedValue = assessMatch[1].trim();

            const lotMatch = html.match(/MainContent_lblLotSize[^>]*>([^<]+)/);
            if (lotMatch) lotSize = lotMatch[1].trim();

            const yearMatch = html.match(/MainContent_lblYearBuilt[^>]*>([^<]+)/);
            if (yearMatch) yearBuilt = yearMatch[1].trim();

            const zoneMatch = html.match(/MainContent_lblZone[^>]*>([^<]+)/);
            if (zoneMatch) zoning = zoneMatch[1].trim();
          }
        } catch (e) {
          console.error("Failed to fetch parcel details:", e);
        }
      }

      return {
        address: cleanAddress || address,
        owner,
        parcelId,
        assessedValue,
        lotSize,
        yearBuilt,
        zoning,
        propertyCardUrl: parcelId
          ? `https://gis.vgsi.com/${vgsSlug}/Parcel.aspx?pid=${parcelId}`
          : `https://gis.vgsi.com/${vgsSlug}/Search.aspx`,
      };
    } catch (e) {
      console.error("Browser VGS fetch error:", e);
      return null;
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

      <main className="px-4 -mt-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-card rounded-xl shadow-lg border border-border p-6">
            <AddressSearch onSearch={handleSearch} isLoading={isLoading} />
          </div>
        </div>

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
