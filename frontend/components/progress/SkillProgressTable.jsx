"use client";

import React, { useState } from "react";
import { Info, Award, Trophy, Dumbbell, Flag, Sparkles, X, ChevronRight } from "lucide-react";

// Custom SVG Circular Progress Ring
function CircularProgressRing({ progress, size = 38, strokeWidth = 3 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#22222a"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#00e5ff"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {/* Percentage Text inside ring */}
      <span className="absolute text-[10px] font-bold text-white">
        {progress}%
      </span>
    </div>
  );
}

// Handstand icon SVG
function HandstandIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="19" r="2" />
      <path d="M12 17v-6" />
      <path d="M8 8l4 3 4-3" />
      <path d="M9 5l3-3 3 3" />
      <path d="M6 14l6-3 6 3" />
    </svg>
  );
}

export default function SkillProgressTable() {
  const [showInfo, setShowInfo] = useState(false);
  const [showAllSkillsModal, setShowAllSkillsModal] = useState(false);

  const skills = [
    {
      id: "planche",
      name: "Planche",
      variation: "Straddle Hold",
      icon: <Award className="w-4 h-4 text-amber-400" />,
      current: "6.0s",
      previous: "4.5s",
      progressDelta: "↑ 33%",
      nextMilestone: "8s Straddle",
      toGo: "2.0s to go",
      percentage: 68,
    },
    {
      id: "front-lever",
      name: "Front Lever",
      variation: "Full Lever Hold",
      icon: <Trophy className="w-4 h-4 text-cyan-400" />,
      current: "8.0s",
      previous: "6.0s",
      progressDelta: "↑ 33%",
      nextMilestone: "12s Full Lever",
      toGo: "4.0s to go",
      percentage: 85,
    },
    {
      id: "hspu",
      name: "Handstand Push-Up",
      variation: "Strict",
      icon: <HandstandIcon className="w-4 h-4 text-cyan-400" />,
      current: "5 reps",
      previous: "4 reps",
      progressDelta: "↑ 25%",
      nextMilestone: "8 reps",
      toGo: "3 reps to go",
      percentage: 74,
    },
    {
      id: "muscle-up",
      name: "Muscle-Up",
      variation: "Strict",
      icon: <Trophy className="w-4 h-4 text-amber-400" />,
      current: "8 reps",
      previous: "6 reps",
      progressDelta: "↑ 33%",
      nextMilestone: "12 reps",
      toGo: "4 reps to go",
      percentage: 90,
    },
    {
      id: "dragon-flag",
      name: "Dragon Flag",
      variation: "Full Extension",
      icon: <Flag className="w-4 h-4 text-rose-400" />,
      current: "12 reps",
      previous: "10 reps",
      progressDelta: "↑ 20%",
      nextMilestone: "15 reps",
      toGo: "3 reps to go",
      percentage: 82,
    },
  ];

  return (
    <div className="bg-[#111114] border border-[#1f1f26] rounded-xl p-5 flex flex-col justify-between relative shadow-sm">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5">
          <h2 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            Skill Progress
          </h2>
          <div className="relative">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="text-zinc-500 hover:text-zinc-300 transition p-0.5"
              title="Information"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
            {showInfo && (
              <div className="absolute left-0 top-6 w-64 bg-[#1a1a22] border border-white/10 p-2.5 rounded-lg text-[11px] text-zinc-300 shadow-xl z-50 animate-fade-in">
                Key isometric and dynamic calisthenics skill progressions comparing your latest recorded PRs with previous benchmarks.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table Structure */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/[0.06] text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
              <th className="pb-3 pr-4 font-semibold">SKILL</th>
              <th className="pb-3 px-3 font-semibold">CURRENT</th>
              <th className="pb-3 px-3 font-semibold">PREVIOUS</th>
              <th className="pb-3 px-3 font-semibold">PROGRESS</th>
              <th className="pb-3 pl-3 text-right font-semibold">NEXT MILESTONE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04] text-xs">
            {skills.map((item) => (
              <tr key={item.id} className="group hover:bg-white/[0.02] transition-colors">
                {/* Skill Column */}
                <td className="py-3.5 pr-4">
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 p-1.5 bg-[#17171e] border border-white/5 rounded-lg">
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-bold text-zinc-100 group-hover:text-cyan-400 transition-colors">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-zinc-400">{item.variation}</p>
                    </div>
                  </div>
                </td>

                {/* Current Column */}
                <td className="py-3.5 px-3 font-semibold text-zinc-200">
                  {item.current}
                </td>

                {/* Previous Column */}
                <td className="py-3.5 px-3 text-zinc-400 font-medium">
                  {item.previous}
                </td>

                {/* Progress % Column */}
                <td className="py-3.5 px-3 font-semibold text-emerald-400">
                  {item.progressDelta}
                </td>

                {/* Next Milestone Column + Circular Ring */}
                <td className="py-3.5 pl-3">
                  <div className="flex items-center justify-end gap-3">
                    <div className="text-right">
                      <p className="font-semibold text-zinc-200">{item.nextMilestone}</p>
                      <p className="text-[10px] text-zinc-400">{item.toGo}</p>
                    </div>
                    <CircularProgressRing progress={item.percentage} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom Button */}
      <div className="mt-4 pt-3 border-t border-white/[0.04]">
        <button
          onClick={() => setShowAllSkillsModal(true)}
          className="px-3.5 py-2 bg-[#17171d] hover:bg-[#202028] border border-[#2a2a34] text-xs font-medium text-zinc-300 hover:text-white rounded-lg transition"
        >
          View all skills
        </button>
      </div>

      {/* All Skills Modal */}
      {showAllSkillsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-[#121216] border border-[#262630] rounded-xl max-w-xl w-full p-6 shadow-2xl animate-fade-in max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Full Calisthenics Skill Tree</h3>
              </div>
              <button
                onClick={() => setShowAllSkillsModal(false)}
                className="text-zinc-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto my-4 space-y-3 pr-1 text-xs">
              {[
                ...skills,
                {
                  id: "maltese",
                  name: "Maltese Cross Prep",
                  variation: "Lean (Angle 45°)",
                  icon: <Award className="w-4 h-4 text-purple-400" />,
                  current: "4.0s",
                  previous: "2.0s",
                  progressDelta: "↑ 50%",
                  nextMilestone: "8s Lean",
                  toGo: "4.0s to go",
                  percentage: 45,
                },
                {
                  id: "v-sit",
                  name: "V-Sit / Manna",
                  variation: "High Compression V",
                  icon: <Award className="w-4 h-4 text-emerald-400" />,
                  current: "10.0s",
                  previous: "7.0s",
                  progressDelta: "↑ 42%",
                  nextMilestone: "15s Manna",
                  toGo: "5.0s to go",
                  percentage: 60,
                },
                {
                  id: "victorian",
                  name: "Victorian Cross Prep",
                  variation: "Elevated Rings",
                  icon: <Award className="w-4 h-4 text-blue-400" />,
                  current: "3.5s",
                  previous: "2.0s",
                  progressDelta: "↑ 75%",
                  nextMilestone: "6s Hold",
                  toGo: "2.5s to go",
                  percentage: 35,
                },
              ].map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-3 bg-[#17171e] rounded-lg border border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-[#20202a] rounded-md">{s.icon}</div>
                    <div>
                      <p className="font-bold text-zinc-100">{s.name}</p>
                      <p className="text-[11px] text-zinc-400">{s.variation}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-cyan-400">{s.current}</p>
                      <p className="text-[10px] text-zinc-400">{s.progressDelta}</p>
                    </div>
                    <CircularProgressRing progress={s.percentage} />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowAllSkillsModal(false)}
              className="w-full py-2 bg-white hover:bg-zinc-200 text-black font-semibold text-xs rounded-lg transition shrink-0"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
