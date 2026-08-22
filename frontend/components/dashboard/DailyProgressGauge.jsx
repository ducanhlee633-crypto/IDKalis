"use client";

import React, { useEffect, useState } from "react";
import { getStoredSession } from "@/lib/auth";
import { apiGetVolume, apiGetTrainingConsistency } from "@/lib/dashboard";

function getVnTodayIso() {
  try {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export default function DailyProgressGauge() {
  const [todaySets, setTodaySets] = useState(null);
  const [todayState, setTodayState] = useState(null); // trained | rest | missed | future
  const [todayLabel, setTodayLabel] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchDaily() {
      const session = getStoredSession();
      const token = session?.token;
      if (!token) return;
      setLoading(true);
      try {
        const [vol, cons] = await Promise.all([
          apiGetVolume(token, "THIS_WEEK").catch(() => null),
          apiGetTrainingConsistency(token, 1).catch(() => null),
        ]);
        if (cancelled) return;
        const vnToday = getVnTodayIso();
        // volume daily
        if (vol?.dailyThisWeek) {
          const todayEntry = vol.dailyThisWeek.find((d) => d.date === vnToday);
          setTodaySets(todayEntry ? todayEntry.sets : 0);
        }
        // consistency matrix
        if (cons?.matrix && cons.matrix.length) {
          // matrix is weeks x 7; find cell where date === vnToday
          let found = null;
          for (const row of cons.matrix) {
            for (const cell of row) {
              if (cell.date === vnToday) found = cell;
            }
          }
          if (found) {
            setTodayState(found.state);
            setTodayLabel(found.label);
          } else {
            // fallback via schedule
            const todayDow = new Date().toLocaleDateString("en-US", { timeZone: "Asia/Ho_Chi_Minh", weekday: "short" });
            setTodayState(null);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchDaily();
    return () => { cancelled = true; };
  }, []);

  // Compute gauge percentage – reset mỗi ngày 00:00 VN, không phải UTC
  // Logic: nếu đã trained hôm nay => 100% (hoàn thành), rest => 100% (nghỉ đúng lịch), missed => 0%, chưa tập nhưng còn trong ngày và có lịch => dựa trên sets/ target 20 sets
  let percentage = 0;
  let statusText = "PENDING";
  let quote = "Reset mỗi ngày 00:00 VN";
  let subLabel = "";

  const targetSetsPerDay = 20; // ước lượng target; có thể điều chỉnh theo schedule
  if (todaySets !== null) {
    subLabel = `${todaySets} / ${targetSetsPerDay} sets hôm nay`;
  }

  if (todayState === "trained") {
    percentage = 100;
    statusText = "ON TARGET";
    quote = "Bạn đã hoàn thành hôm nay! Giữ nhịp!";
  } else if (todayState === "rest") {
    percentage = 100;
    statusText = "REST DAY";
    quote = "Ngày nghỉ — phục hồi đúng lịch.";
  } else if (todayState === "missed") {
    percentage = 0;
    statusText = "MISSED";
    quote = "Bỏ lỡ hôm nay — bù vào ngày mai nhé!";
  } else if (todayState === "future") {
    percentage = 0;
    statusText = "UPCOMING";
    quote = "Chưa tới — chuẩn bị cho buổi tập.";
  } else {
    // No consistency data or still loading: fallback to sets-based
    if (todaySets !== null) {
      percentage = Math.min(100, Math.round((todaySets / targetSetsPerDay) * 100));
      if (percentage >= 100) statusText = "ON TARGET";
      else if (percentage > 0) statusText = "IN PROGRESS";
      else statusText = "NOT STARTED";
      quote = todaySets > 0 ? `Đã tập ${todaySets} sets hôm nay` : "Chưa có set nào hôm nay — reset 00:00 VN";
    } else {
      // static fallback for logged-out
      percentage = 0;
      statusText = "NO DATA";
      quote = "Đăng nhập để track daily progress (reset 00:00 VN)";
    }
  }

  const radius = 70;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative bg-(--surface) border border-(--line) p-5 square-frame flex flex-col justify-between items-center text-center h-full">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-4 h-px bg-(--accent)" />
          <h3 className="text-sm font-semibold text-zinc-100 tracking-tight">Daily progress</h3>
          {loading && <span className="w-3 h-3 border border-zinc-600 border-t-[#ff4d4d] rounded-full animate-spin ml-1" />}
        </div>
        <span className="text-[9px] px-1.5 py-0.5 border border-white/10 text-zinc-500">reset 00:00 VN</span>
      </div>

      {/* Circular Gauge */}
      <div className="relative flex items-center justify-center my-auto py-2">
        <svg className="w-44 h-44 -rotate-90 transform" viewBox="0 0 160 160">
          {/* Background Track */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="#1c1c24"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Progress Arc */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="#ff4d4d"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="butt"
            fill="transparent"
            style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
          />
        </svg>

        {/* Inner Centered Metrics */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-display text-3xl font-semibold text-zinc-50 tracking-tight tnum">
            {percentage}%
          </span>
          <span className="mt-1 px-2 py-0.5 bg-white/5 border border-(--line-strong) text-zinc-100 text-[10px] font-bold tracking-wider uppercase">
            {statusText}
          </span>
        </div>
      </div>

      {/* Footnote Stats */}
      <div className="w-full pt-3 border-t border-(--line) space-y-1">
        <div className="font-display text-xs font-semibold text-zinc-200 tnum">
          {todaySets !== null ? (
            <>
              <span>{todaySets}</span>
              <span className="text-(--faint) font-normal"> / {targetSetsPerDay} sets</span>
              {todayLabel && <span className="ml-2 text-[10px] text-zinc-500 truncate">• {todayLabel}</span>}
            </>
          ) : (
            <span className="text-zinc-500 text-[11px]">Đăng nhập để xem</span>
          )}
        </div>
        <p className="text-[11px] text-(--muted) font-medium">
          {quote}
        </p>
        {todayState && (
          <p className="text-[10px] text-(--faint)">Hôm nay: {getVnTodayIso()} • {todayState} {todaySets !== null ? `• ${todaySets} sets` : ""}</p>
        )}
      </div>
    </div>
  );
}
