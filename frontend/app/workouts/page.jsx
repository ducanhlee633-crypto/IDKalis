"use client";

import React, { useState } from "react";
import { CALISTHENICS_SKILLS, RECENT_WORKOUTS } from "@/data/mockCalisthenicsData";
import { WORKOUT_PROGRAMS_DETAIL } from "@/data/mockCalisthenicsData";
import { Plus, Clock, Zap, Play, StickyNote } from "lucide-react";
import ActiveWorkoutPage from "@/components/workout/ActiveWorkoutPage";
import CreateRoutinePage from "@/components/workout/CreateRoutinePage";

export default function WorkoutsPage() {
  const [filter, setFilter] = useState("ALL");
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [creatingRoutine, setCreatingRoutine] = useState(false);

  const categories = ["ALL", "PUSH", "PULL", "CORE", "LEGS", "SKILLS"];

  const workoutPrograms = [
    {
      id: "prog-1",
      name: "Planche & Pushing Mastery",
      level: "Advanced",
      duration: "60 min",
      category: "PUSH",
      exercises: ["Planche Lean (5x12s)", "Ring Dips (+20kg 4x8)", "Deficit HSPU (4x5)", "Pseudo Planche Push-ups (3x10)"],
      intensity: "High Intensity (RPE 9.0)",
    },
    {
      id: "prog-2",
      name: "Front Lever & Strict Pulling",
      level: "Advanced",
      duration: "75 min",
      category: "PULL",
      exercises: ["Full Front Lever (5x6s)", "Strict Bar Muscle-Up (4x4)", "Weighted Pull-ups (+25kg 4x6)", "Ice Cream Makers (3x8)"],
      intensity: "High Intensity (RPE 8.5)",
    },
    {
      id: "prog-3",
      name: "Core Compression & Dragon Flag",
      level: "Intermediate",
      duration: "45 min",
      category: "CORE",
      exercises: ["Dragon Flag Eccentrics (4x6)", "V-Sit / L-Sit Holds (4x20s)", "Hanging Leg Raises (3x12)", "Ab Wheel (3x10)"],
      intensity: "Moderate (RPE 7.5)",
    },
    {
      id: "prog-4",
      name: "Explosive Lower Body & Mobility",
      level: "Intermediate",
      duration: "55 min",
      category: "LEGS",
      exercises: ["Weighted Pistol Squats (+16kg 4x8)", "Nordic Hamstring Curls (4x6)", "Shrimp Squats (3x10)", "Calf Jumps (3x25)"],
      intensity: "Moderate (RPE 7.8)",
    },
  ];

  const [routines, setRoutines] = useState(workoutPrograms);

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

  const handleSaveRoutine = (routine) => {
    setRoutines((prev) => [routine, ...prev]);
    setCreatingRoutine(false);
  };

  if (creatingRoutine) {
    return (
      <CreateRoutinePage
        onSave={handleSaveRoutine}
        onCancel={() => setCreatingRoutine(false)}
      />
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

      {/* Workout Programs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredPrograms.map((prog) => (
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
              <span className="px-2 py-0.5 bg-(--surface-3) border border-(--line) text-(--muted) text-[10px] font-medium">
                {prog.level}
              </span>
            </div>

            {/* Exercise List */}
            <div className="space-y-1.5 my-3 bg-(--surface-3) p-3 border border-(--line)">
              {prog.exercises.map((ex, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-zinc-300">
                  <span className="w-1.5 h-1.5 bg-(--accent)" />
                  <span>{ex}</span>
                </div>
              ))}
            </div>

            {/* Program Details */}
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-3 border-t border-(--line) text-xs text-(--muted)">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-(--faint)" />
                  {prog.duration}
                </span>
                <span className="flex items-center gap-1.5 text-(--muted)">
                  <Zap className="w-3.5 h-3.5 text-(--accent)" />
                  {prog.intensity ?? `${prog.exercises.length} exercises`}
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
        ))}
      </div>
    </div>
  );
}