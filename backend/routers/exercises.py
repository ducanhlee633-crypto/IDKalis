from fastapi import APIRouter, HTTPException, Query

from db import supabase
from schemas import ExerciseCreate, ExerciseResponse

# Router bài tập: tất cả endpoint đều có prefix /api/exercises
router = APIRouter(prefix="/api/exercises", tags=["exercises"])

TABLE = "exercises"


# GET /api/exercises — lấy danh sách bài tập (sắp xếp theo tên, có thể lọc theo movement_type hoặc search)
@router.get("", response_model=list[ExerciseResponse])
def list_exercises(
    movement_type: str | None = Query(default=None, description="Filter by PUSH/PULL/LEGS/CORE"),
    search: str | None = Query(default=None),
) -> list[dict]:
    query = supabase.table(TABLE).select("*").order("name")

    if movement_type:
        query = query.eq("movement_type", movement_type)
    if search:
        query = query.ilike("name", f"%{search}%")

    data = query.execute()
    return data.data


# GET /api/exercises/{id} — lấy 1 bài tập theo id (404 nếu không tồn tại)
@router.get("/{exercise_id}", response_model=ExerciseResponse)
def get_exercise(exercise_id: str) -> dict:
    data = supabase.table(TABLE).select("*").eq("id", exercise_id).execute()
    if not data.data:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return data.data[0]


# POST /api/exercises — tạo bài tập mới từ payload (camelCase từ frontend, chuyển về snake_case khi insert)
@router.post("", response_model=ExerciseResponse, status_code=201)
def create_exercise(payload: ExerciseCreate) -> dict:
    row = payload.model_dump(by_alias=False)
    data = supabase.table(TABLE).insert(row).execute()
    if not data.data:
        raise HTTPException(status_code=500, detail="Failed to insert exercise")
    return data.data[0]