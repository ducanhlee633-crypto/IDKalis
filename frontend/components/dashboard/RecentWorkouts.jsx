"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getStoredSession } from "@/lib/auth";
import { apiListWorkouts } from "@/lib/workouts";

function formatWorkoutDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function inferIconType(name) {
  const n = (name || "").toLowerCase();
  if (n.includes("push") || n.includes("chest") || n.includes("tricep") || n.includes("planche") || n.includes("dip")) return "bench";
  if (n.includes("pull") || n.includes("back") || n.includes("bicep") || n.includes("lever") || n.includes("muscle")) return "pull";
  if (n.includes("leg") || n.includes("squat") || n.includes("pistol") || n.includes("nordic")) return "squat";
  return "fullbody";
}

export default function RecentWorkouts() {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const fetchWorkouts = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const session = getStoredSession();
      const token = session?.token;
      if (!token) {
        setWorkouts([]);
        setFetchError("Bạn cần đăng nhập để xem workouts.");
        return;
      }
      const data = await apiListWorkouts(token);
      const list = Array.isArray(data) ? data : [];
      // API đã order session_number desc, lấy 4 gần nhất
      setWorkouts(list.slice(0, 4));
    } catch (err) {
      setFetchError(err?.message || "Không tải được workouts.");
      setWorkouts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  const renderWorkoutGraphic = (iconType) => {
    return (
      <div className="w-11 h-11 bg-(--surface-3) border border-(--line) flex items-center justify-center relative overflow-hidden group-hover:border-(--accent-line) transition">
        {iconType === "bench" && (
          <svg viewBox="0 0 32 32" className="w-7 h-7 stroke-zinc-400 fill-none stroke-[1.5]">
            <path d="M 6 22 L 26 22" />
            <path d="M 10 22 L 10 26" />
            <path d="M 22 22 L 22 26" />
            <path d="M 8 16 L 24 16" stroke="#ff4d4d" />
            <circle cx="16" cy="11" r="2.5" fill="#f5f5f6" />
            <path d="M 12 14 L 20 14" />
          </svg>
        )}
        {iconType === "pull" && (
          <svg viewBox="0 0 32 32" className="w-7 h-7 stroke-zinc-400 fill-none stroke-[1.5]">
            <path d="M 6 6 L 26 6" stroke="#ff4d4d" />
            <path d="M 10 6 L 10 14" />
            <path d="M 22 6 L 22 14" />
            <circle cx="16" cy="13" r="2.5" fill="#f5f5f6" />
            <path d="M 12 18 L 16 16 L 20 18" />
            <path d="M 16 16 L 16 26" />
          </svg>
        )}
        {iconType === "squat" && (
          <svg viewBox="0 0 32 32" className="w-7 h-7 stroke-zinc-400 fill-none stroke-[1.5]">
            <path d="M 8 8 L 24 8" stroke="#ff4d4d" />
            <circle cx="16" cy="12" r="2.5" fill="#f5f5f6" />
            <path d="M 16 15 L 16 21 L 11 27" />
            <path d="M 16 21 L 21 27" />
          </svg>
        )}
        {iconType === "fullbody" && (
          <svg viewBox="0 0 32 32" className="w-7 h-7 stroke-zinc-400 fill-none stroke-[1.5]">
            <path d="M 16 6 L 16 10" stroke="#ff4d4d" />
            <circle cx="16" cy="12" r="2" fill="#f5f5f6" />
            <path d="M 11 16 L 21 16" />
            <path d="M 16 14 L 16 22" />
            <path d="M 12 28 L 16 22 L 20 28" stroke="#ff4d4d" />
          </svg>
        )}
      </div>
    );
  };

  return (
    <div className="relative bg-(--surface) border border-(--line) p-5 square-frame flex flex-col justify-between h-full">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-4 h-px bg-(--accent)" />
          <h3 className="text-sm font-semibold text-zinc-100 tracking-tight">Recent workouts</h3>
        </div>
        <Link
          href="/workouts"
          className="text-xs font-medium text-(--faint) hover:text-(--accent) transition tracking-wider"
        >
          View all
        </Link>
      </div>

      {/* Workout Items List */}
      <div className="space-y-2.5">
        {loading && <div className="text-[11px] text-(--muted) py-6 text-center">Đang tải workouts...</div>}
        {!loading && fetchError && (
          <div className="text-center py-4 space-y-2">
            <p className="text-[11px] text-amber-400">{fetchError}</p>
            <button onClick={fetchWorkouts} className="text-[11px] px-3 py-1 border border-(--line) hover:bg-white/5 text-(--muted)">
              Thử lại
            </button>
          </div>
        )}
        {!loading && !fetchError && workouts.length === 0 && (
          <div className="text-center py-6">
            <p className="text-xs text-(--muted)">Chưa có workout nào.</p>
            <p className="text-[11px] text-(--faint) mt-1">Hoàn thành buổi tập đầu tiên để hiển thị ở đây.</p>
          </div>
        )}
        {!loading && !fetchError && workouts.map((w) => {
          const iconType = inferIconType(w.name);
          const dateLabel = formatWorkoutDate(w.createdAt ?? w.created_at);
          const durationLabel = w.durationMinutes ?? w.duration_minutes != null ? `${w.durationMinutes ?? w.duration_minutes} min` : "";
          const setsLabel = w.completedSets ?? w.completed_sets != null ? `${w.completedSets ?? w.completed_sets} sets` : "";
          const rpeLabel = w.avgRpe ?? w.avg_rpe != null ? `RPE ${w.avgRpe ?? w.avg_rpe}` : "";
          const meta = [dateLabel, durationLabel].filter(Boolean).join(" • ");
          return (
            <div
              key={w.id}
              className="group flex items-center justify-between p-2 hover:bg-white/[0.03] border border-transparent hover:border-(--line) transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                {renderWorkoutGraphic(iconType)}
                <div>
                  <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-zinc-50 transition">
                    {w.name}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-(--faint) mt-0.5">
                    <span>{meta || `#${w.sessionNumber ?? w.session_number}`}</span>
                    {setsLabel && (
                      <>
                        <span>•</span>
                        <span>{setsLabel}</span>
                      </>
                    )}
                    {rpeLabel && (
                      <>
                        <span>•</span>
                        <span>{rpeLabel}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-(--faint) group-hover:text-(--accent) group-hover:translate-x-0.5 transition" />
            </div>
          );
        })}
      </div>
    </div>
  );
}