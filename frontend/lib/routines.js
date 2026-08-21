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
    // Network / CORS / backend down
    const msg = err?.message || String(err);
    if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("CORS")) {
      throw new Error(
        `Không kết nối được backend (${url}). Kiểm tra backend đang chạy ở ${API_BASE} và CORS đã cấu hình. Chi tiết: ${msg}`
      );
    }
    throw err;
  }
}

// POST /api/routines — tạo routine (bắt buộc login, FK tới users)
// payload: { name, category, exercises, note, timeEst } (camelCase, exercises gồm reps/sets)
// trả về RoutineResponse { id, userId, name, category, exercises, note, timeEst, createdAt }
export async function apiCreateRoutine(token, payload) {
  const res = await safeFetch(`${API_BASE}/api/routines`, {
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

// GET /api/routines — danh sách routines của user hiện tại
export async function apiListRoutines(token) {
  const res = await safeFetch(`${API_BASE}/api/routines`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

// GET /api/routines/{id}
export async function apiGetRoutine(token, id) {
  const res = await safeFetch(`${API_BASE}/api/routines/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

// DELETE /api/routines/{id}
export async function apiDeleteRoutine(token, id) {
  const res = await safeFetch(`${API_BASE}/api/routines/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await parseError(res));
  return true;
}

// PUT /api/routines/{id} — cập nhật routine
export async function apiUpdateRoutine(token, id, payload) {
  const res = await safeFetch(`${API_BASE}/api/routines/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}
