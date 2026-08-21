"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Dumbbell,
  History,
  Library,
  TrendingUp,
  Target,
  Settings,
  HelpCircle,
  LogOut,
  LogIn,
  X,
  Grid3x3,
  ChevronsUpDown,
} from "lucide-react";
import { USER_PROFILE } from "@/data/mockCalisthenicsData";
import { useAuth } from "@/components/auth/AuthContext";

const primaryLinks = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Workouts", href: "/workouts", icon: Dumbbell },
];

const moreLinks = [
  { name: "History", href: "/history", icon: History },
  { name: "Library", href: "/exercise-library", icon: Library, label: "Exercise Library" },
  { name: "Progress", href: "/progress", icon: TrendingUp },
  { name: "Goals", href: "/goals", icon: Target },
];

function BottomNavItem({ item, active, onClick }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex flex-col items-center justify-center gap-1 min-h-[56px] flex-1 px-2 py-1.5 transition-colors ${
        active ? "text-(--accent)" : "text-(--muted) hover:text-zinc-200"
      }`}
    >
      <span
        className={`flex items-center justify-center w-7 h-7 rounded-md transition-colors ${
          active ? "bg-(--accent-soft)" : ""
        }`}
      >
        <Icon className={`w-[22px] h-[22px] ${active ? "text-(--accent)" : "text-(--faint)"}`} />
      </span>
      <span className="text-[10px] font-medium leading-none tracking-wide">{item.name}</span>
      {active && <span className="w-1 h-1 bg-(--accent) rounded-full mt-0.5" />}
    </Link>
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  if (pathname === "/login") return null;

  const isActive = (href) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const moreActive = moreLinks.some((l) => isActive(l.href));

  // Close sheet on route change
  useEffect(() => {
    setIsMoreOpen(false);
    setIsAccountOpen(false);
  }, [pathname]);

  // Esc to close
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setIsMoreOpen(false);
    };
    if (isMoreOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMoreOpen]);

  // Lock body scroll when sheet open
  useEffect(() => {
    if (isMoreOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMoreOpen]);

  const initials = (user?.username || USER_PROFILE.name)
    .split(/[\s_]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  const displayName = user?.username || USER_PROFILE.name;
  const displayEmail = user ? "IDK account" : USER_PROFILE.email;

  const closeMore = () => setIsMoreOpen(false);

  return (
    <>
      {/* Backdrop */}
      {isMoreOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={closeMore}
          aria-hidden="true"
        />
      )}

      {/* Bottom Sheet */}
      <div
        className={`fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-50 lg:hidden transition-transform duration-300 ease-out ${
          isMoreOpen ? "translate-y-0" : "translate-y-[120%]"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="More navigation"
      >
        <div className="mx-3 mb-2 bg-(--surface) border border-(--line-strong) rounded-xl shadow-2xl overflow-hidden max-h-[65vh] flex flex-col">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2 shrink-0">
            <div className="w-9 h-1 bg-white/20 rounded-full" />
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto px-3 pb-3 space-y-4">
            {/* Main nav in sheet */}
            <div>
              <p className="text-[10px] font-semibold text-(--faint) tracking-[0.18em] uppercase px-2 mb-2 flex items-center gap-2">
                <span className="w-4 h-px bg-(--accent)" />
                Navigation
              </p>
              <div className="grid grid-cols-2 gap-2">
                {moreLinks.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={closeMore}
                      className={`flex items-center gap-3 px-3 py-3 min-h-[48px] border text-xs font-medium transition ${
                        active
                          ? "bg-(--accent-soft) border-(--accent-line) text-(--accent)"
                          : "bg-(--surface-3) border-(--line) text-zinc-300 hover:border-(--line-strong) hover:text-zinc-100"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? "text-(--accent)" : "text-(--faint)"}`} />
                      <span>{item.label || item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Settings / Help */}
            <div>
              <p className="text-[10px] font-semibold text-(--faint) tracking-[0.18em] uppercase px-2 mb-2 flex items-center gap-2">
                <span className="w-4 h-px bg-(--accent)" />
                Settings
              </p>
              <div className="space-y-1">
                <button
                  onClick={closeMore}
                  className="w-full flex items-center gap-3 px-3 py-3 min-h-[48px] text-xs text-(--muted) hover:text-zinc-200 hover:bg-white/[0.03] border border-transparent hover:border-(--line) transition text-left"
                >
                  <Settings className="w-4 h-4 text-(--faint)" />
                  <span>Settings</span>
                </button>
                <button
                  onClick={closeMore}
                  className="w-full flex items-center gap-3 px-3 py-3 min-h-[48px] text-xs text-(--muted) hover:text-zinc-200 hover:bg-white/[0.03] border border-transparent hover:border-(--line) transition text-left"
                >
                  <HelpCircle className="w-4 h-4 text-(--faint)" />
                  <span>Help center</span>
                </button>
              </div>
            </div>

            {/* Profile */}
            <div className="relative">
              <div
                className="flex items-center justify-between p-3 bg-(--surface-3) border border-(--line) hover:border-(--line-strong) transition cursor-pointer min-h-[60px]"
                onClick={() => setIsAccountOpen((v) => !v)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-(--surface-2) border border-(--line) flex items-center justify-center text-zinc-200 font-display font-bold text-xs">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-zinc-200 truncate">{displayName}</p>
                    <p className="text-[10px] text-(--faint) truncate">{displayEmail}</p>
                  </div>
                </div>
                <ChevronsUpDown className="w-4 h-4 text-(--faint) shrink-0" />
              </div>
              {isAccountOpen && (
                <div className="mt-2 bg-(--surface-3) border border-(--line-strong) py-1.5 animate-fade-in">
                  {!user ? (
                    <Link
                      href="/login"
                      onClick={closeMore}
                      className="w-full flex items-center gap-2.5 px-3.5 py-3 min-h-[44px] text-xs text-zinc-300 hover:bg-white/5 transition"
                    >
                      <LogIn className="w-4 h-4 text-(--accent)" />
                      <span>Log in / Sign up</span>
                    </Link>
                  ) : (
                    <button
                      onClick={() => {
                        logout();
                        closeMore();
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-3 min-h-[44px] text-xs text-(--accent) hover:bg-(--accent-soft) transition"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log out</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Close button */}
          <div className="p-3 pt-2 border-t border-(--line) shrink-0">
            <button
              onClick={closeMore}
              className="w-full flex items-center justify-center gap-2 py-3 min-h-[44px] bg-(--surface-3) border border-(--line) text-xs text-(--muted) hover:text-zinc-200 hover:border-(--line-strong) transition"
            >
              <X className="w-4 h-4" />
              <span>Close</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Nav Bar */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-(--surface-3)/95 backdrop-blur-xl border-t border-(--line) flex items-stretch justify-around safe-pb"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Primary navigation"
      >
        {primaryLinks.map((item) => (
          <BottomNavItem key={item.name} item={item} active={isActive(item.href)} onClick={closeMore} />
        ))}

        {/* More button */}
        <button
          onClick={() => setIsMoreOpen((v) => !v)}
          aria-expanded={isMoreOpen}
          aria-controls="more-sheet"
          aria-label="More navigation"
          className={`flex flex-col items-center justify-center gap-1 min-h-[56px] flex-1 px-2 py-1.5 transition-colors ${
            moreActive || isMoreOpen ? "text-(--accent)" : "text-(--muted) hover:text-zinc-200"
          }`}
        >
          <span
            className={`flex items-center justify-center w-7 h-7 rounded-md transition-colors ${
              moreActive || isMoreOpen ? "bg-(--accent-soft)" : ""
            }`}
          >
            {isMoreOpen ? (
              <X className={`w-[22px] h-[22px] ${moreActive || isMoreOpen ? "text-(--accent)" : "text-(--faint)"}`} />
            ) : (
              <Grid3x3 className={`w-[22px] h-[22px] ${moreActive ? "text-(--accent)" : "text-(--faint)"}`} />
            )}
          </span>
          <span className="text-[10px] font-medium leading-none tracking-wide">More</span>
          {(moreActive || isMoreOpen) && <span className="w-1 h-1 bg-(--accent) rounded-full mt-0.5" />}
        </button>
      </nav>
    </>
  );
}
