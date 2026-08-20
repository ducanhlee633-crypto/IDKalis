"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TODAYS_PLAN } from "@/data/mockCalisthenicsData";
import { Check, Circle } from "lucide-react";

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
          <span className="px-2 py-0.5 bg-white/5 border border-(--line-strong) text-zinc-100 text-[10px] font-semibold tracking-wider uppercase">
            DONE
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="px-2 py-0.5 bg-(--accent-soft) border border-(--accent-line) text-(--accent) text-[10px] font-semibold tracking-wider uppercase">
            IN PROGRESS
          </span>
        );
      case "NOT_STARTED":
      default:
        return (
          <span className="px-2 py-0.5 bg-transparent border border-(--line) text-(--faint) text-[10px] font-medium tracking-wider uppercase">
            NOT STARTED
          </span>
        );
    }
  };

  const renderCircleIcon = (status) => {
    if (status === "DONE") {
      return (
        <div className="w-5 h-5 bg-white flex items-center justify-center text-black">
          <Check className="w-3 h-3 stroke-[3]" />
        </div>
      );
    }
    if (status === "IN_PROGRESS") {
      return (
        <div className="w-5 h-5 bg-(--accent) flex items-center justify-center text-black">
          <Check className="w-3 h-3 stroke-[3]" />
        </div>
      );
    }
    return (
      <div className="w-5 h-5 bg-(--surface-3) border border-(--line-strong) flex items-center justify-center">
        <Circle className="w-2.5 h-2.5 text-(--faint) fill-(--faint)" />
      </div>
    );
  };

  return (
    <div className="relative bg-(--surface) border border-(--line) p-5 square-frame flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-4 h-px bg-(--accent)" />
          <h3 className="text-sm font-semibold text-zinc-100 tracking-tight">Today&apos;s plan</h3>
        </div>
        <Link
          href="/workouts"
          className="text-xs font-medium text-(--faint) hover:text-(--accent) transition tracking-wider"
        >
          View plan
        </Link>
      </div>

      {/* Timeline List */}
      <div className="relative pl-1 space-y-4">
        {/* Timeline connector line */}
        <div className="absolute left-[13.5px] top-3 bottom-4 w-[1px] bg-(--line-strong) pointer-events-none" />

        {plans.map((item) => (
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
                      ? "text-zinc-300"
                      : item.status === "IN_PROGRESS"
                      ? "text-(--accent)"
                      : "text-(--muted) group-hover:text-zinc-300"
                  }`}
                >
                  {item.title}
                </h4>
                <div className="flex items-center gap-2 text-[11px] text-(--faint) mt-0.5">
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