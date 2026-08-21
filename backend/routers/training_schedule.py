from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from auth import get_current_user
from db import supabase_admin
from schemas import TrainingScheduleResponse, TrainingScheduleUpdate

router = APIRouter(prefix="/api/training-schedule", tags=["training-schedule"])

TABLE = "training_schedules"
ROUTINES_TABLE = "routines"

# In-memory mock cho dev-user (không có FK auth.users)
_DEV_SCHEDULES: dict[int, str | None] = {i: None for i in range(7)}

DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def _is_dev_user(user_id: str) -> bool:
    return user_id == "dev-user"


def _mock_schedules_for_dev() -> list[dict[str, Any]]:
    now = datetime.now(timezone.utc).isoformat()
    return [
        {
            "id": f"dev-schedule-{d}",
            "user_id": "dev-user",
            "day_of_week": d,
            "routine_id": _DEV_SCHEDULES.get(d),
            "routine": None,
            "created_at": now,
            "updated_at": now,
        }
        for d in range(7)
    ]


def _enrich_with_routines(schedules: list[dict], user_id: str) -> list[dict]:
    """Enrich schedules với routine object (nếu routine_id != null)."""
    if not schedules:
        return schedules
    routine_ids = [s["routine_id"] for s in schedules if s.get("routine_id")]
    if not routine_ids:
        for s in schedules:
            s["routine"] = None
        return schedules
    try:
        data = (
            supabase_admin.table(ROUTINES_TABLE)
            .select("*")
            .eq("user_id", user_id)
            .in_("id", routine_ids)
            .execute()
        )
        routines_by_id = {r["id"]: r for r in (data.data or [])}
    except Exception:
        routines_by_id = {}
    for s in schedules:
        rid = s.get("routine_id")
        s["routine"] = routines_by_id.get(rid) if rid else None
    return schedules


def _ensure_7_days(user_id: str, existing: list[dict]) -> list[dict]:
    """Đảm bảo luôn trả đủ 7 ngày 0-6, thiếu ngày nào trả routine_id=None (không auto-insert DB)."""
    by_day = {int(r["day_of_week"]): r for r in existing}
    result: list[dict] = []
    now = datetime.now(timezone.utc).isoformat()
    for d in range(7):
        if d in by_day:
            result.append(by_day[d])
        else:
            result.append(
                {
                    "id": f"pending-{user_id}-{d}",
                    "user_id": user_id,
                    "day_of_week": d,
                    "routine_id": None,
                    "routine": None,
                    "created_at": None,
                    "updated_at": None,
                }
            )
    return sorted(result, key=lambda x: x["day_of_week"])


@router.get("", response_model=list[TrainingScheduleResponse])
def list_training_schedule(current_user: dict = Depends(get_current_user)) -> list[dict]:
    user_id = current_user["id"]
    if _is_dev_user(user_id):
        return _mock_schedules_for_dev()

    try:
        data = (
            supabase_admin.table(TABLE)
            .select("*")
            .eq("user_id", user_id)
            .order("day_of_week", desc=False)
            .execute()
        )
    except Exception as e:
        msg = str(e)
        if "PGRST205" in msg or "schema cache" in msg:
            raise HTTPException(
                status_code=503,
                detail="Table 'training_schedules' not found. Please run migration 008_create_training_schedules.sql in Supabase Dashboard > SQL Editor.",
            )
        raise HTTPException(status_code=500, detail=f"Failed to list training schedule: {e}")

    rows = data.data or []
    rows = _ensure_7_days(user_id, rows)
    rows = _enrich_with_routines(rows, user_id)
    return rows


