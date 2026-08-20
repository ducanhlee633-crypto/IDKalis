"use client";

import React, { useState } from "react";
import { Target, Clock, Plus, X, CheckCircle2 } from "lucide-react";

const METRIC_TYPES = [
  { key: "seconds", label: "Second Hold", unit: "s" },
  { key: "weighted", label: "Weighted", unit: "kg" },
  { key: "reps", label: "Reps", unit: "reps" },
];

const METRIC_CATEGORY = {
  seconds: "Time Skill",
  weighted: "Strength",
  reps: "Endurance",
};

const TIME_UNITS = [
  { key: "weeks", label: "weeks" },
  { key: "months", label: "months" },
];

const INITIAL_GOALS = [
  {
    title: "Hold 10s Full Planche with straight arms",
    category: "Push Skill",
    deadline: "Aug 30, 2026",
    status: "In Progress",
    current: "6s Straddle Planche",
    progress: 65,
  },
  {
    title: "Clean 15s Full Front Lever Hold",
    category: "Pull Skill",
    deadline: "Jul 15, 2026",
    status: "Near Completion",
    current: "10s Full Lever",
    progress: 85,
  },
  {
    title: "10 Consecutive Strict Ring Muscle-Ups",
    category: "Power Skill",
    deadline: "Jun 30, 2026",
    status: "In Progress",
    current: "8 Consecutive",
    progress: 80,
  },
  {
    title: "Achieve 20 Weighted Pistol Squats (+20kg)",
    category: "Lower Body",
    deadline: "Sep 15, 2026",
    status: "Starting",
    current: "12 Reps (+16kg)",
    progress: 50,
  },
];

