"use client";

import React, { useState } from "react";
import { X, Calendar, Check, Loader2 } from "lucide-react";

const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_SHORT = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

/**
 * Modal hiển thị 7 ngày trong tuần để assign routine.
 * Props:
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - routines: array của RoutineResponse ({id, name, category, timeEst/time_est, exercises})
 *  - schedules: array 7 items [{dayOfWeek/day_of_week, routineId/routine_id, routine, ...}]
 *  - onUpdateDay: (dayOfWeek: number, routineId: string|null) => Promise<void>
 *  - loading: boolean (đang fetch schedules lần đầu)
 *  - error: string|null
 */
export default function TrainingScheduleModal({
  isOpen,
  onClose,
  routines = [],
  schedules = [],
  onUpdateDay,
  loading = false,
  error = null,
}) {
  const [savingDay, setSavingDay] = useState(null);
  const [saveError, setSaveError] = useState(null);

  if (!isOpen) return null;

  // Normalize schedules thành map day -> routineId
  const byDay = {};
  for (const s of schedules) {
    const dow = s.dayOfWeek ?? s.day_of_week ?? s.day;
    const rid = s.routineId ?? s.routine_id ?? s.routine_id;
    // normalize null/undefined/"" -> null
    const norm = rid && String(rid).trim() !== "" ? String(rid) : null;
    if (dow != null) byDay[Number(dow)] = { routineId: norm, routine: s.routine ?? null, raw: s };
  }

  const handleChange = async (day, newRoutineId) => {
    const normalized = newRoutineId === "" || newRoutineId == null ? null : String(newRoutineId);
    setSavingDay(day);
    setSaveError(null);
    try {
      await onUpdateDay(day, normalized);
    } catch (err) {
      setSaveError(err?.message || "Failed to update schedule");
    } finally {
      setSavingDay(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-(--surface) border border-(--line-strong) w-full max-w-4xl square-frame max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-4 border-b border-(--line)">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-(--accent-soft) border border-(--accent-line) flex items-center justify-center text-(--accent)">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 tracking-tight flex items-center gap-2">
                Training Schedule
                <span className="text-[10px] font-semibold tracking-[0.14em] uppercase px-1.5 py-0.5 bg-(--accent-soft) border border-(--accent-line) text-(--accent)">
                  7 DAYS
                </span>
              </h2>
              <p className="text-[11px] text-(--muted) mt-0.5">Assign routine cho từng ngày — để trống = Rest Day (auto-save từng ngày)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-(--faint) hover:text-zinc-300 p-1.5 hover:bg-white/5 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading && <div className="text-xs text-(--muted) py-8 text-center flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Đang tải lịch tập...</div>}

          {!loading && error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-3 py-3 mb-4">
              {error}
            </div>
          )}

          {!loading && saveError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-3 py-2.5 mb-4 flex items-center justify-between">
              <span>{saveError}</span>
              <button onClick={() => setSaveError(null)} className="text-red-300 hover:text-red-100 ml-3">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Legend */}
              <div className="flex items-center gap-3 mb-4 text-[10px] text-(--faint)">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-(--accent) inline-block" /> Assigned
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-(--surface-3) border border-(--line) inline-block" /> Rest Day
                </span>
                <span className="ml-auto text-[10px] text-(--faint)">PATCH auto-save</span>
              </div>

              {/* 7-day grid — mobile 1 col, tablet 2 cols, desktop 7 cols alternative + list mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
                {DAY_LABELS.map((label, idx) => {
                  const entry = byDay[idx];
                  const routineId = entry?.routineId ?? null;
                  const routine = entry?.routine ?? routines.find((r) => r.id === routineId) ?? null;
                  const isRest = !routineId;
                  const isSaving = savingDay === idx;
                  const timeEst = routine ? (routine.timeEst ?? routine.time_est ?? routine.duration ?? 0) : null;
                  const exercisesCount = routine && Array.isArray(routine.exercises) ? routine.exercises.length : 0;

                  return (
                    <div
                      key={idx}
                      className={`bg-(--surface-3) border p-3 flex flex-col gap-3 transition ${
                        isRest ? "border-(--line) opacity-90" : "border-(--accent-line) bg-(--accent-soft)/30"
                      }`}
                    >
                      {/* Day header */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[10px] font-bold tracking-[0.16em] uppercase text-(--faint)">{DAY_SHORT[idx]}</div>
                          <div className="text-xs font-semibold text-zinc-100">{label}</div>
                        </div>
                        <div
                          className={`w-6 h-6 flex items-center justify-center border text-[10px] font-bold ${
                            isRest
                              ? "bg-(--surface) border-(--line) text-(--faint)"
                              : "bg-(--accent) border-(--accent) text-black"
                          }`}
                        >
                          {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : isRest ? "—" : <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>

                      {/* Routine info preview */}
                      <div className="min-h-[56px] bg-(--surface) border border-(--line) p-2.5">
                        {isRest ? (
                          <div className="text-center py-2">
                            <div className="text-xs font-semibold text-(--faint)">Rest Day</div>
                            <div className="text-[10px] text-(--faint) mt-0.5">No routine assigned</div>
                          </div>
                        ) : routine ? (
                          <div>
                            <div className="text-xs font-bold text-zinc-100 truncate" title={routine.name}>
                              {routine.name}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[9px] font-bold tracking-wider uppercase px-1 py-0.5 border bg-(--surface-3) border-(--line) text-(--accent)">
                                {routine.category}
                              </span>
                              <span className="text-[10px] text-(--muted)">
                                {typeof timeEst === "number" ? `${timeEst} min` : timeEst} • {exercisesCount} ex
                              </span>
                            </div>
                            {routine.note ? (
                              <div className="text-[10px] text-(--faint) truncate mt-1" title={routine.note}>
                                {routine.note}
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <div className="text-xs text-amber-400/80">Routine not found</div>
                        )}
                      </div>

                      {/* Selector — auto-save on change */}
                      <div className="mt-auto">
                        <label className="block text-[10px] font-semibold text-(--faint) uppercase tracking-[0.14em] mb-1.5">
                          Routine {isSaving && <span className="text-(--accent) normal-case tracking-normal">— saving…</span>}
                        </label>
                        <div className="relative">
                          <select
                            value={routineId ?? ""}
                            onChange={(e) => handleChange(idx, e.target.value || null)}
                            disabled={isSaving}
                            className="w-full bg-[#0d0d10] border border-white/10 text-zinc-200 text-xs px-2.5 py-2 pr-7 outline-none focus:border-(--accent-line) transition disabled:opacity-50 appearance-none"
                          >
                            <option value="">— Rest Day —</option>
                            {routines.length === 0 && <option disabled>No routines available</option>}
                            {routines.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name} [{r.category}]
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-zinc-500">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="m6 9 6 6 6-6" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Empty routines hint */}
              {routines.length === 0 && (
                <div className="mt-4 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs px-3 py-2.5">
                  Chưa có routine nào. Hãy tạo routine trước rồi quay lại assign vào lịch.
                </div>
              )}

              {/* Footer tip */}
              <div className="mt-5 p-3 bg-(--surface-3) border border-(--line) text-[11px] text-(--muted) leading-relaxed">
                <span className="font-semibold text-zinc-300">Tip:</span> Mỗi ngày chỉ assign 1 routine. Để ngày nghỉ, chọn <span className="text-zinc-200">— Rest Day —</span>. Thay đổi sẽ tự động lưu (PATCH) — không cần nút Save.
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-(--line) bg-(--surface-2)/50">
          <span className="text-[11px] text-(--faint)">{savingDay !== null ? "Saving..." : "Auto-saved per day"}</span>
          <button onClick={onClose} className="btn-ghost border border-(--line) text-xs px-5 py-2 hover:bg-white/5 transition">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
