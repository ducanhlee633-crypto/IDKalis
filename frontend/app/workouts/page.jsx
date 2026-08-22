"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { WORKOUT_PROGRAMS_DETAIL } from "@/data/mockCalisthenicsData";
import { Plus, Clock, Zap, Play, StickyNote, Trash2, Calendar, Layers, Link2, Timer, Target, TrendingUp, Sparkles } from "lucide-react";
import ActiveWorkoutPage from "@/components/workout/ActiveWorkoutPage";
import CreateRoutinePage from "@/components/workout/CreateRoutinePage";
import TrainingScheduleModal from "@/components/workout/TrainingScheduleModal";
import { getStoredSession } from "@/lib/auth";
import { apiListRoutines, apiCreateRoutine, apiDeleteRoutine } from "@/lib/routines";
import { apiListTrainingSchedule, apiUpdateTrainingScheduleDay } from "@/lib/trainingSchedule";
import { apiListGoals } from "@/lib/goals";

// Helper: build superset groups for display (same logic as CreateRoutinePage / ActiveWorkoutPage)
function buildSupersetGroups(exercises) {
  const groups = [];
  let i = 0;
  while (i < exercises.length) {
    const cur = exercises[i];
    if (typeof cur === "string") {
      groups.push({ type: "single", exercises: [cur] });
      i += 1;
      continue;
    }
    const nxt = exercises[i + 1];
    if (cur.supersetId && nxt && typeof nxt !== "string" && cur.supersetId === nxt.supersetId) {
      groups.push({ type: "superset", supersetId: cur.supersetId, exercises: [cur, nxt] });
      i += 2;
    } else {
      groups.push({ type: "single", exercises: [cur] });
      i += 1;
    }
  }
  return groups;
}

function getSupersetLabelMap(exercises) {
  const map = new Map();
  let counter = 0;
  const seen = new Set();
  exercises.forEach((ex) => {
    if (typeof ex === "string") return;
    if (ex.supersetId && !seen.has(ex.supersetId)) {
      seen.add(ex.supersetId);
      map.set(ex.supersetId, String.fromCharCode(65 + counter));
      counter++;
    }
  });
  return map;
}

function getRestSeconds(ex) {
  if (!ex || typeof ex === "string") return null;
  const raw = ex.restSeconds ?? ex.rest_seconds ?? ex.restTime ?? ex.rest_time ?? null;
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  return Number.isNaN(n) ? null : n;
}
function formatRestShort(seconds) {
  const n = Number(seconds);
  if (Number.isNaN(n)) return "";
  if (n < 60) return `${n}s`;
  const m = Math.floor(n / 60);
  const s = n % 60;
  return s ? `${m}m ${s}s` : `${m}m`;
}

