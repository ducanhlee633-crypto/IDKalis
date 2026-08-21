"use client";

import React from "react";
import { Minus, Plus, X } from "lucide-react";

export default function RestTimerBar({
  remaining,
  total,
  onAdd30,
  onSub30,
  onSkip,
}) {
  const mins = Math.floor(Math.max(0, remaining) / 60);
  const secs = Math.max(0, remaining) % 60;
  const display = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  const progress = total > 0 ? Math.max(0, Math.min(100, (remaining / total) * 100)) : 0;
  const isUrgent = remaining <= 10 && remaining > 0;
  const isDone = remaining <= 0;

  return (
    <div
      className="fixed inset-x-0 z-30 animate-slide-up bottom-[calc(64px+env(safe-area-inset-bottom))] lg:bottom-0"
      role="timer"
      aria-live="polite"
      aria-label={`Rest timer ${display}`}
    >
      <div className="mx-auto w-full max-w-[1600px] px-3 lg:px-8 pb-3 lg:pb-4">
        <div className="bg-[#131316] border border-white/[0.12] shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden">
            {/* Top progress line + accent ruler ticks */}
            <div className="h-[3px] w-full bg-white/[0.06] relative overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-(--accent) transition-all duration-1000 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Main row */}
            <div className="flex items-center justify-between gap-2 px-3 py-3 sm:px-4 sm:py-3.5">
              {/* -30s */}
              <button
                onClick={onSub30}
                aria-label="Subtract 30 seconds"
                className="shrink-0 flex items-center justify-center gap-1.5 min-h-[44px] px-3 sm:px-4 bg-[#0d0d10] border border-white/[0.08] text-zinc-300 hover:text-zinc-100 hover:border-white/15 hover:bg-white/[0.04] active:scale-[0.97] transition text-xs font-semibold"
              >
                <Minus className="w-3.5 h-3.5" />
                <span className="hidden xs:inline sm:inline">30s</span>
                <span className="xs:hidden sm:hidden">30</span>
              </button>

              {/* Center: REST label + countdown */}
              <div className="flex-1 min-w-0 flex flex-col items-center justify-center px-2">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-(--accent) rounded-full animate-pulse shrink-0 hidden sm:block" />
                  <span className="text-[10px] font-bold tracking-[0.16em] text-(--accent) uppercase leading-none">
                    REST
                  </span>
                  <span className="w-1.5 h-1.5 bg-(--accent) rounded-full animate-pulse shrink-0 hidden sm:block" />
                </div>
                <span
                  className={`font-display tnum font-bold tracking-tight leading-none mt-1 text-[28px] sm:text-[30px] transition-colors ${
                    isDone
                      ? "text-zinc-500"
                      : isUrgent
                      ? "text-(--accent)"
                      : "text-zinc-100"
                  }`}
                >
                  {display}
                </span>
                <span className="text-[10px] text-(--faint) tracking-wide mt-0.5 hidden sm:block">
                  {isDone ? "Done" : isUrgent ? "Almost ready" : "Take a breath"}
                </span>
              </div>

              {/* +30s */}
              <button
                onClick={onAdd30}
                aria-label="Add 30 seconds"
                className="shrink-0 flex items-center justify-center gap-1.5 min-h-[44px] px-3 sm:px-4 bg-[#0d0d10] border border-white/[0.08] text-zinc-300 hover:text-zinc-100 hover:border-white/15 hover:bg-white/[0.04] active:scale-[0.97] transition text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden xs:inline sm:inline">30s</span>
                <span className="xs:hidden sm:hidden">30</span>
              </button>

              {/* Skip / Close */}
              <button
                onClick={onSkip}
                aria-label="Skip rest timer"
                className="shrink-0 ml-1 w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center bg-transparent border border-white/[0.08] text-(--muted) hover:text-zinc-200 hover:border-white/15 hover:bg-white/[0.04] active:scale-[0.97] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Bottom ticks decoration like square-frame */}
            <div
              className="h-[6px] w-full opacity-40"
              style={{
                background:
                  "repeating-linear-gradient(90deg, rgba(255,255,255,0.14) 0 1px, transparent 1px 9px)",
              }}
            />
          </div>
        </div>
      </div>
  );
}
