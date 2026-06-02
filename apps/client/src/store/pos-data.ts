export type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  emoji: string;
  imageUrl?: string;
};

export const CURRENCY = "RWF";

export const fmt = (n: number) =>
  `${CURRENCY} ${n.toLocaleString("en-US")}`;

export const categories = [
  "All Inventory",
  "Produce",
  "Health & Beauty",
  "Dairy & Eggs",
  "Bakery",
  "Beverages",
  "Household",
];

export const products: Product[] = [
  { id: "p1", name: "Inyange Mineral Water 500ml", price: 500, category: "Beverages", stock: 12, emoji: "💧" },
  { id: "p2", name: "Fresh Organic Tomatoes (1kg)", price: 1200, category: "Produce", stock: 38, emoji: "🍅" },
  { id: "p3", name: "Kigali Artisanal Sourdough", price: 2500, category: "Bakery", stock: 4, emoji: "🍞" },
  { id: "p4", name: "Full Cream Milk 1L", price: 1000, category: "Dairy & Eggs", stock: 22, emoji: "🥛" },
  { id: "p5", name: "Sweet Matooke Bananas", price: 800, category: "Produce", stock: 56, emoji: "🍌" },
  { id: "p6", name: "Panadol Extra (Pack)", price: 1500, category: "Health & Beauty", stock: 3, emoji: "💊" },
  { id: "p7", name: "Indomie Onion 70g", price: 180, category: "Household", stock: 120, emoji: "🍜" },
  { id: "p8", name: "Coca-Cola 50cl", price: 600, category: "Beverages", stock: 64, emoji: "🥤" },
  { id: "p9", name: "Mama Gold Rice 5kg", price: 8500, category: "Household", stock: 14, emoji: "🍚" },
  { id: "p10", name: "Peak Powder Milk 400g", price: 3200, category: "Dairy & Eggs", stock: 18, emoji: "🥛" },
  { id: "p11", name: "Eggs (Tray of 30)", price: 4800, category: "Dairy & Eggs", stock: 9, emoji: "🥚" },
  { id: "p12", name: "Maggi Cube Pack", price: 250, category: "Household", stock: 200, emoji: "🧂" },
];

export const recentTransactions = [
  { id: "T-0184", staff: "Adebayo M.", items: 4, total: 4200, time: "14:22", method: "Cash" },
  { id: "T-0183", staff: "Chidi N.", items: 2, total: 850, time: "14:18", method: "Mobile Money" },
  { id: "T-0182", staff: "Adebayo M.", items: 7, total: 12400, time: "14:05", method: "Card" },
  { id: "T-0181", staff: "Grace K.", items: 1, total: 500, time: "13:51", method: "Cash" },
  { id: "T-0180", staff: "Chidi N.", items: 5, total: 3650, time: "13:44", method: "Mobile Money" },
  { id: "T-0179", staff: "Adebayo M.", items: 3, total: 2100, time: "13:30", method: "Cash" },
];

export const staff = [
  { id: "s1", name: "Adebayo M.", role: "Cashier", sales: 18, revenue: 42500, online: true, initials: "AM" },
  { id: "s2", name: "Chidi N.", role: "Cashier", sales: 14, revenue: 28150, online: true, initials: "CN" },
  { id: "s3", name: "Grace K.", role: "Cashier", sales: 9, revenue: 16800, online: false, initials: "GK" },
  { id: "s4", name: "Jean D'Amour", role: "Manager", sales: 7, revenue: 55050, online: true, initials: "JD" },
];

export const customers = [
  { id: "c1", name: "Aisha Bello", phone: "+234 802 555 0114", visits: 32, spent: 142500 },
  { id: "c2", name: "Samuel Okonkwo", phone: "+234 803 444 0921", visits: 18, spent: 64200 },
  { id: "c3", name: "Fatima Diallo", phone: "+250 788 122 045", visits: 11, spent: 31600 },
  { id: "c4", name: "Brian Mwangi", phone: "+254 712 884 003", visits: 7, spent: 18900 },
];

export const weeklySales = [
  { day: "Mon", value: 98000 },
  { day: "Tue", value: 124500 },
  { day: "Wed", value: 88200 },
  { day: "Thu", value: 152000 },
  { day: "Fri", value: 175400 },
  { day: "Sat", value: 198250 },
  { day: "Sun", value: 142500 },
];