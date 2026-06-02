import { fmt, weeklySales } from "@/store/pos-data";
import { useProducts } from "@/store/pos-store";
import { ArrowUpRight } from "lucide-react";
import { ManagerOnly } from "@/features/layout/components/app-shell";

export function ReportsPage() {
  const products = useProducts() || [];
  const max = Math.max(0, ...(weeklySales || []).map((w) => w.value));
  const total = (weeklySales || []).reduce((s, w) => s + w.value, 0);

  const top = [...(products || [])]
    .slice(0, 5)
    .map((p, i) => ({ ...p, sold: 50 - i * 7, revenue: (p.price || 0) * (50 - i * 7) }));

  return (
    <ManagerOnly>
      <div className="p-4 lg:p-8 space-y-6 lg:space-y-8">
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Last 7 days
          </p>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight mt-1">Sales reports</h1>
        </div>

        <section className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          <Stat label="Weekly revenue" value={fmt(total)} trend="+18%" />
          <Stat label="Best day" value="Saturday" trend={fmt(198250)} />
          <Stat label="Avg ticket" value={fmt(2968)} trend="+4.2%" />
        </section>

        <section className="bg-card border border-border rounded-2xl p-5 lg:p-6 shadow-sm">
          <h2 className="text-base font-bold mb-5">Revenue by day</h2>
          <div className="grid grid-cols-7 gap-2 lg:gap-3 items-end h-48">
            {weeklySales.map((w, i) => (
              <div key={w.day} className="flex flex-col items-center gap-2">
                <div className="w-full flex-1 flex items-end">
                  <div
                    className={
                      "w-full rounded-lg " + (i === 5 ? "bg-primary" : "bg-primary/15")
                    }
                    style={{ height: `${(w.value / max) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground">{w.day}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="text-base font-bold">Top products this week</h2>
          </div>
          <ul className="divide-y divide-border">
            {top.map((p, i) => (
              <li key={p.id} className="p-4 flex items-center gap-3">
                <span className="w-6 text-center text-xs font-bold text-muted-foreground font-mono">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="w-10 h-10 rounded-lg bg-muted grid place-items-center text-xl overflow-hidden">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    p.emoji
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{p.name}</p>
                  <p className="text-[11px] text-muted-foreground">{p.sold} units sold</p>
                </div>
                <p className="text-sm font-bold font-mono">{fmt(p.revenue)}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </ManagerOnly>
  );
}

function Stat({ label, value, trend }: { label: string; value: string; trend: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 lg:p-5 shadow-sm">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
        {label}
      </p>
      <p className="text-lg lg:text-xl font-extrabold font-mono">{value}</p>
      <div className="flex items-center gap-1 mt-2 text-success">
        <ArrowUpRight className="w-3 h-3" />
        <span className="text-[10px] font-bold font-mono">{trend}</span>
      </div>
    </div>
  );
}
