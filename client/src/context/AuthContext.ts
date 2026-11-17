// AuthContext.ts client/src/context/AuthContext.ts
// "Who is logged in?" for the whole website. Any component can ask:
//   const { user, login, logout } = useAuth();
// The values come from AuthProvider.tsx, which wraps the whole app in main.tsx.

// STEP 31 (part 1): The auth context

import { createContext, useContext } from "react";
import type { AuthResponse, User } from "../types/api";

// What the register form sends (server: authController.ts -> register)
export type RegisterData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
};

export type AuthContextValue = {
  user: User | null;
  checking: boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => void;
  setUser: (user: User) => void;
  startSession: (auth: AuthResponse) => User;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside <AuthProvider> (see main.tsx)");
  }
  return value;
};
