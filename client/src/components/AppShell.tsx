import { NavLink, Route, Routes } from "react-router-dom";

import { PlaceholderTab } from "./PlaceholderTab";
import { useAuth } from "../state/auth-context";

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
        <div>
          <p className="eyebrow">Health Partner</p>
          <h1>Welcome, {user?.username}</h1>
          <p className="muted">Your account is signed in and ready for the next feature slices.</p>
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
          <Route
            path="medicines"
            element={
              <PlaceholderTab
                title="Add Medicine"
                description="Medicine management will live here. The login flow is now ready for the rest of the authenticated app."
              />
            }
          />
          <Route
            path="alerts"
            element={
              <PlaceholderTab
                title="Customize Alerts"
                description="Alert customization will plug into the authenticated shell next."
              />
            }
          />
          <Route
            path="reports"
            element={
              <PlaceholderTab
                title="Analyze Reports"
                description="Report upload and AI analysis will be added on top of this protected app frame."
              />
            }
          />
        </Routes>
      </main>
    </div>
  );
};
