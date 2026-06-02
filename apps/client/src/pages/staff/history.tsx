import { useState, useEffect } from "react";
import { Search, Filter, ArrowLeft, MoreVertical, Ban } from "lucide-react";
import { fmt } from "@/store/pos-data";
import { useTransactions, fetchTransactions } from "@/store/pos-store";
import { cn } from "@/lib/utils";

export function SalesHistoryPage() {
  const transactions = useTransactions();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const [q, setQ] = useState("");
  
  const filtered = transactions.filter(t => 
    t.id.toLowerCase().includes(q.toLowerCase()) || 
    t.customerName?.toLowerCase().includes(q.toLowerCase()) ||
    t.staffName.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-10 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
            Ledger
          </p>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900 leading-none">
            Sales History
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
      </div>

      <div className="relative group max-w-md">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          type="text"
          placeholder="Search by ID, customer or staff..."
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium"
        />
      </div>

      <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/30">
                <th className="text-left px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction</th>
                <th className="text-left px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                <th className="text-left px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Staff</th>
                <th className="text-left px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Method</th>
                <th className="text-right px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                <th className="px-4 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-6">
                    <p className="text-sm font-black text-slate-900">{t.id}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                      {t.time} · {t.items} items
                    </p>
                  </td>
                  <td className="px-4 py-6">
                    <p className="text-sm font-bold text-slate-700">{t.customerName || "Walk-in"}</p>
                  </td>
                  <td className="px-4 py-6">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 text-[10px] font-black grid place-items-center text-slate-600">
                        {t.staffName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <p className="text-xs font-bold text-slate-700">{t.staffName}</p>
                    </div>
                  </td>
                  <td className="px-4 py-6">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                      {t.method}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <p className="text-sm font-black text-primary font-mono">{fmt(t.total)}</p>
                  </td>
                  <td className="px-4 py-6 text-right">
                    <button className="w-8 h-8 rounded-lg hover:bg-slate-100 grid place-items-center text-slate-400">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filtered.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-slate-400 font-bold">No transactions found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
