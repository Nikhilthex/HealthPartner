import type { PropsWithChildren } from "react";
import { createContext, startTransition, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ApiError, authApi } from "../lib/api";
import type { ApiUser } from "../lib/api";

type AuthContextValue = {
  user: ApiUser | null;
  bootstrapping: boolean;
  loginPending: boolean;
  logoutPending: boolean;
  errorMessage: string | null;
  login: (values: { username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<ApiUser | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [loginPending, setLoginPending] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    authApi
      .me()
      .then((currentUser) => {
        if (!active) {
          return;
        }
        setUser(currentUser);
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        if (!(error instanceof ApiError) || error.status !== 401) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to restore your session.");
        }
      })
      .finally(() => {
        if (active) {
          setBootstrapping(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const login = async (values: { username: string; password: string }) => {
    setLoginPending(true);
    setErrorMessage(null);

    try {
      const nextUser = await authApi.login(values);
      setUser(nextUser);
      startTransition(() => {
        navigate("/app/medicines", { replace: true });
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to login.");
    } finally {
      setLoginPending(false);
    }
  };

  const logout = async () => {
    setLogoutPending(true);
    setErrorMessage(null);

    try {
      await authApi.logout();
      setUser(null);
      startTransition(() => {
        navigate("/login", { replace: true });
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to logout.");
    } finally {
      setLogoutPending(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        bootstrapping,
        loginPending,
        logoutPending,
        errorMessage,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return value;
};
