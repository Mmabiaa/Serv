import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";

// Layouts
import { AppLayout } from "@/pages/AppLayout";

// Shared Pages
import { LoginPage } from "@/pages/LoginPage";
import { SettingsPage } from "@/pages/SettingsPage";

// Staff Pages
import { DashboardPage as StaffDashboard } from "@/pages/staff/DashboardPage";
import { PosTerminalPage } from "@/pages/staff/PosTerminalPage";
import { SalesHistoryPage } from "@/pages/staff/SalesHistoryPage";

// Manager Pages
import { DashboardPage as ManagerDashboard } from "@/pages/manager/DashboardPage";
import { InventoryPage } from "@/pages/manager/InventoryPage";
import { CustomersPage } from "@/pages/manager/CustomersPage";
import { ReportsPage } from "@/pages/manager/ReportsPage";
import { StaffPage } from "@/pages/manager/StaffPage";
import { MovementsPage } from "@/pages/manager/MovementsPage";
import { ActivityPage } from "@/pages/manager/ActivityPage";

import { useAuth } from "@/store/auth-store";

import "./styles.css";

const rootElement = document.getElementById("root")!;

function DashboardRouter() {
  const user = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return user.role === "manager" ? <ManagerDashboard /> : <StaffDashboard />;
}

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardRouter />} />
            <Route path="/pos" element={<PosTerminalPage />} />
            <Route path="/history" element={<SalesHistoryPage />} />
            
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/inventory/movements" element={<MovementsPage />} />
            
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/staff" element={<StaffPage />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <Toaster position="top-right" richColors closeButton />
      </BrowserRouter>
    </React.StrictMode>
  );
}
