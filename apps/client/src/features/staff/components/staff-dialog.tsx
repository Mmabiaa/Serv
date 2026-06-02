import { X, Trash2 } from "lucide-react";
import { addStaff, deleteStaff, updateStaff, type StaffMember } from "@/store/pos-store";

interface StaffDialogProps {
  dialog: { type: "edit"; member: StaffMember } | { type: "create" };
  onClose: () => void;
}

export function StaffDialog({ dialog, onClose }: StaffDialogProps) {
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
            className="w-9 h-9 grid place-items-center rounded-full hover:bg-muted text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const fullName = fd.get("name") as string;
            const username = fd.get("username") as string;
            const email = fd.get("email") as string;
            const role = fd.get("role") as "manager" | "cashier";
            const staff_pin = fd.get("pin") as string;

            if (dialog.type === "create") {
              addStaff({ full_name: fullName, username, email, role, staff_pin });
            } else {
              updateStaff({ ...dialog.member, fullName, role });
            }
            onClose();
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
              Full Name
            </label>
            <input
              name="name"
              defaultValue={dialog.type === "edit" ? dialog.member.fullName : ""}
              className="w-full bg-background border border-border rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
              Username
            </label>
            <input
              name="username"
              defaultValue={dialog.type === "edit" ? dialog.member.username : ""}
              className="w-full bg-background border border-border rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10"
              required
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
              className="w-full bg-background border border-border rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
              Role
            </label>
            <select
              name="role"
              defaultValue={dialog.type === "edit" ? dialog.member.role : "cashier"}
              className="w-full bg-background border border-border rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10"
            >
              <option value="cashier">Cashier</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          {dialog.type === "create" && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                Terminal PIN (4-digits)
              </label>
              <input
                name="pin"
                maxLength={4}
                className="w-full bg-background border border-border rounded-xl px-3 py-3 text-sm font-mono focus:outline-none focus:ring-4 focus:ring-primary/10"
                required
              />
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 mt-2"
          >
            {dialog.type === "create" ? "Add member" : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
