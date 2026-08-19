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
    <div className="bg-[#121215] border border-[#222228] p-5 relative">
      {/* Exercise Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-400 text-sm font-bold shrink-0">
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
          className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition border border-white/5"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      {/* Set Table */}
      <div className="space-y-0">
        {/* Column Headers */}
        <div className="grid grid-cols-[40px_1fr_1fr_1fr_40px] sm:grid-cols-[50px_1fr_1fr_1fr_50px] gap-1.5 sm:gap-2 px-2 pb-2">
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
            SET
          </span>
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
            {getColumnLabel()}
          </span>
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
            REPS
          </span>
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
            RPE
          </span>
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider text-center">
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
                  ? "border-l-2 border-l-blue-400 bg-blue-400/[0.03]"
                  : isDone
                  ? "opacity-60"
                  : ""
              }`}
            >
              {/* Set Number */}
              <span
                className={`text-xs font-bold text-center ${
                  isActive ? "text-blue-400" : "text-zinc-400"
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
                className="bg-[#0d0d10] border border-white/[0.08] text-zinc-200 text-xs px-2 sm:px-3 py-2 w-full outline-none focus:border-cyan-400/40 transition placeholder:text-zinc-600"
                placeholder="-"
              />

              {/* Reps */}
              <input
                type="text"
                value={set.reps || ""}
                onChange={(e) =>
                  onSetChange(exercise.id, setIdx, "reps", e.target.value)
                }
                className="bg-[#0d0d10] border border-white/[0.08] text-zinc-200 text-xs px-2 sm:px-3 py-2 w-full outline-none focus:border-cyan-400/40 transition placeholder:text-zinc-600"
                placeholder="-"
              />

              {/* RPE */}
              <input
                type="text"
                value={set.rpe || ""}
                onChange={(e) =>
                  onSetChange(exercise.id, setIdx, "rpe", e.target.value)
                }
                className="bg-[#0d0d10] border border-white/[0.08] text-zinc-200 text-xs px-2 sm:px-3 py-2 w-full outline-none focus:border-cyan-400/40 transition placeholder:text-zinc-600"
                placeholder="-"
              />

              {/* Done Checkbox */}
              <div className="flex justify-center">
                <button
                  onClick={() => onToggleDone(exercise.id, setIdx)}
                  className={`w-7 h-7 flex items-center justify-center border transition-all ${
                    isDone
                      ? "bg-amber-400/20 border-amber-400/50 text-amber-400"
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
        className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 border border-dashed border-white/[0.08] text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 text-xs transition"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add Set</span>
      </button>
    </div>
  );
}
