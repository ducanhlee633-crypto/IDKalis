"use client";

import React, { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { USER_PROFILE } from "@/data/mockCalisthenicsData";
import { useAuth } from "@/components/auth/AuthContext";

export default function Header() {
  const { user } = useAuth();
  const displayName = user?.username || USER_PROFILE.name;
  const [dateRange, setDateRange] = useState("May 26 - Jun 1, 2026");
  const [isDateOpen, setIsDateOpen] = useState(false);

  const dateOptions = [
    "May 26 - Jun 1, 2026",
    "May 19 - May 25, 2026",
    "May 12 - May 18, 2026",
    "Full Month of May 2026",
  ];

  return (
    <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 py-2 px-1 mb-6 select-none">
      {/* Greeting info */}
      <div>
        <div className="flex items-center gap-2.5 mb-1.5">
          <span className="led led-live" />
          <p className="text-[10px] font-semibold text-(--faint) tracking-[0.22em] uppercase">
            Session log
          </p>
        </div>
        <h1 className="font-display text-[26px] font-semibold text-zinc-50 tracking-tight leading-tight">
          Welcome back, {displayName.split(/[\s_]+/)[0]}
        </h1>
        <p className="text-xs text-(--muted) mt-1">
          Here&apos;s what&apos;s happening in your calisthenics journey today.
        </p>
      </div>

      {/* Date Range Readout */}
      <div className="flex items-center gap-3 self-start sm:self-auto">
        <div className="relative">
          <button
            onClick={() => setIsDateOpen(!isDateOpen)}
            className="btn-ghost flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium"
          >
            <Calendar className="w-3.5 h-3.5 text-(--faint)" />
            <span className="text-zinc-300">{dateRange}</span>
            <ChevronDown className="w-3.5 h-3.5 text-(--faint)" />
          </button>

          {isDateOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-(--surface) border border-(--line-strong) py-1.5 z-40 text-xs">
              <div className="px-3 py-1 text-[10px] uppercase font-semibold text-(--faint) tracking-[0.18em]">
                Select date window
              </div>
              {dateOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    setDateRange(opt);
                    setIsDateOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 hover:bg-white/5 transition ${
                    dateRange === opt
                      ? "text-(--accent) font-semibold bg-(--accent-soft)"
                      : "text-(--muted)"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}