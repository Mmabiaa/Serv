import { useState, useEffect } from "react";
import { Plus, Search, LayoutGrid, List } from "lucide-react";
import { useProducts, fetchProducts } from "@/store/pos-store";
import { ManagerOnly } from "@/features/layout/components/app-shell";
import { ProductDialog } from "@/features/inventory/components/product-dialog";
import { InventoryList } from "@/features/inventory/components/inventory-list";
import { InventoryCards } from "@/features/inventory/components/inventory-cards";
import type { Product } from "@/store/pos-data";

type Mode = "list" | "cards";

export function InventoryPage() {
  const products = useProducts() || [];

  useEffect(() => {
    fetchProducts();
  }, []);

  const [q, setQ] = useState("");
  const [mode, setMode] = useState<Mode>("list");
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);

  const list = (products || []).filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <ManagerOnly>
      <div className="p-4 lg:p-8 space-y-6">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">Inventory</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {products.length} products · {products.filter((p) => p.quantity < 10).length} low stock
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
          <InventoryList products={list} onEdit={setEditing} />
        ) : (
          <InventoryCards products={list} onEdit={setEditing} />
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
