"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Search,
  X,
  ChevronUp,
  ChevronDown,
  StickyNote,
  Check,
  Link2,
  Unlink2,
  Layers,
  Timer,
  Clock,
  Target,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { apiListExercises } from "@/lib/exercises";
import { getStoredSession } from "@/lib/auth";
import { apiListGoals } from "@/lib/goals";

const CATEGORIES = ["PUSH", "PULL", "CORE", "LEGS", "SKILLS"];
const TIME_EST_OPTIONS = [15, 30, 45, 60, 75, 90, 120];
const REST_DEFAULT_SECONDS = 90;
const REST_PRESETS = [30, 60, 90, 120, 180];
const REST_MIN = 0;
const REST_MAX = 600;

const inputTypeLabel = {
  time: "Time Hold",
  weight: "Weighted",
  note: "Bodyweight",
  reps_time: "Reps + Time",
};

const fieldKeyFor = (inputType) => {
  if (inputType === "time" || inputType === "reps_time") return "time";
  if (inputType === "weight") return "weight";
  return "note";
};

function defaultSetsFor(inputType, count = 3) {
  const sets = [];
  for (let i = 0; i < count; i++) {
    if (inputType === "time") sets.push({ time: "30", rpe: "-" });
    else if (inputType === "reps_time") sets.push({ time: "30", reps: "10", rpe: "-" });
    else if (inputType === "weight") sets.push({ weight: "", reps: "8", rpe: "-" });
    else sets.push({ note: "BW", reps: "10", rpe: "-" });
  }
  return sets;
}

