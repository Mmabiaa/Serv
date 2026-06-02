import { X, Trash2 } from "lucide-react";
import { deleteStaff, type StaffMember } from "@/store/pos-store";

interface StaffViewProps {
  member: StaffMember;
  onClose: () => void;
}

export function StaffView({ member, onClose }: StaffViewProps) {
  return (
    <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold">Staff Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 grid place-items-center rounded-full hover:bg-muted text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-muted text-foreground grid place-items-center text-xl font-bold">
              {member.initials}
            </div>
            <div>
              <p className="text-base font-bold">{member.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
            </div>
          </div>
          <div className="bg-muted rounded-2xl p-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Staff ID
              </p>
              <p className="text-sm font-mono mt-0.5">{member.id}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Terminal PIN
              </p>
              <p className="text-sm font-mono mt-0.5">{member.pin}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (confirm("Delete this staff member?")) {
                deleteStaff(member.id);
                onClose();
              }
            }}
            className="w-full flex items-center justify-center gap-2 text-destructive py-3 text-xs font-bold"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete staff member
          </button>
        </div>
      </div>
    </div>
  );
}