export default function WorkoutsPage() {
  const [filter, setFilter] = useState("ALL");
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [creatingRoutine, setCreatingRoutine] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  const categories = ["ALL", "PUSH", "PULL", "CORE", "LEGS", "SKILLS"];

  // DB-backed routines (đã xoá mock workoutPrograms)
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Goals map để hiển thị tên goal trong routine
  const [goalsMap, setGoalsMap] = useState({});

  // Training schedule state (7 days, PATCH từng ngày)
  const [schedules, setSchedules] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState(null);

  const fetchSchedules = useCallback(async () => {
    setScheduleLoading(true);
    setScheduleError(null);
    try {
      const session = getStoredSession();
      const token = session?.token;
      if (!token) {
        setSchedules([]);
        setScheduleError("Bạn cần đăng nhập để xem lịch tập.");
        return;
      }
      const data = await apiListTrainingSchedule(token);
      setSchedules(Array.isArray(data) ? data : []);
    } catch (err) {
      setScheduleError(err?.message || "Không tải được lịch tập.");
      setSchedules([]);
    } finally {
      setScheduleLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch schedules on mount
    fetchSchedules().catch((e) => {
      console.error("fetchSchedules unhandled", e);
      setScheduleError(e?.message || "Không tải được lịch tập.");
      setScheduleLoading(false);
    });
  }, [fetchSchedules]);

  const handleUpdateScheduleDay = useCallback(
    async (dayOfWeek, routineId) => {
      const session = getStoredSession();
      const token = session?.token;
      if (!token) throw new Error("Bạn cần đăng nhập.");
      const updated = await apiUpdateTrainingScheduleDay(token, dayOfWeek, routineId);
      // Cập nhật local schedules: thay entry của dayOfWeek bằng updated
      setSchedules((prev) => {
        const next = [...prev];
        const idx = next.findIndex((s) => (s.dayOfWeek ?? s.day_of_week) === dayOfWeek);
        if (idx >= 0) next[idx] = updated;
        else next.push(updated);
        return next.sort((a, b) => (a.dayOfWeek ?? a.day_of_week) - (b.dayOfWeek ?? b.day_of_week));
      });
      return updated;
    },
    []
  );

  // Khi mở modal thì refresh schedules để đồng bộ nếu routines vừa thay đổi
  const handleOpenSchedule = useCallback(() => {
    setShowSchedule(true);
    fetchSchedules();
  }, [fetchSchedules]);

  const fetchRoutines = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const session = getStoredSession();
      const token = session?.token;
      if (!token) {
        setRoutines([]);
        setFetchError("Bạn cần đăng nhập để xem routines.");
        return;
      }
      const data = await apiListRoutines(token);
      setRoutines(Array.isArray(data) ? data : []);
    } catch (err) {
      setFetchError(err?.message || "Không tải được routines.");
      setRoutines([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch routines on mount
    fetchRoutines().catch((e) => {
      console.error("fetchRoutines unhandled", e);
      setFetchError(e?.message || "Không tải được routines.");
      setLoading(false);
    });
  }, [fetchRoutines]);

  // Fetch goals để map goalId -> title cho badge
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = getStoredSession();
        const token = session?.token;
        if (!token) return;
        const data = await apiListGoals(token);
        if (!cancelled && Array.isArray(data)) {
          const map = {};
          data.forEach((g) => { map[g.id] = g; });
          setGoalsMap(map);
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  const filteredPrograms =
    filter === "ALL" ? routines : routines.filter((p) => p.category === filter);

  const handleStartWorkout = (programId) => {
    const programDetail = WORKOUT_PROGRAMS_DETAIL[programId];
    const customRoutine = routines.find((r) => r.id === programId);
    if (programDetail) {
      setActiveWorkout(programDetail);
    } else if (customRoutine) {
      setActiveWorkout(customRoutine);
    }
  };

  const handleFinishWorkout = () => {
    setActiveWorkout(null);
  };

  const handleSaveRoutine = async (routine) => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const session = getStoredSession();
      const token = session?.token;
      if (!token) throw new Error("Bạn cần đăng nhập để lưu routine.");
      // routine từ CreateRoutinePage: { name, category, timeEst (locked int), note, exercises:[{name, target, inputType, defaultSets: [{reps, time/weight/note, rpe}], supersetId}] }
      const payload = {
        name: routine.name,
        category: routine.category,
        exercises: routine.exercises || [],
        note: routine.note || "",
        timeEst: Number(routine.timeEst ?? routine.time_est ?? 0),
      };
      const created = await apiCreateRoutine(token, payload);
      setRoutines((prev) => [created, ...prev]);
      setCreatingRoutine(false);
    } catch (err) {
      setSaveError(err?.message || "Lưu routine thất bại.");
      // vẫn ở lại trang tạo để user thử lại
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRoutine = async (routineId) => {
    if (!confirm("Xoá routine này?")) return;
    try {
      const session = getStoredSession();
      const token = session?.token;
      if (!token) throw new Error("Bạn cần đăng nhập.");
      await apiDeleteRoutine(token, routineId);
      setRoutines((prev) => prev.filter((r) => r.id !== routineId));
      // Đồng bộ schedules: ngày nào đang assign routine này sẽ thành Rest (DB FK SET NULL, nhưng update local ngay)
      setSchedules((prev) =>
        prev.map((s) => {
          const rid = s.routineId ?? s.routine_id;
          if (rid === routineId) return { ...s, routineId: null, routine_id: null, routine: null };
          return s;
        })
      );
    } catch (err) {
      alert(err?.message || "Xoá routine thất bại.");
    }
  };

  // Adapter cho CreateRoutinePage để hiển thị lỗi save (nếu cần)
  const handleCreateSave = async (routine) => {
    try {
      await handleSaveRoutine(routine);
    } catch {
      // error đã set ở saveError, không navigate
    }
  };

  if (creatingRoutine) {
    return (
      <div className="space-y-3">
        {saveError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-3 py-2">
            {saveError}
          </div>
        )}
        {isSaving && <div className="text-xs text-(--muted)">Đang lưu routine...</div>}
        <CreateRoutinePage
          onSave={handleCreateSave}
          onCancel={() => {
            setSaveError(null);
            setCreatingRoutine(false);
          }}
        />
      </div>
    );
  }

  if (activeWorkout) {
    return (
      <ActiveWorkoutPage
        program={activeWorkout}
        onFinish={handleFinishWorkout}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-zinc-50 tracking-tight">Workouts & Routines</h1>
          <p className="text-xs text-(--muted) mt-1">
            Calisthenics programs, isometric progressions, and strength routines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenSchedule}
            className="flex items-center gap-2 bg-(--surface) border border-(--line) hover:bg-(--surface-2) text-zinc-200 text-xs px-4 py-2 active:scale-[0.98] transition"
          >
            <Calendar className="w-4 h-4 text-(--accent)" />
            <span>Training Schedule</span>
          </button>
          <button
            onClick={() => setCreatingRoutine(true)}
            className="flex items-center gap-2 btn-accent text-xs px-4 py-2 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Create Routine</span>
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3.5 py-1.5 text-xs font-medium border-l-2 transition ${
              filter === cat
                ? "border-(--accent) bg-(--accent-soft) text-(--accent)"
                : "border-transparent bg-(--surface) border-(--line) text-(--muted) hover:text-zinc-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Loading / Error / Empty */}
      {loading && <div className="text-xs text-(--muted) py-8 text-center">Đang tải routines...</div>}
      {!loading && fetchError && (
        <div className="bg-(--surface) border border-(--line) p-4 text-center space-y-2">
          <p className="text-xs text-amber-400">{fetchError}</p>
          <button onClick={fetchRoutines} className="text-xs btn-ghost px-3 py-1.5">
            Thử lại
          </button>
        </div>
      )}
      {!loading && !fetchError && filteredPrograms.length === 0 && (
        <div className="bg-(--surface) border border-dashed border-(--line-strong) p-10 text-center">
          <p className="text-sm text-(--muted) mb-1">Chưa có routine nào.</p>
          <p className="text-xs text-(--faint) mb-4">
            {filter === "ALL" ? "Tạo routine đầu tiên để bắt đầu." : `Không có routine nào thuộc ${filter}.`}
          </p>
          <button
            onClick={() => setCreatingRoutine(true)}
            className="inline-flex items-center gap-2 btn-accent text-xs px-5 py-2.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Routine</span>
          </button>
        </div>
      )}

      {/* Weekly Schedule Preview — compact strip */}
      {!loading && !scheduleLoading && schedules.length === 7 && (
        <div className="bg-(--surface) border border-(--line) p-3">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] font-bold tracking-[0.16em] uppercase text-(--accent) flex items-center gap-1.5">
              <Calendar className="w-3 h-3" /> Weekly Schedule
            </span>
            <button onClick={handleOpenSchedule} className="text-[10px] text-(--muted) hover:text-zinc-200 underline">
              Edit
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((short, idx) => {
              const entry = schedules.find((s) => (s.dayOfWeek ?? s.day_of_week) === idx);
              const rid = entry?.routineId ?? entry?.routine_id ?? null;
              const routine = entry?.routine ?? (rid ? routines.find((r) => r.id === rid) : null);
              const isRest = !rid;
              return (
                <div
                  key={short}
                  className={`text-center p-2 border text-[10px] leading-tight ${isRest ? "bg-(--surface-3) border-(--line) text-(--faint)" : "bg-(--accent-soft) border-(--accent-line) text-zinc-100"}`}
                  title={routine ? routine.name : "Rest Day"}
                >
                  <div className="font-bold tracking-wider">{short}</div>
                  <div className="truncate mt-1 font-medium max-w-full">
                    {isRest ? "Rest" : (routine?.name ?? "—")}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Workout Programs Grid — DB data (đã xoá mock) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredPrograms.map((prog) => {
          const timeEst = prog.timeEst ?? prog.time_est ?? prog.duration ?? 0;
          const timeLabel = typeof timeEst === "number" ? `${timeEst} min` : String(timeEst);
          // exercises jsonb: snapshot gồm reps/sets
          const exercises = Array.isArray(prog.exercises) ? prog.exercises : [];
          const supersetMap = getSupersetLabelMap(exercises);
          const supersetGroups = buildSupersetGroups(exercises);
          const supersetCount = supersetMap.size;

          return (
            <div
              key={prog.id}
              className="bg-(--surface) border border-(--line) p-5 square-frame hover:bg-(--surface-2) transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-[10px] font-bold text-(--accent) tracking-[0.18em] uppercase">
                    {prog.category}
                  </span>
                  <h3 className="font-display text-base font-semibold text-zinc-100 mt-0.5 flex items-center gap-2 flex-wrap">
                    {prog.name}
                    {supersetCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-(--accent-soft) border border-(--accent-line) text-(--accent) text-[9px] font-bold tracking-wider">
                        <Layers className="w-2.5 h-2.5" /> {supersetCount} SUPERSET{supersetCount > 1 ? "S" : ""}
                      </span>
                    )}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-(--surface-3) border border-(--line) text-(--muted) text-[10px] font-medium">
                    {timeLabel}
                  </span>
                  <button
                    onClick={() => handleDeleteRoutine(prog.id)}
                    title="Delete routine"
                    className="p-1.5 text-(--faint) hover:text-red-400 hover:bg-red-500/10 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Exercise List — render từ jsonb snapshot (có reps/sets) + superset grouping */}
              <div className="space-y-2 my-3 bg-(--surface-3) p-3 border border-(--line)">
                {exercises.length === 0 ? (
                  <span className="text-xs text-(--faint)">No exercises</span>
                ) : (
                  supersetGroups.map((group, gIdx) => {
                    if (group.type === "superset") {
                      const label = supersetMap.get(group.supersetId);
                      return (
                        <div
                          key={group.supersetId || gIdx}
                          className="border border-(--accent-line) bg-(--accent-soft)/40 p-2 space-y-1.5"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-(--accent) text-white text-[8px] font-bold tracking-wider leading-none">
                              <Layers className="w-2.5 h-2.5" /> SUPERSET {label}
                            </span>
                            <span className="text-[10px] text-(--accent) font-medium flex items-center gap-1">
                              <Link2 className="w-2.5 h-2.5" /> Tập liên tiếp
                            </span>
                          </div>
                          {group.exercises.map((ex, innerIdx) => {
                            if (typeof ex === "string") {
                              return (
                                <div key={innerIdx} className="flex items-center gap-2 text-xs text-zinc-300 ml-1">
                                  <span className="w-1.5 h-1.5 bg-(--accent) shrink-0" />
                                  <span>{ex}</span>
                                </div>
                              );
                            }
                            const setsInfo = ex.defaultSets
                              ? `${ex.defaultSets.length} sets • ${ex.defaultSets.map((s) => s.reps ?? s.time ?? s.weight ?? s.note ?? "-").join("/")}`
                              : ex.target || "";
                            const restRaw = getRestSeconds(ex);
                            const restSec = restRaw ?? 90;
                            const isDefaultRest = restRaw == null;
                            const gl = ex.goalLink || ex.goal_link;
                            const linkedGoal = gl?.goalId ? goalsMap[gl.goalId] : null;
                            return (
                              <div key={ex.id || innerIdx} className="flex items-center gap-2 text-xs text-zinc-100 ml-1 flex-wrap">
                                <span className="w-1.5 h-1.5 bg-white shrink-0" />
                                <span className="flex-1 min-w-0 truncate">
                                  <span className="font-medium">{ex.name}</span>
                                  {ex.target ? <span className="text-zinc-300"> — {ex.target}</span> : null}
                                  {setsInfo ? <span className="text-zinc-400 hidden sm:inline"> • {setsInfo}</span> : null}
                                  {gl?.goalId && (
                                    <span className={`ml-1.5 inline-flex items-center gap-1 px-1 py-0.5 border text-[9px] font-bold tracking-wide ${gl.type === "direct" ? "bg-(--accent-soft) border-(--accent-line) text-(--accent)" : "bg-amber-500/10 border-amber-500/30 text-amber-400"}`}>
                                      {gl.type === "direct" ? <Sparkles className="w-2.5 h-2.5" /> : <TrendingUp className="w-2.5 h-2.5" />}
                                      {linkedGoal ? linkedGoal.title : gl.goalId.slice(0,6)} {gl.type === "indirect" ? `+${gl.indirectGain ?? 3}%` : ""}
                                    </span>
                                  )}
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 border text-[10px] font-medium shrink-0 ${isDefaultRest ? "bg-[#1a1a1e] border-white/10 text-zinc-500" : "bg-[#1a1a1e] border-(--accent-line) text-(--accent)"}`}
                                  title={isDefaultRest ? "Mặc định 90s (routine cũ)" : `Rest ${formatRestShort(restSec)}`}
                                >
                                  <Timer className="w-3 h-3" />
                                  {formatRestShort(restSec)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }
                    const ex = group.exercises[0];
                    if (typeof ex === "string") {
                      return (
                        <div key={gIdx} className="flex items-center gap-2 text-xs text-zinc-300">
                          <span className="w-1.5 h-1.5 bg-(--accent)" />
                          <span>{ex}</span>
                        </div>
                      );
                    }
                    const setsInfo = ex.defaultSets
                      ? `${ex.defaultSets.length} sets • ${ex.defaultSets.map((s) => s.reps ?? s.time ?? s.weight ?? s.note ?? "-").join("/")}`
                      : ex.target || "";
                    const restRawSingle = getRestSeconds(ex);
                    const restSecSingle = restRawSingle ?? 90;
                    const isDefaultSingle = restRawSingle == null;
                    const glSingle = ex.goalLink || ex.goal_link;
                    const linkedGoalSingle = glSingle?.goalId ? goalsMap[glSingle.goalId] : null;
                    return (
                      <div key={ex.id || gIdx} className="flex items-center gap-2 text-xs text-zinc-300 flex-wrap">
                        <span className="w-1.5 h-1.5 bg-(--accent) shrink-0" />
                        <span className="flex-1 min-w-0 truncate">
                          <span className="font-medium text-zinc-200">{ex.name}</span>
                          {ex.target ? <span className="text-zinc-400"> — {ex.target}</span> : null}
                          {setsInfo ? <span className="text-(--faint) hidden sm:inline"> • {setsInfo}</span> : null}
                          {glSingle?.goalId && (
                            <span className={`ml-1.5 inline-flex items-center gap-1 px-1 py-0.5 border text-[9px] font-bold tracking-wide ${glSingle.type === "direct" ? "bg-(--accent-soft) border-(--accent-line) text-(--accent)" : "bg-amber-500/10 border-amber-500/30 text-amber-400"}`}>
                              {glSingle.type === "direct" ? <Sparkles className="w-2.5 h-2.5" /> : <TrendingUp className="w-2.5 h-2.5" />}
                              {linkedGoalSingle ? linkedGoalSingle.title : glSingle.goalId.slice(0,6)} {glSingle.type === "indirect" ? `+${glSingle.indirectGain ?? 3}%` : ""}
                            </span>
                          )}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 border text-[10px] font-medium shrink-0 ${isDefaultSingle ? "bg-(--surface-3) border-(--line) text-zinc-500" : "bg-(--surface-3) border-(--accent-line) text-(--accent)"}`}
                          title={isDefaultSingle ? "Mặc định 90s" : `Rest ${formatRestShort(restSecSingle)}`}
                        >
                          <Timer className="w-3 h-3 text-(--accent)" />
                          {formatRestShort(restSecSingle)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Program Details */}
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-3 border-t border-(--line) text-xs text-(--muted)">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-(--faint)" />
                    {timeLabel}
                  </span>
                  <span className="flex items-center gap-1.5 text-(--muted)">
                    <Zap className="w-3.5 h-3.5 text-(--accent)" />
                    {prog.intensity ?? `${exercises.length} exercises${supersetCount ? ` • ${supersetCount} superset` : ""}`}
                  </span>
                </div>
              </div>

              {prog.note && (
                <div className="mt-3 flex items-start gap-2 bg-(--surface-3) border border-(--line) p-2.5 text-[11px] text-(--faint)">
                  <StickyNote className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{prog.note}</span>
                </div>
              )}

              {/* Start Button */}
              <button
                onClick={() => handleStartWorkout(prog.id)}
                className="mt-4 w-full flex items-center justify-center gap-2 btn-accent text-xs px-4 py-2.5 active:scale-[0.98]"
              >
                <Play className="w-4 h-4" />
                <span>Start {prog.name}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Training Schedule Modal */}
      <TrainingScheduleModal
        isOpen={showSchedule}
        onClose={() => setShowSchedule(false)}
        routines={routines}
        schedules={schedules}
        onUpdateDay={handleUpdateScheduleDay}
        loading={scheduleLoading}
        error={scheduleError}
      />
    </div>
  );
}
