import { useState } from "react";
import { X, Trash2, Loader2 } from "lucide-react";
import { addStaff, deleteStaff, updateStaff, type StaffMember } from "@/store/pos-store";
import { toast } from "sonner";

interface StaffDialogProps {
  dialog: { type: "edit"; member: StaffMember } | { type: "create" };
  onClose: () => void;
}

export function StaffDialog({ dialog, onClose }: StaffDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const fullName = fd.get("name") as string;
    const username = fd.get("username") as string;
    const email = fd.get("email") as string;
    const role = fd.get("role") as "manager" | "cashier";
    const staff_pin = fd.get("pin") as string;

    try {
      if (dialog.type === "create") {
        await addStaff({ full_name: fullName, username, email, role, staff_pin });
        toast.success("Staff member created successfully");
      } else {
        await updateStaff({ ...dialog.member, fullName, role });
        toast.success("Staff member updated successfully");
      }
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to save staff member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold">
            {dialog.type === "create" ? "Add Staff Member" : "Staff Details"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-9 h-9 grid place-items-center rounded-full hover:bg-muted text-muted-foreground disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
              Full Name
            </label>
            <input
              name="name"
              defaultValue={dialog.type === "edit" ? dialog.member.fullName : ""}
              className="w-full bg-background border border-border rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:opacity-50"
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
              Username
            </label>
            <input
              name="username"
              defaultValue={dialog.type === "edit" ? dialog.member.username : ""}
              className="w-full bg-background border border-border rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:opacity-50"
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
              Email Address
            </label>
            <input
              name="email"
              type="email"
              defaultValue={dialog.type === "edit" ? (dialog.member as any).email : ""}
              className="w-full bg-background border border-border rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:opacity-50"
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
              Role
            </label>
            <select
              name="role"
              defaultValue={dialog.type === "edit" ? dialog.member.role : "cashier"}
              className="w-full bg-background border border-border rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:opacity-50"
              disabled={loading}
            >
              <option value="cashier">Cashier</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          {dialog.type === "create" && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                Terminal PIN (4 or 6 digits)
              </label>
              <input
                name="pin"
                maxLength={6}
                className="w-full bg-background border border-border rounded-xl px-3 py-3 text-sm font-mono focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:opacity-50"
                required
                disabled={loading}
              />
            </div>
          )}

          <div className="pt-4 flex flex-col gap-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {dialog.type === "create" ? "Create Staff Member" : "Update Details"}
            </button>
            {dialog.type === "edit" && (
              <button
                type="button"
                disabled={loading}
                onClick={async () => {
                  if (confirm("Deactivate this staff member?")) {
                    setLoading(true);
                    try {
                      await deleteStaff(dialog.member.id);
                      toast.success("Staff member deactivated");
                      onClose();
                    } catch (err: any) {
                      toast.error(err.message || "Failed to deactivate");
                    } finally {
                      setLoading(false);
                    }
                  }
                }}
                className="w-full bg-rose-50 text-rose-600 py-4 rounded-xl font-bold text-sm hover:bg-rose-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" /> Deactivate Staff
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
