from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings

from routers import auth, dashboard, exercises, goals, routines, training_schedule, workouts

# Entry point của backend: chạy bằng `uv run uvicorn main:app --reload --port 8000`
app = FastAPI(title="Calisthenics API", version="0.1.0")

# CORS: cho phép frontend Next.js gọi API từ trình duyệt
# Hợp nhất localhost (luôn cho phép local dev) + env CORS_ORIGINS (production Vercel URLs)
# Ví dụ production: CORS_ORIGINS=https://your-app.vercel.app,https://your-app-abc123.vercel.app
def _cors_origins() -> list[str]:
    # Luôn cho phép local dev - dùng cả khi deploy để local frontend vẫn gọi được Render backend
    dev_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
    raw = (settings.cors_origins or "").strip()
    if raw:
        env_origins = [o.strip().rstrip("/") for o in raw.split(",") if o.strip()]
        # merge + dedup, giữ dev_origins luôn có
        seen = set()
        merged = []
        for o in dev_origins + env_origins:
            if o not in seen:
                seen.add(o)
                merged.append(o)
        if merged:
            return merged
    return dev_origins


# Cho phép vercel preview deployments và production: https://*.vercel.app
# Kết hợp với allow_origins ở trên để cover cả custom domain (qua CORS_ORIGINS) + preview
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

# Gắn router training-schedule (các endpoint /api/training-schedule) vào app — bắt buộc login, FK tới routines, per-user RLS
app.include_router(training_schedule.router)

# Gắn router dashboard (muscle focus breakdown từ exercise_progress)
app.include_router(dashboard.router)


# Endpoint kiểm tra sức khỏe: GET http://localhost:8000/
@app.get("/")
def root() -> dict:
    return {"status": "ok", "service": "calisthenics-api"}