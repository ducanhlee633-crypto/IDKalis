import { API_BASE } from "./auth";

async function parseError(res) {
  try {
    const data = await res.json();
    return data.detail || `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

// GET /api/exercises — public, no auth needed
// params: { movementType?: string, search?: string }
export async function apiListExercises({ movementType, search } = {}) {
  const url = new URL(`${API_BASE}/api/exercises`);
  if (movementType && movementType !== "ALL") {
    url.searchParams.set("movement_type", movementType);
  }
  if (search) {
    url.searchParams.set("search", search);
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function apiGetExercise(id) {
  const res = await fetch(`${API_BASE}/api/exercises/${id}`);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function apiCreateExercise(payload) {
  const res = await fetch(`${API_BASE}/api/exercises`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}
