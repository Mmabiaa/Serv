import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useCategories, fetchCategories } from "@/store/pos-store";

interface CategoryBarProps {
  selected: string;
  onSelect: (cat: string) => void;
}

export function CategoryBar({ selected, onSelect }: CategoryBarProps) {
  const categories = useCategories();

  useEffect(() => {
    fetchCategories();
  }, []);

  const allCategories = ["All Inventory", ...categories.map(c => c.name)];

  return (
    <div className="flex gap-2 overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0 no-scrollbar pb-1">
      {allCategories.map((c) => {
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
