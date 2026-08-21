from calendar import monthrange
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from auth import get_current_user
from db import supabase_admin
from schemas import GoalCreate, GoalResponse

router = APIRouter(prefix="/api/goals", tags=["goals"])

TABLE = "goals"

METRIC_CATEGORY = {
    "seconds": "Time Skill",
    "weighted": "Strength",
    "reps": "Endurance",
}

METRIC_LABEL = {
    "seconds": "Second Hold",
    "weighted": "Weighted",
    "reps": "Reps",
}

METRIC_UNIT = {
    "seconds": "s",
    "weighted": "kg",
    "reps": "reps",
}


def _compute_deadline(time_amount: int, time_unit: str) -> str:
    """Tính deadline timestamptz từ now + interval, trả về ISO string UTC."""
    now = datetime.now(timezone.utc)
    if time_unit == "weeks":
        from datetime import timedelta

        deadline = now + timedelta(weeks=time_amount)
    else:  # months: cộng tháng lịch, xử lý cuối tháng
        year = now.year
        month = now.month + time_amount
        # chuẩn hoá year/month
        year += (month - 1) // 12
        month = (month - 1) % 12 + 1
        day = min(now.day, monthrange(year, month)[1])
        deadline = now.replace(year=year, month=month, day=day)
    return deadline.isoformat()


def _build_derived_fields(payload: GoalCreate) -> dict:
    metric_type = payload.metric_type.strip().lower()
    category = METRIC_CATEGORY.get(metric_type, "Time Skill")
    unit = METRIC_UNIT.get(metric_type, "")
    label = METRIC_LABEL.get(metric_type, "")
    # target dạng "10s Second Hold" / "20kg Weighted" / "15reps Reps"
    # metric_value có thể là float, hiển thị gọn (10.0 -> 10)
    mv = payload.metric_value
    mv_str = str(int(mv)) if float(mv).is_integer() else str(mv)
    unit_label = "reps" if unit == "reps" else unit
    target = f"{mv_str}{unit_label} {label.lower()}"
    deadline = _compute_deadline(payload.time_amount, payload.time_unit)
    return {
        "category": category,
        "target": target,
        "deadline": deadline,
        "status": "Starting",
        "progress": 0,
        "current": "Not started",
    }


@router.post("", response_model=GoalResponse, status_code=201)
def create_goal(payload: GoalCreate, current_user: dict = Depends(get_current_user)) -> dict:
    user_id = current_user["id"]

    derived = _build_derived_fields(payload)

    # Dev token – không có FK trong auth.users, trả mock để không block UI test
    if user_id == "dev-user":
        import uuid

        return {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "title": payload.title.strip(),
            "metric_type": payload.metric_type.strip().lower(),
            "metric_value": float(payload.metric_value),
            "time_amount": int(payload.time_amount),
            "time_unit": payload.time_unit.strip().lower(),
            "category": derived["category"],
            "status": derived["status"],
            "progress": derived["progress"],
            "current": derived["current"],
            "target": derived["target"],
            "deadline": derived["deadline"],
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

    row = {
        "user_id": user_id,
        "title": payload.title.strip(),
        "metric_type": payload.metric_type.strip().lower(),
        "metric_value": float(payload.metric_value),
        "time_amount": int(payload.time_amount),
        "time_unit": payload.time_unit.strip().lower(),
        "deadline": derived["deadline"],
        "category": derived["category"],
        "status": derived["status"],
        "progress": derived["progress"],
        "current": derived["current"],
        "target": derived["target"],
    }

    try:
        data = supabase_admin.table(TABLE).insert(row).execute()
    except Exception as e:
        msg = str(e)
        if "PGRST205" in msg or "schema cache" in msg:
            raise HTTPException(
                status_code=503,
                detail="Table 'goals' not found. Please run migration 007_create_goals.sql in Supabase Dashboard > SQL Editor.",
            )
        raise HTTPException(status_code=500, detail=f"Failed to save goal: {e}")

    if not data.data:
        raise HTTPException(status_code=500, detail="Failed to save goal")

    return data.data[0]


@router.get("", response_model=list[GoalResponse])
def list_goals(current_user: dict = Depends(get_current_user)) -> list[dict]:
    if current_user["id"] == "dev-user":
        return []
    try:
        data = (
            supabase_admin.table(TABLE)
            .select("*")
            .eq("user_id", current_user["id"])
            .order("created_at", desc=True)
            .execute()
        )
    except Exception as e:
        msg = str(e)
        if "PGRST205" in msg or "goals" in msg and "schema cache" in msg:
            raise HTTPException(
                status_code=503,
                detail="Table 'goals' not found. Please run migration 007_create_goals.sql in Supabase Dashboard > SQL Editor.",
            )
        raise HTTPException(status_code=500, detail=f"Failed to list goals: {e}")
    return data.data or []


@router.get("/{goal_id}", response_model=GoalResponse)
def get_goal(goal_id: str, current_user: dict = Depends(get_current_user)) -> dict:
    if current_user["id"] == "dev-user":
        raise HTTPException(status_code=404, detail="Goal not found")
    try:
        data = (
            supabase_admin.table(TABLE)
            .select("*")
            .eq("id", goal_id)
            .eq("user_id", current_user["id"])
            .execute()
        )
    except Exception as e:
        msg = str(e)
        if "PGRST205" in msg:
            raise HTTPException(
                status_code=503,
                detail="Table 'goals' not found. Please run migration 007_create_goals.sql.",
            )
        raise HTTPException(status_code=500, detail=f"Failed to get goal: {e}")
    if not data.data:
        raise HTTPException(status_code=404, detail="Goal not found")
    return data.data[0]
