"use client";

import React from "react";
import Link from "next/link";
import { RECENT_WORKOUTS } from "@/data/mockCalisthenicsData";
import { ChevronRight, ArrowUpRight } from "lucide-react";

export default function RecentWorkouts() {
  const renderWorkoutGraphic = (iconType) => {
    // Mini high-tech vector illustration for workout category
    return (
      <div className="w-11 h-11 bg-[#0e0e12] border border-white/5 flex items-center justify-center relative overflow-hidden group-hover:border-cyan-400/30 transition">
        {iconType === "bench" && (
          <svg viewBox="0 0 32 32" className="w-7 h-7 stroke-zinc-400 fill-none stroke-[1.5]">
            <path d="M 6 22 L 26 22" />
            <path d="M 10 22 L 10 26" />
            <path d="M 22 22 L 22 26" />
            <path d="M 8 16 L 24 16" stroke="#00e5ff" />
            <circle cx="16" cy="11" r="2.5" fill="#38bdf8" />
            <path d="M 12 14 L 20 14" />
          </svg>
        )}
        {iconType === "pull" && (
          <svg viewBox="0 0 32 32" className="w-7 h-7 stroke-zinc-400 fill-none stroke-[1.5]">
            <path d="M 6 6 L 26 6" stroke="#00e5ff" />
            <path d="M 10 6 L 10 14" />
            <path d="M 22 6 L 22 14" />
            <circle cx="16" cy="13" r="2.5" fill="#38bdf8" />
            <path d="M 12 18 L 16 16 L 20 18" />
            <path d="M 16 16 L 16 26" />
          </svg>
        )}
        {iconType === "squat" && (
          <svg viewBox="0 0 32 32" className="w-7 h-7 stroke-zinc-400 fill-none stroke-[1.5]">
            <path d="M 8 8 L 24 8" stroke="#00e5ff" />
            <circle cx="16" cy="12" r="2.5" fill="#38bdf8" />
            <path d="M 16 15 L 16 21 L 11 27" />
            <path d="M 16 21 L 21 27" />
          </svg>
        )}
        {iconType === "fullbody" && (
          <svg viewBox="0 0 32 32" className="w-7 h-7 stroke-zinc-400 fill-none stroke-[1.5]">
            <path d="M 16 6 L 16 10" stroke="#00e5ff" />
            <circle cx="16" cy="12" r="2" fill="#38bdf8" />
            <path d="M 11 16 L 21 16" />
            <path d="M 16 14 L 16 22" />
            <path d="M 12 28 L 16 22 L 20 28" stroke="#00e5ff" />
          </svg>
        )}
      </div>
    );
  };

  return (
    <div className="relative bg-[#121215] border border-[#222228] p-5 square-frame flex flex-col justify-between h-full">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-100 tracking-tight">Recent workouts</h3>
        <Link
          href="/workouts"
          className="text-xs font-medium text-zinc-400 hover:text-cyan-400 transition flex items-center gap-1 uppercase tracking-wider"
        >
          VIEW ALL
        </Link>
      </div>

      {/* Workout Items List */}
      <div className="space-y-2.5">
        {RECENT_WORKOUTS.map((workout) => (
          <div
            key={workout.id}
            className="group flex items-center justify-between p-2 hover:bg-white/[0.03] border border-transparent hover:border-white/5 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              {renderWorkoutGraphic(workout.iconType)}
              <div>
                <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-cyan-400 transition">
                  {workout.title}
                </h4>
                <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                  <span>{workout.date}</span>
                  <span>•</span>
                  <span>{workout.duration}</span>
                </div>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition" />
          </div>
        ))}
      </div>
    </div>
  );
}
