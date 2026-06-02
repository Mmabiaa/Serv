import { cn } from "@/lib/utils";
import { fmt } from "@/store/pos-data";

interface WeeklyChartProps {
  data: { day: string; value: number }[];
  max: number;
  highlightLast?: boolean;
}

export function WeeklyChart({ data, max, highlightLast }: WeeklyChartProps) {
  return (
    <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 lg:p-10 shadow-sm relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
      <div className="flex items-center justify-between mb-10 relative">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Weekly Sales Revenue</h2>
          <p className="text-xs font-bold text-slate-500 mt-1">
            Transaction volume across all terminals
          </p>
        </div>
        <select className="bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-black text-slate-600 focus:ring-2 focus:ring-primary/20">
          <option>Last 7 Days</option>
          <option>Last 30 Days</option>
        </select>
      </div>

      <div className="flex items-end justify-between gap-2 h-64 pt-6">
        {data.map((d, i) => {
          const height = (d.value / max) * 100;
          const isLast = i === data.length - 1;
          return (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-4 group">
              <div className="relative w-full flex-1 flex items-end justify-center px-1 sm:px-3">
                <div
                  style={{ height: `${height}%` }}
                  className={cn(
                    "w-full rounded-t-2xl transition-all duration-500 group-hover:scale-x-105 group-hover:brightness-110 relative",
                    isLast && highlightLast
                      ? "bg-primary shadow-lg shadow-primary/20"
                      : "bg-slate-100 group-hover:bg-slate-200"
                  )}
                >
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
                    {fmt(d.value)}
                  </div>
                </div>
              </div>
              <p
                className={cn(
                  "text-[10px] font-black uppercase tracking-widest transition-colors",
                  isLast && highlightLast
                    ? "text-primary"
                    : "text-slate-400 group-hover:text-slate-600"
                )}
              >
                {d.day}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
