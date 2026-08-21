"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Info, Search, X, Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";
import { apiGetExerciseNames, apiGetPerformanceTrend } from "@/lib/dashboard";

// Compute nice Y-axis max/steps from max value
function computeYAxis(maxVal) {
  if (!maxVal || maxVal <= 0) {
    return { yMax: 10, ySteps: [10, 8, 6, 4, 2, 0] };
  }
  const rawMax = maxVal * 1.18;
  // nice number algorithm
  let magnitude = Math.pow(10, Math.floor(Math.log10(rawMax)));
  let normalized = rawMax / magnitude;
  let niceFactor;
  if (normalized <= 1) niceFactor = 1;
  else if (normalized <= 2) niceFactor = 2;
  else if (normalized <= 5) niceFactor = 5;
  else niceFactor = 10;
  let niceMax = niceFactor * magnitude;
  // enforce minimum 5 and rounding for small values
  if (niceMax < 5) niceMax = 5;
  // For small integer ranges (like 5 reps) ensure step =1 or 2
  let step;
  if (niceMax <= 10) step = 2;
  else if (niceMax <= 20) step = 5;
  else if (niceMax <= 50) step = 10;
  else if (niceMax <= 100) step = 20;
  else step = Math.ceil(niceMax / 5 / 10) * 10;

  // Adjust niceMax to be divisible by step
  if (niceMax % step !== 0) {
    niceMax = Math.ceil(niceMax / step) * step;
  }
  const count = Math.round(niceMax / step);
  const ySteps = [];
  for (let i = count; i >= 0; i--) {
    const v = Math.round(i * step * 10) / 10;
    ySteps.push(v);
  }
  return { yMax: niceMax, ySteps };
}

