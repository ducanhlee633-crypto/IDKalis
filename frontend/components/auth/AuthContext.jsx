"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  apiGetMe,
  apiLogin,
  apiRegister,
  clearSession,
  getStoredSession,
  storeSession,
} from "@/lib/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = getStoredSession();
      if (!stored || cancelled) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const user = await apiGetMe(stored.token);
        if (!cancelled) setSession({ token: stored.token, user });
      } catch {
        clearSession();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (identifier, password) => {
    const data = await apiLogin(identifier, password);
    storeSession(data.access_token, data.user);
    setSession({ token: data.access_token, user: data.user });
    return data.user;
  };

  const register = (payload) => apiRegister(payload);

  const logout = () => {
    clearSession();
    setSession(null);
  };

  const value = useMemo(
    () => ({ session, user: session?.user ?? null, loading, login, register, logout }),
    [session, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}