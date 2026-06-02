import { TrendingUp, Receipt, Users, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsGridProps {
  todayRevenue: string;
  txCount: number;
  avgTx: string;
  activeStaff: number;
  totalStaff: number;
  lowStockCount: number;
}

export function StatsGrid({
  todayRevenue,
  txCount,
  avgTx,
  activeStaff,
  totalStaff,
  lowStockCount,
}: StatsGridProps) {
  const stats = [
    {
      label: "Gross Revenue",
      value: todayRevenue,
      trend: "+12.5%",
      trendUp: true,
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
    },
    {
      label: "Transactions",
      value: String(txCount),
      trend: txCount > 0 ? `Avg ${avgTx}` : "—",
      trendUp: true,
      icon: Receipt,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      label: "Active Staff",
      value: String(activeStaff),
      trend: `${totalStaff} total on roster`,
      trendUp: true,
      icon: Users,
      color: "text-violet-500",
      bg: "bg-violet-50",
    },
    {
      label: "Stock Alerts",
      value: String(lowStockCount),
      trend: "Critical levels",
      trendUp: false,
      icon: AlertTriangle,
      color: "text-amber-500",
      bg: "bg-amber-50",
    },
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group"
        >
          <div className="flex items-start justify-between mb-6">
            <div
              className={cn(
                "w-12 h-12 rounded-2xl grid place-items-center transition-transform group-hover:rotate-12",
                s.bg,
                s.color
              )}
            >
              <s.icon className="w-6 h-6" />
            </div>
            <span
              className={cn(
                "text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider",
                s.trendUp ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
              )}
            >
              {s.trendUp ? "↑" : "↓"} {s.trend.split(" ")[0]}
            </span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
            {s.label}
          </p>
          <p className="text-2xl lg:text-3xl font-black text-slate-900 font-mono tracking-tighter">
            {s.value}
          </p>
          <p className="text-[10px] text-slate-500 mt-3 font-bold uppercase tracking-widest leading-none">
            {s.trend}
          </p>
        </div>
      ))}
    </section>
  );
}
