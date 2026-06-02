import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { fmt } from "@/store/pos-data";
import { useStaff, type StaffMember, fetchStaff } from "@/store/pos-store";
import { ManagerOnly } from "@/features/layout/components/app-shell";
import { StaffDialog } from "@/features/staff/components/staff-dialog";
import { StaffView } from "@/features/staff/components/staff-view";
import { StaffCard } from "@/features/staff/components/staff-card";

type DialogMode =
  | { type: "view"; member: StaffMember }
  | { type: "edit"; member: StaffMember }
  | { type: "create" }
  | null;

export function StaffPage() {
  const staff = useStaff();

  useEffect(() => {
    fetchStaff();
  }, []);

  const [dialog, setDialog] = useState<DialogMode>(null);

  return (
    <ManagerOnly>
      <div className="p-4 lg:p-8 space-y-6">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">Staff</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {staff.filter((s) => s.online).length} active · {staff.length} total
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDialog({ type: "create" })}
            className="inline-flex items-center gap-2 bg-foreground text-background px-4 py-3 rounded-xl text-sm font-bold hover:opacity-90"
          >
            <Plus className="w-4 h-4" /> Add staff
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          {staff.map((s) => (
            <div key={s.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-muted text-foreground grid place-items-center text-sm font-bold">
                    {s.initials}
                  </div>
                  <span
                    className={
                      "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card " +
                      (s.online ? "bg-success" : "bg-muted-foreground/40")
                    }
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{s.name}</p>
                  <p className="text-[11px] text-muted-foreground capitalize">{s.role}</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Today's sales
                  </p>
                  <p className="text-sm font-bold font-mono mt-0.5">{s.sales}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Revenue
                  </p>
                  <p className="text-sm font-bold font-mono mt-0.5">{fmt(s.revenue)}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border flex gap-2">
                <button
                  type="button"
                  onClick={() => setDialog({ type: "view", member: s })}
                  className="flex-1 text-xs font-bold py-2 rounded-lg bg-muted hover:bg-secondary transition-colors"
                >
                  View
                </button>
                <button
                  type="button"
                  onClick={() => setDialog({ type: "edit", member: s })}
                  className="flex-1 text-xs font-bold py-2 rounded-lg bg-muted hover:bg-secondary transition-colors"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>

        {dialog?.type === "view" && (
          <StaffView member={dialog.member} onClose={() => setDialog(null)} />
        )}

        {(dialog?.type === "create" || dialog?.type === "edit") && (
          <StaffDialog dialog={dialog} onClose={() => setDialog(null)} />
        )}
      </div>
    </ManagerOnly>
  );
}
