"use client";

import React, { useState } from "react";
import { Calendar, ChevronDown, Bell, Search } from "lucide-react";
import { USER_PROFILE } from "@/data/mockCalisthenicsData";

export default function Header() {
  const [dateRange, setDateRange] = useState("May 26 - Jun 1, 2026");
  const [isDateOpen, setIsDateOpen] = useState(false);

  const dateOptions = [
    "May 26 - Jun 1, 2026",
    "May 19 - May 25, 2026",
    "May 12 - May 18, 2026",
    "Full Month of May 2026",
  ];

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 px-1 mb-6 select-none">
      {/* Greeting info */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
          Welcome back, {USER_PROFILE.name.split(" ")[0]}!
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Here&apos;s what happening with your calisthenics journey today.
        </p>
      </div>

      {/* Date Range & Quick Actions */}
      <div className="flex items-center gap-3 self-start sm:self-auto">
        {/* Date Range Picker Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDateOpen(!isDateOpen)}
            className="flex items-center gap-2.5 bg-[#141418] hover:bg-[#1a1a20] border border-[#26262e] text-zinc-300 text-xs font-medium px-3.5 py-2 transition shadow-sm"
          >
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <span>{dateRange}</span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
          </button>

          {isDateOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-[#18181e] border border-[#2e2e3a] shadow-2xl py-1.5 z-40 text-xs">
              <div className="px-3 py-1 text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">
                Select Date Window
              </div>
              {dateOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    setDateRange(opt);
                    setIsDateOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 hover:bg-white/5 transition ${
                    dateRange === opt ? "text-cyan-400 font-semibold bg-white/[0.02]" : "text-zinc-400"
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
