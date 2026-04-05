import { useState, useEffect, useRef } from "react";
import { ExternalLink, Sparkles, Loader2 } from "lucide-react";
import { AddressSearch } from "@/components/AddressSearch";
import { PropertyResults, type PropertyData } from "@/components/PropertyResults";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const SEARCH_STEPS = [
  "Connecting to assessor database…",
  "Locating property records…",
  "Scraping property details…",
  "Checking ownership & LLC status…",
  "Compiling results…",
];

function SearchProgress({ isLoading }: { isLoading: boolean }) {
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isLoading) { setProgress(0); setStepIndex(0); return; }
    setProgress(35);
    setStepIndex(0);
    let tick = 0;
    intervalRef.current = window.setInterval(() => {
      tick++;
      setProgress(p => {
        const remaining = 97 - p;
        const speed = tick < 3
          ? Math.random() * 15 + 10
          : tick < 6
            ? Math.random() * 6 + 3
            : Math.random() * 2 + 0.5;
        const next = p + Math.min(speed, remaining * 0.5);
        if (next >= 97) { clearInterval(intervalRef.current!); return 97; }
        return next;
      });
      setStepIndex(i => {
        if (tick <= 1) return 1;
        if (tick <= 3) return Math.min(2, SEARCH_STEPS.length - 1);
        if (tick <= 5) return Math.min(3, SEARCH_STEPS.length - 1);
        return Math.min(i + 1, SEARCH_STEPS.length - 1);
      });
    }, 500);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div className="mt-6 space-y-3 animate-fade-in">
      <div className="h-1.5 w-full rounded-full bg-secondary/60 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary via-primary/80 to-accent transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground/70 text-center font-medium tracking-wide">
        {SEARCH_STEPS[stepIndex]}
      </p>
    </div>
  );
}

