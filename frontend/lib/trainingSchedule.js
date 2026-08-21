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
    const res = await fetch(url, options);
    return res;
  } catch (err) {
    const msg = err?.message || String(err);
    if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("CORS")) {
      throw new Error(
        `Không kết nối được backend (${url}). Kiểm tra backend đang chạy ở ${API_BASE} và CORS đã cấu hình. Chi tiết: ${msg}`
      );
    }
    throw err;
  }
}

// GET /api/training-schedule — lấy lịch 7 ngày của user hiện tại (0=Mon..6=Sun)
// trả về: [{ id, userId, dayOfWeek, routineId, routine, createdAt, updatedAt }, ...]
export async function apiListTrainingSchedule(token) {
  const res = await safeFetch(`${API_BASE}/api/training-schedule`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

// PUT /api/training-schedule/{dayOfWeek} — cập nhật 1 ngày (auto-save, PATCH từng ngày)
// routineId: string | null (null = Rest Day)
export async function apiUpdateTrainingScheduleDay(token, dayOfWeek, routineId) {
  const res = await safeFetch(`${API_BASE}/api/training-schedule/${dayOfWeek}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ routineId: routineId ?? null }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

// PUT /api/training-schedule — bulk update cả tuần (nếu cần Save All)
// schedules: [{dayOfWeek: 0-6, routineId: string|null}, ...]
export async function apiBulkUpdateTrainingSchedule(token, schedules) {
  const res = await safeFetch(`${API_BASE}/api/training-schedule`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ schedules }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}
