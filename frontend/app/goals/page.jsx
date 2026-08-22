"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Target, Clock, Plus, X, CheckCircle2, RefreshCw, Trash2, TrendingUp, History, Sparkles } from "lucide-react";
import { getStoredSession } from "@/lib/auth";
import { apiCreateGoal, apiListGoals, apiRecalculateGoal, apiRecalculateAllGoals, apiGetGoalProgress, apiDeleteGoal } from "@/lib/goals";

const METRIC_TYPES = [
  { key: "seconds", label: "Second Hold", unit: "s" },
  { key: "weighted", label: "Weighted", unit: "kg" },
  { key: "reps", label: "Reps", unit: "reps" },
];

const TIME_UNITS = [
  { key: "weeks", label: "weeks" },
  { key: "months", label: "months" },
];

function formatDate(date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDeadline(raw) {
  if (!raw) return "";
  // deadline từ DB là ISO timestamptz, format lại cho UI
  // fallback nếu là string legacy như "Aug 30, 2026"
  const d = new Date(raw);
  if (!isNaN(d.getTime()) && String(raw).includes("T")) {
    return formatDate(d);
  }
  if (!isNaN(d.getTime()) && String(raw).match(/^\d{4}-\d{2}-\d{2}/)) {
    return formatDate(d);
  }
  return String(raw);
}

function computeDeadline(amount, unit) {
  const date = new Date();
  if (unit === "weeks") date.setDate(date.getDate() + amount * 7);
  else date.setMonth(date.getMonth() + amount);
  return formatDate(date);
}

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [recalcLoading, setRecalcLoading] = useState(null);
  const [historyMap, setHistoryMap] = useState({});
  const [historyOpen, setHistoryOpen] = useState(null);

  const [title, setTitle] = useState("");
  const [metricKey, setMetricKey] = useState("seconds");
  const [metricValue, setMetricValue] = useState("");
  const [timeAmount, setTimeAmount] = useState("");
  const [timeUnit, setTimeUnit] = useState("weeks");

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const session = getStoredSession();
      const token = session?.token;
      if (!token) {
        setGoals([]);
        setFetchError("Bạn cần đăng nhập để xem goals.");
        return;
      }
      const data = await apiListGoals(token);
      setGoals(Array.isArray(data) ? data : []);
    } catch (err) {
      setFetchError(err?.message || "Không tải được goals.");
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals().catch((e) => {
      console.error("fetchGoals unhandled", e);
      setFetchError(e?.message || "Không tải được goals.");
      setLoading(false);
    });
  }, [fetchGoals]);

  const resetForm = () => {
    setTitle("");
    setMetricKey("seconds");
    setMetricValue("");
    setTimeAmount("");
    setTimeUnit("weeks");
    setSaveError(null);
  };

  const handleAdd = async () => {
    setSaveError(null);
    const amount = parseFloat(metricValue) || 0;
    const time = parseInt(timeAmount, 10) || 0;
    if (!title.trim() || amount <= 0 || time <= 0) return;

    setIsSaving(true);
    try {
      const session = getStoredSession();
      const token = session?.token;
      if (!token) throw new Error("Bạn cần đăng nhập để tạo goal.");

      const payload = {
        title: title.trim(),
        metricType: metricKey,
        metricValue: amount,
        timeAmount: time,
        timeUnit: timeUnit,
      };
      const created = await apiCreateGoal(token, payload);
      setGoals((prev) => [created, ...prev]);
      setModalOpen(false);
      resetForm();
    } catch (err) {
      setSaveError(err?.message || "Tạo goal thất bại.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRecalcOne = async (goalId) => {
    setRecalcLoading(goalId);
    try {
      const session = getStoredSession();
      const token = session?.token;
      if (!token) throw new Error("Bạn cần đăng nhập.");
      const updated = await apiRecalculateGoal(token, goalId);
      setGoals((prev) => prev.map((g) => (g.id === goalId ? updated : g)));
    } catch (e) {
      alert(e?.message || "Recalculate thất bại");
    } finally {
      setRecalcLoading(null);
    }
  };

  const handleRecalcAll = async () => {
    setRecalcLoading("all");
    try {
      const session = getStoredSession();
      const token = session?.token;
      if (!token) throw new Error("Bạn cần đăng nhập.");
      const data = await apiRecalculateAllGoals(token);
      setGoals(Array.isArray(data) ? data : []);
    } catch (e) {
      alert(e?.message || "Recalculate all thất bại");
    } finally {
      setRecalcLoading(null);
    }
  };

  const handleDelete = async (goalId) => {
    if (!confirm("Xoá goal này? Lịch sử progress cũng sẽ mất.")) return;
    try {
      const session = getStoredSession();
      const token = session?.token;
      if (!token) throw new Error("Bạn cần đăng nhập.");
      await apiDeleteGoal(token, goalId);
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
    } catch (e) {
      alert(e?.message || "Xoá thất bại");
    }
  };

  const toggleHistory = async (goalId) => {
    if (historyOpen === goalId) {
      setHistoryOpen(null);
      return;
    }
    setHistoryOpen(goalId);
    if (historyMap[goalId]) return;
    try {
      const session = getStoredSession();
      const token = session?.token;
      if (!token) return;
      const data = await apiGetGoalProgress(token, goalId);
      setHistoryMap((prev) => ({ ...prev, [goalId]: Array.isArray(data) ? data : [] }));
    } catch {
      setHistoryMap((prev) => ({ ...prev, [goalId]: [] }));
    }
  };

  const canAdd =
    title.trim().length > 0 &&
    (parseFloat(metricValue) || 0) > 0 &&
    (parseInt(timeAmount, 10) || 0) > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-zinc-50 tracking-tight">Calisthenics Goals</h1>
          <p className="text-xs text-(--muted) mt-1">Set and track milestone objectives for your bodyweight journey. Mỗi bài trong routine có thể bổ trợ 1 goal (trực tiếp/gián tiếp).</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleRecalcAll}
            disabled={recalcLoading === "all"}
            className="hidden sm:flex items-center gap-1.5 bg-(--surface) border border-(--line) hover:bg-(--surface-2) text-zinc-300 text-xs px-3 py-2 active:scale-[0.98] disabled:opacity-50"
            title="Tính lại tất cả goals (direct+indirect)"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${recalcLoading === "all" ? "animate-spin" : ""}`} />
            <span>{recalcLoading === "all" ? "Đang tính..." : "Recalc All"}</span>
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 btn-accent text-xs px-4 py-2 active:scale-[0.98] shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Goal</span>
          </button>
        </div>
      </div>

      {loading && <div className="text-xs text-(--muted) py-8 text-center">Đang tải goals...</div>}
      {!loading && fetchError && (
        <div className="bg-(--surface) border border-(--line) p-4 text-center space-y-2">
          <p className="text-xs text-amber-400">{fetchError}</p>
          <button onClick={fetchGoals} className="text-xs btn-ghost px-3 py-1.5 border border-(--line) hover:bg-white/5">
            Thử lại
          </button>
        </div>
      )}
      {!loading && !fetchError && goals.length === 0 && (
        <div className="bg-(--surface) border border-dashed border-(--line-strong) p-10 text-center">
          <p className="text-sm text-(--muted) mb-1">Chưa có goal nào.</p>
          <p className="text-xs text-(--faint) mb-4">Tạo goal đầu tiên để bắt đầu hành trình.</p>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 btn-accent text-xs px-5 py-2.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Goal</span>
          </button>
        </div>
      )}

      {!loading && !fetchError && goals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {goals.map((g, idx) => {
            const prog = g.progress ?? 0;
            const isDone = prog >= 100;
            const isNear = prog >= 50 && prog < 100;
            return (
              <div
                key={g.id ?? idx}
                className="bg-(--surface) border border-(--line) p-5 square-frame flex flex-col"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-(--accent) uppercase tracking-[0.18em]">{g.category}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 border ${isDone ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" : isNear ? "bg-amber-500/15 border-amber-500/30 text-amber-400" : prog > 0 ? "bg-(--accent-soft) border-(--accent-line) text-(--accent)" : "bg-(--surface-3) border-(--line) text-(--muted)"}`}>
                    {g.status}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-zinc-100 mb-1 flex items-center gap-1.5">
                  {isDone && <Sparkles className="w-3.5 h-3.5 text-emerald-400" />}
                  {g.title}
                </h3>
                <div className="flex items-center gap-2 mb-2 text-[10px] text-(--faint)">
                  <span className="px-1.5 py-0.5 bg-(--surface-3) border border-(--line)">{g.metricType ?? g.metric_type} • {g.metricValue ?? g.metric_value}{g.metricType === "seconds" || g.metric_type === "seconds" ? "s" : g.metricType === "weighted" || g.metric_type === "weighted" ? "kg" : " reps"}</span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-(--accent)" />
                    {prog}% • {g.current}
                  </span>
                </div>
                <div className="w-full h-2 bg-(--surface-3) overflow-hidden mb-1.5">
                  <div
                    className={`h-full transition-all duration-700 ${isDone ? "bg-emerald-500" : isNear ? "bg-amber-500" : "bg-(--accent)"}`}
                    style={{ width: `${prog}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-(--faint) mb-3">
                  <span>{prog}% • {g.current}</span>
                  <span>Target: {g.target}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-white/[0.04] gap-2">
                  <span className="flex items-center gap-1 text-zinc-500 text-[11px]">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDeadline(g.deadline)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleHistory(g.id)} className="p-1.5 text-(--faint) hover:text-zinc-200 hover:bg-white/5 transition" title="Lịch sử">
                      <History className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleRecalcOne(g.id)} disabled={recalcLoading === g.id} className="p-1.5 text-(--faint) hover:text-(--accent) hover:bg-(--accent-soft) transition disabled:opacity-50" title="Tính lại">
                      <RefreshCw className={`w-3.5 h-3.5 ${recalcLoading === g.id ? "animate-spin" : ""}`} />
                    </button>
                    <button onClick={() => handleDelete(g.id)} className="p-1.5 text-(--faint) hover:text-red-400 hover:bg-red-500/10 transition" title="Xoá">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {historyOpen === g.id && (
                  <div className="mt-3 bg-(--surface-3) border border-(--line) p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-(--muted)">Lịch sử progress</span>
                      <button onClick={() => setHistoryOpen(null)} className="text-(--faint) hover:text-zinc-300 p-1"><X className="w-3 h-3" /></button>
                    </div>
                    {!historyMap[g.id] ? (
                      <p className="text-[11px] text-(--faint)">Đang tải...</p>
                    ) : historyMap[g.id].length === 0 ? (
                      <p className="text-[11px] text-(--faint)">Chưa có lần tăng nào. Hãy tập 1 buổi có bài bổ trợ cho goal này.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {historyMap[g.id].map((h) => (
                          <div key={h.id} className="flex items-center justify-between text-[11px] bg-(--surface) border border-(--line) px-2 py-1.5">
                            <span className={`px-1 py-0.5 text-[9px] font-bold uppercase border ${h.contributionType === "direct" ? "bg-(--accent-soft) border-(--accent-line) text-(--accent)" : "bg-amber-500/10 border-amber-500/30 text-amber-400"}`}>{h.contributionType}</span>
                            <span className="text-zinc-300 truncate mx-2 flex-1">{h.exerciseName}</span>
                            <span className="text-(--accent) font-medium">+{h.deltaPercent}%</span>
                            <span className="text-(--faint) ml-2">{h.progressBefore}%→{h.progressAfter}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-(--surface) border border-(--line-strong) w-full max-w-md square-frame">
            <div className="flex items-center justify-between p-5 pb-3">
              <h2 className="flex items-center gap-2 text-base font-bold text-zinc-100">
                <Target className="w-4 h-4 text-(--accent)" />
                New Goal
              </h2>
              <button
                onClick={() => {
                  setModalOpen(false);
                  resetForm();
                }}
                className="text-(--faint) hover:text-zinc-300 p-1 hover:bg-white/5 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 pb-5 space-y-4">
              {saveError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-3 py-2">
                  {saveError}
                </div>
              )}
              <div>
                <label className="block text-[10px] font-semibold text-(--faint) uppercase tracking-[0.18em] mb-1.5">
                  Goal Name
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Hold 15s Front Lever"
                  className="w-full bg-(--surface-3) border border-(--line-strong) px-3 py-2 text-xs text-zinc-200 outline-none placeholder:text-(--faint) focus:border-(--accent-line) transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-(--faint) uppercase tracking-[0.18em] mb-1.5">
                  Metric Type
                </label>
                <div className="grid grid-cols-3 gap-1 bg-(--surface-3) border border-(--line) p-1">
                  {METRIC_TYPES.map((m) => (
                    <button
                      key={m.key}
                      onClick={() => setMetricKey(m.key)}
                      className={`px-2 py-2 text-[10px] font-semibold transition ${
                        metricKey === m.key
                          ? "bg-(--accent-soft) border border-(--accent-line) text-(--accent)"
                          : "border border-transparent text-(--faint) hover:text-zinc-300"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={metricValue}
                    onChange={(e) => setMetricValue(e.target.value)}
                    placeholder="Target value"
                    className="w-full bg-(--surface-3) border border-(--line-strong) px-3 py-2 text-xs text-zinc-200 outline-none placeholder:text-(--faint) focus:border-(--accent-line) transition"
                  />
                  <span className="text-[10px] font-bold text-(--muted) uppercase tracking-wider shrink-0 w-12 text-center">
                    {METRIC_TYPES.find((m) => m.key === metricKey).unit}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-(--faint) uppercase tracking-[0.18em] mb-1.5">
                  Estimated Time to Achieve
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={timeAmount}
                    onChange={(e) => setTimeAmount(e.target.value)}
                    placeholder="e.g. 12"
                    className="w-full bg-(--surface-3) border border-(--line-strong) px-3 py-2 text-xs text-zinc-200 outline-none placeholder:text-(--faint) focus:border-(--accent-line) transition"
                  />
                  <select
                    value={timeUnit}
                    onChange={(e) => setTimeUnit(e.target.value)}
                    className="bg-(--surface-3) border border-(--line-strong) px-2 py-2 text-xs text-zinc-200 outline-none focus:border-(--accent-line) transition shrink-0"
                  >
                    {TIME_UNITS.map((u) => (
                      <option key={u.key} value={u.key}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>
                {(parseInt(timeAmount, 10) || 0) > 0 && (
                  <p className="flex items-center gap-1 text-[10px] text-(--muted) mt-1.5">
                    <CheckCircle2 className="w-3 h-3 text-(--accent)" />
                    Estimated deadline: {computeDeadline(parseInt(timeAmount, 10), timeUnit)}
                  </p>
                )}
              </div>

              <button
                onClick={handleAdd}
                disabled={!canAdd || isSaving}
                className="w-full flex items-center justify-center gap-2 btn-accent disabled:opacity-50 text-xs px-4 py-2.5 active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>{isSaving ? "Creating..." : "Create Goal"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
