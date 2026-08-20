"use client";

import React from "react";
import { Star, Activity, Target, Heart } from "lucide-react";

// Arm/Biceps Flex custom icon
function BicepsIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.5 7.5A3.5 3.5 0 0 1 16 11c0 1.5-1 3-2.5 4.5L12 17l-1.5-1.5C9 14 8 12.5 8 11a3.5 3.5 0 0 1 3.5-3.5h1z" />
      <path d="M5 14a4 4 0 0 0 4 4h3" />
      <path d="M18 11a4 4 0 0 1-4 4" />
      <path d="M7 9a2 2 0 0 1 2-2h2" />
    </svg>
  );
}

export default function MetricKpiCards() {
  const metrics = [
    {
      id: "strength",
      title: "STRENGTH",
      icon: (
        <span className="text-(--muted)">
          <BicepsIcon className="w-4 h-4" />
        </span>
      ),
      value: "↑ 12.4%",
      valueColor: "text-zinc-50",
      subtext: "vs previous 30 days",
      type: "sparkline-green",
      sparklinePath: "M0 18 C 20 22, 35 15, 50 18 C 65 21, 80 12, 95 16 C 110 20, 130 8, 145 12 C 160 16, 175 6, 190 10 L 190 28 L 0 28 Z",
      sparklineStroke: "M0 18 C 20 22, 35 15, 50 18 C 65 21, 80 12, 95 16 C 110 20, 130 8, 145 12 C 160 16, 175 6, 190 10",
      strokeColor: "#ff4d4d",
    },
    {
      id: "skill",
      title: "SKILL",
      icon: <Star className="w-4 h-4 text-(--muted)" />,
      value: "↑ 8.7%",
      valueColor: "text-zinc-50",
      subtext: "vs previous 30 days",
      type: "sparkline-green",
      sparklinePath: "M0 20 C 25 17, 45 22, 70 16 C 95 10, 115 19, 140 12 C 165 5, 175 14, 190 8 L 190 28 L 0 28 Z",
      sparklineStroke: "M0 20 C 25 17, 45 22, 70 16 C 95 10, 115 19, 140 12 C 165 5, 175 14, 190 8",
      strokeColor: "#ff4d4d",
    },
    {
      id: "volume",
      title: "VOLUME",
      icon: <Activity className="w-4 h-4 text-(--muted)" />,
      value: "↑ 15.2%",
      valueColor: "text-zinc-50",
      subtext: "vs previous 30 days",
      type: "sparkline-green",
      sparklinePath: "M0 22 C 20 18, 40 24, 60 14 C 80 4, 100 20, 120 10 C 140 0, 160 16, 190 6 L 190 28 L 0 28 Z",
      sparklineStroke: "M0 22 C 20 18, 40 24, 60 14 C 80 4, 100 20, 120 10 C 140 0, 160 16, 190 6",
      strokeColor: "#ff4d4d",
    },
    {
      id: "consistency",
      title: "CONSISTENCY",
      icon: <Target className="w-4 h-4 text-(--muted)" />,
      value: "87%",
      valueColor: "text-white font-bold",
      subtext: "24 / 28 sessions",
      type: "bars",
      bars: [
        { h: 35 }, { h: 55 }, { h: 20 }, { h: 70 }, { h: 85 },
        { h: 40 }, { h: 65 }, { h: 90 }, { h: 45 }, { h: 75 },
        { h: 100 }, { h: 60 }, { h: 80 }, { h: 95 }, { h: 50 },
        { h: 85 }, { h: 90 }, { h: 100 }, { h: 70 }, { h: 80 }
      ],
    },
    {
      id: "recovery",
      title: "RECOVERY",
      icon: <Heart className="w-4 h-4 text-(--muted)" />,
      value: "Good",
      valueColor: "text-(--accent) font-bold",
      subtext: "Your body is ready",
      type: "sparkline-amber",
      sparklinePath: "M0 16 C 15 22, 30 12, 45 18 C 60 24, 75 14, 90 20 C 105 26, 120 12, 135 18 C 150 24, 165 14, 190 18 L 190 28 L 0 28 Z",
      sparklineStroke: "M0 16 C 15 22, 30 12, 45 18 C 60 24, 75 14, 90 20 C 105 26, 120 12, 135 18 C 150 24, 165 14, 190 18",
      strokeColor: "#ff4d4d",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {metrics.map((m) => (
        <div
          key={m.id}
          className="relative bg-(--surface) border border-(--line) p-4 flex flex-col justify-between overflow-hidden group hover:bg-(--surface-2) transition square-frame"
        >
          {/* Header with Icon & Title */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-7 h-7 bg-(--surface-3) border border-(--line) flex items-center justify-center shrink-0">
                {m.icon}
              </div>
              <span className="text-[10px] font-semibold text-(--muted) uppercase tracking-[0.18em]">
                {m.title}
              </span>
            </div>

            {/* Value & Subtext */}
            <div className="space-y-0.5">
              <p className={`text-2xl font-bold tracking-tight ${m.valueColor}`}>
                {m.value}
              </p>
              <p className="text-[11px] text-zinc-400 font-medium">
                {m.subtext}
              </p>
            </div>
          </div>

          {/* Bottom Graph Visualization */}
          <div className="mt-3.5 h-7 w-full flex items-end">
            {m.type === "bars" ? (
              <div className="flex items-end justify-between w-full h-full gap-[3px] pt-1">
                {m.bars.map((bar, idx) => (
                  <div
                    key={idx}
                    className="flex-1 bg-(--accent-soft) group-hover:bg-(--accent) transition-colors"
                    style={{ height: `${bar.h}%` }}
                  />
                ))}
              </div>
            ) : (
              <svg
                viewBox="0 0 190 28"
                className="w-full h-7 overflow-visible"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id={`grad-${m.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={m.strokeColor} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={m.strokeColor} stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d={m.sparklinePath}
                  fill={`url(#grad-${m.id})`}
                />
                <path
                  d={m.sparklineStroke}
                  fill="none"
                  stroke={m.strokeColor}
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
