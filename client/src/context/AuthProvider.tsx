// AuthProvider.tsx client/src/context/AuthProvider.tsx
// Remembers who is logged in, and gives login / register / logout to the whole app (through AuthContext).
// The token is kept in localStorage, so a refresh (or closing the tab) doesn't log you out.

// STEP 31 (part 2): The auth provider

import { useEffect, useState, type ReactNode } from "react";
import type { AuthResponse, User } from "../types/api";
import { api, ApiError, TOKEN_KEY } from "../utils/api";
import { AuthContext, type RegisterData } from "./AuthContext";

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(
    () => localStorage.getItem(TOKEN_KEY) !== null,
  );

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      return;
    }

    api<{ user: User }>("/auth/me")
      .then(({ user: currentUser }) => {
        setUser(currentUser);
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 401) {
          localStorage.removeItem(TOKEN_KEY);
        }
      })
      .finally(() => {
        setChecking(false);
      });
  }, []);

  const startSession = ({ token, user: authenticatedUser }: AuthResponse) => {
    localStorage.setItem(TOKEN_KEY, token);
    setUser(authenticatedUser);
    return authenticatedUser;
  };

  const login = async (
    email: string,
    password: string,
    rememberMe: boolean,
  ) =>
    startSession(
      await api<AuthResponse>("/auth/login", {
        method: "POST",
        body: { email, password, rememberMe },
      }),
    );

  const register = async (data: RegisterData) =>
    startSession(
      await api<AuthResponse>("/auth/register", {
        method: "POST",
        body: data,
      }),
    );

  const logout = () => {
    void api("/auth/logout", { method: "POST" }).catch(() => {});
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        checking,
        login,
        register,
        logout,
        setUser,
        startSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
