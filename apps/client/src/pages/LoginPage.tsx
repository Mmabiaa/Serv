import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { authStore } from "@/store/auth-store";
import { useStaff } from "@/store/pos-store";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Lock, Mail, ShieldCheck, UserCircle2, ChevronRight, Loader2 } from "lucide-react";

// Modular components
import { BrandingSection } from "@/features/auth/components/branding-section";

export function LoginPage() {
  const staff = useStaff();
  const [loginMode, setLoginMode] = useState<"staff" | "manager">("staff");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [staffId, setStaffId] = useState<string>(
    () => staff.find((s) => s.role === "manager")?.id ?? staff[0]?.id ?? ""
  );
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const selected = useMemo(() => staff.find((s) => s.id === staffId), [staff, staffId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (loginMode === "manager") {
        const res = await api.post<{ token: string; user: any }>("/auth/login", {
          email,
          password,
        });
        authStore.login({
          id: res.user.id,
          name: res.user.full_name,
          role: "manager",
          initials: res.user.full_name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .slice(0, 2),
          token: res.token,
        });
        toast.success("Welcome back, Manager!");
        navigate("/dashboard");
      } else {
        if (!selected) return;
        const res = await api.post<{ token: string; user: any }>("/auth/staff/login", {
          username: selected.name,
          pin,
        });
        authStore.login({
          id: res.user.id,
          name: res.user.full_name,
          role: res.user.role === "admin" ? "manager" : "cashier",
          initials: res.user.full_name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .slice(0, 2),
          token: res.token,
        });
        toast.success(`Welcome, ${res.user.full_name}!`);
        navigate(res.user.role === "admin" ? "/dashboard" : "/pos");
      }
    } catch (err: any) {
      toast.error(err.message || "Login failed", {
        description: "Please check your credentials and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8F9FC] text-slate-900 grid lg:grid-cols-2 font-sans selection:bg-primary/10">
      <BrandingSection />

      <div className="flex items-center justify-center p-8 lg:p-16 relative">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-right-4 duration-700">
          <div className="mb-10">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Welcome back</h1>
            <p className="text-sm font-bold text-slate-500 mt-2">
              Select your access level to continue to the dashboard.
            </p>
          </div>

          <div className="flex p-1.5 bg-slate-100 rounded-[1.5rem] mb-10">
            <button
              onClick={() => setLoginMode("staff")}
              className={cn(
                "flex-1 py-3 text-xs font-black rounded-2xl transition-all duration-300 flex items-center justify-center gap-2",
                loginMode === "staff"
                  ? "bg-white text-primary shadow-lg shadow-slate-200"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <ShieldCheck className="w-4 h-4" />
              Staff Terminal
            </button>
            <button
              onClick={() => setLoginMode("manager")}
              className={cn(
                "flex-1 py-3 text-xs font-black rounded-2xl transition-all duration-300 flex items-center justify-center gap-2",
                loginMode === "manager"
                  ? "bg-white text-primary shadow-lg shadow-slate-200"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <UserCircle2 className="w-4 h-4" />
              Management
            </button>
          </div>

          <form onSubmit={submit} className="space-y-6">
            {loginMode === "staff" ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">
                    Select Account
                  </label>
                  <div className="relative">
                    <UserCircle2 className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      value={staffId}
                      onChange={(e) => setStaffId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-black text-slate-900 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all appearance-none cursor-pointer shadow-sm"
                    >
                      {staff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} · {s.role.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">
                    Security PIN
                  </label>
                  <div className="relative group">
                    <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      type="password"
                      inputMode="numeric"
                      placeholder="••••"
                      className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-2xl font-black text-slate-900 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-mono tracking-[1em] shadow-sm"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">
                    Management Email
                  </label>
                  <div className="relative group">
                    <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@serv.com"
                      className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-black text-slate-900 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">
                    Password
                  </label>
                  <div className="relative group">
                    <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-black text-slate-900 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-sm"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-sm shadow-2xl shadow-slate-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Access Terminal
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
