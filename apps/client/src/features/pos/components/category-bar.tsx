import { cn } from "@/lib/utils";
import { categories } from "@/store/pos-data";

interface CategoryBarProps {
  selected: string;
  onSelect: (cat: string) => void;
}

export function CategoryBar({ selected, onSelect }: CategoryBarProps) {
  return (
    <div className="flex gap-2 overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0 no-scrollbar pb-1">
      {categories.map((c) => {
        const active = c === selected;
        return (
          <button
            key={c}
            type="button"
            onClick={() => onSelect(c)}
            className={cn(
              "whitespace-nowrap px-6 py-3 rounded-xl text-sm font-bold transition-all border",
              active
                ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105 z-10"
                : "bg-card border-border text-muted-foreground hover:border-primary/30 hover:bg-muted/50"
            )}
          >
            {c}
          </button>
        );
      })}
    </div>
  );
}
