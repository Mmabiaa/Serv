import { useState } from "react";
import { Search, ArrowUpDown, TrendingDown, TrendingUp, Filter } from "lucide-react";
import { ManagerOnly } from "@/features/layout/components/app-shell";
import { cn } from "@/lib/utils";

export function MovementsPage() {
  const [q, setQ] = useState("");
  
  // Mock movements for UI development
  const movements = [
    { id: "M1", product: "Inyange Milk 500ml", type: "SALE", qty: -2, time: "14:20", staff: "John D.", reason: "Sale REC-123" },
    { id: "M2", product: "Akabanga 100ml", type: "RESTOCK", qty: 24, time: "12:00", staff: "Admin", reason: "Purchase order #45" },
    { id: "M3", product: "Bread Large", type: "ADJUST", qty: -1, time: "09:30", staff: "Marie K.", reason: "Expired" },
  ];

  return (
    <ManagerOnly>
      <div className="p-4 lg:p-10 space-y-8 animate-in fade-in duration-500">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
            Inventory
          </p>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900 leading-none">
            Stock Movements
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative group flex-1">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              type="text"
              placeholder="Search by product or staff..."
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium"
            />
          </div>
          <button className="bg-white border border-slate-200 text-slate-700 px-6 py-4 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-2">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>

        <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/30">
                  <th className="text-left px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Movement</th>
                  <th className="text-left px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product</th>
                  <th className="text-left px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                  <th className="text-center px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantity</th>
                  <th className="text-left px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Staff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-8 py-6">
                      <p className="text-sm font-black text-slate-900">{m.id}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                        {m.time} · {m.reason}
                      </p>
                    </td>
                    <td className="px-4 py-6">
                      <p className="text-sm font-bold text-slate-700">{m.product}</p>
                    </td>
                    <td className="px-4 py-6">
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md",
                        m.type === "SALE" ? "bg-blue-50 text-blue-600" : 
                        m.type === "RESTOCK" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                      )}>
                        {m.type}
                      </span>
                    </td>
                    <td className="px-4 py-6 text-center">
                      <div className={cn(
                        "inline-flex items-center gap-1 text-sm font-black font-mono",
                        m.qty < 0 ? "text-rose-500" : "text-emerald-500"
                      )}>
                        {m.qty < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                        {Math.abs(m.qty)}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs font-bold text-slate-700">{m.staff}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ManagerOnly>
  );
}
