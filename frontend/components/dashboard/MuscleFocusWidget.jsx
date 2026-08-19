"use client";

import React, { useMemo, useState } from "react";
import BodyModelViewer from "./BodyModelViewer";
import { MUSCLE_FOCUS_DATA } from "@/data/mockCalisthenicsData";
import { ChevronDown, Flame } from "lucide-react";

export default function MuscleFocusWidget() {
  const [selectedMuscle, setSelectedMuscle] = useState(null);
  const [hoveredMuscle, setHoveredMuscle] = useState(null);
  const [timeRange, setTimeRange] = useState("THIS WEEK");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const activeMuscleId = hoveredMuscle || selectedMuscle;
  const topMuscle = useMemo(
    () => MUSCLE_FOCUS_DATA.reduce((max, m) => (m.percentage > max.percentage ? m : max), MUSCLE_FOCUS_DATA[0]),
    [],
  );

  const handleSelectMuscle = (id) => {
    setSelectedMuscle(selectedMuscle === id ? null : id);
  };

  return (
    <div className="relative bg-[#121215] border border-[#222228] p-5 square-frame flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100 tracking-tight">Muscle focus</h3>
          <p className="text-[10px] text-zinc-500 mt-0.5 tracking-wide">Calisthenics skills breakdown</p>
        </div>

        {/* Dropdown Time Range */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 bg-[#1a1a1f] px-2.5 py-1 border border-white/5 transition"
          >
            <span>{timeRange}</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-32 bg-[#18181d] border border-[#2e2e38] shadow-2xl py-1 z-30 text-xs">
              {["THIS WEEK", "LAST WEEK", "THIS MONTH"].map((range) => (
                <button
                  key={range}
                  onClick={() => {
                    setTimeRange(range);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-white/5 transition ${
                    timeRange === range ? "text-cyan-300 font-medium" : "text-zinc-400"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 flex-1 min-h-0">
        {/* Left: Body Model Canvas */}
        <div
          className="md:col-span-7 flex items-center justify-center border border-white/5 relative overflow-hidden min-h-[290px]"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 28%, rgba(34,211,238,0.05), transparent 60%), rgba(10,10,13,0.6)",
          }}
        >
          <BodyModelViewer
            selectedMuscle={selectedMuscle}
            onSelectMuscle={handleSelectMuscle}
            hoveredMuscle={hoveredMuscle}
            onHoverMuscle={setHoveredMuscle}
          />
        </div>

        {/* Right: Muscle Percentage Breakdown */}
        <div className="md:col-span-5 flex flex-col justify-center space-y-1.5 px-0.5">
          {MUSCLE_FOCUS_DATA.map((item) => {
            const isActive = activeMuscleId === item.id;
            const isSelected = selectedMuscle === item.id;
            return (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredMuscle(item.id)}
                onMouseLeave={() => setHoveredMuscle(null)}
                onClick={() => handleSelectMuscle(item.id)}
                className={`group cursor-pointer px-2.5 py-1.5 rounded-sm border transition-all duration-150 ${
                  isActive
                    ? "border-cyan-400/40 bg-cyan-400/[0.06] shadow-[0_0_14px_rgba(34,211,238,0.12)]"
                    : "border-transparent hover:bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-1.5 h-1.5 shrink-0 rounded-full transition-all ${
                        isActive
                          ? "bg-[#22D3EE] scale-125 shadow-[0_0_8px_#22D3EE]"
                          : "bg-zinc-600 group-hover:bg-zinc-400"
                      }`}
                    />
                    <span
                      className={`text-[11px] font-bold tracking-widest transition ${
                        isActive ? "text-cyan-300" : "text-zinc-400 group-hover:text-zinc-200"
                      }`}
                    >
                      {item.name}
                    </span>
                    <span
                      className={`hidden xl:inline text-[8.5px] uppercase tracking-wider px-1 py-px border rounded-[2px] transition ${
                        isActive
                          ? "border-cyan-400/30 text-cyan-400/80 bg-cyan-400/5"
                          : "border-white/10 text-zinc-600"
                      }`}
                    >
                      {item.skillsCategory}
                    </span>
                  </div>

                  <span
                    className={`font-mono text-[11px] tabular-nums transition ${
                      isActive ? "text-cyan-300 font-bold" : "text-zinc-400 group-hover:text-zinc-300"
                    }`}
                  >
                    {item.percentage}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-[3px] bg-[#1e1e24] mt-1.5 overflow-hidden rounded-full">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-r from-cyan-400 to-emerald-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]"
                        : "bg-zinc-700 group-hover:bg-zinc-500"
                    }`}
                    style={{ width: `${item.percentage * 3.5}%` }}
                  />
                </div>

                {/* Exercises (chỉ hiện khi chọn) */}
                {isSelected && (
                  <div className="flex flex-wrap gap-1 mt-1.5 animate-fade-in">
                    {item.exercises.map((ex) => (
                      <span
                        key={ex}
                        className="text-[8.5px] px-1.5 py-0.5 bg-[#0c0c10] border border-white/10 text-zinc-400 rounded-[2px]"
                      >
                        {ex}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Summary */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/5 text-[10px]">
        <span className="uppercase tracking-widest text-zinc-500">Total focus · 100%</span>
        <span className="flex items-center gap-1.5 text-cyan-300/80">
          <Flame className="w-3 h-3" />
          <span className="uppercase tracking-wider">
            Top: {topMuscle.name} · {topMuscle.percentage}%
          </span>
        </span>
      </div>
    </div>
  );
}
