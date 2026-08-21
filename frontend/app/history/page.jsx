"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  History,
  Clock,
  Layers,
  Zap,
  Search,
  ChevronDown,
  RefreshCw,
  Trophy,
  Calendar,
  X,
  Hash,
  Timer,
  Dumbbell,
  Activity,
  AlertCircle,
  LogIn,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";
import { apiListWorkouts, apiGetWorkout } from "@/lib/workouts";

// ── Helpers ──────────────────────────────────────────────────
function normalizeWorkout(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    userId: raw.userId ?? raw.user_id,
    name: raw.name ?? "Untitled Session",
    completedSets: raw.completedSets ?? raw.completed_sets ?? 0,
    avgRpe: raw.avgRpe ?? raw.avg_rpe ?? null,
    durationMinutes: raw.durationMinutes ?? raw.duration_minutes ?? 0,
    sessionNumber: raw.sessionNumber ?? raw.session_number ?? 0,
    createdAt: raw.createdAt ?? raw.created_at ?? null,
  };
}

function formatDateShort(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatDateLong(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatDuration(mins) {
  const m = Number(mins) || 0;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem ? `${h} h ${rem} m` : `${h} h`;
  }
  return `${m} min`;
}

function rpeLabel(v) {
  if (v == null) return null;
  if (v >= 9) return { text: "MAX EFFORT", cls: "text-(--accent) bg-(--accent-soft) border-(--accent-line)" };
  if (v >= 7.5) return { text: "HIGH", cls: "text-amber-400 bg-amber-500/10 border-amber-500/30" };
  if (v >= 5) return { text: "MODERATE", cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" };
  return { text: "LIGHT", cls: "text-sky-400 bg-sky-500/10 border-sky-500/30" };
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name", label: "Name A–Z" },
  { value: "duration_desc", label: "Duration • High → Low" },
  { value: "sets_desc", label: "Sets • High → Low" },
  { value: "rpe_desc", label: "RPE • High → Low" },
];

// ── Sub Components ─────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="bg-(--surface) border border-(--line) p-4 square-frame flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="w-8 h-8 bg-(--surface-3) border border-(--line) flex items-center justify-center">
          <Icon className={`w-4 h-4 ${accent || "text-(--muted)"}`} />
        </div>
        <span className="w-2 h-2 bg-(--accent) led" aria-hidden />
      </div>
      <div>
        <p className="text-[10px] font-semibold text-(--faint) tracking-[0.18em] uppercase">{label}</p>
        <p className="font-display text-xl font-bold text-zinc-100 mt-1 tnum">{value}</p>
        {sub && <p className="text-[11px] text-(--faint) mt-1 leading-relaxed">{sub}</p>}
      </div>
    </div>
  );
}

function HistoryCard({ workout, onOpen }) {
  const rpe = rpeLabel(workout.avgRpe);
  return (
    <button
      onClick={() => onOpen(workout)}
      className="w-full text-left bg-(--surface) border border-(--line) p-4 square-frame hover:bg-(--surface-2) hover:border-(--line-strong) transition group flex flex-col gap-3"
    >
      {/* Top row: session + date + rpe badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-(--surface-3) border border-(--line) text-[10px] font-bold tracking-widest uppercase text-(--muted)">
            <Hash className="w-3 h-3 text-(--faint)" />
            {String(workout.sessionNumber).padStart(2, "0")}
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-(--faint)">
            <Calendar className="w-3 h-3" />
            {formatDateShort(workout.createdAt)}
          </span>
        </div>
        {workout.avgRpe != null ? (
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 border text-[10px] font-bold tracking-wider uppercase ${rpe.cls}`}>
            <Zap className="w-3 h-3" />
            RPE {workout.avgRpe.toFixed(1)}
          </span>
        ) : (
          <span className="px-1.5 py-0.5 bg-(--surface-3) border border-(--line) text-[10px] text-(--faint) uppercase tracking-wider">
            No RPE
          </span>
        )}
      </div>

      {/* Name */}
      <h3 className="font-display text-[15px] font-semibold text-zinc-100 leading-tight group-hover:text-white transition line-clamp-2">
        {workout.name}
      </h3>

      {/* Metrics row */}
      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/[0.06]">
        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-(--surface-3) border border-(--line) text-xs text-zinc-300 tnum">
          <Layers className="w-3.5 h-3.5 text-(--faint)" />
          {workout.completedSets} sets
        </span>
        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-(--surface-3) border border-(--line) text-xs text-zinc-300 tnum">
          <Timer className="w-3.5 h-3.5 text-(--faint)" />
          {formatDuration(workout.durationMinutes)}
        </span>
        <span className="ml-auto text-[11px] text-(--faint) group-hover:text-(--accent) transition flex items-center gap-1">
          View detail
          <ChevronDown className="w-3 h-3 rotate-[-90deg]" />
        </span>
      </div>
    </button>
  );
}

