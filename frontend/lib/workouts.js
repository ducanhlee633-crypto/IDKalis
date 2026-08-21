import { API_BASE } from "./auth";

async function parseError(res) {
  try {
    const data = await res.json();
    return data.detail || `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

// POST /api/workouts — lưu buổi tập (bắt buộc login, FK tới users)
// payload: { name, completedSets, avgRpe, durationMinutes } (camelCase)
// trả về WorkoutResponse { id, userId, name, completedSets, avgRpe, durationMinutes, sessionNumber, createdAt }
export async function apiCreateWorkout(token, payload) {
  const res = await fetch(`${API_BASE}/api/workouts`, {
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

// GET /api/workouts — danh sách (chỉ dùng cho docs/test, chưa có UI)
export async function apiListWorkouts(token) {
  const res = await fetch(`${API_BASE}/api/workouts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

// GET /api/workouts/{id}
export async function apiGetWorkout(token, id) {
  const res = await fetch(`${API_BASE}/api/workouts/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}
