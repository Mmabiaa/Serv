import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { authStore } from "@/store/auth-store";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Lock, UserCircle2, ChevronRight, Loader2 } from "lucide-react";

// Modular components
import { BrandingSection } from "@/features/auth/components/branding-section";

export function LoginPage() {
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || pin.length < 4) {
      toast.error("Invalid input", {
        description: "Please enter a valid username and 4-digit PIN.",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await api.post<{ token: string; user: any }>("/auth/staff/login", {
        username,
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
          .slice(0, 2)
          .toUpperCase(),
        token: res.token,
      });

      toast.success(`Welcome back, ${res.user.full_name}!`);
      
      // Automated redirection based on role
      if (res.user.role === "admin") {
        navigate("/dashboard");
      } else {
        navigate("/pos");
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
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Sign in</h1>
            <p className="text-sm font-bold text-slate-500 mt-2">
              Enter your username and security PIN to access the terminal.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">
                  Username
                </label>
                <div className="relative group">
                  <UserCircle2 className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-black text-slate-900 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-sm"
                    required
                    autoComplete="username"
                  />
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
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>
            </div>

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

          <p className="text-center text-[10px] font-bold text-slate-400 mt-8 uppercase tracking-widest">
            Protected by enterprise-grade security
          </p>
        </div>
      </div>
    </main>
  );
}