function DetailModal({ workout, onClose, loadingDetail, detailError }) {
  if (!workout) return null;
  const rpe = rpeLabel(workout.avgRpe);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-(--surface) border border-(--line-strong) w-full max-w-lg square-frame max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between p-5 pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-(--surface-3) border border-(--line) flex items-center justify-center">
              <History className="w-4 h-4 text-(--accent)" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-(--accent) tracking-[0.18em] uppercase">Session #{workout.sessionNumber}</p>
              <h2 className="text-sm font-bold text-zinc-100 leading-tight">{workout.name}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 p-1 hover:bg-white/5 transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {loadingDetail && (
            <div className="flex items-center gap-2 text-xs text-(--muted) bg-(--surface-3) border border-(--line) p-3">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Loading latest detail…
            </div>
          )}
          {detailError && (
            <div className="flex items-center gap-2 text-xs text-(--accent) bg-(--accent-soft) border border-(--accent-line) p-3">
              <AlertCircle className="w-3.5 h-3.5" />
              {detailError}
            </div>
          )}

          {/* Primary metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-(--surface-3) border border-(--line) p-3 text-center">
              <p className="text-[10px] font-semibold text-(--faint) uppercase tracking-[0.14em]">Sets</p>
              <p className="font-display text-lg font-bold text-zinc-100 tnum mt-1">{workout.completedSets}</p>
              <p className="text-[10px] text-(--faint) mt-0.5">completed</p>
            </div>
            <div className="bg-(--surface-3) border border-(--line) p-3 text-center">
              <p className="text-[10px] font-semibold text-(--faint) uppercase tracking-[0.14em]">Duration</p>
              <p className="font-display text-lg font-bold text-zinc-100 tnum mt-1">{formatDuration(workout.durationMinutes)}</p>
              <p className="text-[10px] text-(--faint) mt-0.5">active time</p>
            </div>
            <div className="bg-(--surface-3) border border-(--line) p-3 text-center">
              <p className="text-[10px] font-semibold text-(--faint) uppercase tracking-[0.14em]">Avg RPE</p>
              <p className="font-display text-lg font-bold text-zinc-100 tnum mt-1">
                {workout.avgRpe != null ? workout.avgRpe.toFixed(1) : "—"}
              </p>
              <p className="text-[10px] text-(--faint) mt-0.5">{rpe ? rpe.text : "no data"}</p>
            </div>
          </div>

          {/* Meta */}
          <div className="bg-(--surface-3) border border-(--line) p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-(--faint)">
                <Calendar className="w-3.5 h-3.5" />
                Date
              </span>
              <span className="text-zinc-200 tnum">{formatDateLong(workout.createdAt)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-(--faint)">
                <Hash className="w-3.5 h-3.5" />
                Session
              </span>
              <span className="text-zinc-200 font-medium">#{workout.sessionNumber}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-(--faint)">
                <Dumbbell className="w-3.5 h-3.5" />
                Workout ID
              </span>
              <span className="text-zinc-400 font-mono text-[11px] truncate max-w-[160px]">{workout.id}</span>
            </div>
          </div>

          {/* RPE breakdown hint */}
          {workout.avgRpe != null && (
            <div className="flex items-start gap-2 bg-(--surface-3) border border-(--line) p-3 text-xs leading-relaxed">
              <Activity className="w-4 h-4 text-(--accent) mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-zinc-200">Intensity insight</p>
                <p className="text-(--muted) mt-1">
                  Average RPE <span className="text-zinc-100 font-semibold">{workout.avgRpe.toFixed(1)}/10</span> —{" "}
                  {workout.avgRpe >= 8
                    ? "high intensity, prioritize recovery."
                    : workout.avgRpe >= 6
                    ? "solid moderate effort, consistent stimulus."
                    : "light session, good for technique & volume."}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full btn-white text-xs py-2.5 mt-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────
export default function HistoryPage() {
  const { session, loading: authLoading } = useAuth();
  const token = session?.token;

  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [sortOpen, setSortOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const isDevUser = token === "dev-quick-login-token";

  const fetchWorkouts = async (showLoading = true) => {
    if (!token) {
      setLoading(false);
      return;
    }
    if (showLoading) setLoading(true);
    setError("");
    try {
      const raw = await apiListWorkouts(token);
      const normalized = (raw || []).map(normalizeWorkout).filter(Boolean);
      // Backend already sorts by session_number desc, but we keep client sort as well
      setWorkouts(normalized);
    } catch (e) {
      setError(e?.message || "Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- fallback when unauthenticated
      setLoading(false);
      return;
    }
    fetchWorkouts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, authLoading]);

  const handleOpenDetail = async (workout) => {
    setSelected(workout);
    setDetailError("");
    if (!token || isDevUser) return;
    // Fetch fresh detail from GET /api/workouts/{id} to ensure sync with server
    try {
      setDetailLoading(true);
      const raw = await apiGetWorkout(token, workout.id);
      const fresh = normalizeWorkout(raw);
      if (fresh) setSelected(fresh);
    } catch (e) {
      setDetailError(e?.message || "Failed to fetch detail");
    } finally {
      setDetailLoading(false);
    }
  };

  // ── Derived ────────────────────────────────────────────────
  const filteredAndSorted = useMemo(() => {
    let list = [...workouts];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((w) => w.name.toLowerCase().includes(q));
    }
    switch (sortBy) {
      case "oldest":
        list.sort((a, b) => (a.sessionNumber || 0) - (b.sessionNumber || 0));
        break;
      case "name":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "duration_desc":
        list.sort((a, b) => b.durationMinutes - a.durationMinutes);
        break;
      case "sets_desc":
        list.sort((a, b) => b.completedSets - a.completedSets);
        break;
      case "rpe_desc":
        list.sort((a, b) => (b.avgRpe ?? -1) - (a.avgRpe ?? -1));
        break;
      case "newest":
      default:
        list.sort((a, b) => (b.sessionNumber || 0) - (a.sessionNumber || 0));
        break;
    }
    return list;
  }, [workouts, search, sortBy]);

  const stats = useMemo(() => {
    const total = workouts.length;
    const totalSets = workouts.reduce((s, w) => s + (w.completedSets || 0), 0);
    const totalMins = workouts.reduce((s, w) => s + (w.durationMinutes || 0), 0);
    const rpes = workouts.map((w) => w.avgRpe).filter((v) => v != null && !Number.isNaN(v));
    const avgRpe = rpes.length ? (rpes.reduce((a, b) => a + b, 0) / rpes.length).toFixed(1) : "—";
    return { total, totalSets, totalMins, avgRpe };
  }, [workouts]);

  const sortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label || "Newest first";

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="led led-live" />
            <span className="text-[10px] font-semibold text-(--faint) tracking-[0.22em] uppercase">Training log</span>
          </div>
          <h1 className="font-display text-2xl font-semibold text-zinc-50 tracking-tight flex items-center gap-2.5">
            <History className="w-6 h-6 text-(--accent)" />
            History
          </h1>
          <p className="text-xs text-(--muted) mt-1 max-w-[560px] leading-relaxed">
            Every saved session from Supabase — real data via <span className="text-zinc-300 font-medium">GET /api/workouts</span>. Search, sort and inspect your progress.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <button
            onClick={() => fetchWorkouts(false)}
            disabled={loading || !token || isDevUser}
            className="inline-flex items-center gap-2 btn-ghost text-xs px-3.5 py-2 disabled:opacity-40"
            title="Refresh history"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link
            href="/workouts"
            className="inline-flex items-center gap-2 btn-accent text-xs px-4 py-2"
          >
            <Dumbbell className="w-4 h-4" />
            New workout
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Trophy}
          label="Total sessions"
          value={authLoading || loading ? "—" : stats.total}
          sub={stats.total ? `Latest #${Math.max(...workouts.map((w) => w.sessionNumber))}` : "No sessions yet"}
          accent="text-(--accent)"
        />
        <StatCard
          icon={Layers}
          label="Total sets"
          value={authLoading || loading ? "—" : stats.totalSets}
          sub={stats.total ? "Completed • done=true" : "Start a workout to log sets"}
        />
        <StatCard
          icon={Clock}
          label="Total time"
          value={authLoading || loading ? "—" : formatDuration(stats.totalMins)}
          sub={stats.totalMins ? `${stats.totalMins} minutes logged` : "Duration in minutes"}
        />
        <StatCard
          icon={Zap}
          label="Avg intensity"
          value={authLoading || loading ? "—" : stats.avgRpe === "—" ? "—" : `${stats.avgRpe} RPE`}
          sub={stats.avgRpe !== "—" ? "Across all sessions" : "No RPE recorded yet"}
          accent="text-amber-400"
        />
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 bg-(--surface) border border-(--line) px-3 py-2 w-full sm:max-w-sm">
          <Search className="w-4 h-4 text-zinc-500 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by workout name…"
            className="bg-transparent outline-none text-xs text-zinc-200 w-full placeholder:text-(--faint)"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-(--faint) hover:text-zinc-300">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 sm:ml-auto">
          <div className="relative">
            <button
              onClick={() => setSortOpen((v) => !v)}
              className="flex items-center gap-2 bg-(--surface) border border-(--line) px-3 py-2 text-xs text-zinc-300 hover:border-(--line-strong) transition"
            >
              <span className="text-(--faint) hidden sm:inline">Sort:</span>
              <span className="font-medium">{sortLabel}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-(--faint) transition ${sortOpen ? "rotate-180" : ""}`} />
            </button>
            {sortOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setSortOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-56 bg-(--surface) border border-(--line-strong) py-1 z-30">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setSortBy(opt.value);
                        setSortOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition ${
                        sortBy === opt.value ? "text-(--accent) bg-(--accent-soft) font-semibold" : "text-(--muted)"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <span className="text-[11px] text-(--faint) whitespace-nowrap">
            {filteredAndSorted.length} {filteredAndSorted.length === 1 ? "session" : "sessions"}
          </span>
        </div>
      </div>

      {/* Content states */}
      {authLoading ? (
        <div className="bg-(--surface) border border-(--line) p-10 text-center square-frame">
          <RefreshCw className="w-5 h-5 text-(--muted) animate-spin mx-auto mb-3" />
          <p className="text-sm text-zinc-400">Checking authentication…</p>
        </div>
      ) : !token ? (
        <div className="bg-(--surface) border border-(--accent-line) p-8 text-center square-frame">
          <div className="w-10 h-10 bg-(--surface-3) border border-(--line) flex items-center justify-center mx-auto mb-3">
            <LogIn className="w-5 h-5 text-(--accent)" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-100">Login required</h3>
          <p className="text-xs text-(--muted) mt-1.5 leading-relaxed max-w-md mx-auto">
            History is tied to your account (FK to <span className="text-zinc-300">auth.users</span>). Please log in to fetch
            your real workouts from Supabase via <span className="text-zinc-300">GET /api/workouts</span>.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Link href="/login" className="inline-flex items-center gap-2 btn-accent text-xs px-5 py-2">
              <LogIn className="w-4 h-4" />
              Go to login
            </Link>
            <Link href="/workouts" className="inline-flex items-center gap-2 btn-ghost text-xs px-4 py-2">
              Browse workouts
            </Link>
          </div>
        </div>
      ) : isDevUser ? (
        <div className="bg-(--surface) border border-(--line) p-8 text-center square-frame">
          <div className="w-10 h-10 bg-(--surface-3) border border-(--line) flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-5 h-5 text-amber-400" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-100">Dev account — no persistent history</h3>
          <p className="text-xs text-(--muted) mt-1.5 leading-relaxed max-w-md mx-auto">
            You are logged in with <span className="text-amber-300 font-medium">dev-quick-login-token</span>. The backend
            returns an empty list for this user and does not persist workouts. Please log in with a real account (via
            Supabase Auth) to save and view history.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Link href="/login" className="inline-flex items-center gap-2 btn-accent text-xs px-5 py-2">
              Log in with real account
            </Link>
            <Link href="/workouts" className="inline-flex items-center gap-2 btn-ghost text-xs px-4 py-2">
              Start a quick session
            </Link>
          </div>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-(--surface) border border-(--line) p-5 square-frame animate-pulse">
              <div className="h-3 w-24 bg-(--surface-3) mb-3" />
              <div className="h-5 w-3/4 bg-(--surface-3) mb-4" />
              <div className="flex gap-2">
                <div className="h-6 w-20 bg-(--surface-3)" />
                <div className="h-6 w-24 bg-(--surface-3)" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-(--surface) border border-(--accent-line) p-8 text-center square-frame">
          <AlertCircle className="w-6 h-6 text-(--accent) mx-auto mb-2" />
          <p className="text-sm font-medium text-(--accent)">Failed to load history</p>
          <p className="text-xs text-(--muted) mt-1">{error}</p>
          <p className="text-[11px] text-(--faint) mt-2">Make sure FastAPI is running on http://localhost:8000</p>
          <button onClick={() => fetchWorkouts(true)} className="mt-4 inline-flex items-center gap-2 btn-accent text-xs px-5 py-2">
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      ) : workouts.length === 0 ? (
        <div className="bg-(--surface) border border-(--line) p-10 text-center square-frame">
          <div className="w-12 h-12 bg-(--surface-3) border border-(--line) flex items-center justify-center mx-auto mb-3">
            <History className="w-6 h-6 text-(--faint)" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-100">No sessions yet</h3>
          <p className="text-xs text-(--muted) mt-1.5 max-w-md mx-auto leading-relaxed">
            Complete a workout from <span className="text-zinc-300">Workouts → Start → Finish → Save Session</span>. It will
            be saved via <span className="text-zinc-300">POST /api/workouts</span> and appear here immediately.
          </p>
          <Link href="/workouts" className="mt-5 inline-flex items-center gap-2 btn-accent text-xs px-5 py-2.5">
            <Dumbbell className="w-4 h-4" />
            Start your first workout
          </Link>
        </div>
      ) : filteredAndSorted.length === 0 ? (
        <div className="bg-(--surface) border border-(--line) p-10 text-center square-frame">
          <Search className="w-6 h-6 text-(--faint) mx-auto mb-2" />
          <p className="text-sm text-zinc-400">No sessions match “{search}”</p>
          <button onClick={() => setSearch("")} className="mt-3 text-xs text-(--accent) hover:text-(--accent-strong) underline">
            Clear search
          </button>
        </div>
      ) : (
        <>
          {/* History grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAndSorted.map((w) => (
              <HistoryCard key={w.id} workout={w} onOpen={handleOpenDetail} />
            ))}
          </div>

          {/* Timeline footer hint */}
          <div className="flex items-center gap-2 text-[11px] text-(--faint) pt-2">
            <span className="w-6 h-px bg-(--line-strong)" />
            <span>Ordered by {sortLabel.toLowerCase()} • Fetched live from Supabase</span>
          </div>
        </>
      )}

      {/* Detail modal */}
      {selected && (
        <DetailModal
          workout={selected}
          onClose={() => {
            setSelected(null);
            setDetailError("");
            setDetailLoading(false);
          }}
          loadingDetail={detailLoading}
          detailError={detailError}
        />
      )}
    </div>
  );
}
