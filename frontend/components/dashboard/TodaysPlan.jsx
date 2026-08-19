"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TODAYS_PLAN } from "@/data/mockCalisthenicsData";
import { Check, Clock, Circle } from "lucide-react";

export default function TodaysPlan() {
  const [plans, setPlans] = useState(TODAYS_PLAN);

  const toggleStatus = (id) => {
    setPlans((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextStatus =
            item.status === "DONE"
              ? "IN_PROGRESS"
              : item.status === "IN_PROGRESS"
              ? "NOT_STARTED"
              : "DONE";
          return { ...item, status: nextStatus };
        }
        return item;
      })
    );
  };

  const renderBadge = (status) => {
    switch (status) {
      case "DONE":
        return (
          <span className="px-2 py-0.5 bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-[10px] font-semibold tracking-wider uppercase">
            DONE
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="px-2 py-0.5 bg-cyan-400/15 border border-cyan-400/30 text-cyan-400 text-[10px] font-semibold tracking-wider uppercase shadow-[0_0_8px_rgba(0,229,255,0.2)]">
            IN PROGRESS
          </span>
        );
      case "NOT_STARTED":
      default:
        return (
          <span className="px-2 py-0.5 bg-zinc-800/60 border border-white/5 text-zinc-500 text-[10px] font-medium tracking-wider uppercase">
            NOT STARTED
          </span>
        );
    }
  };

  const renderCircleIcon = (status) => {
    if (status === "DONE") {
      return (
        <div className="w-5 h-5 bg-cyan-400 flex items-center justify-center text-black shadow-[0_0_8px_#00e5ff]">
          <Check className="w-3 h-3 stroke-[3]" />
        </div>
      );
    }
    if (status === "IN_PROGRESS") {
      return (
        <div className="w-5 h-5 bg-cyan-400 flex items-center justify-center text-black shadow-[0_0_8px_#00e5ff]">
          <Check className="w-3 h-3 stroke-[3]" />
        </div>
      );
    }
    return (
      <div className="w-5 h-5 bg-[#1c1c24] border border-zinc-700 flex items-center justify-center">
        <Circle className="w-2.5 h-2.5 text-zinc-600 fill-zinc-600" />
      </div>
    );
  };

  return (
    <div className="relative bg-[#121215] border border-[#222228] p-5 square-frame flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-100 tracking-tight">Today&apos;s plan</h3>
        <Link
          href="/workouts"
          className="text-xs font-medium text-zinc-400 hover:text-cyan-400 transition flex items-center gap-1 uppercase tracking-wider"
        >
          VIEW PLAN
        </Link>
      </div>

      {/* Timeline List */}
      <div className="relative pl-1 space-y-4">
        {/* Timeline connector line */}
        <div className="absolute left-[13.5px] top-3 bottom-4 w-[1px] bg-dashed bg-zinc-800 pointer-events-none" />

        {plans.map((item, index) => (
          <div
            key={item.id}
            onClick={() => toggleStatus(item.id)}
            className="group flex items-center justify-between relative z-10 cursor-pointer p-1.5 hover:bg-white/[0.02] transition"
          >
            <div className="flex items-center gap-3">
              {/* Circle Status Icon */}
              <div className="flex-shrink-0">{renderCircleIcon(item.status)}</div>

              {/* Title & Duration */}
              <div>
                <h4
                  className={`text-xs font-semibold transition ${
                    item.status === "DONE"
                      ? "text-zinc-200"
                      : item.status === "IN_PROGRESS"
                      ? "text-cyan-400"
                      : "text-zinc-400 group-hover:text-zinc-300"
                  }`}
                >
                  {item.title}
                </h4>
                <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                  <span>{item.duration}</span>
                  <span>•</span>
                  <span>{item.type}</span>
                </div>
              </div>
            </div>

            {/* Status Badge */}
            <div>{renderBadge(item.status)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
