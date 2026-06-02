import { Pencil } from "lucide-react";
import { fmt } from "@/store/pos-data";
import type { Product } from "@/store/pos-data";

interface InventoryListProps {
  products: Product[];
  onEdit: (product: Product) => void;
}

export function InventoryList({ products, onEdit }: InventoryListProps) {
  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-5 py-3 font-bold text-muted-foreground uppercase tracking-widest text-[10px]">
                Product
              </th>
              <th className="text-left px-5 py-3 font-bold text-muted-foreground uppercase tracking-widest text-[10px]">
                Category
              </th>
              <th className="text-left px-5 py-3 font-bold text-muted-foreground uppercase tracking-widest text-[10px]">
                Stock
              </th>
              <th className="text-right px-5 py-3 font-bold text-muted-foreground uppercase tracking-widest text-[10px]">
                Price
              </th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-muted grid place-items-center text-xl overflow-hidden shrink-0">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        p.emoji
                      )}
                    </div>
                    <p className="font-bold truncate">{p.name}</p>
                  </div>
                </td>
                <td className="px-5 py-4 text-muted-foreground">{p.category}</td>
                <td className="px-5 py-4">
                  <span
                    className={
                      "font-bold font-mono " +
                      (p.stock < 10 ? "text-warning" : "text-foreground")
                    }
                  >
                    {p.stock}
                  </span>
                </td>
                <td className="px-5 py-4 text-right font-bold font-mono">{fmt(p.price)}</td>
                <td className="px-5 py-4 text-right">
                  <button
                    onClick={() => onEdit(p)}
                    className="w-8 h-8 rounded-lg hover:bg-muted grid place-items-center transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
