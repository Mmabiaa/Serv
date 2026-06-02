import { Link } from "react-router-dom";
import { useAuth } from "@/store/auth-store";

export function DashboardPage() {
  const user = useAuth();
  
  return (
    <div className="p-10 animate-in fade-in duration-500">
      <div className="max-w-2xl">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
          Staff Portal
        </p>
        <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900 leading-none">
          Hello, {user?.name}.
        </h1>
        <p className="text-slate-500 mt-4 text-lg">
          Ready to serve customers? Access the POS terminal below to start processing sales.
        </p>
        
        <div className="mt-12 grid gap-6">
          <Link
            to="/pos"
            className="group bg-primary text-white p-8 rounded-[2rem] shadow-xl shadow-primary/20 hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-between"
          >
            <div>
              <p className="text-2xl font-black">Open POS Terminal</p>
              <p className="text-primary-foreground/70 font-bold mt-1">Start your shift and process orders</p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/20 grid place-items-center text-3xl group-hover:rotate-12 transition-transform">
              🛒
            </div>
          </Link>
          
          <Link
            to="/settings"
            className="group bg-white border border-slate-100 p-8 rounded-[2rem] shadow-sm hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-between"
          >
            <div>
              <p className="text-xl font-black text-slate-900">Account Settings</p>
              <p className="text-slate-500 font-bold mt-1">Update your PIN and preferences</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-50 grid place-items-center text-xl group-hover:rotate-12 transition-transform">
              ⚙️
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
