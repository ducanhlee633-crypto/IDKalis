"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { WEEKLY_ACTIVITY } from "@/data/mockCalisthenicsData";
import { ChevronDown } from "lucide-react";

// Custom Tooltip styled like the bracketed popup in workout_ui.webp
const CustomActivityTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="relative bg-[#18181d]/95 backdrop-blur-md border border-[#33333d] p-2.5 shadow-2xl square-frame min-w-[140px] text-xs">
        <p className="text-[11px] text-zinc-400 font-medium mb-1.5 pb-1 border-b border-white/5">
          {data.fullDay}
        </p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-3 text-zinc-300">
            <span className="flex items-center gap-1.5 text-[11px]">
              <span className="w-2 h-2 bg-[#f97316]" />
              Calories
            </span>
            <span className="font-mono font-semibold text-zinc-100">{data.calories} kcal</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-zinc-300">
            <span className="flex items-center gap-1.5 text-[11px]">
              <span className="w-2 h-2 bg-[#00e5ff]" />
              Time
            </span>
            <span className="font-mono font-semibold text-zinc-100">{data.time} min</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function WeeklyActivityChart() {
  const [timeFilter, setTimeFilter] = useState("THIS WEEK");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="relative bg-[#121215] border border-[#222228] p-5 square-frame flex flex-col justify-between h-full">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-zinc-100 tracking-tight">Weekly activity</h3>

        {/* Time range selector */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 bg-[#1a1a1f] px-2.5 py-1 border border-white/5 transition"
          >
            <span>{timeFilter}</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-32 bg-[#18181d] border border-[#2e2e38] shadow-2xl py-1 z-30 text-xs">
              {["THIS WEEK", "LAST WEEK", "PAST 30 DAYS"].map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    setTimeFilter(item);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-white/5 transition ${
                    timeFilter === item ? "text-cyan-400 font-medium" : "text-zinc-400"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recharts Bar Chart */}
      <div className="w-full h-[230px] -ml-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={WEEKLY_ACTIVITY} margin={{ top: 10, right: 10, left: -15, bottom: 0 }} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#71717a", fontSize: 11, fontWeight: 500 }}
              dy={8}
            />
            <YAxis
              domain={[0, 1000]}
              ticks={[0, 200, 400, 600, 800, 1000]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#52525b", fontSize: 11 }}
            />
            <Tooltip content={<CustomActivityTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
            {/* Dual Bars: Orange for Calories, Cyan for Workout Time */}
            <Bar dataKey="calories" fill="#ea580c" radius={[0, 0, 0, 0]} maxBarSize={14} />
            <Bar dataKey="time" fill="#00e5ff" radius={[0, 0, 0, 0]} maxBarSize={14} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend Footer */}
      <div className="flex items-center justify-center gap-6 pt-3 border-t border-white/[0.04] text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-[#ea580c]" />
          <span>Calories (kcal)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-[#00e5ff]" />
          <span>Workout time (min)</span>
        </div>
      </div>
    </div>
  );
}
