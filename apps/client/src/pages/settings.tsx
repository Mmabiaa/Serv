import { useState } from "react";
import { Bluetooth, Printer, Cloud, Globe, Lock, KeyRound, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/store/auth-store";
import { changeStaffPin, useStaff } from "@/store/pos-store";

const rows = [
  {
    Icon: Printer,
    title: "Bluetooth receipt printer",
    sub: "BIXOLON SPP-R200 · connected",
    badge: "Connected",
    tone: "success" as const,
  },
  {
    Icon: Bluetooth,
    title: "Pair another device",
    sub: "Cash drawer, barcode scanner",
    badge: "Pair",
    tone: "muted" as const,
  },
  {
    Icon: Cloud,
    title: "Cloud sync",
    sub: "Last synced 14:42 today",
    badge: "Auto",
    tone: "success" as const,
  },
  {
    Icon: Globe,
    title: "Currency & locale",
    sub: "RWF · English (East Africa)",
    badge: "Change",
    tone: "muted" as const,
  },
  {
    Icon: Lock,
    title: "Staff PIN policy",
    sub: "Required at start of shift",
    badge: "On",
    tone: "success" as const,
  },
];

export function SettingsPage() {
  const user = useAuth();
  const staff = useStaff();
  const me = staff.find((s) => s.id === user?.id);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    if (!user) return;
    
    if (!next || !confirm) {
      setStatus({ type: "err", msg: "Please enter and confirm your new PIN." });
      return;
    }
    if (next !== confirm) {
      setStatus({ type: "err", msg: "PINs don't match." });
      return;
    }
    
    try {
      await changeStaffPin(current, next);
      setStatus({ type: "ok", msg: "PIN updated." });
      setCurrent("");
      setNext("");
      setConfirm("");
      toast.success("Security PIN updated successfully");
    } catch (err: any) {
      setStatus({ type: "err", msg: err.message || "Failed to update PIN." });
      toast.error(err.message || "Failed to update PIN");
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">Store settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Devices, sync and security.</p>
      </div>

      {/* Change PIN */}
      <section className="bg-card border border-border rounded-2xl shadow-sm p-5 lg:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
            <KeyRound className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold">Change your terminal PIN</h2>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                Current PIN
              </label>
              <input
                type="password"
                maxLength={6}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                className="w-full bg-muted/50 border border-border rounded-xl px-3 py-3 text-sm font-mono focus:outline-none focus:ring-4 focus:ring-primary/10"
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                New Security PIN (4 or 6 digits)
              </label>
              <input
                type="password"
                maxLength={6}
                value={next}
                onChange={(e) => setNext(e.target.value)}
                className="w-full bg-muted/50 border border-border rounded-xl px-3 py-3 text-sm font-mono focus:outline-none focus:ring-4 focus:ring-primary/10"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                Confirm new PIN
              </label>
              <input
                type="password"
                maxLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full bg-muted/50 border border-border rounded-xl px-3 py-3 text-sm font-mono focus:outline-none focus:ring-4 focus:ring-primary/10"
              />
            </div>
          </div>

          {status && (
            <div
              className={
                "p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1 " +
                (status.type === "ok" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")
              }
            >
              {status.type === "ok" && <Check className="w-3.5 h-3.5" />}
              {status.msg}
            </div>
          )}

          <button
            type="submit"
            className="bg-primary text-primary-foreground px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform"
          >
            Update PIN
          </button>
        </form>
      </section>

      {/* Hardware & Sync */}
      <section className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <ul className="divide-y divide-border">
          {rows.map((r) => (
            <li key={r.title} className="p-4 lg:p-5 flex items-center gap-4 hover:bg-muted/30 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-muted grid place-items-center text-muted-foreground">
                <r.Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">{r.title}</p>
                <p className="text-xs text-muted-foreground">{r.sub}</p>
              </div>
              <span
                className={
                  "text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg " +
                  (r.tone === "success" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")
                }
              >
                {r.badge}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
