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
    <div className="relative bg-(--surface) border border-(--line) p-5 square-frame flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-px bg-(--accent)" />
            <h3 className="text-sm font-semibold text-zinc-100 tracking-tight">Muscle focus</h3>
          </div>
          <p className="text-[10px] text-(--faint) mt-0.5 tracking-wide">Calisthenics skills breakdown</p>
        </div>

        {/* Dropdown Time Range */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="btn-ghost flex items-center gap-1.5 text-xs px-2.5 py-1"
          >
            <span>{timeRange}</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-32 bg-(--surface) border border-(--line-strong) py-1 z-30 text-xs">
              {["THIS WEEK", "LAST WEEK", "THIS MONTH"].map((range) => (
                <button
                  key={range}
                  onClick={() => {
                    setTimeRange(range);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-white/5 transition ${
                    timeRange === range ? "text-(--accent) font-medium" : "text-(--muted)"
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
          className="md:col-span-7 flex items-center justify-center border border-(--line) relative overflow-hidden min-h-[290px]"
          style={{
            background:
              "radial-gradient(130% 90% at 50% 22%, rgba(14,165,255,0.09), transparent 62%), radial-gradient(90% 70% at 50% 95%, rgba(14,165,255,0.04), transparent 60%), rgba(10,10,13,0.6)",
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
                className={`group cursor-pointer px-2.5 py-1.5 border-l-2 transition-all duration-150 ${
                  isActive
                    ? "border-[#0ea5e9] bg-[rgba(14,165,255,0.08)]"
                    : "border-transparent hover:bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        isActive
                          ? "bg-[#0ea5e9] shadow-[0_0_8px_rgba(14,165,255,0.9)]"
                          : "bg-(--faint) group-hover:bg-(--muted)"
                      }`}
                    />
                    <span
                      className={`text-[11px] font-bold tracking-widest transition ${
                        isActive ? "text-[#0ea5e9]" : "text-(--muted) group-hover:text-zinc-200"
                      }`}
                    >
                      {item.name}
                    </span>
                    <span
                      className={`hidden xl:inline text-[8.5px] uppercase tracking-wider px-1 py-px border transition ${
                        isActive
                          ? "border-[rgba(14,165,255,0.28)] text-[#0ea5e9]/80"
                          : "border-(--line) text-(--faint)"
                      }`}
                    >
                      {item.skillsCategory}
                    </span>
                  </div>

                  <span
                    className={`font-display text-[11px] tnum transition ${
                      isActive ? "text-[#0ea5e9] font-bold" : "text-(--faint) group-hover:text-(--muted)"
                    }`}
                  >
                    {item.percentage}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-[3px] bg-(--surface-3) mt-1.5">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isActive ? "bg-[#0ea5e9] shadow-[0_0_6px_rgba(14,165,255,0.5)]" : "bg-zinc-700 group-hover:bg-zinc-500"
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
                        className="text-[8.5px] px-1.5 py-0.5 bg-(--surface-3) border border-(--line) text-(--muted)"
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
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-(--line) text-[10px]">
        <span className="uppercase tracking-[0.18em] text-(--faint)">Total focus · 100%</span>
        <span className="flex items-center gap-1.5 text-[#0ea5e9]">
          <Flame className="w-3 h-3" />
          <span className="uppercase tracking-wider">
            Top: {topMuscle.name} · {topMuscle.percentage}%
          </span>
        </span>
      </div>
    </div>
  );
}