@router.put("/{day_of_week}", response_model=TrainingScheduleResponse)
def update_training_schedule_day(
    day_of_week: int,
    payload: TrainingScheduleUpdate,
    current_user: dict = Depends(get_current_user),
) -> dict:
    if day_of_week < 0 or day_of_week > 6:
        raise HTTPException(status_code=422, detail="day_of_week must be between 0 and 6 (0=Mon..6=Sun)")

    user_id = current_user["id"]
    routine_id = payload.routine_id
    # normalize empty string -> None
    if routine_id is not None:
        routine_id = routine_id.strip() if isinstance(routine_id, str) else routine_id
        if routine_id == "":
            routine_id = None

    # Validate routine belongs to user if not null
    if routine_id is not None:
        if _is_dev_user(user_id):
            # dev-user: allow any routine_id (mock), nhưng vẫn cập nhật mock
            _DEV_SCHEDULES[day_of_week] = routine_id
            now = datetime.now(timezone.utc).isoformat()
            return {
                "id": f"dev-schedule-{day_of_week}",
                "user_id": user_id,
                "day_of_week": day_of_week,
                "routine_id": routine_id,
                "routine": None,
                "created_at": now,
                "updated_at": now,
            }
        try:
            exists = (
                supabase_admin.table(ROUTINES_TABLE)
                .select("id")
                .eq("id", routine_id)
                .eq("user_id", user_id)
                .execute()
            )
        except Exception as e:
            msg = str(e)
            if "PGRST205" in msg:
                raise HTTPException(status_code=503, detail="Table 'routines' not found.")
            raise HTTPException(status_code=500, detail=f"Failed to validate routine: {e}")
        if not exists.data:
            raise HTTPException(status_code=404, detail="Routine not found or not owned by user")

    if _is_dev_user(user_id):
        _DEV_SCHEDULES[day_of_week] = routine_id
        now = datetime.now(timezone.utc).isoformat()
        return {
            "id": f"dev-schedule-{day_of_week}",
            "user_id": user_id,
            "day_of_week": day_of_week,
            "routine_id": routine_id,
            "routine": None,
            "created_at": now,
            "updated_at": now,
        }

    # Upsert logic: check existing row for this user+day
    try:
        existing = (
            supabase_admin.table(TABLE)
            .select("*")
            .eq("user_id", user_id)
            .eq("day_of_week", day_of_week)
            .execute()
        )
    except Exception as e:
        msg = str(e)
        if "PGRST205" in msg or "schema cache" in msg:
            raise HTTPException(
                status_code=503,
                detail="Table 'training_schedules' not found. Please run migration 008_create_training_schedules.sql.",
            )
        raise HTTPException(status_code=500, detail=f"Failed to check training schedule: {e}")

    try:
        if existing.data:
            row_id = existing.data[0]["id"]
            data = (
                supabase_admin.table(TABLE)
                .update({"routine_id": routine_id})
                .eq("id", row_id)
                .eq("user_id", user_id)
                .execute()
            )
            if not data.data:
                raise HTTPException(status_code=500, detail="Failed to update training schedule")
            row = data.data[0]
        else:
            data = (
                supabase_admin.table(TABLE)
                .insert({"user_id": user_id, "day_of_week": day_of_week, "routine_id": routine_id})
                .execute()
            )
            if not data.data:
                raise HTTPException(status_code=500, detail="Failed to create training schedule")
            row = data.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save training schedule: {e}")

    # enrich routine
    row["routine"] = None
    if row.get("routine_id"):
        try:
            rdata = (
                supabase_admin.table(ROUTINES_TABLE)
                .select("*")
                .eq("id", row["routine_id"])
                .eq("user_id", user_id)
                .execute()
            )
            if rdata.data:
                row["routine"] = rdata.data[0]
        except Exception:
            pass
    return row


@router.put("", response_model=list[TrainingScheduleResponse])
def bulk_update_training_schedule(
    payload: dict,
    current_user: dict = Depends(get_current_user),
) -> list[dict]:
    """Bulk update cả tuần: body { schedules: [{dayOfWeek, routineId}] } — dùng cho Save cả tuần nếu cần."""
    user_id = current_user["id"]
    schedules = payload.get("schedules") if isinstance(payload, dict) else None
    if schedules is None:
        # fallback: payload có thể là list trực tiếp
        schedules = payload if isinstance(payload, list) else None
    if not isinstance(schedules, list):
        raise HTTPException(status_code=422, detail="Body must contain 'schedules' array of {dayOfWeek, routineId}")

    # Validate từng entry
    normalized: list[tuple[int, str | None]] = []
    for item in schedules:
        if not isinstance(item, dict):
            raise HTTPException(status_code=422, detail="Each schedule must be an object")
        dow = item.get("dayOfWeek", item.get("day_of_week", item.get("day")))
        rid = item.get("routineId", item.get("routine_id"))
        if dow is None:
            raise HTTPException(status_code=422, detail="Each schedule requires dayOfWeek (0-6)")
        try:
            dow = int(dow)
        except Exception:
            raise HTTPException(status_code=422, detail="dayOfWeek must be int 0-6")
        if dow < 0 or dow > 6:
            raise HTTPException(status_code=422, detail="dayOfWeek must be between 0 and 6")
        if isinstance(rid, str):
            rid = rid.strip()
            if rid == "":
                rid = None
        elif rid is not None:
            rid = str(rid)
        normalized.append((dow, rid))

    # Validate routine ownership for non-null ids
    routine_ids_to_check = [rid for _, rid in normalized if rid is not None]
    if routine_ids_to_check and not _is_dev_user(user_id):
        try:
            data = (
                supabase_admin.table(ROUTINES_TABLE)
                .select("id")
                .eq("user_id", user_id)
                .in_("id", routine_ids_to_check)
                .execute()
            )
            found = {r["id"] for r in (data.data or [])}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to validate routines: {e}")
        for _, rid in normalized:
            if rid is not None and rid not in found:
                raise HTTPException(status_code=404, detail=f"Routine not found or not owned: {rid}")

    if _is_dev_user(user_id):
        for dow, rid in normalized:
            _DEV_SCHEDULES[dow] = rid
        return _mock_schedules_for_dev()

    # Upsert từng ngày
    for dow, rid in normalized:
        try:
            existing = (
                supabase_admin.table(TABLE)
                .select("id")
                .eq("user_id", user_id)
                .eq("day_of_week", dow)
                .execute()
            )
            if existing.data:
                supabase_admin.table(TABLE).update({"routine_id": rid}).eq("id", existing.data[0]["id"]).execute()
            else:
                supabase_admin.table(TABLE).insert({"user_id": user_id, "day_of_week": dow, "routine_id": rid}).execute()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to bulk update day {dow}: {e}")

    # Return updated list
    return list_training_schedule(current_user)
