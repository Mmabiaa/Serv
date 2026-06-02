export type Product = {
  id: string;
  name: string;
  price: number;
  category_id: string;
  category_name?: string;
  quantity: number;
  sku?: string;
  barcode?: string;
  description?: string;
  imageUrl?: string;
  emoji?: string; // Keep for UI fallback
};

export type Category = {
  id: string;
  name: string;
  description?: string;
};

export const CURRENCY = "RWF";

export const fmt = (n: number) =>
  `${CURRENCY} ${n.toLocaleString("en-US")}`;

// Mock data removed as per user request.
// All data will be fetched from the server.
export const categories: string[] = [];
export const products: Product[] = [];
export const recentTransactions: any[] = [];
export const staff: any[] = [];
export const customers: any[] = [];
export const weeklySales: { day: string; value: number }[] = [];
