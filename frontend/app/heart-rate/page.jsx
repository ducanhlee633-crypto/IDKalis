"use client";

import React from "react";
import { Heart, Activity, AlertTriangle, Flame } from "lucide-react";

export default function HeartRatePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-zinc-50 tnum tracking-tight">Heart Rate & Intensity</h1>
        <p className="text-xs text-(--muted) mt-1">Real-time cardiovascular zones and RPE exertion analysis.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-(--surface) border border-(--line) p-4 square-frame">
          <div className="flex items-center gap-2 text-(--muted) text-xs font-semibold uppercase mb-1">
            <Heart className="w-4 h-4" />
            <span>Avg Heart Rate</span>
          </div>
          <p className="font-display text-2xl font-semibold text-zinc-50 tnum">128 bpm</p>
          <span className="inline-block mt-1 px-2 py-0.5 bg-(--accent-soft) border border-(--accent-line) text-(--accent) text-[10px] font-semibold">
            NEED ATTENTION
          </span>
        </div>

        <div className="bg-(--surface) border border-(--line) p-4 square-frame">
          <div className="flex items-center gap-2 text-(--muted) text-xs font-semibold uppercase mb-1">
            <Activity className="w-4 h-4" />
            <span>Peak Isometric Heart Rate</span>
          </div>
          <p className="font-display text-2xl font-semibold text-zinc-50 tnum">164 bpm</p>
          <p className="text-[11px] text-(--faint) mt-1">During max Planche hold</p>
        </div>

        <div className="bg-(--surface) border border-(--line) p-4 square-frame">
          <div className="flex items-center gap-2 text-(--muted) text-xs font-semibold uppercase mb-1">
            <Flame className="w-4 h-4" />
            <span>Resting Heart Rate</span>
          </div>
          <p className="font-display text-2xl font-semibold text-(--accent) tnum">54 bpm</p>
          <p className="text-[11px] text-(--faint) mt-1">Excellent athletic baseline</p>
        </div>
      </div>
    </div>
  );
}
