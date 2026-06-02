export function BrandingSection() {
  return (
    <div className="hidden lg:flex flex-col justify-between p-16 bg-slate-900 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full -mr-[300px] -mt-[300px] blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full -ml-[200px] -mb-[200px] blur-[100px]" />

      <div className="flex items-center gap-4 relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-primary text-white grid place-items-center font-black text-2xl shadow-2xl shadow-primary/20 rotate-3">
          S
        </div>
        <div className="leading-none">
          <p className="text-xl font-black tracking-tighter">Serv</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
            Commerce Operating System
          </p>
        </div>
      </div>

      <div className="relative z-10">
        <h2 className="text-5xl font-black tracking-tight leading-[1.1] text-balance">
          The power of <span className="text-primary">Enterprise Commerce</span> in your pocket.
        </h2>
        <p className="text-lg text-slate-400 mt-8 max-w-md font-medium leading-relaxed">
          Manage inventory, process transactions, and track team performance with Kigali's most
          advanced POS platform.
        </p>

        <div className="mt-12 flex items-center gap-6">
          <div className="flex -space-x-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 grid place-items-center text-[10px] font-bold"
              >
                {String.fromCharCode(64 + i)}M
              </div>
            ))}
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Trusted by 500+ Local Businesses
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between relative z-10">
        <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black">
          System Version 2.4.0-Enterprise
        </p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] text-emerald-500 uppercase tracking-[0.2em] font-black">
            All Systems Online
          </span>
        </div>
      </div>
    </div>
  );
}
