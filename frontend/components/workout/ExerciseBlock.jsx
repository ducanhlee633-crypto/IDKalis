"use client";

import React, { useState } from "react";
import { Info, Check, Plus } from "lucide-react";

export default function ExerciseBlock({
  exercise,
  exerciseIndex,
  sets,
  previousSets = [],
  onSetChange,
  onAddSet,
  onToggleDone,
  onInfoClick,
}) {
  // Determine column headers based on inputType
  const getColumnLabel = () => {
    switch (exercise.inputType) {
      case "time":
      case "reps_time":
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
      case "reps_time":
        return "time";
      case "weight":
        return "weight";
      case "note":
      default:
        return "note";
    }
  };

  const fieldKey = getFieldKey();
  const isHold = exercise.inputType === "time";

  // Helpers: lấy placeholder previous cho từng set (chỉ hiển thị nếu có data)
  const getPrevPrimary = (prev) => {
    if (!prev) return null;
    if (fieldKey === "time") {
      if (prev.holdSeconds != null) return String(prev.holdSeconds);
      if (prev.raw?.time != null && String(prev.raw.time).trim() !== "") return String(prev.raw.time).trim();
      return null;
    }
    if (fieldKey === "weight") {
      if (prev.weightRaw != null && String(prev.weightRaw).trim() !== "") return String(prev.weightRaw).trim();
      if (prev.weight != null) return String(prev.weight);
      if (prev.raw?.weight != null && String(prev.raw.weight).trim() !== "") return String(prev.raw.weight).trim();
      return null;
    }
    // note
    if (prev.raw?.note != null && String(prev.raw.note).trim() !== "") return String(prev.raw.note).trim();
    if (prev.weightRaw) return String(prev.weightRaw);
    return null;
  };
  const getPrevReps = (prev) => {
    if (!prev) return null;
    if (prev.reps != null) return String(prev.reps);
    if (prev.raw?.reps != null && String(prev.raw.reps).trim() !== "") return String(prev.raw.reps).trim();
    return null;
  };
  const getPrevRpe = (prev) => {
    if (!prev) return null;
    if (prev.rpe != null) return String(prev.rpe);
    if (prev.raw?.rpe != null && String(prev.raw.rpe).trim() !== "") return String(prev.raw.rpe).trim();
    return null;
  };

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
          className="min-w-[44px] min-h-[44px] p-2 flex items-center justify-center text-(--faint) hover:text-zinc-300 hover:bg-white/5 transition border border-(--line)"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      {/* Set Table — hold (time) ẩn REPS */}
      <div className="space-y-0">
        {/* Column Headers */}
        <div
          className={`grid gap-1.5 sm:gap-2 px-2 pb-2 ${
            isHold
              ? "grid-cols-[40px_1fr_1fr_40px] sm:grid-cols-[50px_1fr_1fr_50px]"
              : "grid-cols-[40px_1fr_1fr_1fr_40px] sm:grid-cols-[50px_1fr_1fr_1fr_50px]"
          }`}
        >
          <span className="text-[10px] font-semibold text-(--faint) uppercase tracking-[0.18em]">
            SET
          </span>
          <span className="text-[10px] font-semibold text-(--faint) uppercase tracking-[0.18em]">
            {getColumnLabel()}
          </span>
          {!isHold && (
            <span className="text-[10px] font-semibold text-(--faint) uppercase tracking-[0.18em]">
              REPS
            </span>
          )}
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
          const prev = previousSets[setIdx] || null;
          const prevPrimary = getPrevPrimary(prev);
          const prevReps = getPrevReps(prev);
          const prevRpe = getPrevRpe(prev);

          return (
            <div
              key={setIdx}
              className={`grid gap-1.5 sm:gap-2 items-center px-2 py-1.5 transition-all ${
                isHold
                  ? "grid-cols-[40px_1fr_1fr_40px] sm:grid-cols-[50px_1fr_1fr_50px]"
                  : "grid-cols-[40px_1fr_1fr_1fr_40px] sm:grid-cols-[50px_1fr_1fr_1fr_50px]"
              } ${
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

              {/* Primary Input (Time/Weight/Note) — placeholder = previous */}
              <input
                type="text"
                value={set[fieldKey] || ""}
                onChange={(e) =>
                  onSetChange(exercise.id, setIdx, fieldKey, e.target.value)
                }
                className="bg-(--surface-3) border border-(--line-strong) text-zinc-200 text-xs px-2 sm:px-3 py-2 w-full outline-none focus:border-(--accent-line) transition placeholder:text-zinc-500"
                placeholder={prevPrimary ?? "-"}
                title={prevPrimary ? `Previous: ${prevPrimary}` : undefined}
              />

              {/* Reps — ẩn khi hold time, placeholder = previous reps */}
              {!isHold && (
                <input
                  type="text"
                  value={set.reps || ""}
                  onChange={(e) =>
                    onSetChange(exercise.id, setIdx, "reps", e.target.value)
                  }
                  className="bg-(--surface-3) border border-(--line-strong) text-zinc-200 text-xs px-2 sm:px-3 py-2 w-full outline-none focus:border-(--accent-line) transition placeholder:text-zinc-500"
                  placeholder={prevReps ?? "-"}
                  title={prevReps ? `Previous: ${prevReps}` : undefined}
                />
              )}

              {/* RPE — placeholder previous RPE nếu có */}
              <input
                type="text"
                value={set.rpe || ""}
                onChange={(e) =>
                  onSetChange(exercise.id, setIdx, "rpe", e.target.value)
                }
                className="bg-(--surface-3) border border-(--line-strong) text-zinc-200 text-xs px-2 sm:px-3 py-2 w-full outline-none focus:border-(--accent-line) transition placeholder:text-zinc-500"
                placeholder={prevRpe ?? "-"}
                title={prevRpe ? `Previous RPE: ${prevRpe}` : undefined}
              />

              {/* Done Checkbox - 44px touch target */}
              <div className="flex justify-center">
                <button
                  onClick={() => onToggleDone(exercise.id, setIdx)}
                  className={`w-10 h-10 min-w-[40px] min-h-[40px] sm:w-11 sm:h-11 flex items-center justify-center border transition-all ${
                    isDone
                      ? "bg-(--accent-soft) border-(--accent-line) text-(--accent)"
                      : "bg-[#0d0d10] border-white/[0.08] text-zinc-600 hover:border-zinc-500"
                  }`}
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Set Button */}
      <button
        onClick={() => onAddSet(exercise.id)}
        className="mt-3 w-full flex items-center justify-center gap-1.5 py-3 min-h-[44px] border border-dashed border-(--line-strong) text-(--faint) hover:text-zinc-300 hover:border-(--line-strong) text-xs transition"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add Set</span>
      </button>
    </div>
  );
}
