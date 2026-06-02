import { Link } from "@tanstack/react-router";
import { ShoppingBag, Check } from "lucide-react";
import { fmt } from "@/store/pos-data";
import type { Transaction } from "@/store/pos-store";

interface RecentTxProps {
  transactions: Transaction[];
}

export function RecentTx({ transactions }: RecentTxProps) {
  return (
    <section className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden h-full flex flex-col">
      <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
        <h2 className="text-base font-black text-slate-900 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-500 grid place-items-center">
            <ShoppingBag className="w-4 h-4" />
          </div>
          Live Sales Stream
        </h2>
        <Link
          to="/reports"
          className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
        >
          Full Ledger
        </Link>
      </div>
      <div className="flex-1">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/30">
                <th className="text-left px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Transaction
                </th>
                <th className="text-left px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Cashier
                </th>
                <th className="text-left px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Method
                </th>
                <th className="text-right px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-5">
                    <p className="text-sm font-black text-slate-900">{t.id}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                      {t.time} · {t.items} items
                    </p>
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 text-[10px] font-black grid place-items-center text-slate-600">
                        {t.staffName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <p className="text-xs font-bold text-slate-700">{t.staffName}</p>
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                      {t.method}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <p className="text-sm font-black text-primary font-mono">{fmt(t.total)}</p>
                    <div className="flex items-center justify-end gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                        Verified
                      </span>
                      <Check className="w-2.5 h-2.5 text-emerald-500" strokeWidth={4} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
