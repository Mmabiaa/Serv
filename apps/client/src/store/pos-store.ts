import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  customers as seedCustomers,
  products as seedProducts,
  recentTransactions as seedTx,
  staff as seedStaff,
  type Product,
} from "./pos-data";

export type StaffMember = {
  id: string;
  name: string;
  role: "manager" | "cashier";
  sales: number;
  revenue: number;
  online: boolean;
  initials: string;
  pin: string;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  visits: number;
  spent: number;
};

export type Transaction = {
  id: string;
  staffId: string;
  staffName: string;
  items: number;
  total: number;
  time: string;
  method: string;
  customerId?: string;
  customerName?: string;
  productIds: string[];
};

interface PosState {
  products: Product[];
  customers: Customer[];
  staff: StaffMember[];
  transactions: Transaction[];
  
  // Actions
  addProduct: (p: Omit<Product, "id"> & { imageUrl?: string }) => void;
  updateProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  
  addStaff: (s: Omit<StaffMember, "id" | "initials">) => void;
  updateStaff: (s: StaffMember) => void;
  deleteStaff: (id: string) => void;
  changeStaffPin: (id: string, pin: string) => void;
  
  upsertCustomerFromSale: (name: string, phone: string, total: number) => { id: string; name: string };
  recordTransaction: (tx: Omit<Transaction, "id" | "time">) => Transaction;
}

// Initial data processing
const initialStaff: StaffMember[] = seedStaff.map((s) => ({
  ...s,
  role: s.role.toLowerCase().includes("manager") ? "manager" : "cashier",
  pin: "1234",
}));

function findStaffId(name: string): string {
  const s = initialStaff.find((x) => x.name === name);
  return s ? s.id : "s1";
}

const initialTx: Transaction[] = seedTx.map((t) => ({
  id: t.id,
  staffId: findStaffId(t.staff),
  staffName: t.staff,
  items: t.items,
  total: t.total,
  time: t.time,
  method: t.method,
  productIds: [],
}));

export const usePosStore = create<PosState>()(
  persist(
    (set, get) => ({
      products: seedProducts,
      customers: seedCustomers,
      staff: initialStaff,
      transactions: initialTx,

      addProduct: (p) => set((state) => ({
        products: [{ ...p, id: "p" + Date.now() }, ...state.products]
      })),
      updateProduct: (p) => set((state) => ({
        products: state.products.map((x) => (x.id === p.id ? p : x))
      })),
      deleteProduct: (id) => set((state) => ({
        products: state.products.filter((p) => p.id !== id)
      })),

      addStaff: (s) => set((state) => {
        const id = "s" + Date.now();
        const initials = s.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
        return { staff: [...state.staff, { ...s, id, initials }] };
      }),
      updateStaff: (s) => set((state) => ({
        staff: state.staff.map((x) => (x.id === s.id ? s : x))
      })),
      deleteStaff: (id) => set((state) => ({
        staff: state.staff.filter((s) => s.id !== id)
      })),
      changeStaffPin: (id, pin) => set((state) => ({
        staff: state.staff.map((s) => (s.id === id ? { ...s, pin } : s))
      })),

      upsertCustomerFromSale: (name, phone, total) => {
        const list = get().customers;
        const existing = list.find((c) => c.phone === phone && phone.length > 0);
        if (existing) {
          set((state) => ({
            customers: state.customers.map((c) =>
              c.id === existing.id
                ? { ...c, visits: c.visits + 1, spent: c.spent + total }
                : c
            )
          }));
          return { id: existing.id, name: existing.name };
        }
        const id = "c" + Date.now();
        set((state) => ({
          customers: [...state.customers, { id, name, phone, visits: 1, spent: total }]
        }));
        return { id, name };
      },

      recordTransaction: (tx) => {
        const id = "T-" + String(get().transactions.length + 185).padStart(4, "0");
        const time = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        const newTx: Transaction = { ...tx, id, time };
        set((state) => ({
          transactions: [newTx, ...state.transactions],
          staff: state.staff.map((s) =>
            s.id === tx.staffId
              ? { ...s, sales: s.sales + 1, revenue: s.revenue + tx.total }
              : s
          )
        }));
        return newTx;
      },
    }),
    {
      name: "kigali-pos-data",
    }
  )
);

// Selectors for hooks
export const useProducts = () => usePosStore((state) => state.products);
export const useCustomers = () => usePosStore((state) => state.customers);
export const useStaff = () => usePosStore((state) => state.staff);
export const useTransactions = () => usePosStore((state) => state.transactions);

// Exportable actions for backward compatibility
export const addProduct = (p: any) => usePosStore.getState().addProduct(p);
export const updateProduct = (p: any) => usePosStore.getState().updateProduct(p);
export const deleteProduct = (id: string) => usePosStore.getState().deleteProduct(id);
export const addStaff = (s: any) => usePosStore.getState().addStaff(s);
export const updateStaff = (s: any) => usePosStore.getState().updateStaff(s);
export const deleteStaff = (id: string) => usePosStore.getState().deleteStaff(id);
export const changeStaffPin = (id: string, pin: string) => usePosStore.getState().changeStaffPin(id, pin);
export const upsertCustomerFromSale = (name: string, phone: string, total: number) => usePosStore.getState().upsertCustomerFromSale(name, phone, total);
export const recordTransaction = (tx: any) => usePosStore.getState().recordTransaction(tx);
