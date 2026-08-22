"use client";

import React, { useEffect, useState } from "react";
import { Activity, Target, TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";
import { apiGetVolume, apiGetTrainingConsistency } from "@/lib/dashboard";

export default function MetricKpiCards() {
  const { session } = useAuth();
  const token = session?.token || null;

  const [volume, setVolume] = useState(null);
  const [consistency, setConsistency] = useState(null);
  const [loading, setLoading] = useState(false);
  const [volumeError, setVolumeError] = useState("");
  const [consistencyError, setConsistencyError] = useState("");

  const fetchAll = async () => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    setVolumeError("");
    setConsistencyError("");
    // fetch riêng để 1 cái fail không làm cái kia fail
    try {
      const vol = await apiGetVolume(token, "THIS_WEEK");
      if (!cancelled) setVolume(vol);
    } catch (e) {
      if (!cancelled) setVolumeError(e?.message || "Không tải được volume");
    }
    try {
      const cons = await apiGetTrainingConsistency(token, 1);
      if (!cancelled) setConsistency(cons);
    } catch (e) {
      if (!cancelled) setConsistencyError(e?.message || "Không tải được consistency");
    }
    if (!cancelled) setLoading(false);
    return () => { cancelled = true; };
  };

  useEffect(() => {
    if (!token) {
      setVolume(null);
      setConsistency(null);
      setVolumeError("");
      setConsistencyError("");
      return;
    }
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Volume derived
  const totalSets = volume?.totalSetsThisWeek ?? null;
  const change = volume?.changePercent;
  const trend = volume?.trend;

  // Consistency derived for tuần hiện tại T2-CN
  // training-consistency weeks=1 gives stats for current week
  const stats = consistency?.stats || null;
  const consistencyPct = stats?.consistency ?? null;
  // completed / total assign: dùng trainedOnScheduled / trainingDaysPerWeek (tổng buổi assign trong tuần)
  // Nếu trainingDaysPerWeek ==0 (chưa đặt lịch) thì hiển thị trainedTotal / 0
  const trainingDaysPerWeek = consistency?.trainingDaysPerWeek ?? stats?.trainingDaysPerWeek ?? 0;
  const completed = stats?.trainedOnScheduled ?? 0;
  // For display fraction: completed / trainingDaysPerWeek (tổng assign tuần này)
  // Nếu chưa có lịch, fallback dùng expectedPast
  const totalAssign = trainingDaysPerWeek || stats?.expectedPast || 0;
  const displayFraction = totalAssign > 0 ? `${completed} / ${totalAssign} buổi` : `${completed} buổi`;

  // Helpers for trend
  const renderChange = () => {
    if (loading && volume === null) return <span className="text-zinc-500">Đang tải...</span>;
    if (totalSets === null) return <span className="text-zinc-500">—</span>;
    if (change === null || change === undefined) {
      if (totalSets === 0) return <span className="text-zinc-500">Chưa có set nào tuần này</span>;
      // no previous data
      return <span className="text-zinc-500">Tuần đầu tiên • {totalSets} sets</span>;
    }
    const abs = Math.abs(change);
    const sign = change > 0 ? "+" : change < 0 ? "" : "";
    const color = trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-zinc-400";
    const Icon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
    return (
      <span className={`inline-flex items-center gap-1 font-medium ${color}`}>
        <Icon className="w-3 h-3" />
        {sign}{change}% vs tuần trước
      </span>
    );
  };

  if (!token) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-(--surface) border border-(--line) p-4 square-frame">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-7 h-7 bg-(--surface-3) border border-(--line) flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4 text-(--muted)" />
            </div>
            <span className="text-[10px] font-semibold text-(--muted) uppercase tracking-[0.18em]">VOLUME</span>
          </div>
          <p className="text-sm text-zinc-400">Cần đăng nhập để xem tổng set tuần này.</p>
        </div>
        <div className="bg-(--surface) border border-(--line) p-4 square-frame">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-7 h-7 bg-(--surface-3) border border-(--line) flex items-center justify-center shrink-0">
              <Target className="w-4 h-4 text-(--muted)" />
            </div>
            <span className="text-[10px] font-semibold text-(--muted) uppercase tracking-[0.18em]">CONSISTENCY</span>
          </div>
          <p className="text-sm text-zinc-400">Cần đăng nhập để xem buổi hoàn thành.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* VOLUME */}
      <div className="relative bg-(--surface) border border-(--line) p-4 flex flex-col justify-between overflow-hidden group hover:bg-(--surface-2) transition square-frame min-h-[110px]">
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-7 h-7 bg-(--surface-3) border border-(--line) flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4 text-(--muted)" />
            </div>
            <span className="text-[10px] font-semibold text-(--muted) uppercase tracking-[0.18em]">VOLUME</span>
            <span className="ml-auto text-[10px] px-2 py-0.5 bg-(--surface-3) border border-(--line) text-zinc-500 uppercase tracking-wider">Tuần này (T2-CN)</span>
          </div>

          <div className="space-y-0.5">
            {loading && volume === null ? (
              <div className="flex items-center gap-2 text-zinc-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Đang tải volume...
              </div>
            ) : volumeError ? (
              <div className="space-y-1.5">
                <p className="text-sm text-amber-400">Không tải được volume</p>
                <p className="text-[11px] text-zinc-500 leading-relaxed break-all">{volumeError}</p>
                <button onClick={fetchAll} className="text-xs px-2 py-1 bg-(--surface-3) border border-(--line) text-zinc-300 hover:text-white transition">Thử lại</button>
                <p className="text-[10px] text-zinc-600">Kiểm tra backend http://localhost:8000 đang chạy và token hợp lệ. Mở Console (F12) xem chi tiết.</p>
              </div>
            ) : (
              <>
                <p className="text-2xl font-bold tracking-tight text-zinc-50">
                  {totalSets !== null ? `${totalSets}` : "—"} <span className="text-sm font-medium text-zinc-400">sets</span>
                </p>
                <p className="text-[11px] text-zinc-400 font-medium flex flex-wrap items-center gap-1.5">
                  <span>Tổng set từ workouts.completed_sets</span>
                  <span className="text-white/20">•</span>
                  {renderChange()}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Simplified footer: daily bars mini for THIS_WEEK (7 bars) – hide if loading; highlight VN today */}
        {volume?.dailyThisWeek && volume.dailyThisWeek.length === 7 && !loading && (
          <div className="mt-3.5 h-6 w-full flex items-end gap-[3px]">
            {volume.dailyThisWeek.map((d, idx) => {
              const max = Math.max(...volume.dailyThisWeek.map((x) => x.sets), 1);
              const h = max ? (d.sets / max) * 100 : 0;
              let isToday = false;
              try {
                const vnToday = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
                isToday = d.date === vnToday;
              } catch { isToday = d.date === new Date().toISOString().slice(0, 10); }
              return (
                <div
                  key={d.date}
                  className={`flex-1 transition-colors ${d.sets > 0 ? "bg-(--accent)" : "bg-white/10"} ${isToday ? "ring-1 ring-white/20" : ""}`}
                  style={{ height: `${Math.max(8, h)}%` }}
                  title={`${d.date}: ${d.sets} sets`}
                />
              );
            })}
          </div>
        )}
        {/* label Mon-Sun minimal */}
        {volume?.dailyThisWeek && !loading && (
          <div className="flex justify-between text-[9px] text-zinc-600 mt-1 px-0.5">
            <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span>
          </div>
        )}
      </div>

      {/* CONSISTENCY */}
      <div className="relative bg-(--surface) border border-(--line) p-4 flex flex-col justify-between overflow-hidden group hover:bg-(--surface-2) transition square-frame min-h-[110px]">
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-7 h-7 bg-(--surface-3) border border-(--line) flex items-center justify-center shrink-0">
              <Target className="w-4 h-4 text-(--muted)" />
            </div>
            <span className="text-[10px] font-semibold text-(--muted) uppercase tracking-[0.18em]">CONSISTENCY</span>
            <span className="ml-auto text-[10px] px-2 py-0.5 bg-(--surface-3) border border-(--line) text-zinc-500 uppercase tracking-wider">Tuần này</span>
          </div>

          <div className="space-y-0.5">
            {loading && consistency === null ? (
              <div className="flex items-center gap-2 text-zinc-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Đang tải...
              </div>
            ) : consistencyError ? (
              <div className="space-y-1.5">
                <p className="text-sm text-amber-400">Không tải được consistency</p>
                <p className="text-[11px] text-zinc-500 leading-relaxed break-all">{consistencyError}</p>
                <button onClick={fetchAll} className="text-xs px-2 py-1 bg-(--surface-3) border border-(--line) text-zinc-300 hover:text-white transition">Thử lại</button>
              </div>
            ) : (
              <>
                <p className="text-2xl font-bold tracking-tight text-white">
                  {consistencyPct !== null ? `${consistencyPct}%` : "—"}
                </p>
                <p className="text-[11px] text-zinc-400 font-medium">
                  {totalAssign > 0 ? (
                    <>
                      <span className="text-white font-semibold">{displayFraction}</span>
                      <span className="text-white/20 mx-1.5">•</span>
                      <span>{trainingDaysPerWeek ? `${trainingDaysPerWeek} buổi assign / tuần` : "Chưa đặt lịch"}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-white font-semibold">{completed} buổi</span>
                      <span className="text-white/20 mx-1.5">•</span>
                      <span>Chưa đặt lịch (training_schedule trống)</span>
                    </>
                  )}
                </p>
                {stats && (
                  <p className="text-[10px] text-zinc-500">
                    {stats.missed > 0 ? `${stats.missed} buổi missed` : "Không missed buổi nào"} • Best streak {stats.bestStreak} ngày
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Simplified progress bar for consistency */}
        {consistencyPct !== null && !loading && (
          <div className="mt-3.5">
            <div className="w-full h-1.5 bg-[#1b1b22] overflow-hidden">
              <div
                className="h-full bg-(--accent) transition-all duration-700 ease-out"
                style={{ width: `${Math.max(0, Math.min(100, consistencyPct))}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
