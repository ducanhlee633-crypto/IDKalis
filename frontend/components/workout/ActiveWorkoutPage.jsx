"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  MoreVertical,
  Save,
  Trophy,
  ArrowLeft,
  RotateCcw,
  GripVertical,
  Timer as TimerIcon,
  Trash2,
  Layers,
  Link2,
} from "lucide-react";
import ExerciseBlock from "./ExerciseBlock";
import RestTimerBar from "./RestTimerBar";
import ExerciseInfoModal from "./ExerciseInfoModal";
import WorkoutSummaryModal from "./WorkoutSummaryModal";
import WorkoutCompleteModal from "./WorkoutCompleteModal";
import { getStoredSession } from "@/lib/auth";
import { apiCreateWorkout, apiGetPreviousSets } from "@/lib/workouts";

const REST_DEFAULT_SECONDS = 90;
const REST_MIN_SECONDS = 0;
const REST_MAX_SECONDS = 600;
const REST_STORAGE_KEY = "idk_rest_default_seconds";

function getInitialRestDefault() {
  if (typeof window === "undefined") return REST_DEFAULT_SECONDS;
  try {
    const raw = window.localStorage.getItem(REST_STORAGE_KEY);
    const n = parseInt(raw, 10);
    if (!Number.isNaN(n) && n >= 30 && n <= REST_MAX_SECONDS) return n;
  } catch {}
  return REST_DEFAULT_SECONDS;
}

function playRestDoneSound() {
  // Boxing bell: 3 gongs loud & long (~2.8s)
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      // iOS / autoplay policy: resume if suspended
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      const now = ctx.currentTime;
      const HITS = 3;
      const HIT_GAP = 0.42; // seconds between gongs
      const DECAY = 1.35; // long tail per hit

      for (let i = 0; i < HITS; i++) {
        const t0 = now + i * HIT_GAP;
        // per-hit gain node (so hits overlap and decay naturally)
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, t0);
        // sharp attack
        gain.gain.linearRampToValueAtTime(0.92, t0 + 0.02);
        // long exponential decay like real bell
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + DECAY);
        gain.connect(ctx.destination);

        // fundamental + octave + fifth for rich bell timbre
        const freqs = [
          { f: 820, vol: 1.0, type: "sine" },
          { f: 1640, vol: 0.42, type: "sine" }, // octave
          { f: 1220, vol: 0.28, type: "triangle" }, // fifth-ish, adds bite
        ];
        freqs.forEach(({ f, vol, type }) => {
          const osc = ctx.createOscillator();
          const oscGain = ctx.createGain();
          osc.type = type;
          // slight detune down over decay to mimic bell
          osc.frequency.setValueAtTime(f, t0);
          osc.frequency.exponentialRampToValueAtTime(f * 0.985, t0 + DECAY);
          oscGain.gain.setValueAtTime(vol, t0);
          oscGain.gain.exponentialRampToValueAtTime(0.001, t0 + DECAY);
          osc.connect(oscGain);
          oscGain.connect(gain);
          osc.start(t0);
          osc.stop(t0 + DECAY + 0.05);
        });

        // low thump for body
        const lowOsc = ctx.createOscillator();
        const lowGain = ctx.createGain();
        lowOsc.type = "sine";
        lowOsc.frequency.setValueAtTime(180, t0);
        lowGain.gain.setValueAtTime(0.35, t0);
        lowGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.45);
        lowOsc.connect(lowGain);
        lowGain.connect(gain);
        lowOsc.start(t0);
        lowOsc.stop(t0 + 0.5);
      }

      // close after all tails
      setTimeout(() => {
        try {
          ctx.close();
        } catch {}
      }, (HITS * HIT_GAP + DECAY) * 1000 + 400);
    } else {
      const audio = new Audio(
        "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA=="
      );
      audio.volume = 0.85;
      audio.play().catch(() => {});
    }
  } catch {}
  try {
    if (navigator.vibrate) navigator.vibrate([380, 90, 380, 90, 620]);
  } catch {}
}

