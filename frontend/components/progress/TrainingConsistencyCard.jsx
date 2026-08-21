"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect } from "react";
import { Info, ChevronRight, X, CalendarCheck, Loader2, Dumbbell } from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";
import { apiGetTrainingConsistency } from "@/lib/dashboard";

export default function TrainingConsistencyCard({ weeks = 4 }) {
  const { session } = useAuth();
  const token = session?.token || null;

  const [showInfo, setShowInfo] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const daysOfWeek = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const dayShortVi = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  useEffect(() => {
    if (!token) {
      setData(null);
      return;
    }
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        const res = await apiGetTrainingConsistency(token, weeks);
        if (!cancelled) setData(res);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Không tải được dữ liệu consistency");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [token, weeks]);

  const matrix = data?.matrix || [];
  const stats = data?.stats || null;
  const schedule = data?.schedule || [];
  const trainingDaysPerWeek = data?.trainingDaysPerWeek ?? 0;
  const restDaysPerWeek = data?.restDaysPerWeek ?? 7;
  const totalExpectedFull = data?.totalExpectedFull ?? 0;

  // Build schedule label e.g., "T2 • T3 • T5 • CN"
  const scheduledDaysLabel = schedule
    .filter((s) => s.routine_id)
    .map((s) => dayShortVi[s.day_of_week])
    .join(" • ");

  const isEmptySchedule = trainingDaysPerWeek === 0;

  return (
    <div className="bg-(--surface) border border-(--line) p-5 flex flex-col justify-between relative square-frame">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-1.5">
          <h2 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Training Consistency</h2>
          <div className="relative">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="text-zinc-500 hover:text-zinc-300 transition p-0.5"
              title="Information"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
            {showInfo && (
              <div className="absolute left-0 top-6 w-72 bg-[#1a1a22] border border-white/10 p-2.5 text-[11px] text-zinc-300 shadow-xl z-50 animate-fade-in leading-relaxed">
                So sánh ngày tập thực tế (từ <span className="text-white">workouts</span>) với lịch đã đặt trong{" "}
                <span className="text-white">training_schedule</span>. Trạng thái: Trained = có workout, Rest = ngày
                nghỉ theo lịch, Missed = lịch yêu cầu tập nhưng không có workout, Future = ngày chưa tới.
                <br />
                <span className="text-zinc-400">
                  {trainingDaysPerWeek ? `${trainingDaysPerWeek} buổi/tuần • ${totalExpectedFull} buổi/${weeks} tuần` : "Chưa thiết lập lịch"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Details Link */}
        <button
          onClick={() => setShowDetailsModal(true)}
          className="flex items-center gap-0.5 text-xs text-(--accent) hover:text-(--accent-strong) transition font-medium"
          disabled={!data}
        >
          <span>Details</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-10 gap-2 text-sm text-zinc-400">
          <Loader2 className="w-4 h-4 animate-spin" /> Đang tải lịch & workouts...
        </div>
      )}

      {error && !loading && (
        <div className="border border-(--accent-line) bg-(--accent-soft)/30 p-3 text-xs text-zinc-300 mb-3">
          <p className="font-semibold text-(--accent)">Lỗi tải dữ liệu</p>
          <p className="mt-1 text-zinc-400">{error}</p>
          <button
            onClick={() => {
              if (token) {
                setLoading(true);
                setError("");
                apiGetTrainingConsistency(token, weeks)
                  .then((res) => setData(res))
                  .catch((e) => setError(e?.message || "Lỗi"))
                  .finally(() => setLoading(false));
              }
            }}
            className="mt-2 px-3 py-1 bg-(--surface-2) border border-(--line) text-zinc-300 hover:text-white transition"
          >
            Thử lại
          </button>
        </div>
      )}

      {!loading && !error && !data && !token && (
        <div className="border border-dashed border-white/[0.08] bg-(--surface-2)/50 p-6 text-center">
          <p className="text-sm text-zinc-300">Cần đăng nhập để xem consistency</p>
          <p className="text-xs text-zinc-500 mt-1">Lịch được lấy từ training_schedule của bạn.</p>
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* Schedule structure banner */}
          <div className="mb-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[11px]">
              <span className="px-2 py-1 bg-(--surface-3) border border-(--line) text-zinc-300 flex items-center gap-1.5">
                <Dumbbell className="w-3 h-3 text-zinc-400" />
                Theo lịch: {trainingDaysPerWeek} buổi/tuần
              </span>
              <span className="text-zinc-500">
                • {totalExpectedFull} buổi/{weeks} tuần
                {isEmptySchedule ? " (chưa đặt lịch)" : ""}
              </span>
              {scheduledDaysLabel && !isEmptySchedule && (
                <span className="hidden sm:inline text-zinc-600">• {scheduledDaysLabel}</span>
              )}
            </div>
            {isEmptySchedule && (
              <div className="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5">
                Bạn chưa thiết lập lịch tập (training_schedule trống). Mặc định tất cả ngày là Rest — hãy vào trang lịch tập để gán routine cho từng ngày (routine_id ≠ null = ngày tập).
              </div>
            )}
          </div>

          {/* Main Content: Heatmap Grid & Stats Column */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* Left Side: Heatmap Matrix (7 cols) */}
            <div className="md:col-span-8 flex flex-col justify-between">
              {/* Weekday Labels */}
              <div className="grid grid-cols-7 gap-2 text-center mb-2.5">
                {daysOfWeek.map((day) => (
                  <span key={day} className="text-[10px] font-semibold text-zinc-400 tracking-wider uppercase">
                    {day}
                  </span>
                ))}
              </div>

              {/* Rows of Status Circles */}
              <div className="space-y-2.5">
                {matrix.map((row, rIdx) => (
                  <div key={rIdx} className="grid grid-cols-7 gap-2">
                    {row.map((cell, cIdx) => {
                      return (
                        <div
                          key={cIdx}
                          className="relative flex items-center justify-center aspect-square"
                          onMouseEnter={() => setHoveredCell(cell)}
                          onMouseLeave={() => setHoveredCell(null)}
                        >
                          {/* Trained: Solid white */}
                          {cell.state === "trained" && (
                            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center cursor-pointer transition-transform hover:scale-110" />
                          )}

                          {/* Rest: Dark circle with grey dot */}
                          {cell.state === "rest" && (
                            <div className="w-6 h-6 rounded-full bg-(--surface-3) border border-(--line-strong) flex items-center justify-center cursor-pointer transition-transform hover:scale-110">
                              <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                            </div>
                          )}

                          {/* Missed: Dark circle with X (red tint) */}
                          {cell.state === "missed" && (
                            <div className="w-6 h-6 rounded-full bg-(--surface-3) border border-(--line-strong) flex items-center justify-center cursor-pointer transition-transform hover:scale-110">
                              <X className="w-3 h-3 text-(--accent)" />
                            </div>
                          )}

                          {/* Future: Very faint dashed border */}
                          {cell.state === "future" && (
                            <div className="w-6 h-6 rounded-full bg-transparent border border-dashed border-white/[0.12] flex items-center justify-center opacity-60">
                              <div className="w-1 h-1 rounded-full bg-white/20" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Bottom Legend + schedule hint */}
              <div className="flex flex-wrap items-center gap-4 text-[10px] text-zinc-400 mt-4 pt-3 border-t border-white/[0.04]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-white" />
                  <span>Trained</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-(--faint)" />
                  <span>Rest</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <X className="w-2.5 h-2.5 text-(--accent)" />
                  <span>Missed</span>
                </div>
                <div className="flex items-center gap-1.5 opacity-60">
                  <span className="w-2 h-2 rounded-full border border-dashed border-white/20" />
                  <span>Future</span>
                </div>
              </div>
            </div>

            {/* Right Side: Stats Numbers */}
            <div className="md:col-span-4 flex md:flex-col justify-between md:justify-center md:items-start pl-0 md:pl-4 md:border-l border-white/[0.06] space-y-0 md:space-y-4">
              <div>
                <p className="font-display text-3xl font-bold text-zinc-50 tracking-tight">
                  {stats ? `${stats.consistency}%` : "—"}
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">Consistency</p>
                <p className="text-[10px] text-zinc-500">
                  {stats ? `${stats.trainedOnScheduled}/${stats.expectedPast} buổi đúng lịch` : ""}
                </p>
              </div>

              <div>
                <p className="text-lg font-bold text-white tracking-tight">
                  {stats ? (
                    <>
                      {stats.trainedTotal} <span className="text-zinc-500 font-normal">/ {stats.expectedPast}</span>
                    </>
                  ) : (
                    "—"
                  )}
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">Sessions</p>
                <p className="text-[10px] text-zinc-500">
                  {stats ? `Lịch yêu cầu ${stats.expectedPast} buổi đã qua • Tổng ${stats.totalExpectedFull}/${weeks} tuần` : ""}
                </p>
              </div>

              <div>
                <p className="text-xs text-zinc-400">Best streak</p>
                <p className="text-sm font-bold text-white mt-0.5">{stats ? `${stats.bestStreak} days` : "—"}</p>
                <p className="text-[10px] text-zinc-500">Consecutive trained days</p>
              </div>
            </div>
          </div>

          {/* Hover Tooltip */}
          {hoveredCell && (
            <div className="absolute bottom-16 left-8 bg-(--surface-2) border border-(--line-strong) px-3 py-1.5 text-xs z-30 pointer-events-none animate-fade-in max-w-[260px]">
              <span className="font-semibold text-white">{hoveredCell.date_display} ({hoveredCell.date})</span>
              <span className="text-zinc-400"> — </span>
              <span className={hoveredCell.state === "missed" ? "text-(--accent)" : hoveredCell.state === "trained" ? "text-white" : "text-zinc-400"}>
                {hoveredCell.label}
              </span>
              {hoveredCell.scheduled !== undefined && (
                <span className="text-zinc-500"> {hoveredCell.scheduled ? "• Lịch tập" : "• Rest"}</span>
              )}
              {hoveredCell.is_future && <span className="text-zinc-600"> • Upcoming</span>}
            </div>
          )}
        </>
      )}

      {/* Details Modal */}
      {showDetailsModal && data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-(--surface) border border-(--line-strong) max-w-lg w-full p-6 animate-fade-in square-frame max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-zinc-100" />
                <h3 className="text-base font-bold text-white">Consistency Breakdown</h3>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="text-zinc-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-(--surface-2) p-3 border border-(--line)">
                  <p className="text-zinc-400">Trained</p>
                  <p className="text-lg font-bold text-zinc-50 mt-1">{stats.trainedTotal}</p>
                  <p className="text-[10px] text-zinc-500">workout days</p>
                </div>
                <div className="bg-(--surface-2) p-3 border border-(--line)">
                  <p className="text-zinc-400">Rest Days</p>
                  <p className="text-lg font-bold text-zinc-300 mt-1">{stats.restDays}</p>
                  <p className="text-[10px] text-zinc-500">trong {stats.pastDays} ngày qua</p>
                </div>
                <div className="bg-(--surface-2) p-3 border border-(--line)">
                  <p className="text-zinc-400">Missed</p>
                  <p className="text-lg font-bold text-(--accent) mt-1">{stats.missed}</p>
                  <p className="text-[10px] text-zinc-500">buổi bỏ lỡ</p>
                </div>
              </div>

              <div className="p-3 bg-(--surface-2) border border-(--line)">
                <p className="font-semibold text-zinc-200 mb-1">Theo lịch (training_schedule)</p>
                <p className="text-zinc-400 leading-relaxed">
                  Lịch hiện tại: <span className="text-white">{trainingDaysPerWeek} buổi/tuần</span> (
                  {restDaysPerWeek} ngày nghỉ) • Tổng yêu cầu:{" "}
                  <span className="text-white">{totalExpectedFull} buổi / {weeks} tuần</span> • Đã qua:{" "}
                  <span className="text-white">{stats.expectedPast} buổi</span> phải tập • Đã hoàn thành{" "}
                  <span className="text-(--accent)">{stats.trainedOnScheduled}</span> • Consistency{" "}
                  <span className="text-white">{stats.consistency}%</span>
                </p>
                <div className="mt-2 grid grid-cols-7 gap-1 text-center">
                  {schedule.map((s) => (
                    <div
                      key={s.day_of_week}
                      className={`px-1 py-1 text-[10px] border ${s.routine_id ? "bg-white text-black border-white font-semibold" : "bg-(--surface) text-zinc-500 border-(--line)"}`}
                    >
                      <div>{dayShortVi[s.day_of_week]}</div>
                      <div className="truncate text-[9px] leading-tight">{s.routine_name ? s.routine_name.slice(0, 8) : "Rest"}</div>
                    </div>
                  ))}
                </div>
                {isEmptySchedule && (
                  <p className="mt-2 text-[11px] text-amber-300">
                    Chưa có lịch — mặc định tất cả ngày là Rest. Hãy tạo lịch để consistency có ý nghĩa.
                  </p>
                )}
              </div>

              <div className="p-3 bg-(--surface-2) border border-(--line)">
                <p className="font-semibold text-zinc-200 mb-1">Consistency Score Insight</p>
                <p className="text-zinc-400 leading-relaxed">
                  {stats.consistency >= 85
                    ? `Bạn nằm trong top những người duy trì trên 85% consistency. Streak tốt nhất ${stats.bestStreak} ngày liên tiếp có tập.`
                    : stats.consistency >= 60
                    ? `Bạn đã tập ${stats.trainedOnScheduled}/${stats.expectedPast} buổi theo lịch. Cố gắng giữ streak > ${stats.bestStreak} ngày để cải thiện.`
                    : `Cần cải thiện: mới đạt ${stats.consistency}% (${stats.missed} buổi missed). Lịch yêu cầu ${trainingDaysPerWeek} buổi/tuần — hãy cố gắng bám sát hơn.`}
                </p>
              </div>

              <div className="text-[11px] text-zinc-500">
                Khoảng: {data.from} → {data.to} • Hôm nay: {data.today} • Tính trên {stats.pastDays} ngày đã qua (bỏ qua future)
              </div>
            </div>

            <button
              onClick={() => setShowDetailsModal(false)}
              className="mt-5 w-full py-2 bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
