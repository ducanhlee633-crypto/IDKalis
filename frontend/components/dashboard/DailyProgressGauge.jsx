"use client";

import React from "react";
import { DAILY_PROGRESS } from "@/data/mockCalisthenicsData";

export default function DailyProgressGauge() {
  const percentage = DAILY_PROGRESS.percentage;
  const radius = 70;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative bg-(--surface) border border-(--line) p-5 square-frame flex flex-col justify-between items-center text-center h-full">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-4 h-px bg-(--accent)" />
          <h3 className="text-sm font-semibold text-zinc-100 tracking-tight">Daily progress</h3>
        </div>
      </div>

      {/* Circular Gauge */}
      <div className="relative flex items-center justify-center my-auto py-2">
        <svg className="w-44 h-44 -rotate-90 transform" viewBox="0 0 160 160">
          {/* Background Track */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="#1c1c24"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Progress Arc */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="#ff4d4d"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="butt"
            fill="transparent"
            style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
          />
        </svg>

        {/* Inner Centered Metrics */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-display text-3xl font-semibold text-zinc-50 tracking-tight tnum">
            {percentage}%
          </span>
          <span className="mt-1 px-2 py-0.5 bg-white/5 border border-(--line-strong) text-zinc-100 text-[10px] font-bold tracking-wider uppercase">
            {DAILY_PROGRESS.statusText}
          </span>
        </div>
      </div>

      {/* Footnote Stats */}
      <div className="w-full pt-3 border-t border-(--line) space-y-1">
        <div className="font-display text-xs font-semibold text-zinc-200 tnum">
          <span>{DAILY_PROGRESS.currentCalories}</span>
          <span className="text-(--faint) font-normal"> / {DAILY_PROGRESS.targetCalories} kcal</span>
        </div>
        <p className="text-[11px] text-(--muted) font-medium">
          {DAILY_PROGRESS.motivationalQuote}
        </p>
      </div>
    </div>
  );
}