import { Outlet } from "react-router-dom";
import { AppShell } from "@/features/layout/components/app-shell";

export function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
