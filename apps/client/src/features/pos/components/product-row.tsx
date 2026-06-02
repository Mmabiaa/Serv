import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmt } from "@/store/pos-data";
import { cartStore } from "@/store/cart-store";
import type { Product } from "@/store/pos-data";

interface ProductRowProps {
  product: Product;
}

export function ProductRow({ product: p }: ProductRowProps) {
  const low = p.quantity < 10;
  return (
    <button
      type="button"
      onClick={() => cartStore.add(p)}
      className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors text-left group"
    >
      <div className="w-12 h-12 rounded-xl bg-muted grid place-items-center text-2xl shrink-0 group-hover:scale-110 transition-transform overflow-hidden">
        {p.imageUrl ? (
          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
        ) : (
          p.emoji || "📦"
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold truncate group-hover:text-primary transition-colors">
          {p.name}
        </h3>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
          {p.category_name}
        </p>
      </div>
      <div className="text-right px-4">
        <p className="text-sm font-black font-mono text-primary">{fmt(p.price)}</p>
        <p className={cn("text-[9px] font-bold uppercase", low ? "text-warning" : "text-success")}>
          {low ? `${p.quantity} left` : "In stock"}
        </p>
      </div>
      <div className="w-10 h-10 rounded-xl bg-muted border border-border grid place-items-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
        <Plus className="w-4 h-4" />
      </div>
    </button>
  );
}
