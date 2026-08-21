from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings

from routers import auth, exercises, goals, routines, workouts

# Entry point của backend: chạy bằng `uv run uvicorn main:app --reload --port 8000`
app = FastAPI(title="Calisthenics API", version="0.1.0")

# CORS: cho phép frontend Next.js gọi API từ trình duyệt
# Đọc từ env CORS_ORIGINS (comma-separated). Fallback localhost cho dev.
# Ví dụ production: CORS_ORIGINS=https://your-app.vercel.app,https://your-app-abc123.vercel.app
def _cors_origins() -> list[str]:
    raw = (settings.cors_origins or "").strip()
    if raw:
        origins = [o.strip().rstrip("/") for o in raw.split(",") if o.strip()]
        if origins:
            return origins
    # dev fallback
    return ["http://localhost:3000", "http://127.0.0.1:3000"]


# Cho phép vercel preview deployments: https://*.vercel.app
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gắn router bài tập (các endpoint /api/exercises) vào app
app.include_router(exercises.router)

# Gắn router auth (các endpoint /register, /token, /me) vào app
app.include_router(auth.router)

# Gắn router workouts (các endpoint /api/workouts) vào app — bắt buộc login, FK tới users
app.include_router(workouts.router)

# Gắn router routines (các endpoint /api/routines) vào app — bắt buộc login, FK tới users, exercises jsonb
app.include_router(routines.router)

# Gắn router goals (các endpoint /api/goals) vào app — bắt buộc login, FK tới auth.users, per-user RLS
app.include_router(goals.router)


# Endpoint kiểm tra sức khỏe: GET http://localhost:8000/
@app.get("/")
def root() -> dict:
    return {"status": "ok", "service": "calisthenics-api"}