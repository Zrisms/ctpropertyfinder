import { useState, useMemo } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CT_TOWNS } from "@/lib/ct-towns";

interface AddressSearchProps {
  onSearch: (address: string, town: string) => void;
  isLoading: boolean;
}

export function AddressSearch({ onSearch, isLoading }: AddressSearchProps) {
  const [address, setAddress] = useState("");
  const [town, setTown] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredTowns = useMemo(() => {
    if (!town) return [];
    return CT_TOWNS.filter((t) =>
      t.toLowerCase().startsWith(town.toLowerCase())
    ).slice(0, 8);
  }, [town]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (address.trim() && town.trim()) {
      onSearch(address.trim(), town.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto space-y-4">
      <div className="relative">
        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Enter street address (e.g. 123 Main St)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="pl-11 h-12 text-base bg-card border-border"
        />
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Town (e.g. Hartford)"
          value={town}
          onChange={(e) => {
            setTown(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          className="pl-11 h-12 text-base bg-card border-border"
        />
        {showSuggestions && filteredTowns.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-card border border-border rounded-lg shadow-lg overflow-hidden">
            {filteredTowns.map((t) => (
              <button
                key={t}
                type="button"
                className="w-full text-left px-4 py-2.5 hover:bg-muted transition-colors text-sm"
                onClick={() => {
                  setTown(t);
                  setShowSuggestions(false);
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
