import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import { useMemo } from "react";
import { api } from "@/lib/api-client";
import {
  type Product,
  type Category,
} from "./pos-data";

export type StaffMember = {
  id: string;
  fullName: string;
  username: string;
  role: "admin" | "manager" | "cashier";
  isActive: boolean;
  initials: string;
};

export type Customer = {
  id: string;
  fullName: string;
  phoneNumber: string;
  totalOrders: number;
  totalSpent: number;
};

export type Transaction = {
  id: string;
  receiptNumber: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  subTotal: number;
  taxAmount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  items: any[];
};

export type DailyReport = {
  date: string;
  total_sales: number;
  total_orders: number;
};

export type StaffPerformance = {
  staff_id: string;
  staff_name: string;
  total_sales: number;
  total_orders: number;
};

export type Movement = {
  id: string;
  product_id: string;
  user_id: string;
  type: string;
  quantity: number;
  previous_qty: number;
  new_qty: number;
  reason: string;
  reference_id?: string;
  created_at: string;
};

interface PosState {
  products: Product[];
  categories: Category[];
  customers: Customer[];
  staff: StaffMember[];
  transactions: Transaction[];
  dailyReports: DailyReport[];
  staffPerformance: StaffPerformance[];
  movements: Movement[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchProducts: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchStaff: () => Promise<void>;
  fetchCustomers: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  fetchReports: () => Promise<void>;
  fetchMovements: () => Promise<void>;

  addCategory: (name: string) => Promise<Category>;
  addProduct: (p: any) => Promise<void>;
  updateProduct: (p: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  
  addStaff: (s: any) => Promise<void>;
  updateStaff: (s: StaffMember) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
  changeStaffPin: (oldPin: string, newPin: string) => Promise<void>;
  
  checkout: (data: any) => Promise<Transaction>;
}

export const usePosStore = create<PosState>()(
  persist(
    (set, get) => ({
      products: [],
      categories: [],
      customers: [],
      staff: [],
      transactions: [],
      dailyReports: [],
      staffPerformance: [],
      movements: [],
      isLoading: false,
      error: null,

      fetchProducts: async () => {
        set({ isLoading: true, error: null });
        try {
          const products = await api.get<Product[]>("/inventory/products?limit=100");
          set({ products: products || [], isLoading: false });
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
        }
      },

      fetchCategories: async () => {
        try {
          const categories = await api.get<Category[]>("/inventory/categories");
          set({ categories: categories || [] });
        } catch (err: any) {
          console.error("Failed to fetch categories:", err);
        }
      },

      fetchStaff: async () => {
        set({ isLoading: true });
        try {
          const staff = await api.get<StaffMember[]>("/users/staff");
          const processedStaff = (staff || []).map(s => ({
            ...s,
            initials: s.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
          }));
          set({ staff: processedStaff, isLoading: false });
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
        }
      },

      fetchCustomers: async () => {
        try {
          const customers = await api.get<Customer[]>("/customers");
          set({ customers: customers || [] });
        } catch (err: any) {
          console.error("Failed to fetch customers:", err);
        }
      },

      fetchTransactions: async () => {
        set({ isLoading: true });
        try {
          const transactions = await api.get<Transaction[]>("/sales/history");
          set({ transactions: transactions || [], isLoading: false });
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
        }
      },

      fetchReports: async () => {
        try {
          const [daily, performance] = await Promise.all([
            api.get<DailyReport[]>("/reports/daily"),
            api.get<StaffPerformance[]>("/reports/staff-performance")
          ]);
          set({ 
            dailyReports: daily || [], 
            staffPerformance: performance || [] 
          });
        } catch (err: any) {
          console.error("Failed to fetch reports:", err);
        }
      },

      fetchMovements: async () => {
        set({ isLoading: true });
        try {
          const movements = await api.get<Movement[]>("/inventory/movements?limit=100");
          set({ movements: movements || [], isLoading: false });
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
        }
      },

      addCategory: async (name: string) => {
        try {
          const res = await api.post<Category>("/inventory/categories", { name });
          set((state) => ({
            categories: [...state.categories, res]
          }));
          return res;
        } catch (err: any) {
          console.error("Failed to add category:", err);
          throw err;
        }
      },

      addProduct: async (p) => {
        set({ isLoading: true });
        try {
          const res = await api.post<Product>("/inventory/products", p);
          
          // If initial stock was provided, perform an adjustment
          if (p.quantity && p.quantity > 0) {
            await api.post("/inventory/adjust", {
              product_id: res.id,
              quantity: p.quantity,
              type: "IN",
              reason: "Initial stock upon product creation"
            });
          }
          
          await get().fetchProducts();
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
          throw err;
        }
      },

      updateProduct: async (p) => {
        set({ isLoading: true });
        try {
          await api.put(`/inventory/products/${p.id}`, p);
          await get().fetchProducts();
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
          throw err;
        }
      },

      deleteProduct: async (id) => {
        try {
          await api.delete(`/inventory/products/${id}`);
          await get().fetchProducts();
        } catch (err: any) {
          console.error("Failed to delete product:", err);
        }
      },

      addStaff: async (s) => {
        set({ isLoading: true });
        try {
          await api.post("/users/staff", s);
          await get().fetchStaff();
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
          throw err;
        }
      },

      updateStaff: async (s) => {
        set({ isLoading: true });
        try {
          await api.put(`/users/staff/${s.id}`, s);
          await get().fetchStaff();
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
          throw err;
        }
      },

      deleteStaff: async (id) => {
        try {
          await api.post(`/users/staff/${id}/deactivate`, {});
          await get().fetchStaff();
        } catch (err: any) {
          console.error("Failed to deactivate staff:", err);
        }
      },

      changeStaffPin: async (oldPin, newPin) => {
        set({ isLoading: true });
        try {
          // Assuming an endpoint exists or will be added. 
          // For now, we call the profile update endpoint if available, 
          // or just throw error if not implemented on backend.
          await api.post("/auth/change-pin", { oldPin, newPin });
          set({ isLoading: false });
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
          throw err;
        }
      },

      checkout: async (data) => {
        set({ isLoading: true });
        try {
          const res = await api.post<Transaction>("/sales/checkout", data);
          set((state) => ({
            transactions: [res, ...state.transactions],
            isLoading: false
          }));
          return res;
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
          throw err;
        }
      },
    }),
    {
      name: "kigali-pos-data",
      partialize: (state) => ({
        // Only persist non-sensitive, non-fetched data if needed
        // For now, let's keep it minimal
      }),
    }
  )
);

// Selectors for hooks
export const useProducts = () => {
  const products = usePosStore((state) => state.products);
  const categories = usePosStore((state) => state.categories);
  return useMemo(() => {
    return (products || []).map(p => ({
      ...p,
      category_name: categories.find(c => c.id === p.category_id)?.name || "Uncategorized"
    }));
  }, [products, categories]);
};

export const useCategories = () => usePosStore((state) => state.categories);
export const useCustomers = () => usePosStore((state) => state.customers);
export const useStaff = () => usePosStore((state) => state.staff);
export const useTransactions = () => usePosStore((state) => state.transactions);
export const useDailyReports = () => usePosStore((state) => state.dailyReports);
export const useStaffPerformance = () => usePosStore((state) => state.staffPerformance);

export const useMovements = () => {
  const movements = usePosStore((state) => state.movements);
  const products = usePosStore((state) => state.products);
  const staff = usePosStore((state) => state.staff);
  return useMemo(() => {
    return (movements || []).map(m => ({
      ...m,
      product_name: products.find(p => p.id === m.product_id)?.name || "Unknown Product",
      staff_name: staff.find(s => s.id === m.user_id)?.fullName || "Unknown Staff"
    }));
  }, [movements, products, staff]);
};

export const usePosLoading = () => usePosStore((state) => state.isLoading);
export const usePosError = () => usePosStore((state) => state.error);

// Exportable actions
export const addProduct = (p: any) => usePosStore.getState().addProduct(p);
export const updateProduct = (p: Product) => usePosStore.getState().updateProduct(p);
export const deleteProduct = (id: string) => usePosStore.getState().deleteProduct(id);

export const addCategory = (name: string) => usePosStore.getState().addCategory(name);
export const addStaff = (s: any) => usePosStore.getState().addStaff(s);
export const updateStaff = (s: StaffMember) => usePosStore.getState().updateStaff(s);
export const deleteStaff = (id: string) => usePosStore.getState().deleteStaff(id);
export const changeStaffPin = (oldPin: string, newPin: string) => usePosStore.getState().changeStaffPin(oldPin, newPin);

export const fetchProducts = () => usePosStore.getState().fetchProducts();
export const fetchCategories = () => usePosStore.getState().fetchCategories();
export const fetchStaff = () => usePosStore.getState().fetchStaff();
export const fetchCustomers = () => usePosStore.getState().fetchCustomers();
export const fetchTransactions = () => usePosStore.getState().fetchTransactions();
export const fetchReports = () => usePosStore.getState().fetchReports();
export const fetchMovements = () => usePosStore.getState().fetchMovements();
export const checkout = (data: any) => usePosStore.getState().checkout(data);
