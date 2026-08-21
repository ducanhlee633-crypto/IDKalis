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

// POST /api/goals — tạo goal (bắt buộc login, FK tới auth.users)
// payload: { title, metricType, metricValue, timeAmount, timeUnit } (camelCase)
// trả về GoalResponse { id, userId, title, metricType, metricValue, timeAmount, timeUnit, category, status, progress, current, target, deadline, createdAt }
export async function apiCreateGoal(token, payload) {
  const res = await safeFetch(`${API_BASE}/api/goals`, {
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

// GET /api/goals — danh sách goals của user hiện tại
export async function apiListGoals(token) {
  const res = await safeFetch(`${API_BASE}/api/goals`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

// GET /api/goals/{id}
export async function apiGetGoal(token, id) {
  const res = await safeFetch(`${API_BASE}/api/goals/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}
