import { fmt } from "@/store/pos-data";
import { type StaffMember } from "@/store/pos-store";

interface StaffCardProps {
  member: StaffMember;
  onView: (member: StaffMember) => void;
  onEdit: (member: StaffMember) => void;
}

export function StaffCard({ member: s, onView, onEdit }: StaffCardProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-muted text-foreground grid place-items-center text-sm font-bold">
            {s.initials}
          </div>
          <span
            className={
              "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card " +
              (s.isActive ? "bg-success" : "bg-muted-foreground/40")
            }
          />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold truncate">{s.fullName}</p>
          <p className="text-[11px] text-muted-foreground capitalize">{s.role}</p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Account Status
          </p>
          <p className="text-sm font-bold mt-0.5">{s.isActive ? "Active" : "Disabled"}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Username
          </p>
          <p className="text-sm font-bold mt-0.5">{s.username}</p>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-border flex gap-2">
        <button
          type="button"
          onClick={() => onView(s)}
          className="flex-1 text-xs font-bold py-2 rounded-lg bg-muted hover:bg-secondary transition-colors"
        >
          View
        </button>
        <button
          type="button"
          onClick={() => onEdit(s)}
          className="flex-1 text-xs font-bold py-2 rounded-lg bg-muted hover:bg-secondary transition-colors"
        >
          Edit
        </button>
      </div>
    </div>
  );
}
