"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/services/api";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, passwordConfirmation: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
  });

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const raw = localStorage.getItem("auth_user");
    if (token && raw) {
      try {
        const user = JSON.parse(raw) as User;
        setState({ user, token, loading: false });
      } catch {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        setState({ user: null, token: null, loading: false });
      }
    } else {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  const persist = useCallback((token: string, user: User) => {
    localStorage.setItem("auth_token", token);
    localStorage.setItem("auth_user", JSON.stringify(user));
    setState({ user, token, loading: false });
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const { token, user } = await authApi.login(email, password);
      persist(token, user);
      router.push("/");
    },
    [persist, router],
  );

  const signup = useCallback(
    async (email: string, password: string, passwordConfirmation: string) => {
      const { token, user } = await authApi.signup(email, password, passwordConfirmation);
      persist(token, user);
      router.push("/");
    },
    [persist, router],
  );

  const logout = useCallback(() => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setState({ user: null, token: null, loading: false });
    router.push("/login");
  }, [router]);

  const value = useMemo(
    () => ({ ...state, login, signup, logout }),
    [state, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
