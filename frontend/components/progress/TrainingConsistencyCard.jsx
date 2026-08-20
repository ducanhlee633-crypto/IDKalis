"use client";

import React, { useState } from "react";
import { Info, ChevronRight, X, CalendarCheck } from "lucide-react";

export default function TrainingConsistencyCard() {
  const [showInfo, setShowInfo] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [hoveredCell, setHoveredCell] = useState(null);

  // 4 Weeks x 7 Days Matrix matching image:
  // state: 'trained' (bright green) | 'rest' (dark with dot) | 'missed' (dark with X) | 'partial' (half green)
  const weeks = [
    // Week 1
    [
      { day: "MON", state: "trained", label: "Push & Planche Lean", date: "Jul 22" },
      { day: "TUE", state: "trained", label: "Pull & Front Lever", date: "Jul 23" },
      { day: "WED", state: "trained", label: "Handstand & Mobility", date: "Jul 24" },
      { day: "THU", state: "trained", label: "Upper Body Power", date: "Jul 25" },
      { day: "FRI", state: "trained", label: "L-Sit & Core Blast", date: "Jul 26" },
      { day: "SAT", state: "missed", label: "Missed Session", date: "Jul 27" },
      { day: "SUN", state: "missed", label: "Missed Session", date: "Jul 28" },
    ],
    // Week 2
    [
      { day: "MON", state: "trained", label: "Push Isometric Strength", date: "Jul 29" },
      { day: "TUE", state: "trained", label: "Back & Muscle-Up Prep", date: "Jul 30" },
      { day: "WED", state: "trained", label: "Handstand Conditioning", date: "Jul 31" },
      { day: "THU", state: "trained", label: "Full Body Calisthenics", date: "Aug 01" },
      { day: "FRI", state: "missed", label: "Missed Session", date: "Aug 02" },
      { day: "SAT", state: "trained", label: "Legs & Core", date: "Aug 03" },
      { day: "SUN", state: "rest", label: "Active Recovery", date: "Aug 04" },
    ],
    // Week 3
    [
      { day: "MON", state: "trained", label: "Heavy Planche Holds", date: "Aug 05" },
      { day: "TUE", state: "trained", label: "Front Lever Rows", date: "Aug 06" },
      { day: "WED", state: "trained", label: "Mobility & Ring Flow", date: "Aug 07" },
      { day: "THU", state: "trained", label: "Push Hypertrophy", date: "Aug 08" },
      { day: "FRI", state: "trained", label: "Dragon Flag & Abs", date: "Aug 09" },
      { day: "SAT", state: "rest", label: "Rest Day", date: "Aug 10" },
      { day: "SUN", state: "partial", label: "Light Mobility (30m)", date: "Aug 11" },
    ],
    // Week 4
    [
      { day: "MON", state: "missed", label: "Travel / Rest", date: "Aug 12" },
      { day: "TUE", state: "rest", label: "Rest Day", date: "Aug 13" },
      { day: "WED", state: "rest", label: "Active Recovery", date: "Aug 14" },
      { day: "THU", state: "rest", label: "Rest Day", date: "Aug 15" },
      { day: "FRI", state: "rest", label: "Rest Day", date: "Aug 16" },
      { day: "SAT", state: "rest", label: "Rest Day", date: "Aug 17" },
      { day: "SUN", state: "rest", label: "Rest Day", date: "Aug 18" },
    ],
  ];

  const daysOfWeek = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  return (
    <div className="bg-(--surface) border border-(--line) p-5 flex flex-col justify-between relative square-frame">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-1.5">
          <h2 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            Training Consistency
          </h2>
          <div className="relative">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="text-zinc-500 hover:text-zinc-300 transition p-0.5"
              title="Information"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
            {showInfo && (
              <div className="absolute left-0 top-6 w-60 bg-[#1a1a22] border border-white/10 p-2.5 text-[11px] text-zinc-300 shadow-xl z-50 animate-fade-in">
                Overview of completed workouts vs planned rest and missed sessions over the last 4 weeks.
              </div>
            )}
          </div>
        </div>

        {/* Details Link */}
        <button
          onClick={() => setShowDetailsModal(true)}
          className="flex items-center gap-0.5 text-xs text-(--accent) hover:text-(--accent-strong) transition font-medium"
        >
          <span>Details</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Content: Heatmap Grid & Stats Column */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Left Side: Heatmap Matrix (7 cols) */}
        <div className="md:col-span-8 flex flex-col justify-between">
          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-2 text-center mb-2.5">
            {daysOfWeek.map((day) => (
              <span
                key={day}
                className="text-[10px] font-semibold text-zinc-400 tracking-wider uppercase"
              >
                {day}
              </span>
            ))}
          </div>

          {/* 4 Rows of Status Circles */}
          <div className="space-y-2.5">
            {weeks.map((row, rIdx) => (
              <div key={rIdx} className="grid grid-cols-7 gap-2">
                {row.map((cell, cIdx) => {
                  return (
                    <div
                      key={cIdx}
                      className="relative flex items-center justify-center aspect-square"
                      onMouseEnter={() => setHoveredCell(cell)}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      {/* Trained: Solid Glowing Green */}
                      {cell.state === "trained" && (
                        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center cursor-pointer transition-transform hover:scale-110" />
                      )}

                      {/* Rest / Active Rest: Dark circle with grey dot */}
                      {cell.state === "rest" && (
                        <div className="w-6 h-6 rounded-full bg-(--surface-3) border border-(--line-strong) flex items-center justify-center cursor-pointer transition-transform hover:scale-110">
                          <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                        </div>
                      )}

                      {/* Missed: Dark circle with cross */}
                      {cell.state === "missed" && (
                        <div className="w-6 h-6 rounded-full bg-(--surface-3) border border-(--line-strong) flex items-center justify-center cursor-pointer transition-transform hover:scale-110">
                          <X className="w-3 h-3 text-(--faint)" />
                        </div>
                      )}

                      {/* Partial / Modified: Half filled green circle */}
                      {cell.state === "partial" && (
                        <div className="w-6 h-6 rounded-full bg-[#181820] border border-[#272732] overflow-hidden relative flex items-center justify-center cursor-pointer transition-transform hover:scale-110">
                          <div className="absolute right-0 top-0 w-3 h-6 bg-white" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Bottom Legend */}
          <div className="flex items-center gap-4 text-[10px] text-zinc-400 mt-4 pt-3 border-t border-white/[0.04]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-white" />
              <span>Trained</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-(--faint)" />
              <span>Rest/Active Rest</span>
            </div>
            <div className="flex items-center gap-1.5">
              <X className="w-2.5 h-2.5 text-(--faint)" />
              <span>Missed</span>
            </div>
          </div>
        </div>

        {/* Right Side: Stats Numbers */}
        <div className="md:col-span-4 flex md:flex-col justify-between md:justify-center md:items-start pl-0 md:pl-4 md:border-l border-white/[0.06] space-y-0 md:space-y-4">
          <div>
            <p className="font-display text-3xl font-bold text-zinc-50 tracking-tight">86%</p>
            <p className="text-xs text-zinc-400 mt-0.5">Consistency</p>
          </div>

          <div>
            <p className="text-lg font-bold text-white tracking-tight">
              24 <span className="text-zinc-500 font-normal">/ 28</span>
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">Sessions</p>
          </div>

          <div>
            <p className="text-xs text-zinc-400">Best streak</p>
            <p className="text-sm font-bold text-white mt-0.5">12 days</p>
          </div>
        </div>
      </div>

      {/* Hover Tooltip */}
      {hoveredCell && (
        <div className="absolute bottom-16 left-8 bg-(--surface-2) border border-(--line-strong) px-3 py-1.5 text-xs z-30 pointer-events-none animate-fade-in">
          <span className="font-semibold text-white">{hoveredCell.date}</span>:{" "}
          <span className="text-(--accent)">{hoveredCell.label}</span>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-(--surface) border border-(--line-strong) max-w-md w-full p-6 animate-fade-in square-frame">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-zinc-100" />
                <h3 className="text-base font-bold text-white">Monthly Consistency Breakdown</h3>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-zinc-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-(--surface-2) p-3 border border-(--line)">
                  <p className="text-zinc-400">Total Workouts</p>
                  <p className="text-lg font-bold text-zinc-50 mt-1">24</p>
                </div>
                <div className="bg-(--surface-2) p-3 border border-(--line)">
                  <p className="text-zinc-400">Rest Days</p>
                  <p className="text-lg font-bold text-zinc-300 mt-1">10</p>
                </div>
                <div className="bg-(--surface-2) p-3 border border-(--line)">
                  <p className="text-zinc-400">Missed</p>
                  <p className="text-lg font-bold text-(--accent) mt-1">4</p>
                </div>
              </div>

              <div className="p-3 bg-(--surface-2) border border-(--line)">
                <p className="font-semibold text-zinc-200 mb-1">Consistency Score Insight</p>
                <p className="text-zinc-400 leading-relaxed">
                  You are in the top 8% of athletes maintaining over 85% monthly consistency. Your 12-day consecutive streak occurred between Week 2 and Week 3.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowDetailsModal(false)}
              className="mt-5 w-full py-2 bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
