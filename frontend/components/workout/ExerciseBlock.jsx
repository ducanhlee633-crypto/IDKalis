"use client";

import React, { useState } from "react";
import { Info, Check, Plus } from "lucide-react";

export default function ExerciseBlock({
  exercise,
  exerciseIndex,
  sets,
  onSetChange,
  onAddSet,
  onToggleDone,
  onInfoClick,
}) {
  // Determine column headers based on inputType
  const getColumnLabel = () => {
    switch (exercise.inputType) {
      case "time":
        return "TIME (S)";
      case "weight":
        return "WEIGHT (KG)";
      case "note":
      default:
        return "NOTE";
    }
  };

  const getFieldKey = () => {
    switch (exercise.inputType) {
      case "time":
        return "time";
      case "weight":
        return "weight";
      case "note":
      default:
        return "note";
    }
  };

  const fieldKey = getFieldKey();

  return (
    <div className="bg-(--surface) border border-(--line) p-5 relative">
      {/* Exercise Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-(--accent-soft) border border-(--accent-line) flex items-center justify-center text-(--accent) font-display text-sm font-bold shrink-0">
            {exerciseIndex + 1}
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100">
              {exercise.name}
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Target: {exercise.target}
            </p>
          </div>
        </div>
        <button
          onClick={() => onInfoClick(exercise)}
          className="p-1.5 text-(--faint) hover:text-zinc-300 hover:bg-white/5 transition border border-(--line)"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      {/* Set Table */}
      <div className="space-y-0">
        {/* Column Headers */}
        <div className="grid grid-cols-[40px_1fr_1fr_1fr_40px] sm:grid-cols-[50px_1fr_1fr_1fr_50px] gap-1.5 sm:gap-2 px-2 pb-2">
          <span className="text-[10px] font-semibold text-(--faint) uppercase tracking-[0.18em]">
            SET
          </span>
          <span className="text-[10px] font-semibold text-(--faint) uppercase tracking-[0.18em]">
            {getColumnLabel()}
          </span>
          <span className="text-[10px] font-semibold text-(--faint) uppercase tracking-[0.18em]">
            REPS
          </span>
          <span className="text-[10px] font-semibold text-(--faint) uppercase tracking-[0.18em]">
            RPE
          </span>
          <span className="text-[10px] font-semibold text-(--faint) uppercase tracking-[0.18em] text-center">
            DONE
          </span>
        </div>

        {/* Set Rows */}
        {sets.map((set, setIdx) => {
          const isActive =
            !set.done &&
            (setIdx === 0 || sets[setIdx - 1]?.done);
          const isDone = set.done;

          return (
            <div
              key={setIdx}
              className={`grid grid-cols-[40px_1fr_1fr_1fr_40px] sm:grid-cols-[50px_1fr_1fr_1fr_50px] gap-1.5 sm:gap-2 items-center px-2 py-1.5 transition-all ${
                isActive
                  ? "border-l-2 border-l-(--accent) bg-(--accent-soft)"
                  : isDone
                  ? "opacity-60"
                  : ""
              }`}
            >
              {/* Set Number */}
              <span
                className={`text-xs font-bold text-center ${
                  isActive ? "text-(--accent)" : "text-(--muted)"
                }`}
              >
                {setIdx + 1}
              </span>

              {/* Primary Input (Time/Weight/Note) */}
              <input
                type="text"
                value={set[fieldKey] || ""}
                onChange={(e) =>
                  onSetChange(exercise.id, setIdx, fieldKey, e.target.value)
                }
                className="bg-(--surface-3) border border-(--line-strong) text-zinc-200 text-xs px-2 sm:px-3 py-2 w-full outline-none focus:border-(--accent-line) transition placeholder:text-(--faint)"
                placeholder="-"
              />

              {/* Reps */}
              <input
                type="text"
                value={set.reps || ""}
                onChange={(e) =>
                  onSetChange(exercise.id, setIdx, "reps", e.target.value)
                }
                className="bg-(--surface-3) border border-(--line-strong) text-zinc-200 text-xs px-2 sm:px-3 py-2 w-full outline-none focus:border-(--accent-line) transition placeholder:text-(--faint)"
                placeholder="-"
              />

              {/* RPE */}
              <input
                type="text"
                value={set.rpe || ""}
                onChange={(e) =>
                  onSetChange(exercise.id, setIdx, "rpe", e.target.value)
                }
                className="bg-(--surface-3) border border-(--line-strong) text-zinc-200 text-xs px-2 sm:px-3 py-2 w-full outline-none focus:border-(--accent-line) transition placeholder:text-(--faint)"
                placeholder="-"
              />

              {/* Done Checkbox */}
              <div className="flex justify-center">
                <button
                  onClick={() => onToggleDone(exercise.id, setIdx)}
                  className={`w-7 h-7 flex items-center justify-center border transition-all ${
                    isDone
                      ? "bg-(--accent-soft) border-(--accent-line) text-(--accent)"
                      : "bg-[#0d0d10] border-white/[0.08] text-zinc-600 hover:border-zinc-500"
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Set Button */}
      <button
        onClick={() => onAddSet(exercise.id)}
        className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 border border-dashed border-(--line-strong) text-(--faint) hover:text-zinc-300 hover:border-(--line-strong) text-xs transition"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add Set</span>
      </button>
    </div>
  );
}
