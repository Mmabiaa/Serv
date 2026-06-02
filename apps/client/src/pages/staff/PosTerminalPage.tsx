import { useMemo, useState } from "react";
import { Grid, List } from "lucide-react";
import { cartCount, cartTotal, useCart } from "@/store/cart-store";
import { fmt } from "@/store/pos-data";
import { useProducts } from "@/store/pos-store";
import { CheckoutSheet } from "@/features/pos/components/checkout-sheet";
import { cn } from "@/lib/utils";

// Modular components
import { SearchBar } from "@/features/pos/components/search-bar";
import { QuickAdd } from "@/features/pos/components/quick-add";
import { CategoryBar } from "@/features/pos/components/category-bar";
import { ProductCard } from "@/features/pos/components/product-card";
import { ProductRow } from "@/features/pos/components/product-row";

export function PosTerminalPage() {
  const cart = useCart();
  const products = useProducts();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All Inventory");
  const [checkout, setCheckout] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          (cat === "All Inventory" || p.category === cat) &&
          (q === "" ||
            p.name.toLowerCase().includes(q.toLowerCase()) ||
            p.id.toLowerCase().includes(q.toLowerCase()))
      ),
    [q, cat, products]
  );

  const popularProducts = useMemo(() => products.slice(0, 4), [products]);

  const count = cartCount(cart);
  const total = cartTotal(cart);

  return (
    <div className="p-4 lg:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">POS Terminal</h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">
            Fast checkout for <span className="text-primary font-bold">Kigali Mini Mart</span>
          </p>
        </div>

        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-xl border border-border">
          <button
            onClick={() => setView("grid")}
            className={cn(
              "p-2 rounded-lg transition-all",
              view === "grid"
                ? "bg-card text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView("list")}
            className={cn(
              "p-2 rounded-lg transition-all",
              view === "list"
                ? "bg-card text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      <SearchBar value={q} onChange={setQ} />

      {!q && cat === "All Inventory" && <QuickAdd products={popularProducts} />}

      <CategoryBar selected={cat} onSelect={setCat} />

      {/* Product grid/list */}
      {view === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
          {filtered.map((p) => (
            <ProductRow key={p.id} product={p} />
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-24 bg-muted/30 rounded-3xl border-2 border-dashed border-border">
          <h3 className="text-lg font-bold text-foreground">No products found</h3>
          <button
            onClick={() => {
              setQ("");
              setCat("All Inventory");
            }}
            className="mt-6 text-sm font-bold text-primary hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Floating cart bar */}
      {count > 0 && (
        <div className="fixed bottom-24 lg:bottom-8 left-4 right-4 lg:left-72 lg:right-8 z-30 animate-in slide-in-from-bottom-10 duration-500">
          <div className="max-w-4xl mx-auto">
            <div className="bg-foreground text-background rounded-3xl p-4 shadow-2xl shadow-foreground/30 flex items-center justify-between gap-4 border border-white/5 ring-1 ring-white/10">
              <div className="flex items-center gap-6 pl-2 min-w-0">
                <div className="flex items-center gap-8 min-w-0">
                  <div>
                    <p className="text-[10px] font-bold text-background/50 uppercase tracking-widest mb-0.5">
                      Items
                    </p>
                    <p className="text-lg font-black font-mono leading-none">{count}</p>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div>
                    <p className="text-[10px] font-bold text-background/50 uppercase tracking-widest mb-0.5">
                      Total Due
                    </p>
                    <p className="text-lg font-black font-mono text-accent leading-none">
                      {fmt(total)}
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCheckout(true)}
                className="bg-accent text-accent-foreground px-10 py-4 rounded-2xl font-black text-sm active:scale-95 transition-all shadow-lg shadow-accent/20 hover:shadow-accent/40 ring-2 ring-accent/20"
              >
                Checkout (Enter)
              </button>
            </div>
          </div>
        </div>
      )}

      <CheckoutSheet open={checkout} onClose={() => setCheckout(false)} />
    </div>
  );
}
