import { Trash2, Minus, Plus } from "lucide-react";
import { cartStore, useCart, cartCount, cartTotal } from "@/store/cart-store";

export function CartLines() {
  const cart = useCart();
  if (cart.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="w-12 h-12 bg-muted rounded-full grid place-items-center mx-auto mb-3 opacity-50">
          <Trash2 className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground font-medium">Cart is empty. Tap a product to start.</p>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-border bg-card rounded-2xl border border-border overflow-hidden">
      {cart.map((line) => (
        <li
          key={line.product.id}
          className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors"
        >
          <div className="w-12 h-12 rounded-xl bg-muted grid place-items-center text-2xl shrink-0 overflow-hidden shadow-sm">
            {line.product.image_url ? (
              <img src={line.product.image_url} alt="" className="w-full h-full object-cover" />
            ) : (
              line.product.emoji
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate text-foreground">{line.product.name}</p>
            <p className="text-xs text-primary font-black font-mono mt-0.5">
              {line.product.price.toLocaleString()} RWF
            </p>
          </div>
          <div className="flex items-center gap-1 bg-muted/80 rounded-xl p-1.5 border border-border/50">
            <button
              type="button"
              onClick={() => cartStore.setQty(line.product.id, line.qty - 1)}
              className="w-8 h-8 grid place-items-center rounded-lg hover:bg-card hover:shadow-sm transition-all text-muted-foreground hover:text-foreground"
              aria-label="Decrease"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center text-sm font-black font-mono">{line.qty}</span>
            <button
              type="button"
              onClick={() => cartStore.setQty(line.product.id, line.qty + 1)}
              className="w-8 h-8 grid place-items-center rounded-lg hover:bg-card hover:shadow-sm transition-all text-muted-foreground hover:text-foreground"
              aria-label="Increase"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => cartStore.remove(line.product.id)}
            className="w-10 h-10 grid place-items-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
            aria-label="Remove"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}