function formatDate(date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function computeDeadline(amount, unit) {
  const date = new Date();
  if (unit === "weeks") date.setDate(date.getDate() + amount * 7);
  else date.setMonth(date.getMonth() + amount);
  return formatDate(date);
}

export default function GoalsPage() {
  const [goals, setGoals] = useState(INITIAL_GOALS);
  const [modalOpen, setModalOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [metricKey, setMetricKey] = useState("seconds");
  const [metricValue, setMetricValue] = useState("");
  const [timeAmount, setTimeAmount] = useState("");
  const [timeUnit, setTimeUnit] = useState("weeks");

  const resetForm = () => {
    setTitle("");
    setMetricKey("seconds");
    setMetricValue("");
    setTimeAmount("");
    setTimeUnit("weeks");
  };

  const handleAdd = () => {
    const metric = METRIC_TYPES.find((m) => m.key === metricKey);
    const unitLabel = metric.unit === "reps" ? "reps" : metric.unit;
    const amount = parseFloat(metricValue) || 0;
    const time = parseInt(timeAmount, 10) || 0;

    const goal = {
      id: `goal-${Date.now()}`,
      title: title.trim(),
      category: METRIC_CATEGORY[metricKey],
      deadline: computeDeadline(time, timeUnit),
      status: "Starting",
      current: "Not started",
      progress: 0,
      target: `${amount}${unitLabel} ${metric.label.toLowerCase()}`,
    };

    setGoals((prev) => [...prev, goal]);
    setModalOpen(false);
    resetForm();
  };

  const canAdd =
    title.trim().length > 0 &&
    (parseFloat(metricValue) || 0) > 0 &&
    (parseInt(timeAmount, 10) || 0) > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-zinc-50 tracking-tight">Calisthenics Goals</h1>
          <p className="text-xs text-(--muted) mt-1">Set and track milestone objectives for your bodyweight journey.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 btn-accent text-xs px-4 py-2 active:scale-[0.98] shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Goal</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {goals.map((g, idx) => (
          <div
            key={g.id ?? idx}
            className="bg-(--surface) border border-(--line) p-5 square-frame"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-(--accent) uppercase tracking-[0.18em]">{g.category}</span>
              <span className="text-xs text-(--muted) font-medium">{g.status}</span>
            </div>
            <h3 className="text-sm font-bold text-zinc-100 mb-2">{g.title}</h3>
            <div className="w-full h-2 bg-(--surface-3) overflow-hidden mb-3">
              <div
                className="h-full bg-(--accent)"
                style={{ width: `${g.progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-white/[0.04]">
              <span>{g.target ? `Target: ${g.target}` : `Current: ${g.current}`}</span>
              <span className="flex items-center gap-1 text-zinc-500">
                <Clock className="w-3.5 h-3.5" />
                {g.deadline}
              </span>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-(--surface) border border-(--line-strong) w-full max-w-md square-frame">
            <div className="flex items-center justify-between p-5 pb-3">
              <h2 className="flex items-center gap-2 text-base font-bold text-zinc-100">
                <Target className="w-4 h-4 text-(--accent)" />
                New Goal
              </h2>
              <button
                onClick={() => {
                  setModalOpen(false);
                  resetForm();
                }}
                className="text-(--faint) hover:text-zinc-300 p-1 hover:bg-white/5 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 pb-5 space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-(--faint) uppercase tracking-[0.18em] mb-1.5">
                  Goal Name
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Hold 15s Front Lever"
                  className="w-full bg-(--surface-3) border border-(--line-strong) px-3 py-2 text-xs text-zinc-200 outline-none placeholder:text-(--faint) focus:border-(--accent-line) transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-(--faint) uppercase tracking-[0.18em] mb-1.5">
                  Metric Type
                </label>
                <div className="grid grid-cols-3 gap-1 bg-(--surface-3) border border-(--line) p-1">
                  {METRIC_TYPES.map((m) => (
                    <button
                      key={m.key}
                      onClick={() => setMetricKey(m.key)}
                      className={`px-2 py-2 text-[10px] font-semibold transition ${
                        metricKey === m.key
                          ? "bg-(--accent-soft) border border-(--accent-line) text-(--accent)"
                          : "border border-transparent text-(--faint) hover:text-zinc-300"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={metricValue}
                    onChange={(e) => setMetricValue(e.target.value)}
                    placeholder="Target value"
                    className="w-full bg-(--surface-3) border border-(--line-strong) px-3 py-2 text-xs text-zinc-200 outline-none placeholder:text-(--faint) focus:border-(--accent-line) transition"
                  />
                  <span className="text-[10px] font-bold text-(--muted) uppercase tracking-wider shrink-0 w-12 text-center">
                    {METRIC_TYPES.find((m) => m.key === metricKey).unit}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-(--faint) uppercase tracking-[0.18em] mb-1.5">
                  Estimated Time to Achieve
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={timeAmount}
                    onChange={(e) => setTimeAmount(e.target.value)}
                    placeholder="e.g. 12"
                    className="w-full bg-(--surface-3) border border-(--line-strong) px-3 py-2 text-xs text-zinc-200 outline-none placeholder:text-(--faint) focus:border-(--accent-line) transition"
                  />
                  <select
                    value={timeUnit}
                    onChange={(e) => setTimeUnit(e.target.value)}
                    className="bg-(--surface-3) border border-(--line-strong) px-2 py-2 text-xs text-zinc-200 outline-none focus:border-(--accent-line) transition shrink-0"
                  >
                    {TIME_UNITS.map((u) => (
                      <option key={u.key} value={u.key}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>
                {(parseInt(timeAmount, 10) || 0) > 0 && (
                  <p className="flex items-center gap-1 text-[10px] text-(--muted) mt-1.5">
                    <CheckCircle2 className="w-3 h-3 text-(--accent)" />
                    Estimated deadline: {computeDeadline(parseInt(timeAmount, 10), timeUnit)}
                  </p>
                )}
              </div>

              <button
                onClick={handleAdd}
                disabled={!canAdd}
                className="w-full flex items-center justify-center gap-2 btn-accent disabled:opacity-50 text-xs px-4 py-2.5 active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>Create Goal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}