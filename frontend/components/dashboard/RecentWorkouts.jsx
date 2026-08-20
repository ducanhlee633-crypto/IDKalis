"use client";

import React from "react";
import Link from "next/link";
import { RECENT_WORKOUTS } from "@/data/mockCalisthenicsData";
import { ChevronRight } from "lucide-react";

export default function RecentWorkouts() {
  const renderWorkoutGraphic = (iconType) => {
    return (
      <div className="w-11 h-11 bg-(--surface-3) border border-(--line) flex items-center justify-center relative overflow-hidden group-hover:border-(--accent-line) transition">
        {iconType === "bench" && (
          <svg viewBox="0 0 32 32" className="w-7 h-7 stroke-zinc-400 fill-none stroke-[1.5]">
            <path d="M 6 22 L 26 22" />
            <path d="M 10 22 L 10 26" />
            <path d="M 22 22 L 22 26" />
            <path d="M 8 16 L 24 16" stroke="#ff4d4d" />
            <circle cx="16" cy="11" r="2.5" fill="#f5f5f6" />
            <path d="M 12 14 L 20 14" />
          </svg>
        )}
        {iconType === "pull" && (
          <svg viewBox="0 0 32 32" className="w-7 h-7 stroke-zinc-400 fill-none stroke-[1.5]">
            <path d="M 6 6 L 26 6" stroke="#ff4d4d" />
            <path d="M 10 6 L 10 14" />
            <path d="M 22 6 L 22 14" />
            <circle cx="16" cy="13" r="2.5" fill="#f5f5f6" />
            <path d="M 12 18 L 16 16 L 20 18" />
            <path d="M 16 16 L 16 26" />
          </svg>
        )}
        {iconType === "squat" && (
          <svg viewBox="0 0 32 32" className="w-7 h-7 stroke-zinc-400 fill-none stroke-[1.5]">
            <path d="M 8 8 L 24 8" stroke="#ff4d4d" />
            <circle cx="16" cy="12" r="2.5" fill="#f5f5f6" />
            <path d="M 16 15 L 16 21 L 11 27" />
            <path d="M 16 21 L 21 27" />
          </svg>
        )}
        {iconType === "fullbody" && (
          <svg viewBox="0 0 32 32" className="w-7 h-7 stroke-zinc-400 fill-none stroke-[1.5]">
            <path d="M 16 6 L 16 10" stroke="#ff4d4d" />
            <circle cx="16" cy="12" r="2" fill="#f5f5f6" />
            <path d="M 11 16 L 21 16" />
            <path d="M 16 14 L 16 22" />
            <path d="M 12 28 L 16 22 L 20 28" stroke="#ff4d4d" />
          </svg>
        )}
      </div>
    );
  };

  return (
    <div className="relative bg-(--surface) border border-(--line) p-5 square-frame flex flex-col justify-between h-full">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-4 h-px bg-(--accent)" />
          <h3 className="text-sm font-semibold text-zinc-100 tracking-tight">Recent workouts</h3>
        </div>
        <Link
          href="/workouts"
          className="text-xs font-medium text-(--faint) hover:text-(--accent) transition tracking-wider"
        >
          View all
        </Link>
      </div>

      {/* Workout Items List */}
      <div className="space-y-2.5">
        {RECENT_WORKOUTS.map((workout) => (
          <div
            key={workout.id}
            className="group flex items-center justify-between p-2 hover:bg-white/[0.03] border border-transparent hover:border-(--line) transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              {renderWorkoutGraphic(workout.iconType)}
              <div>
                <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-zinc-50 transition">
                  {workout.title}
                </h4>
                <div className="flex items-center gap-2 text-[11px] text-(--faint) mt-0.5">
                  <span>{workout.date}</span>
                  <span>•</span>
                  <span>{workout.duration}</span>
                </div>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-(--faint) group-hover:text-(--accent) group-hover:translate-x-0.5 transition" />
          </div>
        ))}
      </div>
    </div>
  );
}