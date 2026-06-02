import { useState } from "react";
import { Search, ShieldAlert, LogIn, ShoppingCart, UserPlus } from "lucide-react";
import { ManagerOnly } from "@/features/layout/components/app-shell";
import { cn } from "@/lib/utils";

export function ActivityPage() {
  const [q, setQ] = useState("");
  
  // Mock activity logs
  const logs = [
    { id: 1, user: "John D.", action: "Logged in", time: "14:00", details: "IP: 192.168.1.1", icon: LogIn, color: "text-blue-500", bg: "bg-blue-50" },
    { id: 2, user: "Marie K.", action: "New Sale", time: "14:15", details: "Sale #REC-982 for 12,000 RWF", icon: ShoppingCart, color: "text-emerald-500", bg: "bg-emerald-50" },
    { id: 3, user: "Admin", action: "Updated Staff", time: "13:30", details: "Changed role for Eric M.", icon: UserPlus, color: "text-violet-500", bg: "bg-violet-50" },
    { id: 4, user: "Eric M.", action: "Void Request", time: "12:45", details: "Requesting void for Sale #REC-970", icon: ShieldAlert, color: "text-rose-500", bg: "bg-rose-50" },
  ];

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
          {logs.map((log) => (
            <div key={log.id} className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm flex items-center justify-between gap-6 hover:shadow-md transition-shadow group">
              <div className="flex items-center gap-6">
                <div className={cn("w-14 h-14 rounded-2xl grid place-items-center shrink-0 transition-transform group-hover:rotate-6", log.bg, log.color)}>
                  <log.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-slate-900">{log.user}</p>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">•</span>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{log.action}</p>
                  </div>
                  <p className="text-sm text-slate-500 mt-1 font-medium">{log.details}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-slate-900 font-mono">{log.time}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Today</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ManagerOnly>
  );
}
