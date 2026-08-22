"use client";

import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { ChevronDown, Loader2 } from "lucide-react";
import { getStoredSession } from "@/lib/auth";
import { apiGetVolume } from "@/lib/dashboard";

const FILTER_TO_RANGE = {
  "THIS WEEK": "THIS_WEEK",
  "LAST WEEK": "LAST_WEEK",
  "LAST 7 DAYS": "7D",
};

const RANGE_LABEL = {
  THIS_WEEK: "T2-CN tuần này (reset Thứ 2 00:00 VN)",
  LAST_WEEK: "T2-CN tuần trước",
  "7D": "7 ngày gần nhất (sliding)",
};

const CustomActivityTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="relative bg-(--surface-2)/95 backdrop-blur-md border border-(--line-strong) p-2.5 min-w-[150px] text-xs">
        <p className="text-[11px] text-(--muted) font-medium mb-1.5 pb-1 border-b border-(--line)">
          {data.fullDay || data.day}
        </p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-3 text-zinc-300">
            <span className="flex items-center gap-1.5 text-[11px]">
              <span className="w-2 h-2 bg-(--accent)" />
              Sets
            </span>
            <span className="font-display font-semibold text-zinc-100 tnum">{data.sets} sets</span>
          </div>
          {data.date && (
            <div className="text-[10px] text-(--faint)">{data.date}</div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

function toDayShort(dateStr) {
  // dateStr YYYY-MM-DD -> MON..SUN
  try {
    const d = new Date(dateStr + "T12:00:00");
    const map = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    return map[d.getDay()];
  } catch {
    return dateStr;
  }
}

function buildChartData(volume, filter) {
  if (!volume) return [];
  // Backend: dailyThisWeek always contains data for the requested range (THIS_WEEK / LAST_WEEK / 7D)
  // dailyLastWeek is comparison week, not for chart when filter=LAST WEEK
  const daily = volume.dailyThisWeek || volume.dailyLastWeek || [];
  if (!daily || !Array.isArray(daily) || daily.length === 0) return [];
  // daily: [{date, sets}]
  return daily.map((d) => ({
    day: toDayShort(d.date),
    fullDay: `${toDayShort(d.date)} ${d.date}`,
    date: d.date,
    sets: d.sets || 0,
    // keep time/calories for compat but 0
    time: d.sets || 0,
    calories: d.sets * 5, // placeholder if need calories scale: 1 set ~5 kcal estimate (only for visual scale)
  }));
}

export default function WeeklyActivityChart() {
  const [timeFilter, setTimeFilter] = useState("THIS WEEK");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [volume, setVolume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const rangeKey = FILTER_TO_RANGE[timeFilter] || "THIS_WEEK";

  useEffect(() => {
    let cancelled = false;
    async function fetchVolume() {
      const session = getStoredSession();
      const token = session?.token;
      if (!token) {
        setVolume(null);
        setError("");
        return;
      }
      setLoading(true);
      setError("");
      try {
        const data = await apiGetVolume(token, rangeKey);
        if (!cancelled) setVolume(data);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Không tải được weekly activity");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchVolume();
    return () => { cancelled = true; };
  }, [rangeKey]);

  const chartData = buildChartData(volume, timeFilter);
  const displayTotal = volume?.totalSetsThisWeek ?? 0;
  // Y max based on max sets
  const maxSets = chartData.length ? Math.max(...chartData.map(d => d.sets), 5) : 5;
  const yMax = Math.max(5, Math.ceil(maxSets * 1.3 / 5) * 5);

  return (
    <div className="relative bg-(--surface) border border-(--line) p-5 square-frame flex flex-col justify-between h-full">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-4 h-px bg-(--accent)" />
          <h3 className="text-sm font-semibold text-zinc-100 tracking-tight">Weekly activity</h3>
          {loading && <Loader2 className="w-3 h-3 animate-spin text-zinc-500 ml-1" />}
        </div>

        {/* Time range selector */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="btn-ghost flex items-center gap-1.5 text-xs px-2.5 py-1"
          >
            <span>{timeFilter}</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-40 bg-(--surface) border border-(--line-strong) py-1 z-30 text-xs">
              {["THIS WEEK", "LAST WEEK", "LAST 7 DAYS"].map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    setTimeFilter(item);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-white/5 transition ${
                    timeFilter === item ? "text-(--accent) font-medium" : "text-(--muted)"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {rangeKey === "THIS_WEEK" && (
        <p className="text-[10px] text-(--faint) -mt-3 mb-2">Reset mỗi Thứ 2 00:00 VN • {RANGE_LABEL[rangeKey]}</p>
      )}

      {error && (
        <div className="mb-3 text-[11px] px-2.5 py-2 border border-red-500/30 bg-red-500/10 text-red-300">
          {error}
        </div>
      )}

      {!getStoredSession()?.token && !loading && (
        <div className="text-center py-8 text-xs text-zinc-500 border border-dashed border-white/10 bg-white/[0.02] mb-3">
          Cần đăng nhập để xem activity thực (sets theo tuần). Hiện đang hiển thị mock? Đã chuyển sang data thực: sẽ trống nếu chưa có workout.
        </div>
      )}

      {/* Recharts Bar Chart */}
      <div className="w-full h-[230px] -ml-3">
        {loading && chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-zinc-500 gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Đang tải sets theo ngày...
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/[0.08] bg-(--surface-2)/50">
            <p className="text-xs text-zinc-400">Chưa có set nào trong {timeFilter.toLowerCase()}</p>
            <p className="text-[11px] text-zinc-600 mt-1">Hoàn thành workout đầu tiên (Thứ 2 sẽ reset về 0 và track lại).</p>
            {displayTotal != null && <p className="text-[11px] text-zinc-500 mt-2">Total: {displayTotal} sets</p>}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -5, bottom: 0 }} barGap={6}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#71717a", fontSize: 11, fontWeight: 500 }}
                dy={8}
              />
              <YAxis
                domain={[0, yMax]}
                ticks={Array.from({length: Math.min(6, yMax/5+1)}, (_,i)=>i*5)}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#52525b", fontSize: 11 }}
              />
              <Tooltip content={<CustomActivityTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
              <Bar dataKey="sets" fill="#ff4d4d" radius={[0, 0, 0, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend Footer */}
      <div className="flex items-center justify-center gap-6 pt-3 border-t border-(--line) text-xs text-(--muted)">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-(--accent)" />
          <span>Sets per day (T2-CN)</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-(--faint)">
          <span>Total: {displayTotal ?? 0} sets</span>
          {volume?.changePercent != null && (
            <span className={volume.trend === "up" ? "text-emerald-400" : volume.trend === "down" ? "text-zinc-500" : "text-zinc-500"}>
              {volume.changePercent > 0 ? `+${volume.changePercent}%` : `${volume.changePercent}%`} vs tuần trước
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
