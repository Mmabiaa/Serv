import { Pencil } from "lucide-react";
import { fmt } from "@/store/pos-data";
import type { Product } from "@/store/pos-data";

interface InventoryCardsProps {
  products: Product[];
  onEdit: (product: Product) => void;
}

export function InventoryCards({ products, onEdit }: InventoryCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
      {products.map((p) => (
        <div
          key={p.id}
          className="bg-card border border-border rounded-2xl p-4 shadow-sm group"
        >
          <div className="aspect-square bg-muted rounded-xl mb-4 grid place-items-center text-4xl overflow-hidden relative">
            {p.imageUrl ? (
              <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              p.emoji
            )}
            <button
              onClick={() => onEdit(p)}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/90 shadow-sm border border-border grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
          <h3 className="text-sm font-bold truncate">{p.name}</h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
            {p.category}
          </p>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm font-bold font-mono">{fmt(p.price)}</p>
            <span
              className={
                "text-[10px] font-bold font-mono " +
                (p.stock < 10 ? "text-warning" : "text-muted-foreground")
              }
            >
              {p.stock} units
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
