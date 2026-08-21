from fastapi import APIRouter, Depends, HTTPException

from auth import get_current_user
from db import supabase_admin
from schemas import WorkoutCreate, WorkoutResponse

router = APIRouter(prefix="/api/workouts", tags=["workouts"])

TABLE = "workouts"


def _next_session_number(user_id: str) -> int:
    """Per-user auto-increment: max(session_number) + 1."""
    try:
        data = (
            supabase_admin.table(TABLE)
            .select("session_number")
            .eq("user_id", user_id)
            .order("session_number", desc=True)
            .limit(1)
            .execute()
        )
        if data.data:
            return int(data.data[0]["session_number"]) + 1
        return 1
    except Exception:
        return 1


@router.post("", response_model=WorkoutResponse, status_code=201)
def create_workout(payload: WorkoutCreate, current_user: dict = Depends(get_current_user)) -> dict:
    user_id = current_user["id"]

    # Dev token – không có FK trong auth.users, trả mock để không block UI test
    if user_id == "dev-user":
        import uuid
        from datetime import datetime, timezone

        return {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "name": payload.name.strip(),
            "completed_sets": payload.completed_sets,
            "avg_rpe": round(float(payload.avg_rpe), 1) if payload.avg_rpe is not None else None,
            "session_number": 1,
            "duration_minutes": payload.duration_minutes,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

    session_number = _next_session_number(user_id)
    avg_rpe = round(float(payload.avg_rpe), 1) if payload.avg_rpe is not None else None

    row = {
        "user_id": user_id,
        "name": payload.name.strip(),
        "completed_sets": payload.completed_sets,
        "avg_rpe": avg_rpe,
        "session_number": session_number,
        "duration_minutes": payload.duration_minutes,
    }

    try:
        data = supabase_admin.table(TABLE).insert(row).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save workout: {e}")

    if not data.data:
        raise HTTPException(status_code=500, detail="Failed to save workout")

    return data.data[0]


@router.get("", response_model=list[WorkoutResponse])
def list_workouts(current_user: dict = Depends(get_current_user)) -> list[dict]:
    if current_user["id"] == "dev-user":
        return []
    data = (
        supabase_admin.table(TABLE)
        .select("*")
        .eq("user_id", current_user["id"])
        .order("session_number", desc=True)
        .execute()
    )
    return data.data or []


@router.get("/{workout_id}", response_model=WorkoutResponse)
def get_workout(workout_id: str, current_user: dict = Depends(get_current_user)) -> dict:
    if current_user["id"] == "dev-user":
        raise HTTPException(status_code=404, detail="Workout not found")
    data = (
        supabase_admin.table(TABLE)
        .select("*")
        .eq("id", workout_id)
        .eq("user_id", current_user["id"])
        .execute()
    )
    if not data.data:
        raise HTTPException(status_code=404, detail="Workout not found")
    return data.data[0]
