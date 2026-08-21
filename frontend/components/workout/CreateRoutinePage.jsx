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
} from "lucide-react";
import { apiListExercises } from "@/lib/exercises";

const CATEGORIES = ["PUSH", "PULL", "CORE", "LEGS", "SKILLS"];
const TIME_EST_OPTIONS = [15, 30, 45, 60, 75, 90, 120];

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
  };
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

  const totalSets = useMemo(
    () => exercises.reduce((sum, ex) => sum + ex.defaultSets.length, 0),
    [exercises]
  );

  const addExercise = (libEx) => {
    if (exercises.some((ex) => ex.name === libEx.name)) return;
    setExercises((prev) => [...prev, createExercise(libEx)]);
  };

  const removeExercise = (id) => {
    setExercises((prev) => prev.filter((ex) => ex.id !== id));
  };

  const moveExercise = (id, dir) => {
    setExercises((prev) => {
      const idx = prev.findIndex((ex) => ex.id === id);
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.splice(idx + dir, 0, item);
      return next;
    });
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
    // exercises snapshot gồm reps/sets (defaultSets) để lưu jsonb — hold (time) bỏ reps
    const routine = {
      name: name.trim() || "Untitled Routine",
      category,
      timeEst: Number(timeEst),
      note: note.trim(),
      exercises: exercises.map((ex) => ({
        id: ex.id,
        name: ex.name,
        target: ex.target.trim() || defaultTargetFor(ex),
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
      })),
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
      <div className="space-y-4">
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
          return (
            <div key={ex.id} className="bg-(--surface) border border-(--line) p-5">
              {/* Exercise Header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-8 h-8 bg-(--accent-soft) border border-(--accent-line) flex items-center justify-center text-(--accent) font-display text-sm font-bold shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-zinc-100">{ex.name}</h3>
                      <span className="px-1.5 py-0.5 bg-(--surface-3) border border-(--line) text-(--faint) text-[9px] font-medium uppercase">
                        {inputTypeLabel[ex.inputType]}
                      </span>
                    </div>
                    <input
                      value={ex.target}
                      onChange={(e) => updateExercise(ex.id, "target", e.target.value)}
                      placeholder={`Target (e.g. ${defaultTargetFor(ex)})`}
                      className="mt-1 w-full sm:w-56 bg-(--surface-3) border border-(--line-strong) px-2.5 py-1.5 text-[11px] text-zinc-300 outline-none placeholder:text-(--faint) focus:border-(--accent-line) transition"
                    />
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
          );
        })}

        {/* Add Exercise Button */}
        {exercises.length > 0 && (
          <button
            onClick={() => setPickerOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 border border-dashed border-(--line-strong) text-zinc-500 hover:text-(--accent) hover:border-(--accent-line) text-xs font-semibold transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Exercise</span>
          </button>
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