export default function PerformanceTrendCard({ timeframe = "30d" }) {
  const { session } = useAuth();
  const token = session?.token || null;

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [countsMap, setCountsMap] = useState({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState("");
  const [chartData, setChartData] = useState(null);
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [chartError, setChartError] = useState("");
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [hasFetchedInitial, setHasFetchedInitial] = useState(false);

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Debounce search input 320ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 320);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Close suggestions on outside click
  useEffect(() => {
    function onClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Fetch suggestions (distinct exercise_names from exercise_progress)
  useEffect(() => {
    if (!token) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    async function fetchSuggestions() {
      setIsLoadingSuggestions(true);
      try {
        const res = await apiGetExerciseNames(token, {
          search: debouncedSearch,
          limit: 50,
        });
        if (cancelled) return;
        const names = res.exercise_names || [];
        setSuggestions(names);
        setCountsMap(res.counts || {});
        // Auto-select first exercise on initial load if none selected
        if (!hasFetchedInitial && names.length > 0 && !selectedExercise) {
          const first = names[0];
          setSelectedExercise(first);
          setSearchInput(first);
          setHasFetchedInitial(true);
        } else if (!hasFetchedInitial && names.length === 0) {
          setHasFetchedInitial(true);
        }
      } catch (e) {
        if (!cancelled) {
          // keep previous suggestions on error; do not crash
          console.error("fetch exercise names failed", e);
        }
      } finally {
        if (!cancelled) setIsLoadingSuggestions(false);
      }
    }
    fetchSuggestions();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, debouncedSearch]);

  // Fetch chart when selectedExercise or timeframe changes
  useEffect(() => {
    if (!token || !selectedExercise) {
      setChartData(null);
      setChartError("");
      return;
    }
    let cancelled = false;
    async function fetchTrend() {
      setIsLoadingChart(true);
      setChartError("");
      try {
        const res = await apiGetPerformanceTrend(token, selectedExercise, timeframe);
        if (cancelled) return;
        setChartData(res);
      } catch (e) {
        if (cancelled) return;
        setChartError(e?.message || "Không tải được dữ liệu trend");
        setChartData(null);
      } finally {
        if (!cancelled) setIsLoadingChart(false);
      }
    }
    fetchTrend();
    return () => {
      cancelled = true;
    };
  }, [token, selectedExercise, timeframe]);

  const points = useMemo(() => chartData?.points || [], [chartData]);
  const unit = chartData?.unit || "reps";
  const inputType = chartData?.input_type || "note";

  const { yMax, ySteps } = useMemo(() => {
    if (!points.length) return computeYAxis(0);
    const maxVal = Math.max(...points.map((p) => p.value));
    return computeYAxis(maxVal);
  }, [points]);

  // Chart dimensions (keep original)
  const chartWidth = 560;
  const chartHeight = 180;
  const paddingLeft = 35;
  const paddingRight = 35;
  const paddingTop = 25;
  const paddingBottom = 25;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  const coords = useMemo(() => {
    if (!points.length) return [];
    return points.map((p, index) => {
      let x;
      if (points.length === 1) {
        x = paddingLeft + innerWidth / 2;
      } else {
        x = paddingLeft + (index / (points.length - 1)) * innerWidth;
      }
      const y = paddingTop + innerHeight - (p.value / yMax) * innerHeight;
      return { ...p, xCoord: x, yCoord: y, index };
    });
  }, [points, yMax, innerWidth, innerHeight, paddingLeft, paddingTop]);

  const pathD = useMemo(() => {
    if (!coords.length) return "";
    return coords.reduce((acc, pt, i, arr) => {
      if (i === 0) return `M ${pt.xCoord} ${pt.yCoord}`;
      const prev = arr[i - 1];
      const cp1x = prev.xCoord + (pt.xCoord - prev.xCoord) / 2;
      const cp1y = prev.yCoord;
      const cp2x = prev.xCoord + (pt.xCoord - prev.xCoord) / 2;
      const cp2y = pt.yCoord;
      return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${pt.xCoord} ${pt.yCoord}`;
    }, "");
  }, [coords]);

  const areaD = useMemo(() => {
    if (!coords.length || !pathD) return "";
    return `${pathD} L ${coords[coords.length - 1].xCoord} ${paddingTop + innerHeight} L ${coords[0].xCoord} ${paddingTop + innerHeight} Z`;
  }, [pathD, coords, paddingTop, innerHeight]);

  const latestPoint = coords.length ? coords[coords.length - 1] : null;
  const activePoint = hoveredPoint || latestPoint;

  // X-axis labels: show up to 5 evenly spaced dates
  const xLabels = useMemo(() => {
    if (!points.length) return [];
    if (points.length <= 5) return points.map((p) => p.date_display || p.date);
    const step = Math.ceil(points.length / 5);
    const labels = [];
    for (let i = 0; i < points.length; i += step) {
      labels.push(points[i].date_display || points[i].date);
    }
    if (labels[labels.length - 1] !== (points[points.length - 1].date_display || points[points.length - 1].date)) {
      labels[labels.length - 1] = points[points.length - 1].date_display || points[points.length - 1].date;
    }
    return labels;
  }, [points]);

  const timeframeLabelMap = {
    "7d": "7 ngày qua",
    "30d": "30 ngày qua",
    "90d": "90 ngày qua",
    year: "năm nay",
    all: "toàn thời gian",
  };
  const rangeLabel = timeframeLabelMap[timeframe] || timeframe;

  const handleSelectSuggestion = (name) => {
    setSelectedExercise(name);
    setSearchInput(name);
    setShowSuggestions(false);
    setHoveredPoint(null);
  };

  const handleClear = () => {
    setSearchInput("");
    setSelectedExercise("");
    setChartData(null);
    setChartError("");
    setSuggestions([]);
    setShowSuggestions(true);
    inputRef.current?.focus();
    // trigger refetch of all names
    setDebouncedSearch("");
  };

  const handleInputFocus = () => {
    setShowSuggestions(true);
    // if suggestions empty and not loading, trigger fetch via debounced change
    if (!suggestions.length && !isLoadingSuggestions && token) {
      // force re-fetch empty search
      setDebouncedSearch(searchInput);
    }
  };

  // Highlight matched substring in suggestion
  const renderHighlighted = (name, query) => {
    if (!query) return name;
    const idx = name.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return name;
    const before = name.slice(0, idx);
    const match = name.slice(idx, idx + query.length);
    const after = name.slice(idx + query.length);
    return (
      <>
        {before}
        <span className="text-white font-semibold bg-white/10 px-0.5">{match}</span>
        {after}
      </>
    );
  };

  return (
    <div ref={containerRef} className="bg-(--surface) border border-(--line) p-5 flex flex-col justify-between relative square-frame">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <h2 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Performance Trend</h2>
          <div className="relative">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="text-zinc-500 hover:text-zinc-300 transition p-0.5"
              title="Information"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
            {showInfo && (
              <div className="absolute left-0 top-6 w-72 bg-(--surface-2) border border-(--line-strong) p-2.5 text-[11px] text-zinc-300 shadow-xl z-50 animate-fade-in leading-relaxed">
                Gõ tên bài tập đã từng tập (từ <span className="text-white">exercise_progress</span>) để xem trend. Dữ liệu được aggregate
                theo <span className="text-white">max value per workout</span> trong khoảng <span className="text-white">{rangeLabel}</span>.
                <br />
                <span className="text-zinc-400">time → giây (s) • note/reps → reps • weight → kg (kèm reps)</span>
              </div>
            )}
          </div>
        </div>
        {/* timeframe badge */}
        <span className="text-[10px] px-2 py-1 bg-(--surface-3) border border-(--line) text-zinc-400 uppercase tracking-wider">
          {rangeLabel}
        </span>
      </div>

      {/* Search Box – thay thế dropdown cũ */}
      <div className="relative mb-4">
        <div className="flex items-center gap-2 bg-(--surface-2) border border-(--line) px-2.5 py-2 focus-within:border-(--line-strong) focus-within:bg-(--surface-3) transition">
          <Search className="w-4 h-4 text-zinc-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={handleInputFocus}
            placeholder="Search exercise… (ví dụ: Push-Up, Planche Lean, Pull-Up)"
            className="flex-1 bg-transparent outline-none text-sm text-zinc-100 placeholder:text-zinc-500"
          />
          {isLoadingSuggestions && <Loader2 className="w-4 h-4 text-zinc-500 animate-spin shrink-0" />}
          {searchInput && !isLoadingSuggestions && (
            <button onClick={handleClear} className="p-0.5 text-zinc-500 hover:text-zinc-200 transition shrink-0" title="Xóa">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && (
          <div className="absolute left-0 right-0 mt-1.5 bg-(--surface) border border-(--line-strong) z-40 max-h-64 overflow-y-auto shadow-xl backdrop-blur-xl animate-fade-in">
            {!token ? (
              <div className="px-3 py-4 text-xs text-zinc-500 text-center">Cần đăng nhập để search dữ liệu của bạn.</div>
            ) : isLoadingSuggestions && !suggestions.length ? (
              <div className="px-3 py-4 text-xs text-zinc-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Đang tải danh sách bài tập...
              </div>
            ) : suggestions.length === 0 ? (
              <div className="px-3 py-4 text-xs text-zinc-500 text-center leading-relaxed">
                {debouncedSearch ? (
                  <>
                    Không tìm thấy bài tập chứa “<span className="text-white">{debouncedSearch}</span>” trong lịch sử tập của bạn.
                    <br />
                    <span className="text-[11px]">Thử từ khóa khác hoặc hoàn thành thêm workout để có dữ liệu.</span>
                  </>
                ) : (
                  <>
                    Chưa có dữ liệu <span className="text-white">exercise_progress</span> nào.
                    <br />
                    <span className="text-[11px]">Hãy hoàn thành một buổi workout (done=true) để ghi nhận progress.</span>
                  </>
                )}
              </div>
            ) : (
              <div className="py-1">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider border-b border-white/[0.06] mb-1">
                  {debouncedSearch ? `Kết quả cho “${debouncedSearch}” • ${suggestions.length}` : `Bài đã tập • ${suggestions.length}`} 
                </div>
                {suggestions.map((name) => (
                  <button
                    key={name}
                    onClick={() => handleSelectSuggestion(name)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-xs text-left transition border-l-2 ${
                      selectedExercise === name
                        ? "bg-(--accent-soft) border-(--accent) text-white"
                        : "border-transparent text-zinc-300 hover:text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    <span className="truncate pr-2">{renderHighlighted(name, debouncedSearch)}</span>
                    <span className="text-[10px] text-zinc-500 shrink-0">
                      {countsMap[name] ? `${countsMap[name]} sets` : ""}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Subheader / Metric Label */}
      <div className="flex items-center gap-2 mb-4">
        <span className="w-4 h-px bg-(--accent)" />
        <span className="text-xs text-zinc-400">
          {selectedExercise ? (
            <>
              {selectedExercise} <span className="text-zinc-500">({unit} • {inputType})</span>
              {chartData?.total_workouts ? <span className="text-zinc-600"> • {chartData.total_workouts} workouts • {chartData.total_sets} sets</span> : null}
            </>
          ) : (
            "Chọn bài tập từ ô search để xem trend"
          )}
        </span>
      </div>

      {/* Chart Area */}
      <div className="relative w-full h-[220px] select-none">
        {isLoadingChart ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-(--surface)/50 backdrop-blur-[1px] z-10">
            <Loader2 className="w-6 h-6 text-(--accent) animate-spin" />
            <span className="text-xs text-zinc-400">Đang tải trend cho “{selectedExercise}”...</span>
          </div>
        ) : null}

        {!selectedExercise ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/[0.08] bg-(--surface-2)/50">
            <Search className="w-8 h-8 text-zinc-600 mb-2" />
            <p className="text-sm font-medium text-zinc-300">Chưa chọn bài tập</p>
            <p className="text-xs text-zinc-500 mt-1 max-w-[260px] leading-relaxed">
              Gõ tên bài tập ở ô search phía trên để fetch dữ liệu real từ <span className="text-zinc-300">exercise_progress</span> và vẽ biểu đồ.
            </p>
          </div>
        ) : chartError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 border border-(--accent-line) bg-(--accent-soft)/30">
            <p className="text-sm font-semibold text-(--accent)">Không tải được dữ liệu</p>
            <p className="text-xs text-zinc-400 mt-1">{chartError}</p>
            <button
              onClick={() => {
                setChartError("");
                // retry
                if (selectedExercise && token) {
                  setIsLoadingChart(true);
                  apiGetPerformanceTrend(token, selectedExercise, timeframe)
                    .then((res) => setChartData(res))
                    .catch((e) => setChartError(e?.message || "Lỗi"))
                    .finally(() => setIsLoadingChart(false));
                }
              }}
              className="mt-3 px-3 py-1.5 bg-(--surface-2) border border-(--line) text-xs text-zinc-300 hover:text-white transition"
            >
              Thử lại
            </button>
          </div>
        ) : points.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/[0.08] bg-(--surface-2)/50">
            <p className="text-sm font-medium text-zinc-300">Không có dữ liệu trong {rangeLabel}</p>
            <p className="text-xs text-zinc-500 mt-1 max-w-[280px] leading-relaxed">
              Bài “<span className="text-white">{selectedExercise}</span>” chưa có log nào trong khoảng này.
              <br />
              Thử đổi timeframe ở header sang <span className="text-zinc-300">All Time</span> hoặc hoàn thành thêm workout.
            </p>
            <div className="mt-3 text-[11px] text-zinc-600">
              input_type: {inputType} • unit: {unit}
            </div>
          </div>
        ) : (
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff4d4d" stopOpacity="0.25" />
                <stop offset="60%" stopColor="#ff4d4d" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#ff4d4d" stopOpacity="0.0" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Grid lines + Y labels */}
            {ySteps.map((step) => {
              const yPos = paddingTop + innerHeight - (step / yMax) * innerHeight;
              return (
                <g key={step}>
                  <line x1={paddingLeft} y1={yPos} x2={chartWidth - paddingRight} y2={yPos} stroke="#ffffff" strokeOpacity="0.06" strokeDasharray="2 3" />
                  <text x={paddingLeft - 8} y={yPos + 3.5} textAnchor="end" fill="#71717a" fontSize="9.5" fontFamily="inherit">
                    {step}
                    {unit}
                  </text>
                </g>
              );
            })}

            {/* Area */}
            {areaD && <path d={areaD} fill="url(#areaGradient)" />}

            {/* Line */}
            {pathD && <path d={pathD} fill="none" stroke="#ff4d4d" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />}

            {/* Points */}
            {coords.map((pt, idx) => {
              const isHovered = hoveredPoint?.index === idx;
              const isLast = idx === coords.length - 1;
              return (
                <g key={idx}>
                  <circle
                    cx={pt.xCoord}
                    cy={pt.yCoord}
                    r={isHovered || isLast ? 4 : 2.5}
                    fill="#ff4d4d"
                    className="transition-all duration-150 cursor-pointer"
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  {(isHovered || isLast) && (
                    <circle cx={pt.xCoord} cy={pt.yCoord} r={7} fill="none" stroke="#ff4d4d" strokeWidth="1.5" strokeOpacity="0.5" />
                  )}
                </g>
              );
            })}
          </svg>
        )}

        {/* Tooltip */}
        {activePoint && points.length > 0 && !isLoadingChart && !chartError && selectedExercise && (
          <div
            className="absolute z-10 pointer-events-none transform -translate-x-1/2 -translate-y-full"
            style={{
              left: `${(activePoint.xCoord / chartWidth) * 100}%`,
              top: `${(activePoint.yCoord / chartHeight) * 100}%`,
              marginTop: "-12px",
            }}
          >
            <div className="bg-(--surface-2)/95 border border-(--line-strong) px-2.5 py-1.5 text-center backdrop-blur-md min-w-[84px]">
              <p className="text-xs font-bold text-white leading-tight">{activePoint.label || `${activePoint.value}${unit}`}</p>
              <p className="text-[9px] text-zinc-400 leading-tight mt-0.5">{activePoint.date_display || activePoint.date}</p>
              {activePoint.sets_count ? <p className="text-[9px] text-zinc-500 leading-tight">{activePoint.sets_count} sets</p> : null}
              {activePoint.max_weight != null && activePoint.max_weight_reps != null && unit === "kg" ? (
                <p className="text-[9px] text-(--accent) leading-tight">
                  {activePoint.max_weight}kg × {activePoint.max_weight_reps} reps
                </p>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* X-axis Timeline Labels */}
      <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-3 border-t border-white/[0.04] mt-2 px-1 min-h-[18px]">
        {points.length === 0 ? (
          <span className="text-zinc-600 text-[11px]">{selectedExercise ? "—" : "Chọn bài tập để hiển thị trục thời gian"}</span>
        ) : (
          xLabels.map((label, i) => (
            <span key={i} className={i === xLabels.length - 1 ? "text-white font-medium" : ""}>
              {label}
            </span>
          ))
        )}
      </div>
    </div>
  );
}
