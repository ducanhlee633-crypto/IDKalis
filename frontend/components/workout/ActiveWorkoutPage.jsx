"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  MoreVertical,
  Save,
  Trophy,
  ArrowLeft,
  RotateCcw,
  GripVertical,
  Timer as TimerIcon,
  Trash2,
} from "lucide-react";
import ExerciseBlock from "./ExerciseBlock";
import RestTimerBar from "./RestTimerBar";
import ExerciseInfoModal from "./ExerciseInfoModal";
import WorkoutSummaryModal from "./WorkoutSummaryModal";
import WorkoutCompleteModal from "./WorkoutCompleteModal";
import { getStoredSession } from "@/lib/auth";
import { apiCreateWorkout } from "@/lib/workouts";

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
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(1320, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.28, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.55);
      // close context after
      setTimeout(() => {
        try {
          ctx.close();
        } catch {}
      }, 700);
    } else {
      // fallback beep via audio element if no AudioContext
      const audio = new Audio(
        "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA=="
      );
      audio.volume = 0.5;
      audio.play().catch(() => {});
    }
  } catch {}
  try {
    if (navigator.vibrate) navigator.vibrate([220, 80, 220]);
  } catch {}
}

export default function ActiveWorkoutPage({ program, onFinish }) {
  // Initialize sets state from program exercises
  const [sets, setSets] = useState(() => {
    const initial = {};
    program.exercises.forEach((ex) => {
      initial[ex.id] = ex.defaultSets.map((s) => ({
        ...s,
        done: false,
      }));
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
          // play sound + haptic then auto hide
          playRestDoneSound();
          // delay hide to let user see 00:00 briefly
          setTimeout(() => setRestActive(false), 1100);
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
      setTimeout(() => setRestActive(false), 600);
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

  // Toggle set done — triggers rest timer
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
    if (nextDone) {
      // if already active, restart with (possibly updated) default — gives fresh countdown per set
      startRest(restDefaultRef.current);
    } else {
      // uncheck -> dismiss current rest (if user unticks, they probably don't need rest)
      stopRest();
    }
  };

  // Add a new set
  const handleAddSet = (exerciseId) => {
    setSets((prev) => {
      const updated = { ...prev };
      const exercise = program.exercises.find((ex) => ex.id === exerciseId);
      const lastSet = updated[exerciseId][updated[exerciseId].length - 1];

      // Create new set based on last set values
      const newSet = { ...lastSet, done: false, rpe: "-" };
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
      const res = await apiCreateWorkout(token, {
        name: program.name,
        completedSets,
        avgRpe,
        durationMinutes,
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

      {/* Exercise Blocks */}
      <div className="space-y-5">
        {program.exercises.map((exercise, idx) => (
          <ExerciseBlock
            key={exercise.id}
            exercise={exercise}
            exerciseIndex={idx}
            sets={sets[exercise.id] || []}
            onSetChange={handleSetChange}
            onAddSet={handleAddSet}
            onToggleDone={handleToggleDone}
            onInfoClick={(ex) => setInfoExercise(ex)}
          />
        ))}
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
