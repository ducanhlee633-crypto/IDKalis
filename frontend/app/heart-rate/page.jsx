"use client";

import React from "react";
import { Heart, Activity, AlertTriangle, Flame } from "lucide-react";

export default function HeartRatePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Heart Rate & Intensity</h1>
        <p className="text-xs text-zinc-400 mt-1">Real-time cardiovascular zones and RPE exertion analysis.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#121215] border border-[#222228] p-4 square-frame">
          <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold uppercase mb-1">
            <Heart className="w-4 h-4" />
            <span>Avg Heart Rate</span>
          </div>
          <p className="text-2xl font-bold text-zinc-100">128 bpm</p>
          <span className="inline-block mt-1 px-2 py-0.5 bg-amber-400/10 text-amber-400 text-[10px] font-semibold">
            NEED ATTENTION
          </span>
        </div>

        <div className="bg-[#121215] border border-[#222228] p-4 square-frame">
          <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold uppercase mb-1">
            <Activity className="w-4 h-4" />
            <span>Peak Isometric Heart Rate</span>
          </div>
          <p className="text-2xl font-bold text-zinc-100">164 bpm</p>
          <p className="text-[11px] text-zinc-500 mt-1">During max Planche hold</p>
        </div>

        <div className="bg-[#121215] border border-[#222228] p-4 square-frame">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase mb-1">
            <Flame className="w-4 h-4" />
            <span>Resting Heart Rate</span>
          </div>
          <p className="text-2xl font-bold text-cyan-400">54 bpm</p>
          <p className="text-[11px] text-zinc-500 mt-1">Excellent athletic baseline</p>
        </div>
      </div>
    </div>
  );
}
