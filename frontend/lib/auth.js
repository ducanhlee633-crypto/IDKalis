export const API_BASE = "http://localhost:8000";

const TOKEN_KEY = "idk_access_token";
const USER_KEY = "idk_user";

export function getStoredSession() {
  if (typeof window === "undefined") return null;
  try {
    const token = window.localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    const userRaw = window.localStorage.getItem(USER_KEY);
    return { token, user: userRaw ? JSON.parse(userRaw) : null };
  } catch {
    return null;
  }
}

export function storeSession(token, user) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

async function parseError(res) {
  try {
    const data = await res.json();
    return data.detail || `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

// POST /token — login with email or username (OAuth2 form data)
export async function apiLogin(identifier, password) {
  const res = await fetch(`${API_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username: identifier, password }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

// POST /register — create account (returns user, no token until email verified)
export async function apiRegister({ username, email, password }) {
  const res = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

// GET /me — validate stored token and fetch fresh user profile
export async function apiGetMe(token) {
  const res = await fetch(`${API_BASE}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}