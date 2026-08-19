"use client";

import React from "react";
import { X, Dumbbell, Lightbulb } from "lucide-react";

export default function ExerciseInfoModal({ exercise, isOpen, onClose }) {
  if (!isOpen || !exercise) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#141418] border border-[#2a2a32] w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <h3 className="text-base font-bold text-zinc-100">{exercise.name}</h3>
          <button
            onClick={onClose}
            className="p-1 text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Description */}
          <p className="text-xs text-zinc-400 leading-relaxed">
            {exercise.description}
          </p>

          {/* Muscle Groups */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Dumbbell className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Muscle Groups</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {exercise.muscleGroups?.map((muscle, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-[10px] font-medium"
                >
                  {muscle}
                </span>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Tips</span>
            </div>
            <ul className="space-y-1.5">
              {exercise.tips?.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                  <span className="w-1 h-1 bg-amber-400 mt-1.5 shrink-0" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.06]">
          <button
            onClick={onClose}
            className="w-full bg-[#1c1c24] border border-white/10 text-zinc-300 text-xs font-semibold py-2 hover:bg-[#222230] transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
