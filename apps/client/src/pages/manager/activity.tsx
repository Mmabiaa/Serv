import { useState, useEffect } from "react";
import { Search, ShieldAlert, LogIn, ShoppingCart, UserPlus, Package, Trash2, Edit, CheckCircle } from "lucide-react";
import { ManagerOnly } from "@/features/layout/components/app-shell";
import { useAuditLogs, fetchAuditLogs, fetchStaff } from "@/store/pos-store";
import { cn } from "@/lib/utils";

const getIcon = (action: string) => {
  if (action.includes("LOGIN")) return { icon: LogIn, color: "text-blue-500", bg: "bg-blue-50" };
  if (action.includes("SALE") || action.includes("CHECKOUT")) return { icon: ShoppingCart, color: "text-emerald-500", bg: "bg-emerald-50" };
  if (action.includes("CREATE_STAFF")) return { icon: UserPlus, color: "text-violet-500", bg: "bg-violet-50" };
  if (action.includes("DELETE")) return { icon: Trash2, color: "text-rose-500", bg: "bg-rose-50" };
  if (action.includes("UPDATE")) return { icon: Edit, color: "text-amber-500", bg: "bg-amber-50" };
  if (action.includes("PRODUCT")) return { icon: Package, color: "text-slate-500", bg: "bg-slate-50" };
  return { icon: CheckCircle, color: "text-slate-500", bg: "bg-slate-50" };
};

export function ActivityPage() {
  const [q, setQ] = useState("");
  const logs = useAuditLogs() || [];

  useEffect(() => {
    fetchAuditLogs();
    fetchStaff();
  }, []);
  
  const filtered = logs.filter((log) =>
    (log.user_name + log.action + log.details).toLowerCase().includes(q.toLowerCase())
  );

  return (
    <ManagerOnly>
      <div className="p-4 lg:p-10 space-y-8 animate-in fade-in duration-500">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
            Security
          </p>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900 leading-none">
            Activity Monitoring
          </h1>
        </div>

        <div className="relative group max-w-md">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="text"
            placeholder="Search by user or action..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium"
          />
        </div>

        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-bold bg-white border border-slate-100 rounded-[2rem]">
              No activity logs found.
            </div>
          ) : (
            filtered.map((log) => {
              const style = getIcon(log.action);
              return (
                <div key={log.id} className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm flex items-center justify-between gap-6 hover:shadow-md transition-shadow group">
                  <div className="flex items-center gap-6">
                    <div className={cn("w-14 h-14 rounded-2xl grid place-items-center shrink-0 transition-transform group-hover:rotate-6", style.bg, style.color)}>
                      <style.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-slate-900">{log.user_name}</p>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">•</span>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{log.action}</p>
                      </div>
                      <p className="text-sm text-slate-500 mt-1 font-medium">{log.details || `Performed ${log.action} on ${log.entity}`}</p>
                      <p className="text-[9px] text-slate-400 font-mono mt-1">IP: {log.ip_address}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900 font-mono">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      {new Date(log.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </ManagerOnly>
  );
}
