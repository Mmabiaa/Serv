import { Search, X, ScanLine } from "lucide-react";
import { useRef, useEffect } from "react";

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") {
        onChange("");
        searchRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [onChange]);

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1 group">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <input
          ref={searchRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          type="text"
          placeholder="Search products or scan barcode... (Ctrl+F)"
          className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-base font-medium"
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <button
        type="button"
        className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/20 font-bold text-sm hover:opacity-90 active:scale-95 transition-all"
      >
        <ScanLine className="w-5 h-5" />
        <span className="hidden sm:inline">Scanner</span>
      </button>
    </div>
  );
}
