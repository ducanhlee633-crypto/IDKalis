"use client";

import React, { useEffect, useMemo, useState } from "react";
import BodyModelViewer from "./BodyModelViewer";
import { MUSCLE_FOCUS_DATA as FALLBACK_DATA } from "@/data/mockCalisthenicsData";
import { ChevronDown, Flame } from "lucide-react";
import { getStoredSession } from "@/lib/auth";
import { apiGetMuscleFocus } from "@/lib/dashboard";

function normalizeGroups(rawGroups) {
  if (!Array.isArray(rawGroups) || rawGroups.length === 0) return null;
  return rawGroups.map((g) => {
    let exercises = [];
    let exercisesWithCount = [];
    if (Array.isArray(g.exercises)) {
      if (g.exercises.length > 0 && typeof g.exercises[0] === "object" && g.exercises[0] !== null && "name" in g.exercises[0]) {
        exercisesWithCount = g.exercises;
        exercises = g.exercises.map((e) => e.name);
      } else {
        exercises = g.exercises;
        exercisesWithCount = g.exercises.map((name) => ({ name, count: 0 }));
      }
    } else if (Array.isArray(g.exercisesStr)) {
      exercises = g.exercisesStr;
      exercisesWithCount = g.exercisesStr.map((name) => ({ name, count: 0 }));
    }
    return { ...g, exercises, exercisesWithCount };
  });
}

