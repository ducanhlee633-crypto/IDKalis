"use client";

import React from "react";
import { Trophy, Clock, CheckCircle2, Dumbbell, X } from "lucide-react";

export default function WorkoutSummaryModal({
  isOpen,
  onClose,
  onSave,
  onDiscard,
  workoutName,
  timerSeconds,
  exercises,
  sets,
}) {
  if (!isOpen) return null;

  const mins = Math.floor(timerSeconds / 60);
  const secs = timerSeconds % 60;
  const duration = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  // Count completed sets
  let totalSets = 0;
  let completedSets = 0;
  if (sets) {
    Object.values(sets).forEach((exerciseSets) => {
      exerciseSets.forEach((set) => {
        totalSets++;
        if (set.done) completedSets++;
      });
    });
  }

  const exerciseCount = exercises?.length || 0;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-(--surface) border border-(--line-strong) w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-bold text-zinc-100">Workout Summary</h3>
          <button
            onClick={onClose}
            className="p-1 text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Trophy + Name */}
        <div className="p-6 text-center">
          <div className="w-14 h-14 bg-white/5 border border-(--line-strong) flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-7 h-7 text-zinc-100" />
          </div>
          <h2 className="text-lg font-bold text-zinc-100 mb-1">{workoutName}</h2>
          <p className="text-xs text-zinc-500">Session complete!</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 px-6 pb-6">
          <div className="bg-(--surface-3) border border-(--line) p-3 text-center">
            <Clock className="w-4 h-4 text-(--accent) mx-auto mb-1.5" />
            <p className="font-display text-sm font-bold text-zinc-100 tnum">{duration}</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">Duration</p>
          </div>
          <div className="bg-(--surface-3) border border-(--line) p-3 text-center">
            <CheckCircle2 className="w-4 h-4 text-zinc-100 mx-auto mb-1.5" />
            <p className="text-sm font-bold text-zinc-100">{completedSets}/{totalSets}</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">Sets Done</p>
          </div>
          <div className="bg-(--surface-3) border border-(--line) p-3 text-center">
            <Dumbbell className="w-4 h-4 text-(--muted) mx-auto mb-1.5" />
            <p className="text-sm font-bold text-zinc-100">{exerciseCount}</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">Exercises</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="p-4 border-t border-white/[0.06] space-y-2">
          <button
            onClick={onSave}
            className="w-full btn-accent text-xs py-2.5 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Save & Close
          </button>
          <button
            onClick={onDiscard}
            className="w-full bg-transparent border border-(--accent-line) text-(--accent) hover:bg-(--accent-soft) text-xs font-semibold py-2.5 transition"
          >
            Discard Workout
          </button>
        </div>
      </div>
    </div>
  );
}
