"use client";

import React from "react";
import { Target, CheckCircle2, Circle, Clock, Flame } from "lucide-react";

export default function GoalsPage() {
  const goals = [
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Calisthenics Goals</h1>
        <p className="text-xs text-zinc-400 mt-1">Set and track milestone objectives for your bodyweight journey.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {goals.map((g, idx) => (
          <div
            key={idx}
            className="bg-[#121215] border border-[#222228] p-5 square-frame"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">{g.category}</span>
              <span className="text-xs text-emerald-400 font-medium">{g.status}</span>
            </div>
            <h3 className="text-sm font-bold text-zinc-100 mb-2">{g.title}</h3>
            <div className="w-full h-2 bg-[#1b1b22] overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                style={{ width: `${g.progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-white/[0.04]">
              <span>Current: {g.current}</span>
              <span className="flex items-center gap-1 text-zinc-500">
                <Clock className="w-3.5 h-3.5" />
                {g.deadline}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
