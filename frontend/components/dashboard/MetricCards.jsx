"use client";

import React from "react";
import { TOP_METRICS } from "@/data/mockCalisthenicsData";
import { Flame, Clock, HeartPulse, Dumbbell, ArrowUpRight, ArrowDownRight, AlertTriangle } from "lucide-react";

export default function MetricCards() {
  const renderIcon = (iconName) => {
    switch (iconName) {
      case "Flame":
        return <Flame className="w-3.5 h-3.5" />;
      case "Clock":
        return <Clock className="w-3.5 h-3.5" />;
      case "HeartPulse":
        return <HeartPulse className="w-3.5 h-3.5" />;
      case "Dumbbell":
        return <Dumbbell className="w-3.5 h-3.5" />;
      default:
        return <Flame className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {TOP_METRICS.map((metric) => (
        <div
          key={metric.id}
          className="relative bg-(--surface) border border-(--line) p-4 square-frame transition-all duration-200 hover:bg-(--surface-2)"
        >
          {/* Card Top: Icon and Metric Label */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-(--faint)">{renderIcon(metric.icon)}</span>
            <span className="text-[10px] font-semibold tracking-[0.18em] text-(--muted) uppercase">
              {metric.label}
            </span>
          </div>

          {/* Card Middle: Primary Value */}
          <div className="flex items-baseline gap-2 mb-3">
            <span className="font-display text-2xl font-semibold text-zinc-50 tracking-tight tnum">
              {metric.value}
            </span>
            {metric.unit && <span className="text-sm font-medium text-(--faint)">{metric.unit}</span>}
            {metric.secondaryValue && (
              <span className="text-xs text-(--faint) ml-1">({metric.secondaryValue})</span>
            )}
          </div>

          {/* Card Bottom: Trend */}
          <div className="flex items-center justify-between pt-1 border-t border-(--line)">
            {metric.tag ? (
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-(--accent-soft) border border-(--accent-line) text-(--accent) text-[10px] font-semibold tracking-wider uppercase">
                <AlertTriangle className="w-3 h-3" />
                <span>{metric.tag}</span>
              </div>
            ) : metric.trend === "up" ? (
              <div className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-100">
                <ArrowUpRight className="w-3.5 h-3.5 text-(--accent)" />
                <span>{metric.change}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1 text-[11px] font-medium text-(--faint)">
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>{metric.change}</span>
              </div>
            )}

            <span className="text-[10px] text-(--faint) hidden sm:inline">{metric.subInfo}</span>
          </div>
        </div>
      ))}
    </div>
  );
}