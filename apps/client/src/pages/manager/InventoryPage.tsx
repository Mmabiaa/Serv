import { useState } from "react";
import { Plus, Search, LayoutGrid, List, Pencil } from "lucide-react";
import { fmt } from "@/store/pos-data";
import { useProducts } from "@/store/pos-store";
import { ManagerOnly } from "@/features/layout/components/app-shell";
import { ProductDialog } from "@/features/inventory/components/product-dialog";
import type { Product } from "@/store/pos-data";

type Mode = "list" | "cards";

export function InventoryPage() {
  const products = useProducts();
  const [q, setQ] = useState("");
  const [mode, setMode] = useState<Mode>("list");
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);

  const list = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <ManagerOnly>
      <div className="p-4 lg:p-8 space-y-6">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">Inventory</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {products.length} products · {products.filter((p) => p.stock < 10).length} low stock
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center bg-card border border-border rounded-xl p-1">
              <button
                type="button"
                onClick={() => setMode("list")}
                className={
                  "px-3 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 " +
                  (mode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground")
                }
              >
                <List className="w-3.5 h-3.5" /> List
              </button>
              <button
                type="button"
                onClick={() => setMode("cards")}
                className={
                  "px-3 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 " +
                  (mode === "cards" ? "bg-primary text-primary-foreground" : "text-muted-foreground")
                }
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Cards
              </button>
            </div>
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="inline-flex items-center gap-2 bg-foreground text-background px-4 py-3 rounded-xl text-sm font-bold hover:opacity-90"
            >
              <Plus className="w-4 h-4" /> Add product
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="text"
            placeholder="Search inventory..."
            className="w-full pl-11 pr-4 py-3.5 bg-card border border-border rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-primary/10 text-sm"
          />
        </div>

        {mode === "list" ? (
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
                  {list.map((p) => (
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
                          onClick={() => setEditing(p)}
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
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
            {list.map((p) => (
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
                    onClick={() => setEditing(p)}
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
        )}

        {(editing || creating) && (
          <ProductDialog
            product={editing}
            onClose={() => {
              setEditing(null);
              setCreating(false);
            }}
          />
        )}
      </div>
    </ManagerOnly>
  );
}
