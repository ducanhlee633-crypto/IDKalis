"use client";

import React, { useState } from "react";
import {
  Info,
  Lightbulb,
  Gem,
  Layers,
  Timer,
  ShieldCheck,
  Smile,
} from "lucide-react";

// Circular gauge for the top bottleneck badge
function BottleneckGauge({ percentage = 64, size = 48, strokeWidth = 4 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,77,77,0.15)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#ff4d4d"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute text-xs font-bold text-(--accent)">
        {percentage}%
      </span>
    </div>
  );
}

export default function CurrentBottleneckCard() {
  const [showInfo, setShowInfo] = useState(false);

  const attributes = [
    {
      id: "strength",
      label: "Strength",
      icon: <Gem className="w-3.5 h-3.5 text-zinc-400" />,
      value: 88,
      color: "bg-(--accent)",
      textColor: "text-zinc-200",
    },
    {
      id: "technique",
      label: "Technique",
      icon: <Layers className="w-3.5 h-3.5 text-zinc-400" />,
      value: 79,
      color: "bg-white/60",
      textColor: "text-zinc-200",
    },
    {
      id: "endurance",
      label: "Endurance",
      icon: <Timer className="w-3.5 h-3.5 text-(--muted)" />,
      value: 64,
      color: "bg-(--accent)",
      textColor: "text-(--accent)",
    },
    {
      id: "mobility",
      label: "Mobility",
      icon: <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />,
      value: 81,
      color: "bg-(--accent)",
      textColor: "text-zinc-200",
    },
    {
      id: "consistency",
      label: "Consistency",
      icon: <Smile className="w-3.5 h-3.5 text-zinc-400" />,
      value: 93,
      color: "bg-(--accent)",
      textColor: "text-zinc-200",
    },
  ];

  return (
    <div className="bg-(--surface) border border-(--line) p-5 flex flex-col justify-between relative square-frame">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5">
          <h2 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            Current Bottleneck
          </h2>
          <div className="relative">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="text-zinc-500 hover:text-zinc-300 transition p-0.5"
              title="Information"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
            {showInfo && (
              <div className="absolute left-0 top-6 w-60 bg-(--surface-2) border border-(--line-strong) p-2.5 text-[11px] text-zinc-300 shadow-xl z-50 animate-fade-in">
                AI performance analyzer determines the single biggest limiting factor holding back your next calisthenics skill milestone.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Highlight Box with Amber Accent */}
      <div className="bg-(--accent-soft) border border-(--accent-line) p-4 flex items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-sm font-bold text-(--accent)">
            Planche Endurance
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Your hold endurance is limiting your progress.
          </p>
        </div>
        <BottleneckGauge percentage={64} />
      </div>

      {/* Attribute Progress Bars */}
      <div className="space-y-3.5 mb-4">
        {attributes.map((attr) => (
          <div key={attr.id} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {attr.icon}
                <span className="text-zinc-300 font-medium">{attr.label}</span>
              </div>
              <span className={`font-semibold ${attr.textColor}`}>
                {attr.value}%
              </span>
            </div>

            {/* Custom Bar track */}
            <div className="w-full h-1.5 bg-[#1b1b22] overflow-hidden">
              <div
                className={`h-full transition-all duration-700 ease-out ${attr.color}`}
                style={{ width: `${attr.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Focus Tip Card */}
      <div className="bg-(--surface-2) border border-(--line) p-3.5 flex items-start gap-3 mt-auto">
        <div className="p-1.5 bg-(--accent-soft) shrink-0 mt-0.5">
          <Lightbulb className="w-4 h-4 text-(--accent)" />
        </div>
        <div className="text-xs">
          <p className="font-bold text-(--accent)">Focus this week</p>
          <p className="text-zinc-400 mt-0.5 leading-relaxed">
            Improve hold endurance with higher volume isometric work.
          </p>
        </div>
      </div>
    </div>
  );
}
