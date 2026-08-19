"use client";

import React from "react";
import { Moon, Bed, BatteryCharging, Zap } from "lucide-react";

export default function SleepPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Sleep & Recovery</h1>
        <p className="text-xs text-zinc-400 mt-1">CNS Recovery & Musculoskeletal Repair Index.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#121215] border border-[#222228] p-4 square-frame">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase mb-1">
            <Moon className="w-4 h-4" />
            <span>Sleep Duration</span>
          </div>
          <p className="text-2xl font-bold text-zinc-100">7 h 48 m</p>
          <p className="text-[11px] text-emerald-400 mt-1">Optimal recovery window</p>
        </div>

        <div className="bg-[#121215] border border-[#222228] p-4 square-frame">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase mb-1">
            <Bed className="w-4 h-4" />
            <span>Deep Sleep</span>
          </div>
          <p className="text-2xl font-bold text-zinc-100">1 h 52 m</p>
          <p className="text-[11px] text-zinc-500 mt-1">24% of total rest</p>
        </div>

        <div className="bg-[#121215] border border-[#222228] p-4 square-frame">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase mb-1">
            <BatteryCharging className="w-4 h-4" />
            <span>Recovery Score</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">92%</p>
          <p className="text-[11px] text-zinc-400 mt-1">Ready for high RPE training</p>
        </div>
      </div>
    </div>
  );
}
