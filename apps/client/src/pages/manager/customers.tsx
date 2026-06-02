import { useState, useEffect } from "react";
import { Search, ChevronDown, ChevronUp, History, ShoppingBag } from "lucide-react";
import { fmt } from "@/store/pos-data";
import { useCustomers, fetchCustomers } from "@/store/pos-store";
import { ManagerOnly } from "@/features/layout/components/app-shell";
import { cn } from "@/lib/utils";

export function CustomersPage() {
  const customers = useCustomers() || [];
  const [expanded, setExpanded] = useState<string | null>(null);
  
  useEffect(() => {
    fetchCustomers();
  }, []);

  const [q, setQ] = useState("");
  const list = customers.filter((c) =>
    (c.full_name + c.phone_number).toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <ManagerOnly>
      <div className="p-4 lg:p-8 space-y-6">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">Customers</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {customers.length} on file · recorded automatically from checkout
            </p>
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="text"
            placeholder="Search by name or phone..."
            className="w-full pl-11 pr-4 py-3.5 bg-card border border-border rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-primary/10 text-sm"
          />
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          {list.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              No customers yet. Add a name and phone at checkout to record one.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {list.map((c) => (
                <li key={c.id} className="group transition-colors">
                  <div 
                    onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                    className={cn(
                      "p-4 lg:p-5 flex items-center gap-4 cursor-pointer hover:bg-muted/30 transition-colors",
                      expanded === c.id && "bg-muted/50"
                    )}
                  >
                    <div className="w-11 h-11 rounded-full bg-primary/10 text-primary grid place-items-center text-sm font-bold shrink-0">
                      {(c.full_name || "??")
                        .split(" ")
                        .map((p) => p[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{c.full_name}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        {c.phone_number || "No phone on file"}
                      </p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Visits
                      </p>
                      <p className="text-sm font-bold font-mono">{c.total_orders}</p>
                    </div>
                    <div className="text-right px-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Spent
                      </p>
                      <p className="text-sm font-bold font-mono">{fmt(c.total_spent)}</p>
                    </div>
                    <div className="text-muted-foreground">
                      {expanded === c.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  {expanded === c.id && (
                    <div className="bg-muted/20 border-t border-border p-4 lg:p-6 animate-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center gap-2 mb-4">
                        <History className="w-4 h-4 text-primary" />
                        <h3 className="text-xs font-black uppercase tracking-widest">Transaction History</h3>
                      </div>
                      
                      {(!c.sales || c.sales.length === 0) ? (
                        <p className="text-xs text-muted-foreground italic">No detailed records found.</p>
                      ) : (
                        <div className="space-y-3">
                          {c.sales.map((s) => (
                            <div key={s.id} className="bg-card border border-border rounded-xl p-3 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-muted grid place-items-center">
                                  <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold">{s.receipt_number}</p>
                                  <p className="text-[10px] text-muted-foreground">{new Date(s.created_at).toLocaleDateString()} · {s.payment_method}</p>
                                </div>
                              </div>
                              <p className="text-xs font-black font-mono text-primary">{fmt(s.total_amount)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </ManagerOnly>
  );
}
