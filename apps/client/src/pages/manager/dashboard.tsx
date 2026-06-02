import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Clock } from "lucide-react";
import { fmt } from "@/store/pos-data";
import { 
  useProducts, 
  useStaff, 
  useTransactions, 
  useDailyReports,
  fetchProducts, 
  fetchStaff, 
  fetchTransactions,
  fetchReports 
} from "@/store/pos-store";

// Modular components
import { StatsGrid } from "@/features/dashboard/components/stats-grid";
import { WeeklyChart } from "@/features/dashboard/components/weekly-chart";
import { RecentTx } from "@/features/dashboard/components/recent-transactions";
import { ManagerOnly } from "@/features/layout/components/app-shell";

export function DashboardPage() {
  const products = useProducts() || [];
  const staff = useStaff() || [];
  const transactions = useTransactions() || [];
  const reports = useDailyReports() || [];

  useEffect(() => {
    fetchProducts();
    fetchStaff();
    fetchTransactions();
    fetchReports();
  }, []);

  const weeklySales = useMemo(() => {
    return (reports || []).slice(0, 7).reverse().map(r => ({
      day: new Date(r.date).toLocaleDateString('en-US', { weekday: 'short' }),
      value: r.total_sales
    }));
  }, [reports]);

  const low = (products || []).filter((p) => p.quantity < 10);
  const max = Math.max(0, ...weeklySales.map((w) => w.value));
  const todayRevenue = (transactions || []).reduce((s, t) => s + (t.totalAmount || 0), 0);
  const todayOrders = (transactions || []).length;

  return (
    <ManagerOnly>
      <div className="p-4 lg:p-10 space-y-10 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900 leading-none">
              Welcome back, Admin.
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/reports"
              className="bg-white border border-slate-200 text-slate-700 px-6 py-3.5 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all shadow-sm"
            >
              Analytics
            </Link>
            <Link
              to="/pos"
              className="bg-primary text-white px-8 py-3.5 rounded-2xl font-black text-sm hover:opacity-90 shadow-xl shadow-primary/20 active:scale-95 transition-all"
            >
              Open Terminal
            </Link>
          </div>
        </div>

        <StatsGrid
          todayRevenue={fmt(todayRevenue)}
          txCount={todayOrders}
          avgTx={todayOrders > 0 ? fmt(Math.round(todayRevenue / todayOrders)) : "—"}
          activeStaff={staff.filter((s) => s.isActive).length}
          totalStaff={staff.length}
          lowStockCount={low.length}
        />

        <WeeklyChart data={weeklySales} max={max} highlightLast />

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentTx transactions={transactions.slice(0, 5)} />
          </div>

          <section className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 grid place-items-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                Inventory Alerts
              </h2>
            </div>
            <div className="flex-1">
              <ul className="divide-y divide-slate-50">
                {low.slice(0, 6).map((p) => (
                  <li
                    key={p.id}
                    className="p-6 flex items-center gap-4 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-900 grid place-items-center text-2xl overflow-hidden group-hover:scale-110 transition-transform">
                      {p.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-slate-900 truncate">{p.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        {p.category}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        <div className="bg-slate-900 text-white rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 grid place-items-center">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-black">System Uptime: 99.9%</p>
              <p className="text-xs font-bold text-slate-400">All services operational · Kigali Hub</p>
            </div>
          </div>
        </div>
      </div>
    </ManagerOnly>
  );
}
