import { API_BASE } from "./auth";

async function parseError(res) {
  try {
    const data = await res.json();
    return data.detail || `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

async function safeFetch(url, options) {
  try {
    return await fetch(url, options);
  } catch (err) {
    const msg = err?.message || String(err);
    if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.toLowerCase().includes("cors")) {
      throw new Error(
        `Không kết nối được backend (${url}). Kiểm tra backend đang chạy ở ${API_BASE} và CORS đã cấu hình. Chi tiết: ${msg}`
      );
    }
    throw err;
  }
}

// GET /api/dashboard/muscle-focus?range=THIS_WEEK|LAST_WEEK|THIS_MONTH
export async function apiGetMuscleFocus(token, range = "THIS_WEEK") {
  const q = encodeURIComponent(range);
  const res = await safeFetch(`${API_BASE}/api/dashboard/muscle-focus?range=${q}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

// GET /api/dashboard/exercise-names?search=&limit=
export async function apiGetExerciseNames(token, { search = "", limit = 50 } = {}) {
  const url = new URL(`${API_BASE}/api/dashboard/exercise-names`);
  if (search && search.trim()) url.searchParams.set("search", search.trim());
  if (limit) url.searchParams.set("limit", String(limit));
  const res = await safeFetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

// GET /api/dashboard/performance-trend?exercise_name=&range=30d
export async function apiGetPerformanceTrend(token, exerciseName, range = "30d") {
  if (!exerciseName || !exerciseName.trim()) throw new Error("exerciseName is required");
  const url = new URL(`${API_BASE}/api/dashboard/performance-trend`);
  url.searchParams.set("exercise_name", exerciseName.trim());
  url.searchParams.set("range", range || "30d");
  const res = await safeFetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

// GET /api/dashboard/training-consistency?weeks=4
export async function apiGetTrainingConsistency(token, weeks = 4) {
  const url = new URL(`${API_BASE}/api/dashboard/training-consistency`);
  url.searchParams.set("weeks", String(weeks));
  const res = await safeFetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}
