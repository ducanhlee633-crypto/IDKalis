"use client";

import React, { useState, useEffect } from "react";
import { TOP_METRICS } from "@/data/mockCalisthenicsData";
import { Flame, Clock, HeartPulse, Dumbbell, ArrowUpRight, ArrowDownRight, AlertTriangle } from "lucide-react";
import { getStoredSession } from "@/lib/auth";
import { apiGetWorkoutStats } from "@/lib/workouts";

function formatWorkoutTime(totalMinutes) {
  if (totalMinutes == null || isNaN(totalMinutes)) return "--";
  if (totalMinutes === 0) return "0 m";
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0 && m > 0) return `${h} h ${m} m`;
  if (h > 0) return `${h} h`;
  return `${m} m`;
}

function formatChange(changePercent) {
  if (changePercent == null) return null;
  const sign = changePercent > 0 ? "+" : "";
  return `${sign}${changePercent}% VS LAST WEEK`;
}

export default function MetricCards() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchStats() {
      try {
        const session = getStoredSession();
        const token = session?.token;
        if (!token) {
          if (!cancelled) setLoading(false);
          return;
        }
        const data = await apiGetWorkoutStats(token);
        if (!cancelled) {
          setStats(data);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }
    fetchStats();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const filteredMetrics = TOP_METRICS.filter((m) => m.id !== "active-calories");

  // Build dynamic metrics: override WORKOUT TIME & AVG RPE & TOTAL WORKOUTS with real data
  const displayMetrics = filteredMetrics.map((metric) => {
    // WORKOUT TIME — fetch từ table workouts (duration_minutes sum 7d)
    if (metric.id === "workout-time") {
      if (loading && !stats) {
        return { ...metric, value: "…", unit: "", change: "LOADING…", trend: "flat", subInfo: "Fetching from workouts…" };
      }
      if (stats?.workoutTime) {
        const wt = stats.workoutTime;
        const formatted = formatWorkoutTime(wt.totalMinutesCurrent7d);
        const change = formatChange(wt.changePercent);
        const trend = wt.trend || (wt.changePercent == null ? "flat" : wt.changePercent >= 0 ? "up" : "down");
        return {
          ...metric,
          value: formatted,
          unit: "",
          change: change ?? (wt.totalMinutesPrev7d === 0 && wt.totalMinutesCurrent7d > 0 ? "NEW THIS WEEK" : "NO CHANGE"),
          trend: wt.changePercent == null ? "flat" : trend,
          subInfo: `${wt.totalMinutesCurrent7d} min in 7 days`,
        };
      }
      return metric;
    }

    // AVG INTENSITY & RPE — fetch avg_rpe từ table workouts
    if (metric.id === "avg-intensity") {
      if (loading && !stats) {
        return { ...metric, value: "…", unit: "RPE", secondaryValue: null, tag: null, change: "LOADING…", trend: "flat", subInfo: "Fetching from workouts…" };
      }
      if (stats?.avgRpe) {
        const rpe = stats.avgRpe;
        if (rpe.avgCurrent7d == null) {
          return {
            ...metric,
            value: "--",
            unit: "RPE",
            secondaryValue: null,
            tag: null,
            change: "NO DATA",
            trend: "flat",
            subInfo: "No RPE data in 7 days",
          };
        }
        const change = formatChange(rpe.changePercent);
        const trend = rpe.trend || "flat";
        // Tag logic: RPE >=8 cần chú ý
        const tag = rpe.avgCurrent7d >= 8 ? "NEED ATTENTION" : null;
        return {
          ...metric,
          value: rpe.avgCurrent7d.toFixed(1),
          unit: "RPE",
          secondaryValue: rpe.avgPrev7d != null ? `prev ${rpe.avgPrev7d.toFixed(1)}` : null,
          tag,
          change: change ?? "NO CHANGE",
          trend: tag ? undefined : trend, // tag ưu tiên hiển thị thay trend
          subInfo: rpe.avgPrev7d != null ? `Prev: ${rpe.avgPrev7d.toFixed(1)} RPE` : "Avg last 7 days",
        };
      }
      return metric;
    }

    // TOTAL WORKOUTS — cũng fetch thực để đồng bộ
    if (metric.id === "total-workouts") {
      if (loading && !stats) {
        return { ...metric, value: "…", unit: "in 7 days", change: "LOADING…", trend: "flat", subInfo: "Fetching from workouts…" };
      }
      if (stats?.totalWorkouts) {
        const tw = stats.totalWorkouts;
        const change = formatChange(tw.changePercent);
        const trend = tw.trend || "flat";
        return {
          ...metric,
          value: String(tw.countCurrent7d),
          unit: "in 7 days",
          change: change ?? (tw.countPrev7d === 0 && tw.countCurrent7d > 0 ? "NEW THIS WEEK" : "NO CHANGE"),
          trend: tw.changePercent == null ? "flat" : trend,
          subInfo: "Goal: 6 sessions/week",
        };
      }
      return metric;
    }

    return metric;
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {displayMetrics.map((metric) => (
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
            ) : metric.trend === "down" ? (
              <div className="inline-flex items-center gap-1 text-[11px] font-medium text-(--faint)">
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>{metric.change}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1 text-[11px] font-medium text-(--faint)">
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
