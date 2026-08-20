"use client";

import React from "react";
import {
  Trophy,
  Clock,
  CheckCircle2,
  Dumbbell,
  Flame,
  PartyPopper,
  Zap,
  Award,
  X,
} from "lucide-react";

export default function WorkoutCompleteModal({
  isOpen,
  onClose,
  workoutName,
  timerSeconds,
  exercises,
  sets,
  sessionNumber,
}) {
  if (!isOpen) return null;

  const mins = Math.floor(timerSeconds / 60);
  const secs = timerSeconds % 60;
  const duration = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  // Tính toán số liệu thật từ các set đã nhập
  const { rows: exerciseRows, totals } = (exercises || []).reduce(
    (acc, ex) => {
      const exSets = (sets && sets[ex.id]) || [];
      let done = 0;
      let reps = 0;
      let hold = 0;
      exSets.forEach((s) => {
        if (s.done) done++;
        const r = parseInt(s.reps, 10);
        if (!Number.isNaN(r)) reps += r;
        const t = parseFloat(s.time);
        if (!Number.isNaN(t)) hold += t;
      });
      acc.totals.totalSets += exSets.length;
      acc.totals.completedSets += done;
      acc.totals.totalReps += reps;
      acc.totals.totalHold += hold;
      acc.rows.push({ name: ex.name, done, total: exSets.length, reps, hold });
      return acc;
    },
    {
      rows: [],
      totals: { totalSets: 0, completedSets: 0, totalReps: 0, totalHold: 0 },
    }
  );
  const totalSets = totals.totalSets;
  const completedSets = totals.completedSets;
  const totalReps = totals.totalReps;
  const totalHold = totals.totalHold;

  // Mock data (tạm thời, sau này thay bằng dữ liệu thật từ backend)
  const mock = {
    calories: Math.round(totalReps * 4 + totalHold * 0.5 + timerSeconds * 0.6),
    isPersonalBest: sessionNumber % 3 === 0,
    streak: 12 + (sessionNumber % 7),
    volume: totalReps * 9 + totalHold * 2,
  };

  const stats = [
    { label: "Buổi tập", value: `#${sessionNumber}`, sub: "Session", icon: Trophy },
    { label: "Sets done", value: `${completedSets}/${totalSets}`, sub: "sets", icon: CheckCircle2 },
    { label: "Reps", value: totalReps.toLocaleString(), sub: "reps", icon: Dumbbell },
    { label: "Duration", value: duration, sub: "time", icon: Clock },
    { label: "Hold time", value: `${Math.round(totalHold)}s`, sub: "isometric", icon: Zap },
    { label: "Calories", value: mock.calories.toLocaleString(), sub: "kcal (mock)", icon: Flame },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-(--surface) border border-(--accent-line) w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Celebration header */}
        <div className="relative p-7 pb-5 text-center border-b border-white/[0.06] overflow-hidden">
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-(--accent)/[0.15] blur-[80px] pointer-events-none" />
          <button
            onClick={onClose}
            className="absolute right-3 top-3 p-1 text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="relative">
            <div className="w-16 h-16 bg-(--accent-soft) border border-(--accent-line) flex items-center justify-center mx-auto mb-4 animate-slide-up">
              <Trophy className="w-8 h-8 text-(--accent)" />
            </div>
            <p className="text-[10px] font-bold text-(--accent) tracking-[0.22em] uppercase mb-1.5">
              Chúc mừng!
            </p>
            <h2 className="font-display text-xl font-bold text-zinc-50 leading-tight">
              Buổi tập thứ #{sessionNumber} hoàn thành
            </h2>
            <p className="text-xs text-zinc-500 mt-1.5">{workoutName}</p>
          </div>
        </div>

        {/* Mock badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 px-6 pt-4">
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-(--accent-soft) border border-(--accent-line) text-(--accent) text-[10px] font-semibold">
            <PartyPopper className="w-3.5 h-3.5" />
            Nice work
          </span>
          {mock.isPersonalBest && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-(--line-strong) text-zinc-200 text-[10px] font-semibold">
              <Award className="w-3.5 h-3.5" />
              New Personal Best (mock)
            </span>
          )}
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-(--line-strong) text-zinc-300 text-[10px] font-semibold">
            <Flame className="w-3.5 h-3.5" />
            Streak {mock.streak} days
          </span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 px-6 pt-5">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-(--surface-3) border border-(--line) p-3 text-center">
                <Icon className="w-4 h-4 text-(--accent) mx-auto mb-1.5" />
                <p className="font-display text-sm font-bold text-zinc-100 tnum">{s.value}</p>
                <p className="text-[9px] uppercase tracking-wider text-zinc-500 mt-0.5">{s.label}</p>
                <p className="text-[9px] text-(--faint)">{s.sub}</p>
              </div>
            );
          })}
        </div>

        {/* Exercise summary table */}
        <div className="px-6 pt-5">
          <p className="text-[10px] font-semibold text-(--faint) uppercase tracking-[0.18em] mb-2">
            Chi tiết bài tập
          </p>
          <div className="border border-(--line) overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-2 bg-(--surface-3) border-b border-(--line) text-[10px] font-semibold text-(--faint) uppercase tracking-wider">
              <span>Exercise</span>
              <span className="text-center">Sets</span>
              <span className="text-center">Reps</span>
              <span className="text-center">Time</span>
            </div>
            {exerciseRows.map((row, idx) => (
              <div
                key={idx}
                className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-2 border-b border-white/[0.04] last:border-b-0 text-xs"
              >
                <span className="text-zinc-300 truncate pr-2">{row.name}</span>
                <span className="text-zinc-100 font-semibold text-center tnum">
                  {row.done}/{row.total}
                </span>
                <span className="text-zinc-400 text-center tnum">{row.reps || "-"}</span>
                <span className="text-zinc-400 text-center tnum">
                  {row.hold ? `${Math.round(row.hold)}s` : "-"}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[9px] text-(--faint) mt-1.5 text-center">
            Volume ≈ {mock.volume.toLocaleString()} kg (mock)
          </p>
        </div>

        {/* Actions */}
        <div className="p-6 pt-5">
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 btn-accent text-xs py-2.5"
          >
            <PartyPopper className="w-4 h-4" />
            Back to Workouts
          </button>
        </div>
      </div>
    </div>
  );
}