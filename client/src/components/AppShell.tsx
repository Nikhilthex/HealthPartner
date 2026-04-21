import { NavLink, Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "../state/auth-context";
import { ReminderPopup } from "./ReminderPopup";
import { AlertsPage } from "../features/alerts/AlertsPage";
import { MedicinesPage } from "../features/medicines/MedicinesPage";
import { ReportsPage } from "../features/reports/ReportsPage";

const navItems = [
  { to: "/app/medicines", label: "Add Medicine" },
  { to: "/app/alerts", label: "Customize Alerts" },
  { to: "/app/reports", label: "Analyze Reports" }
];

export const AppShell = () => {
  const { user, logout, logoutPending } = useAuth();

  return (
    <div className="shell">
      <aside className="shell__sidebar">
        <div className="stack-gap">
          <div>
            <p className="eyebrow">Health Partner</p>
            <h1>Welcome, {user?.username}</h1>
            <p className="muted">
              Manage medicines, customize reminder timing, and review report analysis in one workspace.
            </p>
          </div>
        </div>

        <nav className="shell__nav" aria-label="Primary">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? "shell__link shell__link--active" : "shell__link")}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button className="button button--ghost" type="button" onClick={() => void logout()} disabled={logoutPending}>
          {logoutPending ? "Signing out..." : "Logout"}
        </button>
      </aside>

      <main className="shell__content">
        <Routes>
          <Route path="medicines" element={<MedicinesPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="*" element={<Navigate replace to="/app/medicines" />} />
        </Routes>
      </main>

      <ReminderPopup onRefreshMedicines={() => undefined} />
    </div>
  );
};
