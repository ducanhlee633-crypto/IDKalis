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

// POST /api/workouts — lưu buổi tập (bắt buộc login, FK tới users)
// payload: { name, completedSets, avgRpe, durationMinutes, exercises?: [{exerciseId?, exerciseName, inputType, sets:[{reps?, time?, weight?, note?, rpe?, done}]}] } (camelCase)
// Chỉ set done=true mới được persist vào exercise_progress per-set
// trả về WorkoutResponse { id, userId, name, completedSets, avgRpe, durationMinutes, sessionNumber, createdAt }
export async function apiCreateWorkout(token, payload) {
  const res = await safeFetch(`${API_BASE}/api/workouts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

// POST /api/workouts/previous-sets — batch lấy previous sets cho placeholder
// payload: { exerciseNames: string[] }
// trả về dict { "Planche Lean": [{setNumber, reps, holdSeconds, weight, weightRaw, rpe, inputType, raw}], ... }
// Mỗi exercise chỉ lấy sets của workout gần nhất chứa exercise đó
export async function apiGetPreviousSets(token, exerciseNames) {
  const names = Array.isArray(exerciseNames) ? exerciseNames.filter(Boolean) : [];
  if (names.length === 0) return {};
  const res = await safeFetch(`${API_BASE}/api/workouts/previous-sets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ exerciseNames: names }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

// GET /api/workouts/previous-sets?names=... — alias GET để test nhanh (dự phòng POST fail)
export async function apiGetPreviousSetsGet(token, exerciseNames) {
  const names = Array.isArray(exerciseNames) ? exerciseNames.filter(Boolean) : [];
  if (names.length === 0) return {};
  const q = encodeURIComponent(names.join(","));
  const res = await safeFetch(`${API_BASE}/api/workouts/previous-sets?names=${q}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

// GET /api/workouts — danh sách (chỉ dùng cho docs/test, chưa có UI)
export async function apiListWorkouts(token) {
  const res = await safeFetch(`${API_BASE}/api/workouts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

// GET /api/workouts/stats/summary — dashboard metrics (workout time & RPE thực từ table workouts)
export async function apiGetWorkoutStats(token) {
  const res = await safeFetch(`${API_BASE}/api/workouts/stats/summary`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

// GET /api/workouts/{id}
export async function apiGetWorkout(token, id) {
  const res = await safeFetch(`${API_BASE}/api/workouts/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}
