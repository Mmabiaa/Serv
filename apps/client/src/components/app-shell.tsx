import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Package,
  BarChart3,
  Users,
  UserCog,
  Settings,
  Bell,
  Wifi,
  LayoutDashboard,
  Search,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useEffect, type ReactNode, useState } from "react";
import { authStore, useAuth } from "@/store/auth-store";
import { cn } from "@/lib/utils";

const managerNav = [
  { to: "/dashboard", label: "Home", longLabel: "Dashboard", icon: LayoutDashboard },
  { to: "/pos", label: "POS", longLabel: "POS Terminal", icon: Home },
  { to: "/inventory", label: "Stock", longLabel: "Inventory", icon: Package },
  { to: "/reports", label: "Reports", longLabel: "Sales Analytics", icon: BarChart3 },
  { to: "/customers", label: "People", longLabel: "Customers", icon: Users },
  { to: "/staff", label: "Staff", longLabel: "Staff Management", icon: UserCog },
] as const;

const cashierNav = [
  { to: "/dashboard", label: "Home", longLabel: "Dashboard", icon: LayoutDashboard },
  { to: "/pos", label: "POS", longLabel: "POS Terminal", icon: Home },
] as const;

function useActive() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (to: string) => (to === "/" ? path === "/" : path.startsWith(to));
}

export function AppShell({ children }: { children: ReactNode }) {
  const isActive = useActive();
  const user = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!user) navigate({ to: "/login" });
    
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [user, navigate]);

  if (!user) return null;

  const navItems = user.role === "manager" ? managerNav : cashierNav;
  const roleLabel = user.role === "manager" ? "Store Manager" : "Cashier";

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-foreground flex font-sans selection:bg-primary/10">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-[280px] bg-white border-r border-slate-200 sticky top-0 h-screen shrink-0 z-40">
        <div className="p-8 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary text-white grid place-items-center font-black text-2xl shadow-xl shadow-primary/20 rotate-3">
            S
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">Serv</h1>
            <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mt-1">
              Commerce OS
            </p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
            Main Menu
          </p>
          {navItems.map((item) => {
            const active = isActive(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group w-full flex items-center justify-between px-4 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200",
                  active
                    ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("w-5 h-5", active ? "text-white" : "text-slate-400 group-hover:text-primary transition-colors")} />
                  {item.longLabel}
                </div>
                {active && <ChevronRight className="w-4 h-4 opacity-50" />}
              </Link>
            );
          })}
          
          <div className="pt-8 pb-4">
            <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
              System
            </p>
            <Link
              to="/settings"
              className={cn(
                "group w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200",
                isActive("/settings")
                  ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Settings className={cn("w-5 h-5", isActive("/settings") ? "text-white" : "text-slate-400 group-hover:text-primary transition-colors")} />
              Settings
            </Link>
          </div>
        </nav>

        <div className="p-6">
          <div className="bg-slate-900 rounded-[2rem] p-6 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 rounded-full -mr-8 -mt-8 blur-2xl group-hover:bg-primary/30 transition-colors" />
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md text-white grid place-items-center text-sm font-black border border-white/10">
                {user.initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black truncate">{user.name}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {roleLabel}
                </p>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => {
                authStore.logout();
                navigate({ to: "/login" });
              }}
              className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 group/btn"
            >
              <LogOut className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header 
          className={cn(
            "sticky top-0 z-30 px-4 py-4 lg:px-10 flex items-center justify-between transition-all duration-300",
            scrolled ? "bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm" : "bg-transparent"
          )}
        >
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-primary text-white grid place-items-center font-black text-xl shadow-lg shadow-primary/20">
              S
            </div>
            <div className="leading-none">
              <h1 className="text-sm font-black tracking-tight text-slate-900">Serv</h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                {roleLabel}
              </p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-6">
            <div className="relative group">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search anything... (⌘K)"
                className="bg-slate-100 border-none rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold w-64 focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">Live Sync</span>
            </div>
            
            <button className="w-11 h-11 rounded-xl bg-white border border-slate-200 grid place-items-center hover:bg-slate-50 transition-colors relative shadow-sm">
              <Bell className="w-5 h-5 text-slate-600" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-white" />
            </button>

            <div className="lg:hidden w-11 h-11 rounded-xl bg-slate-900 text-white grid place-items-center text-xs font-black shadow-lg">
              {user.initials}
            </div>
          </div>
        </header>

        <main className="flex-1 pb-32 lg:pb-10 overflow-x-hidden">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-6 inset-x-4 z-40 bg-white/90 backdrop-blur-xl border border-slate-200 rounded-[2rem] p-2 lg:hidden shadow-2xl shadow-slate-900/10 ring-1 ring-slate-900/5">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const active = isActive(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="flex flex-col items-center gap-1 p-2 min-w-[64px]"
              >
                <div
                  className={cn(
                    "p-2.5 rounded-2xl transition-all duration-300",
                    active ? "bg-primary text-white shadow-lg shadow-primary/30 -translate-y-1" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <span
                  className={cn(
                    "text-[10px] font-black tracking-tight transition-colors",
                    active ? "text-primary" : "text-slate-500"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

// Lightweight gate for manager-only pages
export function ManagerOnly({ children }: { children: ReactNode }) {
  const user = useAuth();
  if (!user) return null;
  if (user.role !== "manager") {
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-3">
        <h1 className="text-xl font-extrabold tracking-tight">Restricted</h1>
        <p className="text-sm text-muted-foreground">
          This area is for store managers. Ask a manager to sign in.
        </p>
        <Link
          to="/pos"
          className="inline-block bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-bold"
        >
          Back to Terminal
        </Link>
      </div>
    );
  }
  return <>{children}</>;
}
