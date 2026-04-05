import { useState, useMemo, useRef, useCallback } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CT_TOWNS } from "@/lib/ct-towns";
import { COMMON_STREET_NAMES, STREET_SUFFIXES } from "@/lib/ct-streets";

interface AddressSearchProps {
  onSearch: (address: string, town: string) => void;
  isLoading: boolean;
}

export function AddressSearch({ onSearch, isLoading }: AddressSearchProps) {
  const [address, setAddress] = useState("");
  const [town, setTown] = useState("");
  const [showTownSuggestions, setShowTownSuggestions] = useState(false);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [activeTownIndex, setActiveTownIndex] = useState(-1);
  const [activeAddressIndex, setActiveAddressIndex] = useState(-1);
  const townRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);

  // Fuzzy match towns - supports contains, not just startsWith
  const filteredTowns = useMemo(() => {
    if (!town) return CT_TOWNS.slice(0, 8);
    const q = town.toLowerCase();
    const starts = CT_TOWNS.filter((t) => t.toLowerCase().startsWith(q));
    const contains = CT_TOWNS.filter(
      (t) => !t.toLowerCase().startsWith(q) && t.toLowerCase().includes(q)
    );
    return [...starts, ...contains].slice(0, 8);
  }, [town]);

  // Street name suggestions based on partial input
  const addressSuggestions = useMemo(() => {
    if (!address) return [];
    const parts = address.trim().split(/\s+/);
    
    // If only a number, no suggestions yet
    if (parts.length < 2) return [];
    
    const lastWord = parts[parts.length - 1].toLowerCase();
    const prefix = parts.slice(0, -1).join(" ");

    // Check if user is typing a street name (after the house number)
    const hasNumber = /^\d+/.test(parts[0]);
    
    if (hasNumber && parts.length === 2) {
      // Suggest street names after house number
      const matches = COMMON_STREET_NAMES.filter((s) =>
        s.toLowerCase().startsWith(lastWord)
      ).slice(0, 6);
      return matches.map((m) => `${prefix} ${m}`);
    }
    
    if (hasNumber && parts.length >= 3) {
      // Suggest suffixes after street name
      const suffixMatches = STREET_SUFFIXES.filter((s) =>
        s.toLowerCase().startsWith(lastWord)
      ).slice(0, 6);
      if (suffixMatches.length > 0) {
        return suffixMatches.map((s) => `${prefix} ${s}`);
      }
    }

    return [];
  }, [address]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (address.trim() && town.trim()) {
      onSearch(address.trim(), town.trim());
    }
  };

  const handleTownKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showTownSuggestions || filteredTowns.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveTownIndex((i) => Math.min(i + 1, filteredTowns.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveTownIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && activeTownIndex >= 0) {
        e.preventDefault();
        setTown(filteredTowns[activeTownIndex]);
        setShowTownSuggestions(false);
        setActiveTownIndex(-1);
      } else if (e.key === "Escape") {
        setShowTownSuggestions(false);
      }
    },
    [showTownSuggestions, filteredTowns, activeTownIndex]
  );

  const handleAddressKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showAddressSuggestions || addressSuggestions.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveAddressIndex((i) => Math.min(i + 1, addressSuggestions.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveAddressIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && activeAddressIndex >= 0) {
        e.preventDefault();
        setAddress(addressSuggestions[activeAddressIndex]);
        setShowAddressSuggestions(false);
        setActiveAddressIndex(-1);
      } else if (e.key === "Escape") {
        setShowAddressSuggestions(false);
      }
    },
    [showAddressSuggestions, addressSuggestions, activeAddressIndex]
  );

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto space-y-4">
      {/* Address input with street suggestions */}
      <div className="relative">
        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          ref={addressRef}
          type="text"
          placeholder="Enter street address (e.g. 123 Main St)"
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            setShowAddressSuggestions(true);
            setActiveAddressIndex(-1);
          }}
          onFocus={() => setShowAddressSuggestions(true)}
          onBlur={() => setTimeout(() => setShowAddressSuggestions(false), 200)}
          onKeyDown={handleAddressKeyDown}
          className="pl-11 h-12 text-base bg-card border-border"
        />
        {showAddressSuggestions && addressSuggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-card border border-border rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto">
            {addressSuggestions.map((s, i) => (
              <button
                key={s}
                type="button"
                className={`w-full text-left px-4 py-2.5 transition-colors text-sm ${
                  i === activeAddressIndex ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                }`}
                onClick={() => {
                  setAddress(s);
                  setShowAddressSuggestions(false);
                  setActiveAddressIndex(-1);
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Town input with fuzzy autocomplete */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          ref={townRef}
          type="text"
          placeholder="Town (e.g. Hartford)"
          value={town}
          onChange={(e) => {
            setTown(e.target.value);
            setShowTownSuggestions(true);
            setActiveTownIndex(-1);
          }}
          onFocus={() => setShowTownSuggestions(true)}
          onBlur={() => setTimeout(() => setShowTownSuggestions(false), 200)}
          onKeyDown={handleTownKeyDown}
          className="pl-11 h-12 text-base bg-card border-border"
        />
        {showTownSuggestions && filteredTowns.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-card border border-border rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto">
            {filteredTowns.map((t, i) => (
              <button
                key={t}
                type="button"
                className={`w-full text-left px-4 py-2.5 transition-colors text-sm ${
                  i === activeTownIndex ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                }`}
                onClick={() => {
                  setTown(t);
                  setShowTownSuggestions(false);
                  setActiveTownIndex(-1);
                }}
              >
                {t}, CT
              </button>
            ))}
          </div>
        )}
      </div>

      <Button
        type="submit"
        disabled={isLoading || !address.trim() || !town.trim()}
        className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Searching...
          </>
        ) : (
          <>
            <Search className="mr-2 h-5 w-5" />
            Search Property
          </>
        )}
      </Button>
    </form>
  );
}
