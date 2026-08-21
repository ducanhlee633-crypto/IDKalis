"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Dumbbell,
  TrendingUp,
  Target,
  Settings,
  HelpCircle,
  ChevronsUpDown,
  PanelLeftClose,
  PanelLeftOpen,
  Library,
  X,
  LogOut,
  LogIn,
  History,
} from "lucide-react";
import { USER_PROFILE } from "@/data/mockCalisthenicsData";
import { useAuth } from "@/components/auth/AuthContext";

const overviewLinks = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Workouts", href: "/workouts", icon: Dumbbell },
  { name: "History", href: "/history", icon: History },
  { name: "Exercise Library", href: "/exercise-library", icon: Library },
  { name: "Progress", href: "/progress", icon: TrendingUp },
];

const trackingLinks = [
  { name: "Goals", href: "/goals", icon: Target },
];

function NavSection({ label, links, isActive, onNavigate }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 px-3 mb-1.5">
        <span className="w-4 h-px bg-(--accent)" />
        <p className="text-[10px] font-semibold text-(--faint) tracking-[0.18em] uppercase">
          {label}
        </p>
      </div>
      <nav className="space-y-0.5">
        {links.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 pl-3 pr-3 py-2 text-xs font-medium border-l-2 transition-all ${
                active
                  ? "border-(--accent) text-zinc-100 bg-white/[0.03]"
                  : "border-transparent text-(--muted) hover:text-zinc-200 hover:bg-white/[0.03]"
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  active ? "text-(--accent)" : "text-(--faint)"
                }`}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function SidebarContent({ isActive, onCloseClick, onNavigate, closeButton = false, user, onLogout }) {
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const initials = (user?.username || USER_PROFILE.name)
    .split(/[\s_]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  const displayName = user?.username || USER_PROFILE.name;
  const displayEmail = user ? "IDK account" : USER_PROFILE.email;
  return (
    <>
      {/* Top Section: Brand & Navigation */}
      <div className="space-y-6">
        {/* Brand Logo & Close/Collapse */}
        <div className="flex items-center justify-between px-2 pt-1">
          <Link href="/" onClick={onNavigate} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-(--surface-2) border border-(--accent-line) flex items-center justify-center text-(--text) font-display font-bold text-lg group-hover:border-(--accent) transition">
              I
            </div>
            <div className="flex flex-col">
              <span className="text-base font-display font-bold text-white tracking-[0.22em] uppercase leading-none">
                IDK
              </span>
              <span className="text-[9px] text-(--faint) font-medium tracking-[0.18em] uppercase mt-0.5">
                Calisthenics
              </span>
            </div>
          </Link>

          {closeButton ? (
            <button
              onClick={onCloseClick}
              className="text-zinc-500 hover:text-zinc-300 p-1.5 hover:bg-white/5 transition"
              title="Close navigation"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onCloseClick}
              className="text-zinc-500 hover:text-zinc-300 p-1 hover:bg-white/5 transition"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* OVERVIEW Section */}
        <NavSection
          label="Overview"
          links={overviewLinks}
          isActive={isActive}
          onNavigate={() => {
            setIsAccountOpen(false);
            onNavigate?.();
          }}
        />

        {/* TRACKING Section */}
        <NavSection
          label="Tracking"
          links={trackingLinks}
          isActive={isActive}
          onNavigate={() => {
            setIsAccountOpen(false);
            onNavigate?.();
          }}
        />
      </div>

      {/* Bottom Section: Settings + Profile */}
      <div className="space-y-4 pt-4">
        {/* Secondary Links: Settings & Help Center */}
        <div className="space-y-0.5">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 min-h-[44px] text-xs text-(--muted) hover:text-zinc-200 hover:bg-white/[0.03] transition">
            <Settings className="w-4 h-4 text-(--faint)" />
            <span>Settings</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 min-h-[44px] text-xs text-(--muted) hover:text-zinc-200 hover:bg-white/[0.03] transition">
            <HelpCircle className="w-4 h-4 text-(--faint)" />
            <span>Help center</span>
          </button>
        </div>

        {/* User Profile Pill Footer */}
        <div className="relative">
          <div
            className="flex items-center justify-between p-2 bg-(--surface-3) border border-(--line) hover:border-(--line-strong) transition cursor-pointer"
            onClick={() => setIsAccountOpen((v) => !v)}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 bg-(--surface-2) border border-(--line) flex items-center justify-center text-zinc-200 font-display font-bold text-xs">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-zinc-200 truncate">{displayName}</p>
                <p className="text-[10px] text-(--faint) truncate">{displayEmail}</p>
              </div>
            </div>
            <ChevronsUpDown className="w-4 h-4 text-(--faint) shrink-0" />
          </div>

          {/* Account Dropdown */}
          {isAccountOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-(--surface) border border-(--line-strong) py-1.5 z-40 animate-fade-in">
              {!user ? (
                <Link
                  href="/login"
                  onClick={() => {
                    setIsAccountOpen(false);
                    onNavigate?.();
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-zinc-300 hover:bg-white/5 transition"
                >
                  <LogIn className="w-4 h-4 text-(--accent)" />
                  <span>Log in / Sign up</span>
                </Link>
              ) : (
                <button
                  onClick={() => {
                    setIsAccountOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-(--accent) hover:bg-(--accent-soft) transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log out</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (pathname === "/login") return null;

  const isActive = (href) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* Desktop Sidebar - hidden on mobile, replaced by BottomNav */}
      <aside
        className={`hidden lg:flex ${
          isCollapsed
            ? "w-0 p-0 border-r-0 overflow-hidden"
            : "w-64 p-4"
        } min-h-screen bg-(--surface-3) border-r border-(--line) flex-col justify-between select-none shrink-0 transition-all duration-300`}
      >
        {!isCollapsed && (
          <SidebarContent
            isActive={isActive}
            onCloseClick={() => setIsCollapsed(true)}
            user={user}
            onLogout={handleLogout}
          />
        )}
      </aside>

      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="hidden lg:flex fixed top-4 left-4 z-50 items-center justify-center text-zinc-500 hover:text-zinc-300 p-1.5 hover:bg-white/5 transition min-w-[44px] min-h-[44px]"
          title="Expand sidebar"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>
      )}
    </>
  );
}