function createExercise(libEx) {
  return {
    id: `cx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: libEx.name,
    inputType: libEx.inputType,
    description: libEx.description,
    muscleGroups: [...libEx.primaryMuscles, ...(libEx.secondaryMuscles || [])],
    tips: [],
    target: "",
    note: "",
    defaultSets: defaultSetsFor(libEx.inputType),
    supersetId: null,
    restSeconds: REST_DEFAULT_SECONDS,
    goalLink: null, // {goalId, type: 'direct'|'indirect', indirectGain: 3-5}
  };
}

function formatRest(seconds) {
  const s = Number(seconds) || 0;
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem ? `${m}m ${rem}s` : `${m}m`;
}

function generateSupersetId() {
  return `ss-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export default function CreateRoutinePage({ onSave, onCancel }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("PUSH");
  const [timeEst, setTimeEst] = useState(45);
  const [note, setNote] = useState("");
  const [exercises, setExercises] = useState([]);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  // Fetch exercise library from Supabase via /api/exercises (thay cho EXERCISE_LIBRARY mock)
  const [libraryExercises, setLibraryExercises] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [libraryError, setLibraryError] = useState(null);

  // Goals để link per-exercise (goalLink)
  const [goalsList, setGoalsList] = useState([]);
  const [goalsLoading, setGoalsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLibraryLoading(true);
        setLibraryError(null);
        const data = await apiListExercises();
        if (!cancelled) setLibraryExercises(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) setLibraryError(err?.message || "Failed to load exercises");
      } finally {
        if (!cancelled) setLibraryLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setGoalsLoading(true);
        const session = getStoredSession();
        const token = session?.token;
        if (!token) {
          if (!cancelled) setGoalsList([]);
          return;
        }
        const data = await apiListGoals(token);
        if (!cancelled) setGoalsList(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setGoalsList([]);
      } finally {
        if (!cancelled) setGoalsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalSets = useMemo(
    () => exercises.reduce((sum, ex) => sum + ex.defaultSets.length, 0),
    [exercises]
  );

  const supersetLabelMap = useMemo(() => {
    const map = new Map();
    let counter = 0;
    const seen = new Set();
    exercises.forEach((ex) => {
      if (ex.supersetId && !seen.has(ex.supersetId)) {
        seen.add(ex.supersetId);
        const label = String.fromCharCode(65 + counter);
        map.set(ex.supersetId, label);
        counter++;
      }
    });
    return map;
  }, [exercises]);

  const supersetCount = supersetLabelMap.size;

  const addExercise = (libEx) => {
    if (exercises.some((ex) => ex.name === libEx.name)) return;
    setExercises((prev) => [...prev, createExercise(libEx)]);
  };

  const removeExercise = (id) => {
    setExercises((prev) => {
      const target = prev.find((ex) => ex.id === id);
      const sid = target?.supersetId;
      let filtered = prev.filter((ex) => ex.id !== id);
      if (sid) {
        filtered = filtered.map((ex) => (ex.supersetId === sid ? { ...ex, supersetId: null } : ex));
      }
      return filtered;
    });
  };

  const moveExercise = (id, dir) => {
    setExercises((prev) => {
      const idx = prev.findIndex((ex) => ex.id === id);
      if (idx < 0) return prev;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.splice(newIdx, 0, item);
      // validate supersets: only consecutive pair with same id is valid
      const groups = new Map();
      next.forEach((ex, i) => {
        if (!ex.supersetId) return;
        if (!groups.has(ex.supersetId)) groups.set(ex.supersetId, []);
        groups.get(ex.supersetId).push(i);
      });
      const invalid = new Set();
      groups.forEach((indices, sid) => {
        if (indices.length !== 2) invalid.add(sid);
        else if (Math.abs(indices[0] - indices[1]) !== 1) invalid.add(sid);
      });
      if (invalid.size > 0) {
        return next.map((ex) => (invalid.has(ex.supersetId) ? { ...ex, supersetId: null } : ex));
      }
      return next;
    });
  };

  const toggleSuperset = (idx) => {
    if (idx < 0 || idx >= exercises.length - 1) return;
    const a = exercises[idx];
    const b = exercises[idx + 1];
    const isPaired = a.supersetId && a.supersetId === b.supersetId;
    if (isPaired) {
      const sid = a.supersetId;
      setExercises((prev) => prev.map((ex) => (ex.supersetId === sid ? { ...ex, supersetId: null } : ex)));
    } else {
      // clear existing superset containing a or b
      const sidsToClear = new Set();
      if (a.supersetId) sidsToClear.add(a.supersetId);
      if (b.supersetId) sidsToClear.add(b.supersetId);
      let next = exercises;
      if (sidsToClear.size > 0) {
        next = next.map((ex) => (sidsToClear.has(ex.supersetId) ? { ...ex, supersetId: null } : ex));
      } else {
        next = [...next];
      }
      const newId = generateSupersetId();
      next[idx] = { ...next[idx], supersetId: newId };
      next[idx + 1] = { ...next[idx + 1], supersetId: newId };
      setExercises(next);
    }
  };

  const updateExercise = (id, field, value) => {
    setExercises((prev) =>
      prev.map((ex) => (ex.id === id ? { ...ex, [field]: value } : ex))
    );
  };

  const updateSet = (exId, setIdx, field, value) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exId) return ex;
        const defaultSets = ex.defaultSets.map((s, i) =>
          i === setIdx ? { ...s, [field]: value } : s
        );
        return { ...ex, defaultSets };
      })
    );
  };

  const addSet = (exId) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exId) return ex;
        const last = ex.defaultSets[ex.defaultSets.length - 1] || {};
        const nextSet = { ...last, rpe: "-" };
        // Hold (time) không lưu reps
        if (ex.inputType === "time") delete nextSet.reps;
        return { ...ex, defaultSets: [...ex.defaultSets, nextSet] };
      })
    );
  };

  const removeSet = (exId, setIdx) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exId
          ? { ...ex, defaultSets: ex.defaultSets.filter((_, i) => i !== setIdx) }
          : ex
      )
    );
  };

  const updateRestSeconds = (exId, seconds) => {
    const clamped = Math.max(REST_MIN, Math.min(REST_MAX, Number(seconds) || 0));
    setExercises((prev) => prev.map((ex) => (ex.id === exId ? { ...ex, restSeconds: clamped } : ex)));
  };

  const updateGoalLink = (exId, patch) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exId) return ex;
        const cur = ex.goalLink || null;
        if (patch === null) return { ...ex, goalLink: null };
        // patch có thể là {goalId, type, indirectGain}
        const next = { ...(cur || {}), ...patch };
        // nếu chọn goal mới mà chưa có type thì mặc định direct
        if (!next.type) next.type = "direct";
        if (next.type === "direct") delete next.indirectGain;
        else {
          const g = Number(next.indirectGain ?? 3);
          next.indirectGain = Math.max(3, Math.min(5, g || 3));
        }
        // nếu goalId rỗng => clear
        if (!next.goalId) return { ...ex, goalLink: null };
        return { ...ex, goalLink: next };
      })
    );
  };

  const clearGoalLink = (exId) => {
    setExercises((prev) => prev.map((ex) => (ex.id === exId ? { ...ex, goalLink: null } : ex)));
  };

  const defaultTargetFor = (ex) => {
    const first = ex.defaultSets[0];
    if (!first) return "";
    // Hold (time) chỉ có TIME, không có REPS
    if (ex.inputType === "time") {
      const t = first.time && first.time !== "-" ? `${first.time}s` : "";
      return t ? `${ex.defaultSets.length}x${t}` : `${ex.defaultSets.length} holds`;
    }
    const reps = first.reps && first.reps !== "-" ? `${first.reps}` : "";
    return `${ex.defaultSets.length}x${reps}`;
  };

  const handleSave = () => {
    // exercises snapshot gồm reps/sets (defaultSets) + restSeconds + goalLink để lưu jsonb — hold (time) bỏ reps
    const routine = {
      name: name.trim() || "Untitled Routine",
      category,
      timeEst: Number(timeEst),
      note: note.trim(),
      exercises: exercises.map((ex) => {
        const base = {
          id: ex.id,
          name: ex.name,
          target: (ex.target || "").trim() || defaultTargetFor(ex),
          inputType: ex.inputType,
          description: ex.description,
          muscleGroups: ex.muscleGroups,
          tips: ex.tips,
          note: ex.note,
          defaultSets: ex.defaultSets.map((s) => {
            const clean = { ...s };
            if (ex.inputType === "time") delete clean.reps;
            return clean;
          }),
          supersetId: ex.supersetId || null,
          restSeconds: Math.max(REST_MIN, Math.min(REST_MAX, Number(ex.restSeconds ?? REST_DEFAULT_SECONDS))),
          // keep snake_case alias for backward compat fetch
          rest_seconds: Math.max(REST_MIN, Math.min(REST_MAX, Number(ex.restSeconds ?? REST_DEFAULT_SECONDS))),
        };
        if (ex.goalLink && ex.goalLink.goalId) {
          base.goalLink = {
            goalId: ex.goalLink.goalId,
            type: ex.goalLink.type || "direct",
            ...(ex.goalLink.type === "indirect" ? { indirectGain: ex.goalLink.indirectGain ?? 3 } : {}),
          };
          // alias snake_case
          base.goal_link = base.goalLink;
        }
        return base;
      }),
    };
    onSave(routine);
  };

  const canSave = name.trim().length > 0 && exercises.length > 0;

  const filteredLibrary = libraryExercises.filter((ex) => {
    const matchesFilter = filter === "ALL" || ex.movementType === filter;
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query || ex.name.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-1.5 text-(--faint) hover:text-zinc-300 hover:bg-white/5 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="text-[10px] font-bold text-(--accent) tracking-[0.18em] uppercase">
              CREATE ROUTINE
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Routine name..."
              className="block w-full sm:w-[420px] bg-transparent outline-none text-xl font-bold text-zinc-100 tracking-tight mt-0.5 placeholder:text-zinc-600"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-(--surface-2) border border-(--accent-line) text-(--accent) text-xs font-display font-semibold tnum">
            <span>{exercises.length} EX</span>
            <span className="text-(--faint)">|</span>
            <span>{totalSets} SETS</span>
            {supersetCount > 0 && (
              <>
                <span className="text-(--faint)">|</span>
                <span className="flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  {supersetCount} SS
                </span>
              </>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={!canSave}
            className="flex items-center gap-2 btn-accent text-xs px-4 py-2"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Routine</span>
          </button>
        </div>
      </div>

      {/* Routine Meta — category + locked time_est (int minutes) */}
      <div className="bg-(--surface) border border-(--line) p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-semibold text-(--faint) uppercase tracking-[0.18em] mb-1.5">
            Category
          </label>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-2.5 py-1 text-[10px] font-semibold border transition ${
                  category === cat
                    ? "bg-(--accent-soft) border-(--accent-line) text-(--accent)"
                    : "bg-[#0d0d10] border-white/10 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-(--faint) uppercase tracking-[0.18em] mb-1.5">
            Est. Duration (minutes) — locked
          </label>
          <div className="flex flex-wrap gap-1.5">
            {TIME_EST_OPTIONS.map((t) => (
              <button
                key={t}
                onClick={() => setTimeEst(t)}
                className={`px-3 py-1.5 text-xs font-semibold border transition ${
                  timeEst === t
                    ? "bg-(--accent-soft) border-(--accent-line) text-(--accent)"
                    : "bg-[#0d0d10] border-white/10 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {t} min
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Routine Note */}
      <div className="bg-(--surface) border border-(--line) p-4">
        <div className="flex items-center gap-1.5 mb-2">
          <StickyNote className="w-3.5 h-3.5 text-(--faint)" />
          <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
            Routine Note
          </label>
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Notes about this routine (goals, progression strategy, equipment needed...)"
          className="w-full bg-(--surface-3) border border-(--line-strong) px-3 py-2 text-xs text-zinc-200 outline-none placeholder:text-(--faint) focus:border-(--accent-line) transition resize-none"
        />
      </div>

      {/* Exercise List */}
      <div className="space-y-0">
        {exercises.length === 0 && (
          <div className="bg-(--surface) border border-dashed border-(--line-strong) p-10 text-center">
            <p className="text-sm text-(--muted) mb-1">No exercises yet.</p>
            <p className="text-xs text-(--faint) mb-5">
              Add exercises from the library to build your routine.
            </p>
            <button
              onClick={() => setPickerOpen(true)}
              className="inline-flex items-center gap-2 btn-accent text-xs px-5 py-2.5 active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Exercise</span>
            </button>
          </div>
        )}

        {exercises.map((ex, idx) => {
          const fieldKey = fieldKeyFor(ex.inputType);
          const isHold = ex.inputType === "time";
          const inSuperset = !!ex.supersetId;
          const supersetLabel = inSuperset ? supersetLabelMap.get(ex.supersetId) : null;
          const isPairedWithNext = inSuperset && ex.supersetId === exercises[idx + 1]?.supersetId;
          const isPairedWithPrev = inSuperset && ex.supersetId === exercises[idx - 1]?.supersetId;
          const showTopConnector = isPairedWithPrev;
          const showBottomConnector = idx < exercises.length - 1;
          const bottomIsPaired = isPairedWithNext;

          return (
            <React.Fragment key={ex.id}>
              {/* Superset top connector bar (when this exercise is second in pair) */}
              {showTopConnector && (
                <div className="flex justify-center -my-1 relative z-10">
                  <div className="w-px h-3 bg-(--accent) opacity-60" />
                </div>
              )}

              <div
                className={`bg-(--surface) border p-5 relative transition ${
                  inSuperset
                    ? "border-(--accent-line) shadow-[0_0_0_1px_rgba(255,77,77,0.15)]"
                    : "border-(--line)"
                } ${isPairedWithPrev ? "rounded-t-none border-t-0" : ""} ${isPairedWithNext ? "rounded-b-none border-b-0" : ""}`}
              >
                {/* Superset Badge - top left corner */}
                {inSuperset && (
                  <div className="absolute -top-2 left-4 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-(--accent) text-white text-[9px] font-bold tracking-[0.14em] uppercase shadow">
                      <Layers className="w-2.5 h-2.5" />
                      SUPERSET {supersetLabel}
                    </span>
                    {isPairedWithNext && (
                      <span className="text-[9px] text-(--accent) font-medium hidden sm:inline">↕ nối với bài tiếp theo</span>
                    )}
                    {isPairedWithPrev && (
                      <span className="text-[9px] text-(--accent) font-medium hidden sm:inline">↕ nối với bài trước</span>
                    )}
                  </div>
                )}

                {/* Exercise Header */}
                <div className={`flex items-start justify-between gap-3 mb-4 ${inSuperset ? "mt-2" : ""}`}>
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className={`w-8 h-8 flex items-center justify-center font-display text-sm font-bold shrink-0 border transition ${
                        inSuperset
                          ? "bg-(--accent) border-(--accent) text-white"
                          : "bg-(--accent-soft) border-(--accent-line) text-(--accent)"
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-zinc-100">{ex.name}</h3>
                        <span className="px-1.5 py-0.5 bg-(--surface-3) border border-(--line) text-(--faint) text-[9px] font-medium uppercase">
                          {inputTypeLabel[ex.inputType]}
                        </span>
                        <span className="text-[10px] text-(--faint) hidden sm:inline">
                          • {defaultTargetFor(ex)}
                        </span>
                      </div>
                      {/* Rest Timer Setter — thay thế Target input */}
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wide uppercase text-(--muted)">
                          <Timer className="w-3 h-3 text-(--accent)" />
                          Rest:
                        </span>
                        <div className="flex items-center gap-1 flex-wrap">
                          {REST_PRESETS.map((preset) => {
                            const isActive = (ex.restSeconds ?? REST_DEFAULT_SECONDS) === preset;
                            return (
                              <button
                                key={preset}
                                onClick={() => updateRestSeconds(ex.id, preset)}
                                className={`px-2 py-1 text-[11px] font-medium border transition ${
                                  isActive
                                    ? "bg-(--accent) border-(--accent) text-white"
                                    : "bg-(--surface-3) border-(--line-strong) text-zinc-400 hover:text-zinc-200 hover:border-(--accent-line)"
                                }`}
                              >
                                {formatRest(preset)}
                              </button>
                            );
                          })}
                          <div className="flex items-center gap-1 ml-1 bg-(--surface-3) border border-(--line-strong) px-2 py-1 focus-within:border-(--accent-line) transition">
                            <input
                              type="number"
                              min={REST_MIN}
                              max={REST_MAX}
                              step={5}
                              value={ex.restSeconds ?? REST_DEFAULT_SECONDS}
                              onChange={(e) => updateRestSeconds(ex.id, e.target.value)}
                              className="w-14 bg-transparent outline-none text-xs text-zinc-200 text-center placeholder:text-(--faint)"
                              placeholder="90"
                            />
                            <span className="text-[11px] text-(--faint)">giây</span>
                          </div>
                        </div>
                      </div>
                      {/* Goal Link — bổ trợ cho mục tiêu */}
                      <div className="mt-2.5 flex flex-col gap-1.5 bg-(--surface-3) border border-(--line) p-2.5">
                        <div className="flex items-center gap-1.5">
                          <Target className="w-3 h-3 text-(--accent)" />
                          <span className="text-[10px] font-bold tracking-wide uppercase text-(--muted)">Bổ trợ Goal</span>
                          {ex.goalLink?.goalId && (
                            <span className="ml-auto inline-flex items-center gap-1 text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 bg-(--accent-soft) border border-(--accent-line) text-(--accent)">
                              {ex.goalLink.type === "direct" ? (
                                <>
                                  <Sparkles className="w-2.5 h-2.5" /> Trực tiếp
                                </>
                              ) : (
                                <>
                                  <TrendingUp className="w-2.5 h-2.5" /> Gián tiếp +{ex.goalLink.indirectGain ?? 3}%
                                </>
                              )}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <select
                            value={ex.goalLink?.goalId || ""}
                            onChange={(e) => {
                              const gid = e.target.value;
                              if (!gid) clearGoalLink(ex.id);
                              else updateGoalLink(ex.id, { goalId: gid });
                            }}
                            className="flex-1 min-w-[180px] bg-(--surface) border border-(--line-strong) px-2 py-1.5 text-[11px] text-zinc-200 outline-none focus:border-(--accent-line) transition"
                          >
                            <option value="">— Không liên kết —</option>
                            {goalsLoading ? (
                              <option disabled>Đang tải goals...</option>
                            ) : goalsList.length === 0 ? (
                              <option disabled>Chưa có goal nào</option>
                            ) : (
                              goalsList.map((g) => (
                                <option key={g.id} value={g.id}>
                                  {g.title} • {g.target || `${g.metricValue}${g.metricType === "seconds" ? "s" : g.metricType === "weighted" ? "kg" : " reps"}`} ({g.progress ?? 0}%)
                                </option>
                              ))
                            )}
                          </select>
                          {ex.goalLink?.goalId && (
                            <>
                              <div className="flex items-center gap-1 bg-(--surface) border border-(--line) p-0.5">
                                <button
                                  onClick={() => updateGoalLink(ex.id, { type: "direct" })}
                                  className={`px-2 py-1 text-[10px] font-semibold border transition ${ex.goalLink.type === "direct" ? "bg-(--accent) border-(--accent) text-white" : "border-transparent text-(--muted) hover:text-zinc-200"}`}
                                >
                                  Trực tiếp
                                </button>
                                <button
                                  onClick={() => updateGoalLink(ex.id, { type: "indirect" })}
                                  className={`px-2 py-1 text-[10px] font-semibold border transition ${ex.goalLink.type === "indirect" ? "bg-(--accent) border-(--accent) text-white" : "border-transparent text-(--muted) hover:text-zinc-200"}`}
                                >
                                  Gián tiếp
                                </button>
                              </div>
                              {ex.goalLink.type === "indirect" && (
                                <div className="flex items-center gap-1 bg-(--surface) border border-(--line-strong) px-2 py-1">
                                  <span className="text-[10px] text-(--faint)">+Gain:</span>
                                  {[3, 4, 5].map((g) => (
                                    <button
                                      key={g}
                                      onClick={() => updateGoalLink(ex.id, { indirectGain: g })}
                                      className={`px-1.5 py-0.5 text-[11px] font-medium border transition ${ (ex.goalLink.indirectGain ?? 3) === g ? "bg-(--accent-soft) border-(--accent-line) text-(--accent)" : "border-transparent text-zinc-400 hover:text-zinc-200"}`}
                                    >
                                      {g}%
                                    </button>
                                  ))}
                                </div>
                              )}
                              <button
                                onClick={() => clearGoalLink(ex.id)}
                                className="p-1 text-(--faint) hover:text-(--accent) hover:bg-(--accent-soft) transition"
                                title="Xoá liên kết"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                        {ex.goalLink?.goalId && (
                          <p className="text-[10px] leading-relaxed text-(--faint)">
                            {ex.goalLink.type === "direct" ? (
                              <>
                                <span className="text-(--accent) font-semibold">Trực tiếp:</span> progress = hold/reps/weight tốt nhất / target ×100. VD Adv Tuck Planche 5s hold 3s → 60%.
                              </>
                            ) : (
                              <>
                                <span className="text-(--accent) font-semibold">Gián tiếp:</span> mỗi buổi có bài này done +{ex.goalLink.indirectGain ?? 3}% (cộng dồn per bài, cap 100). VD Planche Lean.
                              </>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => moveExercise(ex.id, -1)}
                      disabled={idx === 0}
                      className="p-1.5 text-(--faint) hover:text-zinc-300 hover:bg-white/5 transition disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveExercise(ex.id, 1)}
                      disabled={idx === exercises.length - 1}
                      className="p-1.5 text-(--faint) hover:text-zinc-300 hover:bg-white/5 transition disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeExercise(ex.id)}
                      className="p-1.5 text-(--faint) hover:text-(--accent) hover:bg-(--accent-soft) transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sets Table — hold (time) không có REPS */}
                <div
                  className={`grid gap-1.5 sm:gap-2 px-2 pb-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider ${
                    isHold
                      ? "grid-cols-[40px_1fr_1fr_36px] sm:grid-cols-[50px_1fr_1fr_40px]"
                      : "grid-cols-[40px_1fr_1fr_1fr_36px] sm:grid-cols-[50px_1fr_1fr_1fr_40px]"
                  }`}
                >
                  <span>SET</span>
                  <span>{fieldKey === "time" ? "TIME (S)" : fieldKey === "weight" ? "WEIGHT (KG)" : "NOTE"}</span>
                  {!isHold && <span>REPS</span>}
                  <span>RPE</span>
                  <span />
                </div>

                {ex.defaultSets.map((set, setIdx) => (
                  <div
                    key={setIdx}
                    className={`grid gap-1.5 sm:gap-2 items-center px-2 py-1.5 ${
                      isHold
                        ? "grid-cols-[40px_1fr_1fr_36px] sm:grid-cols-[50px_1fr_1fr_40px]"
                        : "grid-cols-[40px_1fr_1fr_1fr_36px] sm:grid-cols-[50px_1fr_1fr_1fr_40px]"
                    }`}
                  >
                    <span className="text-xs font-bold text-zinc-400 text-center">
                      {setIdx + 1}
                    </span>
                    <input
                      type="text"
                      value={set[fieldKey] || ""}
                      onChange={(e) => updateSet(ex.id, setIdx, fieldKey, e.target.value)}
                      placeholder="-"
                      className="bg-(--surface-3) border border-(--line-strong) text-zinc-200 text-xs px-2 sm:px-3 py-2 w-full outline-none focus:border-(--accent-line) transition placeholder:text-(--faint)"
                    />
                    {!isHold && (
                      <input
                        type="text"
                        value={set.reps || ""}
                        onChange={(e) => updateSet(ex.id, setIdx, "reps", e.target.value)}
                        placeholder="-"
                        className="bg-(--surface-3) border border-(--line-strong) text-zinc-200 text-xs px-2 sm:px-3 py-2 w-full outline-none focus:border-(--accent-line) transition placeholder:text-(--faint)"
                      />
                    )}
                    <input
                      type="text"
                      value={set.rpe || ""}
                      onChange={(e) => updateSet(ex.id, setIdx, "rpe", e.target.value)}
                      placeholder="-"
                      className="bg-(--surface-3) border border-(--line-strong) text-zinc-200 text-xs px-2 sm:px-3 py-2 w-full outline-none focus:border-(--accent-line) transition placeholder:text-(--faint)"
                    />
                    <button
                      onClick={() => removeSet(ex.id, setIdx)}
                      disabled={ex.defaultSets.length <= 1}
                      className="flex items-center justify-center p-1.5 text-zinc-600 hover:text-red-400 transition disabled:opacity-25 disabled:cursor-not-allowed"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {/* Add Set + Exercise Note */}
                <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3">
                  <button
                    onClick={() => addSet(ex.id)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 border border-dashed border-(--line-strong) text-(--faint) hover:text-zinc-300 hover:border-(--line-strong) text-[11px] transition shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Set</span>
                  </button>
                  <div className="flex items-center gap-2 flex-1">
                    <StickyNote className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                    <input
                      value={ex.note}
                      onChange={(e) => updateExercise(ex.id, "note", e.target.value)}
                      placeholder="Note for this exercise (form cues, tempo, alternative...)"
                      className="w-full bg-(--surface-3) border border-(--line-strong) px-3 py-2 text-[11px] text-zinc-300 outline-none placeholder:text-(--faint) focus:border-(--accent-line) transition"
                    />
                  </div>
                </div>
              </div>

              {/* Superset Toggle Connector between this and next exercise */}
              {showBottomConnector && (
                <div
                  className={`flex items-center justify-center gap-2 py-2 px-3 -mx-0.5 ${
                    bottomIsPaired
                      ? "bg-(--accent-soft) border-x border-(--accent-line) border-dashed"
                      : "bg-transparent"
                  }`}
                >
                  <div className={`hidden sm:block h-px flex-1 ${bottomIsPaired ? "bg-(--accent-line)" : "bg-(--line) border-t border-dashed border-(--line-strong)"}`} />
                  <button
                    onClick={() => toggleSuperset(idx)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold border transition shrink-0 ${
                      bottomIsPaired
                        ? "bg-(--accent) border-(--accent) text-white hover:bg-(--accent-strong)"
                        : "bg-(--surface) border border-dashed border-(--line-strong) text-(--muted) hover:text-zinc-200 hover:border-(--accent-line) hover:bg-(--accent-soft)"
                    }`}
                    title={bottomIsPaired ? "Huỷ superset giữa 2 bài này" : "Nối 2 bài này thành superset (tập liên tiếp không nghỉ)"}
                  >
                    {bottomIsPaired ? (
                      <>
                        <Unlink2 className="w-3.5 h-3.5" />
                        <span>Huỷ Superset {supersetLabelMap.get(ex.supersetId)}</span>
                      </>
                    ) : (
                      <>
                        <Link2 className="w-3.5 h-3.5" />
                        <span>Nối Superset</span>
                      </>
                    )}
                  </button>
                  <div className={`hidden sm:block h-px flex-1 ${bottomIsPaired ? "bg-(--accent-line)" : "bg-(--line) border-t border-dashed border-(--line-strong)"}`} />
                </div>
              )}

              {/* Gap between non-superset pairs */}
              {!showBottomConnector && idx < exercises.length - 1 && !bottomIsPaired && (
                <div className="h-4" />
              )}
              {showBottomConnector && !bottomIsPaired && <div className="h-2" />}
            </React.Fragment>
          );
        })}

        {/* Add Exercise Button */}
        {exercises.length > 0 && (
          <button
            onClick={() => setPickerOpen(true)}
            className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 border border-dashed border-(--line-strong) text-zinc-500 hover:text-(--accent) hover:border-(--accent-line) text-xs font-semibold transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Exercise</span>
          </button>
        )}

        {/* Superset helper hint */}
        {exercises.length >= 2 && (
          <div className="mt-3 flex items-start gap-2 bg-(--surface-3) border border-(--line) p-3">
            <Layers className="w-3.5 h-3.5 text-(--accent) mt-0.5 shrink-0" />
            <p className="text-[11px] leading-relaxed text-(--muted)">
              <span className="font-semibold text-zinc-300">Superset:</span> Nhấn{" "}
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-(--surface) border border-(--line-strong) text-[10px] text-zinc-300">
                <Link2 className="w-2.5 h-2.5" /> Nối Superset
              </span>{" "}
              giữa 2 bài để tập liên tiếp không nghỉ. Khi đã nối, 2 bài sẽ có viền đỏ và nhãn{" "}
              <span className="inline-flex items-center px-1.5 py-0.5 bg-(--accent) text-white text-[9px] font-bold">SUPERSET A</span>. Nhấn{" "}
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-(--accent) text-white text-[10px]">
                <Unlink2 className="w-2.5 h-2.5" /> Huỷ
              </span>{" "}
              để tách ra. Mỗi superset gồm đúng 2 bài liên tiếp.
            </p>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-(--line)">
        <button
          onClick={onCancel}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition"
        >
          Cancel & discard routine
        </button>
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="flex items-center gap-2.5 btn-accent text-sm font-semibold px-8 py-3"
        >
          <Save className="w-4.5 h-4.5" />
          <span>Save Routine</span>
        </button>
      </div>

      {/* Exercise Picker Modal */}
      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-(--surface) border border-(--line-strong) w-full max-w-lg square-frame max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-5 pb-3">
              <h2 className="text-base font-bold text-zinc-100">Add Exercise</h2>
              <button
                onClick={() => setPickerOpen(false)}
                className="text-(--faint) hover:text-zinc-300 p-1 hover:bg-white/5 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 pb-3 space-y-3">
              <div className="flex items-center gap-2 bg-(--surface-3) border border-(--line-strong) px-3 py-2">
                <Search className="w-4 h-4 text-zinc-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search exercises..."
                  className="bg-transparent outline-none text-xs text-zinc-200 w-full placeholder:text-zinc-500"
                />
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {["ALL", ...CATEGORIES].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilter(cat)}
                    className={`px-2.5 py-1 text-[10px] font-medium transition shrink-0 ${
                      filter === cat
                        ? "bg-(--accent-soft) border border-(--accent-line) text-(--accent)"
                        : "bg-[#0d0d10] border border-white/5 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-2">
              {libraryLoading ? (
                <p className="text-xs text-zinc-400 text-center py-6">Loading exercises from Supabase...</p>
              ) : libraryError ? (
                <div className="text-center py-6 space-y-2">
                  <p className="text-xs text-red-400">Failed to load exercises: {libraryError}</p>
                  <button
                    onClick={async () => {
                      try {
                        setLibraryLoading(true);
                        setLibraryError(null);
                        const data = await apiListExercises();
                        setLibraryExercises(Array.isArray(data) ? data : []);
                      } catch (err) {
                        setLibraryError(err?.message || "Failed to load exercises");
                      } finally {
                        setLibraryLoading(false);
                      }
                    }}
                    className="text-xs btn-ghost px-3 py-1.5"
                  >
                    Retry
                  </button>
                </div>
              ) : filteredLibrary.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-6">
                  No exercises found.
                </p>
              ) : (
                filteredLibrary.map((ex) => {
                  const added = exercises.some((e) => e.name === ex.name);
                  return (
                    <button
                      key={ex.id}
                      onClick={() => addExercise(ex)}
                      disabled={added}
                      className={`w-full flex items-center gap-3 p-3 border text-left transition ${
                        added
                          ? "border-(--accent-line) bg-(--accent-soft) opacity-60"
                          : "border-(--line) bg-(--surface-3) hover:border-(--line-strong)"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-zinc-100">{ex.name}</h3>
                          <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 border border-(--line) bg-(--surface-3) text-(--faint)">
                            {ex.movementType}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
                          {ex.description}
                        </p>
                      </div>
                      {added ? (
                        <span className="flex items-center gap-1 text-(--accent) text-[10px] font-semibold shrink-0">
                          <Check className="w-3.5 h-3.5" />
                          Added
                        </span>
                      ) : (
                        <span className="text-zinc-600 shrink-0">
                          <Plus className="w-4 h-4" />
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
