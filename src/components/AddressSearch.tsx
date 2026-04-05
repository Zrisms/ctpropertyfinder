import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CT_TOWNS } from "@/lib/ct-towns";
import { supabase } from "@/integrations/supabase/client";

interface AddressSearchProps {
  onSearch: (address: string, town: string) => void;
  isLoading: boolean;
}

interface AddressSuggestion {
  street: string;
  town: string;
  display: string;
}

export function AddressSearch({ onSearch, isLoading }: AddressSearchProps) {
  const [address, setAddress] = useState("");
  const [town, setTown] = useState("");
  const [showTownSuggestions, setShowTownSuggestions] = useState(false);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [activeTownIndex, setActiveTownIndex] = useState(-1);
  const [activeAddressIndex, setActiveAddressIndex] = useState(-1);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const debounceRef = useRef<number | null>(null);

  const filteredTowns = useMemo(() => {
    if (!town) return CT_TOWNS.slice(0, 6);
    const q = town.toLowerCase();
    const starts = CT_TOWNS.filter((t) => t.toLowerCase().startsWith(q));
    const contains = CT_TOWNS.filter((t) => !t.toLowerCase().startsWith(q) && t.toLowerCase().includes(q));
    return [...starts, ...contains].slice(0, 6);
  }, [town]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (address.length < 3) { setAddressSuggestions([]); return; }
    debounceRef.current = window.setTimeout(async () => {
      setIsFetchingSuggestions(true);
      try {
        const query = town ? `${address}, ${town}` : address;
        const { data, error } = await supabase.functions.invoke("address-autocomplete", { body: { query } });
        if (!error && data?.suggestions) setAddressSuggestions(data.suggestions);
      } catch { /* silent */ }
      finally { setIsFetchingSuggestions(false); }
    }, 800);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [address, town]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (address.trim() && town.trim()) onSearch(address.trim(), town.trim());
  };

  const handleTownKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showTownSuggestions || filteredTowns.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveTownIndex((i) => Math.min(i + 1, filteredTowns.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveTownIndex((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && activeTownIndex >= 0) { e.preventDefault(); setTown(filteredTowns[activeTownIndex]); setShowTownSuggestions(false); setActiveTownIndex(-1); }
    else if (e.key === "Escape") setShowTownSuggestions(false);
  }, [showTownSuggestions, filteredTowns, activeTownIndex]);

  const handleAddressKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showAddressSuggestions || addressSuggestions.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveAddressIndex((i) => Math.min(i + 1, addressSuggestions.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveAddressIndex((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && activeAddressIndex >= 0) { e.preventDefault(); const s = addressSuggestions[activeAddressIndex]; setAddress(s.street); setTown(s.town); setShowAddressSuggestions(false); setActiveAddressIndex(-1); }
    else if (e.key === "Escape") setShowAddressSuggestions(false);
  }, [showAddressSuggestions, addressSuggestions, activeAddressIndex]);

  const inputClasses = "pl-11 h-12 text-[15px] bg-secondary/50 border-0 rounded-xl focus:ring-2 focus:ring-primary/30 focus:bg-card placeholder:text-muted-foreground/60 transition-all";

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3">
      {/* Address */}
      <div className="relative">
        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground/60" />
        {isFetchingSuggestions && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 animate-spin" />}
        <Input
          type="text"
          placeholder="Street address"
          value={address}
          onChange={(e) => { setAddress(e.target.value); setShowAddressSuggestions(true); setActiveAddressIndex(-1); }}
          onFocus={() => setShowAddressSuggestions(true)}
          onBlur={() => setTimeout(() => setShowAddressSuggestions(false), 200)}
          onKeyDown={handleAddressKeyDown}
          className={inputClasses}
        />
        {showAddressSuggestions && addressSuggestions.length > 0 && (
          <div className="absolute z-10 mt-2 w-full apple-card-elevated overflow-hidden max-h-52 overflow-y-auto">
            {addressSuggestions.map((s, i) => (
              <button
                key={`${s.street}-${s.town}-${i}`}
                type="button"
                className={`w-full text-left px-4 py-3 transition-colors text-sm ${i === activeAddressIndex ? "bg-primary/10" : "hover:bg-secondary/80"}`}
                onClick={() => { setAddress(s.street); setTown(s.town); setShowAddressSuggestions(false); }}
              >
                <span className="font-medium text-foreground">{s.street}</span>
                <span className="text-muted-foreground"> — {s.town}, CT</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Town */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground/60" />
        <Input
          type="text"
          placeholder="Town"
          value={town}
          onChange={(e) => { setTown(e.target.value); setShowTownSuggestions(true); setActiveTownIndex(-1); }}
          onFocus={() => setShowTownSuggestions(true)}
          onBlur={() => setTimeout(() => setShowTownSuggestions(false), 200)}
          onKeyDown={handleTownKeyDown}
          className={inputClasses}
        />
        {showTownSuggestions && filteredTowns.length > 0 && (
          <div className="absolute z-10 mt-2 w-full apple-card-elevated overflow-hidden max-h-52 overflow-y-auto">
            {filteredTowns.map((t, i) => (
              <button
                key={t}
                type="button"
                className={`w-full text-left px-4 py-3 transition-colors text-sm ${i === activeTownIndex ? "bg-primary/10" : "hover:bg-secondary/80"}`}
                onClick={() => { setTown(t); setShowTownSuggestions(false); setActiveTownIndex(-1); }}
              >
                <span className="text-foreground">{t}</span>
                <span className="text-muted-foreground">, CT</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <Button
        type="submit"
        disabled={isLoading || !address.trim() || !town.trim()}
        className="apple-button w-full h-12 text-[15px] font-semibold bg-primary hover:brightness-110 text-primary-foreground border-0 shadow-none"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Searching…
          </>
        ) : (
          "Search Property"
        )}
      </Button>
    </form>
  );
}
