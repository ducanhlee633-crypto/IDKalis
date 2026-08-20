from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import auth, exercises

# Entry point của backend: chạy bằng `uv run uvicorn main:app --reload --port 8000`
app = FastAPI(title="Calisthenics API", version="0.1.0")

# CORS: cho phép frontend Next.js (localhost:3000) gọi API từ trình duyệt
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gắn router bài tập (các endpoint /api/exercises) vào app
app.include_router(exercises.router)

# Gắn router auth (các endpoint /register, /token, /me) vào app
app.include_router(auth.router)


# Endpoint kiểm tra sức khỏe: GET http://localhost:8000/
@app.get("/")
def root() -> dict:
    return {"status": "ok", "service": "calisthenics-api"}