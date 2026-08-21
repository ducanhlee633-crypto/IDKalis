"use client";

import React, { useState, useEffect, useCallback } from "react";
import { WORKOUT_PROGRAMS_DETAIL } from "@/data/mockCalisthenicsData";
import { Plus, Clock, Zap, Play, StickyNote, Trash2 } from "lucide-react";
import ActiveWorkoutPage from "@/components/workout/ActiveWorkoutPage";
import CreateRoutinePage from "@/components/workout/CreateRoutinePage";
import { getStoredSession } from "@/lib/auth";
import { apiListRoutines, apiCreateRoutine, apiDeleteRoutine } from "@/lib/routines";

export default function WorkoutsPage() {
  const [filter, setFilter] = useState("ALL");
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [creatingRoutine, setCreatingRoutine] = useState(false);

  const categories = ["ALL", "PUSH", "PULL", "CORE", "LEGS", "SKILLS"];

  // DB-backed routines (đã xoá mock workoutPrograms)
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

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
      // routine từ CreateRoutinePage: { name, category, timeEst (locked int), note, exercises:[{name, target, inputType, defaultSets: [{reps, time/weight/note, rpe}]}] }
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

        <button
          onClick={() => setCreatingRoutine(true)}
          className="flex items-center gap-2 btn-accent text-xs px-4 py-2 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Create Routine</span>
        </button>
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

      {/* Workout Programs Grid — DB data (đã xoá mock) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredPrograms.map((prog) => {
          const timeEst = prog.timeEst ?? prog.time_est ?? prog.duration ?? 0;
          const timeLabel = typeof timeEst === "number" ? `${timeEst} min` : String(timeEst);
          // exercises jsonb: snapshot gồm reps/sets
          const exercises = Array.isArray(prog.exercises) ? prog.exercises : [];
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
                  <h3 className="font-display text-base font-semibold text-zinc-100 mt-0.5">{prog.name}</h3>
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

              {/* Exercise List — render từ jsonb snapshot (có reps/sets) */}
              <div className="space-y-1.5 my-3 bg-(--surface-3) p-3 border border-(--line)">
                {exercises.length === 0 ? (
                  <span className="text-xs text-(--faint)">No exercises</span>
                ) : (
                  exercises.map((ex, idx) => {
                    // ex có thể là string (legacy) hoặc object {name, target, defaultSets}
                    if (typeof ex === "string") {
                      return (
                        <div key={idx} className="flex items-center gap-2 text-xs text-zinc-300">
                          <span className="w-1.5 h-1.5 bg-(--accent)" />
                          <span>{ex}</span>
                        </div>
                      );
                    }
                    const setsInfo = ex.defaultSets
                      ? `${ex.defaultSets.length} sets • ${ex.defaultSets.map((s) => s.reps ?? s.time ?? s.weight ?? s.note ?? "-").join("/")}`
                      : ex.target || "";
                    return (
                      <div key={ex.id || idx} className="flex items-center gap-2 text-xs text-zinc-300">
                        <span className="w-1.5 h-1.5 bg-(--accent) shrink-0" />
                        <span className="flex-1 min-w-0 truncate">
                          <span className="font-medium text-zinc-200">{ex.name}</span>
                          {ex.target ? <span className="text-zinc-400"> — {ex.target}</span> : null}
                          {setsInfo ? <span className="text-(--faint) hidden sm:inline"> • {setsInfo}</span> : null}
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
                    {prog.intensity ?? `${exercises.length} exercises`}
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
    </div>
  );
}
