"use client";

import React, { useState, useRef, useEffect } from "react";
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
import WorkoutTimer from "./WorkoutTimer";
import ExerciseInfoModal from "./ExerciseInfoModal";
import WorkoutSummaryModal from "./WorkoutSummaryModal";
import WorkoutCompleteModal from "./WorkoutCompleteModal";

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
  const moreMenuRef = useRef(null);

  // Timer tick
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

  // Toggle set done
  const handleToggleDone = (exerciseId, setIdx) => {
    setSets((prev) => {
      const updated = { ...prev };
      updated[exerciseId] = [...updated[exerciseId]];
      updated[exerciseId][setIdx] = {
        ...updated[exerciseId][setIdx],
        done: !updated[exerciseId][setIdx].done,
      };
      return updated;
    });
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

  // Get next mock workout session number (persisted so it increments across sessions)
  const getNextSessionNumber = () => {
    if (typeof window === "undefined") return 1;
    const key = "idk_workout_session_count";
    const current = parseInt(window.localStorage.getItem(key) || "0", 10) || 0;
    const next = current + 1;
    window.localStorage.setItem(key, String(next));
    return next;
  };

  // Save session -> show congratulation board
  const handleSave = () => {
    setSessionNumber(getNextSessionNumber());
    setShowSummary(false);
    setShowComplete(true);
  };

  // Close congratulation board -> back to workouts list
  const handleCompleteClose = () => {
    setShowComplete(false);
    onFinish();
  };

  // Discard session
  const handleDiscard = () => {
    onFinish();
  };

  // Timer display
  const mins = Math.floor(timerSeconds / 60);
  const secs = timerSeconds % 60;
  const timerDisplay = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  return (
    <div className="space-y-5 pb-8">
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
            className="flex items-center gap-2 btn-ghost text-xs font-semibold px-4 py-2"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Session</span>
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
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-zinc-400 hover:bg-white/5 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Rest Timer
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

      {/* Exercise Info Modal */}
      <ExerciseInfoModal
        exercise={infoExercise}
        isOpen={!!infoExercise}
        onClose={() => setInfoExercise(null)}
      />

      {/* Workout Summary Modal */}
      <WorkoutSummaryModal
        isOpen={showSummary}
        onClose={() => setShowSummary(false)}
        onSave={handleSave}
        onDiscard={handleDiscard}
        workoutName={program.name}
        timerSeconds={timerSeconds}
        exercises={program.exercises}
        sets={sets}
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
