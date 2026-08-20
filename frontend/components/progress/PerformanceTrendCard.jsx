"use client";

import React, { useState } from "react";
import { Info, ChevronDown, Check } from "lucide-react";

const SKILL_DATA = {
  planche: {
    name: "Planche Hold",
    unit: "s",
    yMax: 12,
    ySteps: [12, 10, 8, 6, 4, 2, 0],
    points: [
      { x: "4 weeks ago", date: "Jul 22", value: 3.0 },
      { x: "", date: "Jul 25", value: 3.5 },
      { x: "", date: "Jul 28", value: 4.8 },
      { x: "3 weeks ago", date: "Jul 31", value: 5.2 },
      { x: "", date: "Aug 03", value: 5.6 },
      { x: "", date: "Aug 06", value: 5.0 },
      { x: "2 weeks ago", date: "Aug 09", value: 5.8 },
      { x: "", date: "Aug 12", value: 6.2 },
      { x: "", date: "Aug 14", value: 6.6 },
      { x: "1 week ago", date: "Aug 16", value: 7.2 },
      { x: "", date: "Aug 17", value: 7.8 },
      { x: "", date: "Aug 18", value: 8.0 },
      { x: "This week", date: "Aug 19", value: 8.8, isCurrent: true, label: "6.0s" },
    ],
  },
  frontLever: {
    name: "Front Lever Hold",
    unit: "s",
    yMax: 14,
    ySteps: [14, 12, 10, 8, 6, 4, 2, 0],
    points: [
      { x: "4 weeks ago", date: "Jul 22", value: 4.5 },
      { x: "", date: "Jul 25", value: 5.0 },
      { x: "", date: "Jul 28", value: 5.5 },
      { x: "3 weeks ago", date: "Jul 31", value: 6.0 },
      { x: "", date: "Aug 03", value: 6.2 },
      { x: "", date: "Aug 06", value: 6.0 },
      { x: "2 weeks ago", date: "Aug 09", value: 6.8 },
      { x: "", date: "Aug 12", value: 7.0 },
      { x: "", date: "Aug 14", value: 7.2 },
      { x: "1 week ago", date: "Aug 16", value: 7.5 },
      { x: "", date: "Aug 17", value: 7.8 },
      { x: "", date: "Aug 18", value: 8.0 },
      { x: "This week", date: "Aug 19", value: 8.0, isCurrent: true, label: "8.0s" },
    ],
  },
  hspu: {
    name: "Handstand Push-Up",
    unit: "reps",
    yMax: 10,
    ySteps: [10, 8, 6, 4, 2, 0],
    points: [
      { x: "4 weeks ago", date: "Jul 22", value: 2 },
      { x: "", date: "Jul 25", value: 2 },
      { x: "", date: "Jul 28", value: 3 },
      { x: "3 weeks ago", date: "Jul 31", value: 3 },
      { x: "", date: "Aug 03", value: 3 },
      { x: "", date: "Aug 06", value: 4 },
      { x: "2 weeks ago", date: "Aug 09", value: 4 },
      { x: "", date: "Aug 12", value: 4 },
      { x: "", date: "Aug 14", value: 4 },
      { x: "1 week ago", date: "Aug 16", value: 5 },
      { x: "", date: "Aug 17", value: 5 },
      { x: "", date: "Aug 18", value: 5 },
      { x: "This week", date: "Aug 19", value: 5, isCurrent: true, label: "5 reps" },
    ],
  },
  muscleUp: {
    name: "Muscle-Up",
    unit: "reps",
    yMax: 12,
    ySteps: [12, 10, 8, 6, 4, 2, 0],
    points: [
      { x: "4 weeks ago", date: "Jul 22", value: 4 },
      { x: "", date: "Jul 25", value: 5 },
      { x: "", date: "Jul 28", value: 5 },
      { x: "3 weeks ago", date: "Jul 31", value: 6 },
      { x: "", date: "Aug 03", value: 6 },
      { x: "", date: "Aug 06", value: 6 },
      { x: "2 weeks ago", date: "Aug 09", value: 7 },
      { x: "", date: "Aug 12", value: 7 },
      { x: "", date: "Aug 14", value: 7 },
      { x: "1 week ago", date: "Aug 16", value: 8 },
      { x: "", date: "Aug 17", value: 8 },
      { x: "", date: "Aug 18", value: 8 },
      { x: "This week", date: "Aug 19", value: 8, isCurrent: true, label: "8 reps" },
    ],
  },
  dragonFlag: {
    name: "Dragon Flag",
    unit: "reps",
    yMax: 16,
    ySteps: [16, 12, 8, 4, 0],
    points: [
      { x: "4 weeks ago", date: "Jul 22", value: 7 },
      { x: "", date: "Jul 25", value: 8 },
      { x: "", date: "Jul 28", value: 8 },
      { x: "3 weeks ago", date: "Jul 31", value: 9 },
      { x: "", date: "Aug 03", value: 9 },
      { x: "", date: "Aug 06", value: 10 },
      { x: "2 weeks ago", date: "Aug 09", value: 10 },
      { x: "", date: "Aug 12", value: 10 },
      { x: "", date: "Aug 14", value: 11 },
      { x: "1 week ago", date: "Aug 16", value: 11 },
      { x: "", date: "Aug 17", value: 12 },
      { x: "", date: "Aug 18", value: 12 },
      { x: "This week", date: "Aug 19", value: 12, isCurrent: true, label: "12 reps" },
    ],
  },
};

