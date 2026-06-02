import { useState } from "react";
import { Search } from "lucide-react";
import { fmt } from "@/store/pos-data";
import { useCustomers } from "@/store/pos-store";
import { ManagerOnly } from "@/features/layout/components/app-shell";

export function CustomersPage() {
  const customers = useCustomers();
  const [q, setQ] = useState("");
  const list = customers.filter((c) =>
    (c.name + c.phone).toLowerCase().includes(q.toLowerCase()),
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
                <li key={c.id} className="p-4 lg:p-5 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-primary/10 text-primary grid place-items-center text-sm font-bold">
                    {c.name
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{c.name}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      {c.phone || "No phone on file"}
                    </p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Visits
                    </p>
                    <p className="text-sm font-bold font-mono">{c.visits}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Spent
                    </p>
                    <p className="text-sm font-bold font-mono">{fmt(c.spent)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </ManagerOnly>
  );
}