export default function MuscleFocusWidget() {
  const [selectedMuscle, setSelectedMuscle] = useState(null);
  const [hoveredMuscle, setHoveredMuscle] = useState(null);
  const [timeRange, setTimeRange] = useState("THIS WEEK");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [groups, setGroups] = useState(normalizeGroups(FALLBACK_DATA));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState({ totalSets: 0, totalPoints: 0, isFallback: true, skippedSets: 0 });

  const activeMuscleId = hoveredMuscle || selectedMuscle;

  const topMuscle = useMemo(() => {
    if (!groups || groups.length === 0) return FALLBACK_DATA[0];
    return groups.reduce((max, m) => (m.percentage > max.percentage ? m : max), groups[0]);
  }, [groups]);

  const handleSelectMuscle = (id) => {
    setSelectedMuscle(selectedMuscle === id ? null : id);
  };

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      const session = getStoredSession();
      if (!session?.token) {
        // no token -> keep fallback but mark
        if (!cancelled) {
          setGroups(normalizeGroups(FALLBACK_DATA));
          setMeta((prev) => ({ ...prev, isFallback: true }));
          setError(null);
          setLoading(false);
        }
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await apiGetMuscleFocus(session.token, timeRange);
        if (cancelled) return;
        const normalized = normalizeGroups(data.groups);
        if (normalized) {
          setGroups(normalized);
          setMeta({
            totalSets: data.totalSets ?? 0,
            totalPoints: data.totalPoints ?? 0,
            skippedSets: data.skippedSets ?? 0,
            isFallback: false,
            from: data.from,
            to: data.to,
          });
        }
      } catch (e) {
        if (cancelled) return;
        // keep fallback data visible, show error banner
        setError(e?.message || "Failed to load muscle focus");
        // if we already have real data, keep it; otherwise fallback remains
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [timeRange]);

  const isEmpty = !loading && !error && meta.totalPoints === 0 && !meta.isFallback;
  const showFallbackBadge = meta.isFallback && !loading;

  return (
    <div className="relative bg-(--surface) border border-(--line) p-5 square-frame flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-px bg-(--accent)" />
            <h3 className="text-sm font-semibold text-zinc-100 tracking-tight">Muscle focus</h3>
            {loading && <span className="w-3 h-3 border border-zinc-600 border-t-[#0ea5e9] rounded-full animate-spin ml-1" />}
            {showFallbackBadge && <span className="text-[9px] px-1.5 py-0.5 border border-amber-500/30 text-amber-400 bg-amber-500/10">DEMO</span>}
          </div>
          <p className="text-[10px] text-(--faint) mt-0.5 tracking-wide">
            Calisthenics skills breakdown{!meta.isFallback && meta.totalSets > 0 ? ` · ${meta.totalSets} sets` : ""}
          </p>
        </div>

        {/* Dropdown Time Range */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="btn-ghost flex items-center gap-1.5 text-xs px-2.5 py-1"
          >
            <span>{timeRange}</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-32 bg-(--surface) border border-(--line-strong) py-1 z-30 text-xs">
              {["THIS WEEK", "LAST WEEK", "THIS MONTH"].map((range) => (
                <button
                  key={range}
                  onClick={() => {
                    setTimeRange(range);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-white/5 transition ${
                    timeRange === range ? "text-(--accent) font-medium" : "text-(--muted)"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-3 text-[11px] px-2.5 py-1.5 border border-red-500/30 bg-red-500/10 text-red-300 flex items-center justify-between gap-2">
          <span className="line-clamp-2">{error}</span>
          <button
            onClick={() => {
              setError(null);
              // trigger refetch by toggling range state
              setTimeRange((prev) => prev);
              // force effect re-run via temp loading
              const session = getStoredSession();
              if (session?.token) {
                setLoading(true);
                apiGetMuscleFocus(session.token, timeRange)
                  .then((data) => {
                    const n = normalizeGroups(data.groups);
                    if (n) setGroups(n);
                    setMeta({ totalSets: data.totalSets ?? 0, totalPoints: data.totalPoints ?? 0, skippedSets: data.skippedSets ?? 0, isFallback: false });
                    setError(null);
                  })
                  .catch((e) => setError(e?.message || "Failed to load"))
                  .finally(() => setLoading(false));
              }
            }}
            className="shrink-0 text-[10px] px-2 py-0.5 border border-red-400/30 hover:bg-red-500/20 transition"
          >
            Retry
          </button>
        </div>
      )}

      {isEmpty && (
        <div className="mb-3 text-[11px] px-2.5 py-2 border border-white/10 bg-white/[0.02] text-zinc-400 text-center">
          Chưa có dữ liệu tập trong {timeRange.toLowerCase()}. Hãy hoàn thành 1 buổi tập để xem breakdown.
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 flex-1 min-h-0">
        {/* Left: Body Model Canvas */}
        <div
          className="md:col-span-7 flex items-center justify-center border border-(--line) relative overflow-hidden min-h-[290px]"
          style={{
            background:
              "radial-gradient(130% 90% at 50% 22%, rgba(14,165,255,0.09), transparent 62%), radial-gradient(90% 70% at 50% 95%, rgba(14,165,255,0.04), transparent 60%), rgba(10,10,13,0.6)",
          }}
        >
          <BodyModelViewer
            selectedMuscle={selectedMuscle}
            onSelectMuscle={handleSelectMuscle}
            hoveredMuscle={hoveredMuscle}
            onHoverMuscle={setHoveredMuscle}
            muscleData={groups}
          />
        </div>

        {/* Right: Muscle Percentage Breakdown */}
        <div className="md:col-span-5 flex flex-col justify-center space-y-1.5 px-0.5">
          {(groups || FALLBACK_DATA).map((item) => {
            const isActive = activeMuscleId === item.id;
            const isSelected = selectedMuscle === item.id;
            const pct = typeof item.percentage === "number" ? item.percentage : 0;
            const exercises = item.exercises || [];
            const exercisesWithCount = item.exercisesWithCount || exercises.map((name) => ({ name, count: 0 }));
            return (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredMuscle(item.id)}
                onMouseLeave={() => setHoveredMuscle(null)}
                onClick={() => handleSelectMuscle(item.id)}
                className={`group cursor-pointer px-2.5 py-1.5 border-l-2 transition-all duration-150 ${
                  isActive
                    ? "border-[#0ea5e9] bg-[rgba(14,165,255,0.08)]"
                    : "border-transparent hover:bg-white/[0.02]"
                } ${loading ? "opacity-60" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        isActive
                          ? "bg-[#0ea5e9] shadow-[0_0_8px_rgba(14,165,255,0.9)]"
                          : "bg-(--faint) group-hover:bg-(--muted)"
                      }`}
                    />
                    <span
                      className={`text-[11px] font-bold tracking-widest transition ${
                        isActive ? "text-[#0ea5e9]" : "text-(--muted) group-hover:text-zinc-200"
                      }`}
                    >
                      {item.name}
                    </span>
                    <span
                      className={`hidden xl:inline text-[8.5px] uppercase tracking-wider px-1 py-px border transition ${
                        isActive
                          ? "border-[rgba(14,165,255,0.28)] text-[#0ea5e9]/80"
                          : "border-(--line) text-(--faint)"
                      }`}
                    >
                      {item.skillsCategory}
                    </span>
                  </div>

                  <span
                    className={`font-display text-[11px] tnum transition ${
                      isActive ? "text-[#0ea5e9] font-bold" : "text-(--faint) group-hover:text-(--muted)"
                    }`}
                  >
                    {pct}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-[3px] bg-(--surface-3) mt-1.5">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isActive ? "bg-[#0ea5e9] shadow-[0_0_6px_rgba(14,165,255,0.5)]" : "bg-zinc-700 group-hover:bg-zinc-500"
                    }`}
                    style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
                  />
                </div>

                {/* Exercises (chỉ hiện khi chọn) */}
                {isSelected && (
                  <div className="flex flex-wrap gap-1 mt-1.5 animate-fade-in">
                    {exercises.length > 0 ? (
                      exercisesWithCount.map((ex) => (
                        <span
                          key={ex.name}
                          className="text-[8.5px] px-1.5 py-0.5 bg-(--surface-3) border border-(--line) text-(--muted) flex items-center gap-1"
                          title={ex.count ? `${ex.count} sets` : undefined}
                        >
                          <span>{ex.name}</span>
                          {ex.count > 0 && <span className="text-[7px] px-1 py-px bg-white/10 border border-white/10 rounded-sm">{ex.count}</span>}
                        </span>
                      ))
                    ) : (
                      <span className="text-[8.5px] text-(--faint) italic">Không có bài tập nổi bật trong khoảng này</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Summary */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-(--line) text-[10px]">
        <span className="uppercase tracking-[0.18em] text-(--faint)">
          {isEmpty ? "No data" : `Total focus · ${meta.isFallback ? "DEMO" : `${groups.reduce((s, g) => s + (g.percentage || 0), 0).toFixed(1)}%`}`}
        </span>
        <span className="flex items-center gap-1.5 text-[#0ea5e9]">
          <Flame className="w-3 h-3" />
          <span className="uppercase tracking-wider">
            Top: {topMuscle.name} · {topMuscle.percentage}%
          </span>
        </span>
      </div>
    </div>
  );
}