export default function ActiveWorkoutPage({ program, onFinish }) {
  // Initialize sets state from program exercises — hold (time) bỏ reps
  const [sets, setSets] = useState(() => {
    const initial = {};
    program.exercises.forEach((ex) => {
      const isHold = ex.inputType === "time";
      initial[ex.id] = ex.defaultSets.map((s) => {
        const clean = { ...s, done: false };
        if (isHold) delete clean.reps;
        return clean;
      });
    });
    return initial;
  });

  const [infoExercise, setInfoExercise] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [sessionNumber, setSessionNumber] = useState(1);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const moreMenuRef = useRef(null);

  // Previous sets map: { [exerciseName]: [{setNumber, reps, holdSeconds, weight, weightRaw, rpe}] }
  const [previousMap, setPreviousMap] = useState({});

  // Superset grouping - same logic as CreateRoutinePage
  const supersetLabelMap = useMemo(() => {
    const map = new Map();
    let counter = 0;
    const seen = new Set();
    (program.exercises || []).forEach((ex) => {
      if (ex.supersetId && !seen.has(ex.supersetId)) {
        seen.add(ex.supersetId);
        const label = String.fromCharCode(65 + counter);
        map.set(ex.supersetId, label);
        counter++;
      }
    });
    return map;
  }, [program.exercises]);

  const groups = useMemo(() => {
    const result = [];
    const exs = program.exercises || [];
    let i = 0;
    while (i < exs.length) {
      const cur = exs[i];
      const nxt = exs[i + 1];
      if (cur.supersetId && nxt && cur.supersetId === nxt.supersetId) {
        result.push({
          type: "superset",
          supersetId: cur.supersetId,
          exercises: [cur, nxt],
          startIndex: i,
        });
        i += 2;
      } else {
        result.push({ type: "single", exercises: [cur], startIndex: i });
        i += 1;
      }
    }
    return result;
  }, [program.exercises]);

  const hasSuperset = supersetLabelMap.size > 0;

  // Fetch previous sets (exercise_progress) for placeholder — per user, latest workout per exercise
  useEffect(() => {
    let cancelled = false;
    async function fetchPrevious() {
      try {
        const session = getStoredSession();
        const token = session?.token;
        if (!token) return;
        const names = (program.exercises || []).map((e) => e.name).filter(Boolean);
        if (names.length === 0) return;
        const data = await apiGetPreviousSets(token, names);
        if (!cancelled) setPreviousMap(data || {});
      } catch (e) {
        // Silent: không block workout nếu fetch fail (chưa có data hoặc chưa chạy migration)
        console.warn("[ActiveWorkout] previous-sets fetch failed:", e?.message || e);
        if (!cancelled) setPreviousMap({});
      }
    }
    fetchPrevious();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program.id]);

  // ── Rest Timer state ─────────────────────────────
  const [restRemaining, setRestRemaining] = useState(() => getInitialRestDefault());
  const [restTotal, setRestTotal] = useState(() => getInitialRestDefault());
  const [restActive, setRestActive] = useState(false);
  const restIntervalRef = useRef(null);
  const restDefaultRef = useRef(getInitialRestDefault());



  const persistRestDefault = useCallback((seconds) => {
    const clamped = Math.max(30, Math.min(REST_MAX_SECONDS, seconds));
    restDefaultRef.current = clamped;
    try {
      window.localStorage.setItem(REST_STORAGE_KEY, String(clamped));
    } catch {}
  }, []);

  const stopRest = useCallback(() => {
    if (restIntervalRef.current) {
      clearInterval(restIntervalRef.current);
      restIntervalRef.current = null;
    }
    setRestActive(false);
  }, []);

  const startRest = useCallback(
    (seconds) => {
      const secs = typeof seconds === "number" ? seconds : restDefaultRef.current;
      const clamped = Math.max(REST_MIN_SECONDS, Math.min(REST_MAX_SECONDS, secs));
      if (clamped <= 0) {
        stopRest();
        return;
      }
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
        restIntervalRef.current = null;
      }
      setRestRemaining(clamped);
      setRestTotal(clamped);
      setRestActive(true);
    },
    [stopRest]
  );

  // Rest countdown interval
  useEffect(() => {
    if (!restActive) {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
        restIntervalRef.current = null;
      }
      return;
    }
    // ensure no duplicate
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    restIntervalRef.current = setInterval(() => {
      setRestRemaining((prev) => {
        if (prev <= 1) {
          // will hit 0
          if (restIntervalRef.current) {
            clearInterval(restIntervalRef.current);
            restIntervalRef.current = null;
          }
          // play boxing bell (~2.6s) then auto hide — keep 00:00 visible during ring
          playRestDoneSound();
          setTimeout(() => setRestActive(false), 2850);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
        restIntervalRef.current = null;
      }
    };
  }, [restActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    };
  }, []);

  const handleRestAdd30 = useCallback(() => {
    const nextRemaining = Math.min(REST_MAX_SECONDS, restRemaining + 30);
    const nextTotal = Math.min(REST_MAX_SECONDS, restTotal + 30);
    setRestRemaining(nextRemaining);
    setRestTotal(nextTotal);
    persistRestDefault(nextTotal);
    if (!restActive && nextRemaining > 0) setRestActive(true);
  }, [restRemaining, restTotal, restActive, persistRestDefault]);

  const handleRestSub30 = useCallback(() => {
    const nextRemaining = Math.max(REST_MIN_SECONDS, restRemaining - 30);
    const nextTotal = Math.max(30, restTotal - 30);
    setRestRemaining(nextRemaining);
    setRestTotal(nextTotal);
    persistRestDefault(nextTotal);
    if (nextRemaining <= 0) {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
        restIntervalRef.current = null;
      }
      playRestDoneSound();
      setTimeout(() => setRestActive(false), 2850);
    }
  }, [restRemaining, restTotal, persistRestDefault]);

  const handleRestSkip = useCallback(() => {
    stopRest();
  }, [stopRest]);

  // Timer tick (workout elapsed)
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close more menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Handle set field change
  const handleSetChange = (exerciseId, setIdx, field, value) => {
    setSets((prev) => {
      const updated = { ...prev };
      updated[exerciseId] = [...updated[exerciseId]];
      updated[exerciseId][setIdx] = {
        ...updated[exerciseId][setIdx],
        [field]: value,
      };
      return updated;
    });
  };

  // Helper: lấy restSeconds per-exercise (fetch từ DB snapshot), fallback về global default
  const getRestForExercise = useCallback(
    (ex) => {
      if (!ex) return restDefaultRef.current;
      const raw = ex.restSeconds ?? ex.rest_seconds ?? ex.restTime ?? ex.rest_time ?? null;
      if (raw == null || raw === "") return restDefaultRef.current;
      const n = Number(raw);
      if (Number.isNaN(n)) return restDefaultRef.current;
      return Math.max(REST_MIN_SECONDS, Math.min(REST_MAX_SECONDS, n));
    },
    []
  );

  // Toggle set done — triggers rest timer (superset-aware: nghỉ chỉ sau khi xong cả 2 bài trong superset)
  // Dùng restSeconds đã set trong routine (per-exercise)
  const handleToggleDone = (exerciseId, setIdx) => {
    const currentDone = sets[exerciseId]?.[setIdx]?.done;
    const nextDone = !currentDone;

    setSets((prev) => {
      const updated = { ...prev };
      updated[exerciseId] = [...updated[exerciseId]];
      updated[exerciseId][setIdx] = {
        ...updated[exerciseId][setIdx],
        done: nextDone,
      };
      return updated;
    });

    // Rest timer logic: auto start when DONE true, cancel when undone
    // Superset: nếu là bài đầu của superset (có supersetId trùng bài kế tiếp) thì KHÔNG nghỉ — tập luôn bài kia
    if (nextDone) {
      const exIdx = program.exercises.findIndex((e) => e.id === exerciseId);
      const ex = program.exercises[exIdx];
      const nextEx = program.exercises[exIdx + 1];
      const isFirstInSuperset = ex?.supersetId && nextEx && ex.supersetId === nextEx.supersetId;
      if (isFirstInSuperset) {
        // Không bật rest, để user tập ngay bài thứ 2 trong superset
        stopRest();
      } else {
        // bài thứ 2 trong superset hoặc bài lẻ: dùng rest đã set cho bài đó
        const secs = getRestForExercise(ex);
        startRest(secs);
      }
    } else {
      // uncheck -> dismiss current rest
      stopRest();
    }
  };

  // Add a new set
  const handleAddSet = (exerciseId) => {
    setSets((prev) => {
      const updated = { ...prev };
      const exercise = program.exercises.find((ex) => ex.id === exerciseId);
      const lastSet = updated[exerciseId][updated[exerciseId].length - 1];

      // Create new set based on last set values — hold (time) không có reps
      const newSet = { ...lastSet, done: false, rpe: "-" };
      if (exercise?.inputType === "time") delete newSet.reps;
      updated[exerciseId] = [...updated[exerciseId], newSet];
      return updated;
    });
  };

  // Get next mock workout session number (fallback khi chưa có backend)
  const getNextSessionNumber = () => {
    if (typeof window === "undefined") return 1;
    const key = "idk_workout_session_count";
    const current = parseInt(window.localStorage.getItem(key) || "0", 10) || 0;
    const next = current + 1;
    window.localStorage.setItem(key, String(next));
    return next;
  };

  // Helper: tính completedSets và avgRpe (chỉ trên set done)
  const computeWorkoutStats = () => {
    let completedSets = 0;
    const rpes = [];
    Object.values(sets).forEach((exerciseSets) => {
      exerciseSets.forEach((s) => {
        if (s.done) {
          completedSets++;
          if (s.rpe !== undefined && s.rpe !== null && s.rpe !== "-" && s.rpe !== "") {
            const v = parseFloat(String(s.rpe).replace(",", "."));
            if (!Number.isNaN(v) && v >= 0 && v <= 10) rpes.push(v);
          }
        }
      });
    });
    const avgRpe = rpes.length ? Math.round((rpes.reduce((a, b) => a + b, 0) / rpes.length) * 10) / 10 : null;
    const durationMinutes = Math.round(timerSeconds / 60);
    return { completedSets, avgRpe, durationMinutes };
  };

  // Save session -> gọi POST /api/workouts rồi show congratulation board
  // Kèm exercises per-set để lưu vào exercise_progress (chỉ done=true)
  const handleSave = async () => {
    const { completedSets, avgRpe, durationMinutes } = computeWorkoutStats();
    const session = getStoredSession();
    const token = session?.token;

    // Bắt buộc login để có FK tới users
    if (!token) {
      setSaveError("Bạn cần đăng nhập để lưu buổi tập. Vui lòng đăng nhập lại.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      // Build exercises payload cho exercise_progress (1 row = 1 set done=true)
      // kèm goalLink để backend tính progress (direct/indirect) + routineId để trace
      const exercisesPayload = (program.exercises || []).map((ex) => {
        const exSets = sets[ex.id] || [];
        const rawGoalLink = ex.goalLink || ex.goal_link;
        let goalLink = null;
        if (rawGoalLink && typeof rawGoalLink === "object" && rawGoalLink.goalId) {
          goalLink = {
            goalId: rawGoalLink.goalId,
            type: (rawGoalLink.type || "direct").toLowerCase(),
            ...(rawGoalLink.type === "indirect" ? { indirectGain: rawGoalLink.indirectGain ?? rawGoalLink.indirect_gain ?? 3 } : {}),
          };
        }
        return {
          exerciseId: ex.id,
          exerciseName: ex.name,
          inputType: ex.inputType,
          muscleGroups: ex.muscleGroups || ex.muscle_groups || [],
          primaryMuscles: ex.primaryMuscles || ex.primary_muscles || [],
          secondaryMuscles: ex.secondaryMuscles || ex.secondary_muscles || [],
          goalLink,
          goal_link: goalLink,
          sets: exSets.map((s) => ({
            reps: s.reps,
            time: s.time,
            weight: s.weight,
            note: s.note,
            rpe: s.rpe,
            done: !!s.done,
          })),
        };
      });

      // routineId nếu là custom routine (uuid), mock prog-* thì bỏ qua
      const routineId = program.id && !String(program.id).startsWith("prog-") ? program.id : null;

      const res = await apiCreateWorkout(token, {
        name: program.name,
        completedSets,
        avgRpe,
        durationMinutes,
        exercises: exercisesPayload,
        ...(routineId ? { routineId, routine_id: routineId } : {}),
      });
      // Backend trả về camelCase (sessionNumber) hoặc snake_case (session_number)
      const serverSession = res.sessionNumber ?? res.session_number ?? getNextSessionNumber();
      // Vẫn sync localStorage để fallback hiển thị khi offline sau này
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem("idk_workout_session_count", String(serverSession));
        } catch {}
      }
      setSessionNumber(serverSession);
      setShowSummary(false);
      setShowComplete(true);
      stopRest();
    } catch (err) {
      setSaveError(err?.message || "Lưu buổi tập thất bại. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  // Close congratulation board -> back to workouts list
  const handleCompleteClose = () => {
    setShowComplete(false);
    onFinish();
  };

  // Discard session
  const handleDiscard = () => {
    stopRest();
    onFinish();
  };

  // Timer display
  const mins = Math.floor(timerSeconds / 60);
  const secs = timerSeconds % 60;
  const timerDisplay = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  return (
    <div className={`space-y-5 ${restActive ? "pb-[140px] lg:pb-28" : "pb-8"}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSummary(true)}
            className="p-1.5 text-(--faint) hover:text-zinc-300 hover:bg-white/5 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-bold text-(--accent) tracking-[0.18em] uppercase">
                ACTIVE WORKOUT
              </span>
              <span className="led led-live" />
              {hasSuperset && (
                <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 bg-(--accent-soft) border border-(--accent-line) text-(--accent) text-[9px] font-bold tracking-wider">
                  <Layers className="w-2.5 h-2.5" /> {supersetLabelMap.size} SUPERSET
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-zinc-100 tracking-tight">
              {program.name}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Timer */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-(--surface-2) border border-(--accent-line) text-(--accent) text-sm font-display font-semibold tnum">
            <TimerIcon className="w-4 h-4" />
            <span>{timerDisplay}</span>
          </div>

          {/* Save Session */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 btn-ghost text-xs font-semibold px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? "Saving..." : "Save Session"}</span>
          </button>

          {/* More Menu */}
          <div className="relative" ref={moreMenuRef}>
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-2 text-(--faint) hover:text-zinc-300 hover:bg-white/5 transition border border-(--line)"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMoreMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-(--surface) border border-(--line-strong) z-40">
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    handleDiscard();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-(--accent) hover:bg-(--accent-soft) transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Discard Workout
                </button>
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    if (restActive) stopRest();
                    else startRest(restDefaultRef.current);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-zinc-400 hover:bg-white/5 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {restActive ? "Stop Rest Timer" : "Start Rest Timer"}
                </button>
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-zinc-400 hover:bg-white/5 transition"
                >
                  <GripVertical className="w-3.5 h-3.5" />
                  Reorder Exercises
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Exercise Blocks - grouped by superset */}
      <div className="space-y-5">
        {groups.map((group) => {
          if (group.type === "superset") {
            const label = supersetLabelMap.get(group.supersetId);
            return (
              <div
                key={group.supersetId}
                className="border border-(--accent-line) bg-(--surface) p-3 sm:p-4 space-y-4 relative"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-(--accent) text-white text-[10px] font-bold tracking-[0.14em] uppercase shadow">
                    <Layers className="w-3 h-3" />
                    SUPERSET {label}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-(--accent) font-medium">
                    <Link2 className="w-3 h-3" /> {group.exercises[0].name} + {group.exercises[1].name}
                  </span>
                  <span className="text-[10px] text-(--muted) hidden sm:inline">• Tập liên tiếp, nghỉ sau khi xong cả 2 bài</span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {group.exercises.map((exercise, innerIdx) => {
                    const globalIdx = group.startIndex + innerIdx;
                    return (
                      <div key={exercise.id} className="relative">
                        {innerIdx === 1 && (
                          <div className="flex items-center justify-center gap-2 py-1">
                            <div className="h-px flex-1 bg-(--accent-line)/40 hidden sm:block" />
                            <span className="text-[9px] font-bold tracking-wider text-(--accent) bg-(--accent-soft) border border-(--accent-line) px-2 py-0.5 flex items-center gap-1">
                              <Link2 className="w-2.5 h-2.5" /> SUPERSET
                            </span>
                            <div className="h-px flex-1 bg-(--accent-line)/40 hidden sm:block" />
                          </div>
                        )}
                        <ExerciseBlock
                          exercise={exercise}
                          exerciseIndex={globalIdx}
                          sets={sets[exercise.id] || []}
                          previousSets={previousMap[exercise.name] || []}
                          onSetChange={handleSetChange}
                          onAddSet={handleAddSet}
                          onToggleDone={handleToggleDone}
                          onInfoClick={(ex) => setInfoExercise(ex)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }
          // single
          const exercise = group.exercises[0];
          return (
            <ExerciseBlock
              key={exercise.id}
              exercise={exercise}
              exerciseIndex={group.startIndex}
              sets={sets[exercise.id] || []}
              previousSets={previousMap[exercise.name] || []}
              onSetChange={handleSetChange}
              onAddSet={handleAddSet}
              onToggleDone={handleToggleDone}
              onInfoClick={(ex) => setInfoExercise(ex)}
            />
          );
        })}
      </div>

      {/* Finish Workout Button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={() => setShowSummary(true)}
          className="flex items-center gap-2.5 btn-accent text-sm font-semibold px-8 py-3"
        >
          <Trophy className="w-4.5 h-4.5" />
          <span>Finish Workout</span>
        </button>
      </div>

      {/* Rest Timer Bar — fixed bottom */}
      {restActive && (
        <RestTimerBar
          remaining={restRemaining}
          total={restTotal}
          onAdd30={handleRestAdd30}
          onSub30={handleRestSub30}
          onSkip={handleRestSkip}
        />
      )}

      {/* Exercise Info Modal */}
      <ExerciseInfoModal
        exercise={infoExercise}
        isOpen={!!infoExercise}
        onClose={() => setInfoExercise(null)}
      />

      {/* Workout Summary Modal */}
      <WorkoutSummaryModal
        isOpen={showSummary}
        onClose={() => {
          if (!isSaving) {
            setSaveError(null);
            setShowSummary(false);
          }
        }}
        onSave={handleSave}
        onDiscard={handleDiscard}
        workoutName={program.name}
        timerSeconds={timerSeconds}
        exercises={program.exercises}
        sets={sets}
        isSaving={isSaving}
        error={saveError}
      />

      {/* Workout Complete (Congratulation) Modal */}
      <WorkoutCompleteModal
        isOpen={showComplete}
        onClose={handleCompleteClose}
        workoutName={program.name}
        timerSeconds={timerSeconds}
        exercises={program.exercises}
        sets={sets}
        sessionNumber={sessionNumber}
      />
    </div>
  );
}
