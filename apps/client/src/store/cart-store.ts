import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "./pos-data";

export type CartLine = { product: Product; qty: number };

interface CartState {
  items: CartLine[];
  addItem: (p: Product) => void;
  removeItem: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (p: Product) =>
        set((state) => {
          const line = state.items.find((c) => c.product.id === p.id);
          if (line) {
            return {
              items: state.items.map((c) =>
                c.product.id === p.id ? { ...c, qty: c.qty + 1 } : c
              ),
            };
          }
          return { items: [...state.items, { product: p, qty: 1 }] };
        }),
      removeItem: (id: string) =>
        set((state) => ({
          items: state.items.filter((c) => c.product.id !== id),
        })),
      setQty: (id: string, qty: number) =>
        set((state) => {
          if (qty <= 0) {
            return { items: state.items.filter((c) => c.product.id !== id) };
          }
          return {
            items: state.items.map((c) =>
              c.product.id === id ? { ...c, qty } : c
            ),
          };
        }),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: "kigali-pos-cart",
    }
  )
);

// Backward compatibility or convenience helpers
export const cartStore = {
  add: (p: Product) => useCartStore.getState().addItem(p),
  remove: (id: string) => useCartStore.getState().removeItem(id),
  setQty: (id: string, qty: number) => useCartStore.getState().setQty(id, qty),
  clear: () => useCartStore.getState().clearCart(),
};

export function useCart() {
  return useCartStore((state) => state.items || []);
}

export function cartTotal(lines: CartLine[]) {
  return (lines || []).reduce((s, l) => s + (l.product?.price || 0) * l.qty, 0);
}

export function cartCount(lines: CartLine[]) {
  return (lines || []).reduce((s, l) => s + l.qty, 0);
}