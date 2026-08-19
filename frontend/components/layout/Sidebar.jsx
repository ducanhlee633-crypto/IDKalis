"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Dumbbell,
  TrendingUp,
  Target,
  Moon,
  Heart,
  Crown,
  Settings,
  HelpCircle,
  ChevronsUpDown,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Library,
  Menu,
  X,
} from "lucide-react";
import { USER_PROFILE } from "@/data/mockCalisthenicsData";

const overviewLinks = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Workouts", href: "/workouts", icon: Dumbbell },
  { name: "Exercise Library", href: "/exercise-library", icon: Library },
  { name: "Progress", href: "/progress", icon: TrendingUp },
];

const trackingLinks = [
  { name: "Goals", href: "/goals", icon: Target },
  { name: "Sleep", href: "/sleep", icon: Moon },
  { name: "Heart Rate", href: "/heart-rate", icon: Heart },
];

function NavSection({ label, links, isActive, onNavigate }) {
  return (
    <div className="space-y-1">
      <p className="px-3 text-[10px] font-semibold text-zinc-500 tracking-wider uppercase mb-1.5">
        {label}
      </p>
      <nav className="space-y-0.5">
        {links.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2 text-xs font-medium transition-all ${
                active
                  ? "bg-[#1c1c22] text-zinc-100 border border-white/10 shadow-inner"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]"
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  active ? "text-cyan-400" : "text-zinc-500 group-hover:text-zinc-300"
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

function SidebarContent({ isActive, onUpgradeOpen, onCloseClick, onNavigate, closeButton = false }) {
  return (
    <>
      {/* Top Section: Brand & Navigation */}
      <div className="space-y-6">
        {/* Brand Logo & Close/Collapse */}
        <div className="flex items-center justify-between px-2 pt-1">
          <Link href="/" onClick={onNavigate} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-400 flex items-center justify-center text-black font-extrabold text-lg shadow-[0_0_12px_rgba(0,229,255,0.4)]">
              I
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-white tracking-widest uppercase font-mono">
                IDK
              </span>
              <span className="text-[9px] text-cyan-400 font-medium tracking-wider uppercase -mt-1">
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
        <NavSection label="Overview" links={overviewLinks} isActive={isActive} onNavigate={onNavigate} />

        {/* TRACKING Section */}
        <NavSection label="Tracking" links={trackingLinks} isActive={isActive} onNavigate={onNavigate} />
      </div>

      {/* Bottom Section: Pro Banner + Settings + Profile */}
      <div className="space-y-4 pt-4">
        {/* Unlock Pro Banner (Styled exactly like workout_ui.webp) */}
        <div className="relative bg-[#15151a] border border-[#26262e] p-4 square-frame">
          <div className="w-7 h-7 bg-[#1f1f26] border border-white/10 flex items-center justify-center mb-2.5 text-zinc-300">
            <Crown className="w-4 h-4 text-amber-400" />
          </div>
          <h4 className="text-xs font-semibold text-zinc-100 mb-1">Unlock your best you</h4>
          <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
            Upgrade to premium for personalized calisthenics skills, advanced analytics & more.
          </p>
          <button
            onClick={onUpgradeOpen}
            className="w-full bg-white hover:bg-zinc-200 text-black text-xs font-semibold py-2 px-3 transition shadow-md active:scale-95"
          >
            Upgrade now
          </button>
        </div>

        {/* Secondary Links: Settings & Help Center */}
        <div className="space-y-0.5">
          <button className="w-full flex items-center gap-3 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] transition">
            <Settings className="w-4 h-4 text-zinc-500" />
            <span>Settings</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] transition">
            <HelpCircle className="w-4 h-4 text-zinc-500" />
            <span>Help center</span>
          </button>
        </div>

        {/* User Profile Pill Footer */}
        <div className="flex items-center justify-between p-2 bg-[#141418] border border-white/5 hover:border-white/10 transition cursor-pointer">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 bg-gradient-to-tr from-cyan-400 to-indigo-400 flex items-center justify-center text-white font-bold text-xs ring-2 ring-white/10 shrink-0">
              ES
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-200 truncate">{USER_PROFILE.name}</p>
              <p className="text-[10px] text-zinc-500 truncate">{USER_PROFILE.email}</p>
            </div>
          </div>
          <ChevronsUpDown className="w-4 h-4 text-zinc-500 shrink-0" />
        </div>
      </div>
    </>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isActive = (href) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const closeMobile = () => setIsMobileOpen(false);

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-30 lg:hidden flex items-center justify-center w-9 h-9 bg-[#0d0d0f]/90 backdrop-blur border border-[#1e1e24] text-zinc-300 hover:text-white hover:border-zinc-600 transition"
        aria-label="Open navigation menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={closeMobile}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-[#0d0d0f] border-r border-[#1e1e24] flex flex-col justify-between overflow-y-auto select-none shrink-0 transition-transform duration-300 lg:hidden ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent
          isActive={isActive}
          onUpgradeOpen={() => setIsUpgradeModalOpen(true)}
          onCloseClick={closeMobile}
          onNavigate={closeMobile}
          closeButton
        />
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex ${
          isCollapsed
            ? "w-0 p-0 border-r-0 overflow-hidden"
            : "w-64 p-4"
        } min-h-screen bg-[#0d0d0f] border-r border-[#1e1e24] flex-col justify-between select-none shrink-0 transition-all duration-300`}
      >
        {!isCollapsed && (
          <SidebarContent
            isActive={isActive}
            onUpgradeOpen={() => setIsUpgradeModalOpen(true)}
            onCloseClick={() => setIsCollapsed(true)}
          />
        )}
      </aside>

      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="hidden lg:flex fixed top-4 left-4 z-50 items-center justify-center text-zinc-500 hover:text-zinc-300 p-1.5 hover:bg-white/5 transition"
          title="Expand sidebar"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>
      )}
    </>
  );
}