import { useState, useEffect } from "react";
import { X, Banknote, Smartphone, CreditCard, Wallet, Printer, Check, ShieldCheck, User, Phone } from "lucide-react";
import { cartStore, cartCount, cartTotal, useCart } from "@/store/cart-store";
import { fmt } from "@/store/pos-data";
import { CartLines } from "./cart-lines";
import { useAuth } from "@/store/auth-store";
import {
  recordTransaction,
  upsertCustomerFromSale,
  useStaff,
} from "@/store/pos-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Method = "cash" | "momo" | "card" | "credit";

const methods: { id: Method; label: string; sub: string; Icon: typeof Banknote }[] = [
  { id: "cash", label: "Cash", sub: "Hand to till", Icon: Banknote },
  { id: "momo", label: "Mobile Money", sub: "M-Pesa, MoMo", Icon: Smartphone },
  { id: "card", label: "Card", sub: "Visa, Master", Icon: CreditCard },
  { id: "credit", label: "Credit", sub: "Trusted customer", Icon: Wallet },
];

export function CheckoutSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const cart = useCart();
  const user = useAuth();
  const staff = useStaff();
  const [method, setMethod] = useState<Method>("cash");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pinRequired, setPinRequired] = useState(false);
  const [pin, setPin] = useState("");
  const [receipt, setReceipt] = useState<{ id: string; customer: string } | null>(
    null,
  );
  const total = cartTotal(cart);

  useEffect(() => {
    if (open) {
      setDone(false);
      setPinRequired(false);
      setPin("");
    }
  }, [open]);

  if (!open) return null;

  const reset = () => {
    if (loading) return;
    setDone(false);
    setReceipt(null);
    setCustomerName("");
    setCustomerPhone("");
    setMethod("cash");
    onClose();
  };

  const handleCharge = () => {
    if (method === "credit" && !pinRequired) {
      setPinRequired(true);
      return;
    }
    charge();
  };

  const charge = () => {
    if (!user) return;
    
    if (pinRequired) {
      const manager = staff.find(s => s.role === "manager" && s.pin === pin);
      if (!manager) {
        toast.error("Invalid Manager PIN", {
          description: "Manager approval is required for credit transactions."
        });
        return;
      }
    }

    setLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      const name = customerName.trim() || "Walk-in customer";
      const phone = customerPhone.trim();
      const customer =
        phone.length > 0 || customerName.trim().length > 0
          ? upsertCustomerFromSale(name, phone, total)
          : undefined;
          
      const tx = recordTransaction({
        staffId: user.id,
        staffName: user.name,
        items: cartCount(cart),
        total,
        method:
          method === "cash"
            ? "Cash"
            : method === "momo"
              ? "Mobile Money"
              : method === "card"
                ? "Card"
                : "Credit",
        customerId: customer?.id,
        customerName: customer?.name,
        productIds: cart.flatMap((l) => Array(l.qty).fill(l.product.id)),
      });

      setReceipt({ id: tx.id, customer: customer?.name ?? "Walk-in customer" });
      setDone(true);
      setLoading(false);
      toast.success("Transaction Complete");
      setTimeout(() => cartStore.clear(), 200);
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300"
      onClick={reset}
    >
      <div
        className="bg-white w-full sm:max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        {done && receipt ? (
          <ReceiptView
            total={total}
            method={method}
            txId={receipt.id}
            customer={receipt.customer}
            onClose={reset}
          />
        ) : (
          <div className="flex flex-col h-full max-h-[90vh]">
            {/* Header */}
            <div className="px-8 pt-8 pb-4 flex justify-between items-center border-b border-slate-100">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900">
                  {pinRequired ? "Manager Approval" : "Complete Payment"}
                </h2>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                  Terminal 01 · {user?.name}
                </p>
              </div>
              <button
                type="button"
                onClick={reset}
                className="w-12 h-12 grid place-items-center rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              {pinRequired ? (
                <div className="space-y-6 animate-in zoom-in-95 duration-300">
                  <div className="w-20 h-20 rounded-3xl bg-amber-50 text-amber-500 grid place-items-center mx-auto shadow-xl shadow-amber-500/10">
                    <ShieldCheck className="w-10 h-10" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-black text-slate-900">Security Check</h3>
                    <p className="text-sm text-slate-500 mt-1">Manager PIN required for <span className="text-slate-900 font-bold">Credit</span> payment.</p>
                  </div>
                  <div className="flex justify-center gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-xl font-black transition-all",
                          pin.length >= i ? "border-primary bg-primary/5 text-primary scale-110" : "border-slate-200 bg-slate-50 text-slate-300"
                        )}
                      >
                        {pin.length >= i ? "●" : ""}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-3 max-w-[300px] mx-auto">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, "C", 0, "OK"].map((n) => (
                      <button
                        key={n}
                        onClick={() => {
                          if (n === "C") setPin("");
                          else if (n === "OK") { if (pin.length === 4) charge(); }
                          else if (pin.length < 4) setPin(p => p + n);
                        }}
                        className={cn(
                          "h-14 rounded-2xl font-black text-lg transition-all active:scale-90",
                          n === "OK" ? "bg-primary text-white col-span-1 shadow-lg shadow-primary/20" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => setPinRequired(false)}
                    className="w-full text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Go back to payment methods
                  </button>
                </div>
              ) : (
                <>
                  {/* Cart Summary */}
                  <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Order Summary</p>
                      <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{cartCount(cart)} Items</p>
                    </div>
                    <CartLines />
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Customer Details</p>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="relative group">
                        <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Walk-in customer"
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all"
                        />
                      </div>
                      <div className="relative group">
                        <Phone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="Phone number (optional)"
                          inputMode="tel"
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Payment Method</p>
                    <div className="grid grid-cols-2 gap-3">
                      {methods.map((m) => {
                        const active = m.id === method;
                        return (
                          <button
                            type="button"
                            key={m.id}
                            onClick={() => setMethod(m.id)}
                            className={cn(
                              "p-4 rounded-3xl border-2 text-left transition-all duration-300 relative overflow-hidden group",
                              active
                                ? "border-primary bg-primary/5 shadow-lg shadow-primary/5"
                                : "border-slate-100 bg-white hover:border-slate-200"
                            )}
                          >
                            <div className={cn(
                              "w-10 h-10 rounded-xl grid place-items-center mb-3 transition-colors",
                              active ? "bg-primary text-white" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                            )}>
                              <m.Icon className="w-5 h-5" />
                            </div>
                            <p className="text-sm font-black text-slate-900">{m.label}</p>
                            <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
                              {m.sub}
                            </p>
                            {active && (
                              <div className="absolute top-3 right-3 w-5 h-5 bg-primary rounded-full grid place-items-center animate-in zoom-in">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            {!pinRequired && (
              <div className="p-8 bg-slate-50 border-t border-slate-100">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Payable</p>
                    <p className="text-4xl font-black text-slate-900 font-mono leading-none">
                      {fmt(total)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-1">Tax Included</p>
                    <p className="text-xs font-bold text-slate-400">VAT 18%: {fmt(total * 0.18)}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCharge}
                  disabled={cart.length === 0 || loading}
                  className={cn(
                    "w-full py-5 rounded-[1.5rem] font-black text-base shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3",
                    loading 
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                      : "bg-primary text-white shadow-primary/30 hover:shadow-primary/40"
                  )}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {method === "credit" ? <ShieldCheck className="w-5 h-5" /> : <Banknote className="w-5 h-5" />}
                      Complete Transaction
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ReceiptView({
  total,
  method,
  txId,
  customer,
  onClose,
}: {
  total: number;
  method: Method;
  txId: string;
  customer: string;
  onClose: () => void;
}) {
  return (
    <div className="p-10 text-center animate-in zoom-in-95 duration-500">
      <div className="w-24 h-24 rounded-[2rem] bg-emerald-50 text-emerald-500 grid place-items-center mx-auto mb-6 shadow-xl shadow-emerald-500/10">
        <Check className="w-12 h-12" strokeWidth={4} />
      </div>
      <h2 className="text-3xl font-black tracking-tight text-slate-900">Payment Success</h2>
      <p className="text-sm font-bold text-slate-500 mt-2 uppercase tracking-widest">
        Transaction {txId}
      </p>

      <div className="mt-10 bg-slate-50 rounded-[2rem] p-8 text-left border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-2xl" />
        
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Store</p>
            <p className="text-xs font-black text-slate-900">Kigali Mini Mart · Serv OS</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Date</p>
            <p className="text-xs font-bold text-slate-900">{new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="space-y-4 pt-6 border-t border-dashed border-slate-200">
          <div className="flex justify-between text-sm">
            <span className="font-bold text-slate-500">Customer</span>
            <span className="font-black text-slate-900">{customer}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-bold text-slate-500">Payment Method</span>
            <span className="font-black text-slate-900 uppercase tracking-widest text-xs bg-slate-200 px-2 py-1 rounded-md">{method}</span>
          </div>
          <div className="flex justify-between items-end pt-4 border-t border-slate-200">
            <span className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Total Amount Paid</span>
            <span className="font-black text-3xl text-primary font-mono leading-none">{fmt(total)}</span>
          </div>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          className="bg-white border-2 border-slate-100 py-5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-slate-50 hover:border-slate-200 transition-all active:scale-[0.98]"
        >
          <Printer className="w-5 h-5" /> Print Receipt
        </button>
        <button
          type="button"
          onClick={onClose}
          className="bg-slate-900 text-white py-5 rounded-2xl font-black text-sm shadow-xl shadow-slate-900/20 active:scale-[0.98] transition-all"
        >
          New Transaction
        </button>
      </div>
    </div>
  );
}
