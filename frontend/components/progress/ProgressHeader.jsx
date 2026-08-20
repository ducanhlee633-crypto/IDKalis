"use client";

import React, { useState } from "react";
import { Calendar, Check } from "lucide-react";

export default function ProgressHeader({ timeframe, setTimeframe }) {
  const [isOpen, setIsOpen] = useState(false);

  const options = [
    { label: "Last 7 Days", value: "7d" },
    { label: "Last 30 Days", value: "30d" },
    { label: "Last 90 Days", value: "90d" },
    { label: "This Year", value: "year" },
    { label: "All Time", value: "all" },
  ];

  const currentLabel = options.find((o) => o.value === timeframe)?.label || "Last 30 Days";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
          Performance Analytics
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Track, analyze and optimize your calisthenics journey.
        </p>
      </div>

      {/* Date Range Selector Dropdown */}
      <div className="relative self-start sm:self-auto">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 px-3.5 py-2 btn-ghost text-xs font-medium"
        >
          <span>{currentLabel}</span>
          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-44 bg-(--surface) border border-(--line-strong) z-50 py-1.5 backdrop-blur-xl animate-fade-in">
              {options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setTimeframe(opt.value);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-left text-zinc-300 hover:text-white hover:bg-white/[0.06] transition"
                >
                  <span>{opt.label}</span>
                  {timeframe === opt.value && (
                    <Check className="w-3.5 h-3.5 text-(--accent)" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
