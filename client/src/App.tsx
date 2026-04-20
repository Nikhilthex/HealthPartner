import { Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "./components/AppShell";
import { LoadingScreen } from "./components/LoadingScreen";
import { LoginPage } from "./features/auth/LoginPage";
import { useAuth } from "./state/auth-context";

const ProtectedApp = () => {
  const { user, bootstrapping } = useAuth();

  if (bootstrapping) {
    return <LoadingScreen message="Checking your session..." />;
  }

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  return <AppShell />;
};

const LoginRoute = () => {
  const { user, bootstrapping } = useAuth();

  if (bootstrapping) {
    return <LoadingScreen message="Preparing Health Partner..." />;
  }

  if (user) {
    return <Navigate replace to="/app/medicines" />;
  }

  return <LoginPage />;
};

export const App = () => (
  <Routes>
    <Route path="/login" element={<LoginRoute />} />
    <Route path="/app/*" element={<ProtectedApp />} />
    <Route path="*" element={<Navigate replace to="/app/medicines" />} />
  </Routes>
);
