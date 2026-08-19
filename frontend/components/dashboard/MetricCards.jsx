"use client";

import React from "react";
import { TOP_METRICS } from "@/data/mockCalisthenicsData";
import { Flame, Clock, HeartPulse, Dumbbell, ArrowUpRight, ArrowDownRight, AlertTriangle } from "lucide-react";

export default function MetricCards() {
  const renderIcon = (iconName) => {
    switch (iconName) {
      case "Flame":
        return <Flame className="w-4 h-4 text-orange-400" />;
      case "Clock":
        return <Clock className="w-4 h-4 text-cyan-400" />;
      case "HeartPulse":
        return <HeartPulse className="w-4 h-4 text-rose-400" />;
      case "Dumbbell":
        return <Dumbbell className="w-4 h-4 text-purple-400" />;
      default:
        return <Flame className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {TOP_METRICS.map((metric) => (
        <div
          key={metric.id}
          className="relative bg-[#121215] border border-[#222228] p-4 square-frame transition-all duration-200 hover:border-zinc-700/80 hover:bg-[#15151a]"
        >
          {/* Card Top: Icon and Metric Label */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-[#1a1a20] border border-white/5 flex items-center justify-center">
              {renderIcon(metric.icon)}
            </div>
            <span className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
              {metric.label}
            </span>
          </div>

          {/* Card Middle: Primary Value and Units */}
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-2xl font-bold text-zinc-100 tracking-tight font-sans">
              {metric.value}
            </span>
            {metric.unit && (
              <span className="text-sm font-medium text-zinc-400">{metric.unit}</span>
            )}
            {metric.secondaryValue && (
              <span className="text-xs text-zinc-400 ml-1">({metric.secondaryValue})</span>
            )}
          </div>

          {/* Card Bottom: Trend / Tag Badge */}
          <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
            {metric.tag ? (
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[10px] font-semibold tracking-wider uppercase">
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                <span>{metric.tag}</span>
              </div>
            ) : metric.trend === "up" ? (
              <div className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>{metric.change}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400">
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>{metric.change}</span>
              </div>
            )}

            <span className="text-[10px] text-zinc-500 hidden sm:inline">{metric.subInfo}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
