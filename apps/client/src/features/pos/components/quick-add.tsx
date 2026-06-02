import { Zap } from "lucide-react";
import { fmt } from "@/store/pos-data";
import { cartStore } from "@/store/cart-store";
import type { Product } from "@/store/pos-data";

interface QuickAddProps {
  products: Product[];
}

export function QuickAdd({ products }: QuickAddProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
        <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
        Quick Add
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {products.map((p) => (
          <button
            key={p.id}
            onClick={() => cartStore.add(p)}
            className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all text-left group"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">{p.emoji}</span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold truncate">{p.name}</p>
              <p className="text-[10px] text-primary font-black font-mono">{fmt(p.price)}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