function PropertySkeleton() {
  return (
    <div className="mt-14 pb-20 max-w-4xl mx-auto animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass rounded-2xl p-6 space-y-4">
            <div className="h-4 w-1/3 rounded-md bg-muted animate-pulse" />
            <div className="space-y-2.5">
              <div className="h-3 w-full rounded bg-muted/60 animate-pulse" />
              <div className="h-3 w-4/5 rounded bg-muted/60 animate-pulse" />
              <div className="h-3 w-2/3 rounded bg-muted/60 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 glass rounded-2xl p-6 space-y-4">
        <div className="h-4 w-1/4 rounded-md bg-muted animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-1/2 rounded bg-muted/60 animate-pulse" />
              <div className="h-5 w-3/4 rounded bg-muted/40 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LLCLoadingSkeleton() {
  return (
    <div className="glass rounded-2xl p-6 col-span-full animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <h3 className="apple-section-title">Loading business details…</h3>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-1/3 rounded bg-muted/60 animate-pulse" />
            <div className="h-3 w-2/3 rounded bg-muted/40 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingLLC, setIsLoadingLLC] = useState(false);
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null);
  const [searchUrl, setSearchUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchLLCDetails = async (ownerName: string) => {
    setIsLoadingLLC(true);
    try {
      const { data, error } = await supabase.functions.invoke("llc-search", {
        body: { businessName: ownerName },
      });
      if (error) throw error;
      if (data?.success && data.llcDetails) {
        setPropertyData(prev => prev ? { ...prev, llcDetails: data.llcDetails } : prev);
      }
    } catch (e) {
      console.error("LLC lookup failed:", e);
    } finally {
      setIsLoadingLLC(false);
    }
  };

  const handleSearch = async (address: string, town: string) => {
    setIsLoading(true); setPropertyData(null); setSearchUrl(null); setIsLoadingLLC(false);
    try {
      const { data, error } = await supabase.functions.invoke("property-search", { body: { address, town } });
      if (error) throw error;
      if (data?.success) {
        // Show property data immediately
        setPropertyData(data.property);
        setIsLoading(false);
        toast({ title: "Property Found", description: `Found data for ${data.property.address}` });
        
        // If LLC, fetch business details in background
        if (data.property.isLLC && data.property.owner) {
          fetchLLCDetails(data.property.owner);
        }
        return;
      }
      if (data?.searchUrl) setSearchUrl(data.searchUrl);
      toast({ title: "Not Found", description: data?.error || "Could not find property data.", variant: "destructive" });
    } catch { toast({ title: "Error", description: "Search failed. Try again.", variant: "destructive" }); }
    finally { setIsLoading(false); }
  };

  const handleDownloadPdf = async () => {
    if (!propertyData) return; setIsExporting(true);
    try { const { data, error } = await supabase.functions.invoke("property-pdf", { body: { property: propertyData } }); if (error) throw error; if (data?.pdf) { downloadBlob(base64ToBlob(data.pdf, "application/pdf"), `${propertyData.address.replace(/\s+/g, "_")}_card.pdf`); toast({ title: "Downloaded" }); } }
    catch { toast({ title: "Error", description: "PDF generation failed.", variant: "destructive" }); } finally { setIsExporting(false); }
  };
  const handleDownloadExcel = async () => {
    if (!propertyData) return; setIsExporting(true);
    try { const { data, error } = await supabase.functions.invoke("property-excel", { body: { property: propertyData } }); if (error) throw error; if (data?.excel) { downloadBlob(base64ToBlob(data.excel, "text/csv"), `${propertyData.owner.replace(/\s+/g, "_")}_property.csv`); toast({ title: "Downloaded" }); } }
    catch { toast({ title: "Error", description: "Excel export failed.", variant: "destructive" }); } finally { setIsExporting(false); }
  };
  const handleDownloadLLCPdf = async () => {
    if (!propertyData?.llcDetails) return; setIsExporting(true);
    try { const { data, error } = await supabase.functions.invoke("llc-detail-pdf", { body: { llcDetails: propertyData.llcDetails, ownerName: propertyData.owner } }); if (error) throw error; if (data?.pdf) { downloadBlob(base64ToBlob(data.pdf, "application/pdf"), `${propertyData.owner.replace(/\s+/g, "_")}_business.pdf`); toast({ title: "Downloaded" }); } }
    catch { toast({ title: "Error", description: "LLC PDF failed.", variant: "destructive" }); } finally { setIsExporting(false); }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated ambient glow orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="orb-1 absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[150px]" />
        <div className="orb-2 absolute top-1/4 -right-32 w-[400px] h-[400px] rounded-full bg-[hsl(260_80%_65%/0.08)] blur-[120px]" />
        <div className="orb-3 absolute -bottom-40 left-1/3 w-[450px] h-[450px] rounded-full bg-accent/6 blur-[140px]" />
      </div>

      {/* Header — compact when results showing */}
      <header className={`relative px-6 transition-all duration-500 ${propertyData ? 'pt-8 pb-6' : 'pt-24 pb-32'}`}>
        <div className="max-w-3xl mx-auto text-center">
          {!propertyData && (
            <>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-medium text-primary mb-8 animate-fade-in" style={{ opacity: 0 }}>
                <Sparkles className="h-3.5 w-3.5" />
                Connecticut Property Intelligence
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05] mb-6 animate-fade-in" style={{ animationDelay: '0.1s', opacity: 0 }}>
                <span className="text-shimmer">Foyr</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground font-light leading-relaxed max-w-lg mx-auto animate-fade-in" style={{ animationDelay: '0.2s', opacity: 0 }}>
                Owners, valuations, building details, and LLC records — all in one search.
              </p>
            </>
          )}
          {propertyData && (
            <h1 className="text-2xl font-semibold tracking-tight">
              <span className="text-shimmer">Foyr</span>
            </h1>
          )}
        </div>
      </header>

      {/* Search */}
      <main className={`relative px-6 z-10 ${propertyData ? '' : '-mt-12'}`}>
        <div className={`mx-auto animate-fade-in ${propertyData ? 'max-w-4xl' : 'max-w-xl'}`} style={{ animationDelay: '0.3s', opacity: 0 }}>
          <div className={`glass-elevated rainbow-border rounded-3xl glow-blue ${propertyData ? 'p-4' : 'p-8'}`}>
            <AddressSearch onSearch={handleSearch} isLoading={isLoading} />
            <SearchProgress isLoading={isLoading} />
          </div>
        </div>

        {searchUrl && !propertyData && (
          <div className="max-w-xl mx-auto mt-8 animate-fade-in">
            <div className="glass rounded-2xl p-6 text-center space-y-3">
              <p className="text-sm text-muted-foreground">Couldn't extract data automatically.</p>
              <a href={searchUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all active:scale-[0.97]">
                <ExternalLink className="h-4 w-4" /> Open Assessor Database
              </a>
            </div>
          </div>
        )}

        {isLoading && !propertyData && <PropertySkeleton />}

        {propertyData && (
          <div className="mt-14 pb-20 animate-fade-in" style={{ animationDelay: '0.1s', opacity: 0 }}>
            <PropertyResults data={propertyData} onDownloadPdf={handleDownloadPdf} onDownloadExcel={handleDownloadExcel}
              onDownloadLLCPdf={propertyData.isLLC && propertyData.llcDetails ? handleDownloadLLCPdf : undefined} isExporting={isExporting} />
            {/* LLC loading skeleton shown while fetching business details */}
            {isLoadingLLC && <LLCLoadingSkeleton />}
          </div>
        )}

        {!propertyData && !isLoading && !searchUrl && (
          <div className="text-center pt-20 pb-32 animate-fade-in" style={{ animationDelay: '0.6s', opacity: 0 }}>
            <p className="text-sm text-muted-foreground/40">Enter an address to get started</p>
          </div>
        )}
      </main>

      <footer className="relative border-t border-border/30">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-muted-foreground/40">
          <span>Foyr</span>
          <span>Public records</span>
        </div>
      </footer>
    </div>
  );
};

function base64ToBlob(b: string, t: string) { const d = atob(b); const a = new Uint8Array(d.length); for (let i = 0; i < d.length; i++) a[i] = d.charCodeAt(i); return new Blob([a], { type: t }); }
function downloadBlob(b: Blob, f: string) { const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = f; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(u); }

export default Index;
