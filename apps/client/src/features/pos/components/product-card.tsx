import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmt } from "@/store/pos-data";
import { cartStore } from "@/store/cart-store";
import type { Product } from "@/store/pos-data";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product: p }: ProductCardProps) {
  const low = p.quantity < 10;
  return (
    <button
      type="button"
      onClick={() => cartStore.add(p)}
      className="group text-left bg-card p-4 rounded-2xl border border-border shadow-sm hover:shadow-xl hover:border-primary/50 hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 relative overflow-hidden"
    >
      <div className="aspect-square bg-muted grid place-items-center text-5xl overflow-hidden">
        {p.image_url ? (
          <img
            src={p.image_url}
            alt={p.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <span className="group-hover:scale-125 transition-transform duration-500">
            {p.emoji || "📦"}
          </span>
        )}
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-bold leading-tight line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors">
          {p.name}
        </h3>
        <p className="text-primary font-black font-mono text-lg">{fmt(p.price)}</p>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span
          className={cn(
            "text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider transition-colors",
            low ? "text-warning bg-warning/15" : "text-success bg-success/10"
          )}
        >
          {low ? `${p.quantity} left` : "In stock"}
        </span>
        <span className="w-10 h-10 rounded-xl bg-muted border border-border grid place-items-center text-primary font-bold group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary group-hover:rotate-90 transition-all duration-300 shadow-sm">
          <Plus className="w-5 h-5" />
        </span>
      </div>
    </button>
  );
}
