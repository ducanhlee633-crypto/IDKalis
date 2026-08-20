"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";

export default function AuthGuard({ children }) {
  const { session, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (loading) return;
    if (!session && !isLoginPage) router.replace("/login");
    else if (session && isLoginPage) router.replace("/");
  }, [session, loading, isLoginPage, router]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#09090b]">
        <div className="text-xs text-zinc-500 animate-pulse">Loading...</div>
      </div>
    );
  }

  if ((!session && !isLoginPage) || (session && isLoginPage)) return null;

  return children;
}