export default function PerformanceTrendCard() {
  const [selectedSkillKey, setSelectedSkillKey] = useState("planche");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [showInfo, setShowInfo] = useState(false);

  const currentSkill = SKILL_DATA[selectedSkillKey];
  const points = currentSkill.points;
  const yMax = currentSkill.yMax;
  const ySteps = currentSkill.ySteps;

  // Chart dimensions
  const chartWidth = 560;
  const chartHeight = 180;
  const paddingLeft = 35;
  const paddingRight = 35;
  const paddingTop = 25;
  const paddingBottom = 25;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  // Map data points to SVG coordinates
  const coords = points.map((p, index) => {
    const x = paddingLeft + (index / (points.length - 1)) * innerWidth;
    const y = paddingTop + innerHeight - (p.value / yMax) * innerHeight;
    return { ...p, xCoord: x, yCoord: y, index };
  });

  // Build SVG path
  const pathD = coords.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M ${pt.xCoord} ${pt.yCoord}`;
    const prev = arr[i - 1];
    const cp1x = prev.xCoord + (pt.xCoord - prev.xCoord) / 2;
    const cp1y = prev.yCoord;
    const cp2x = prev.xCoord + (pt.xCoord - prev.xCoord) / 2;
    const cp2y = pt.yCoord;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${pt.xCoord} ${pt.yCoord}`;
  }, "");

  // Area under curve
  const areaD = `${pathD} L ${coords[coords.length - 1].xCoord} ${
    paddingTop + innerHeight
  } L ${coords[0].xCoord} ${paddingTop + innerHeight} Z`;

  const latestPoint = coords[coords.length - 1];

  return (
    <div className="bg-(--surface) border border-(--line) p-5 flex flex-col justify-between relative square-frame">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <h2 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            Performance Trend
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
                Tracks clean isometric hold duration or strict reps over time across your training sessions.
              </div>
            )}
          </div>
        </div>

        {/* Skill Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 btn-ghost text-xs font-medium"
          >
            <span>{currentSkill.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-1.5 w-48 bg-(--surface) border border-(--line-strong) z-50 py-1 backdrop-blur-xl animate-fade-in">
                {Object.entries(SKILL_DATA).map(([key, item]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedSkillKey(key);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-left text-zinc-300 hover:text-white hover:bg-white/[0.06] transition"
                  >
                    <span>{item.name}</span>
                    {selectedSkillKey === key && (
                      <Check className="w-3.5 h-3.5 text-(--accent)" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Subheader / Metric Label */}
      <div className="flex items-center gap-2 mb-4">
        <span className="w-4 h-px bg-(--accent)" />
        <span className="text-xs text-zinc-400">
          {currentSkill.name} ({currentSkill.unit})
        </span>
      </div>

      {/* Interactive Line Chart */}
      <div className="relative w-full h-[220px] select-none">
        {/* SVG Drawing Canvas */}
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Cyan glowing gradient fill */}
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff4d4d" stopOpacity="0.25" />
              <stop offset="60%" stopColor="#ff4d4d" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#ff4d4d" stopOpacity="0.0" />
            </linearGradient>

            {/* Glowing filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Horizontal Grid lines and Y-axis text */}
          {ySteps.map((step) => {
            const yPos =
              paddingTop + innerHeight - (step / yMax) * innerHeight;
            return (
              <g key={step}>
                <line
                  x1={paddingLeft}
                  y1={yPos}
                  x2={chartWidth - paddingRight}
                  y2={yPos}
                  stroke="#ffffff"
                  strokeOpacity="0.06"
                  strokeDasharray="2 3"
                />
                <text
                  x={paddingLeft - 8}
                  y={yPos + 3.5}
                  textAnchor="end"
                  fill="#71717a"
                  fontSize="9.5"
                  fontFamily="inherit"
                >
                  {step}{currentSkill.unit}
                </text>
              </g>
            );
          })}

          {/* Area Gradient Fill */}
          <path d={areaD} fill="url(#areaGradient)" />

          {/* Glowing Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#ff4d4d"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow)"
          />

          {/* Data Points */}
          {coords.map((pt, idx) => {
            const isHovered = hoveredPoint?.index === idx;
            const isLast = idx === coords.length - 1;

            return (
              <g key={idx}>
                {/* Outer halo for nodes */}
                <circle
                  cx={pt.xCoord}
                  cy={pt.yCoord}
                  r={isHovered || isLast ? 4 : 2.5}
                  fill="#ff4d4d"
                  className="transition-all duration-150 cursor-pointer"
                  onMouseEnter={() => setHoveredPoint(pt)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
                {(isHovered || isLast) && (
                  <circle
                    cx={pt.xCoord}
                    cy={pt.yCoord}
                    r={7}
                    fill="none"
                    stroke="#ff4d4d"
                    strokeWidth="1.5"
                    strokeOpacity="0.5"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating Highlight / Current Value Tooltip (like in screenshot "6.0s / Aug 19") */}
        <div
          className="absolute z-10 pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{
            left: `${((hoveredPoint || latestPoint).xCoord / chartWidth) * 100}%`,
            top: `${(((hoveredPoint || latestPoint).yCoord) / chartHeight) * 100}%`,
            marginTop: "-12px",
          }}
        >
          <div className="bg-(--surface-2)/95 border border-(--line-strong) px-2.5 py-1.5 text-center backdrop-blur-md">
            <p className="text-xs font-bold text-white leading-tight">
              {(hoveredPoint || latestPoint).label || `${(hoveredPoint || latestPoint).value}${currentSkill.unit}`}
            </p>
            <p className="text-[9px] text-zinc-400 leading-tight mt-0.5">
              {(hoveredPoint || latestPoint).date}
            </p>
          </div>
        </div>
      </div>

      {/* X-axis Timeline Labels */}
      <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-3 border-t border-white/[0.04] mt-2 px-1">
        <span>4 weeks ago</span>
        <span>3 weeks ago</span>
        <span>2 weeks ago</span>
        <span>1 week ago</span>
        <span>This week</span>
      </div>
    </div>
  );
}
