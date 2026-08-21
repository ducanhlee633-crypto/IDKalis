from fastapi import APIRouter, Depends, HTTPException

from auth import get_current_user
from db import supabase_admin
from schemas import RoutineCreate, RoutineResponse

router = APIRouter(prefix="/api/routines", tags=["routines"])

TABLE = "routines"


@router.post("", response_model=RoutineResponse, status_code=201)
def create_routine(payload: RoutineCreate, current_user: dict = Depends(get_current_user)) -> dict:
    user_id = current_user["id"]

    # Dev token – không có FK trong auth.users, trả mock để không block UI test
    if user_id == "dev-user":
        import uuid
        from datetime import datetime, timezone

        return {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "name": payload.name.strip(),
            "category": payload.category.strip().upper(),
            "exercises": payload.exercises or [],
            "note": (payload.note or "").strip(),
            "time_est": int(payload.time_est),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

    row = {
        "user_id": user_id,
        "name": payload.name.strip(),
        "category": payload.category.strip().upper(),
        "exercises": payload.exercises or [],
        "note": (payload.note or "").strip(),
        "time_est": int(payload.time_est),
    }

    try:
        data = supabase_admin.table(TABLE).insert(row).execute()
    except Exception as e:
        msg = str(e)
        if "PGRST205" in msg or "schema cache" in msg:
            raise HTTPException(
                status_code=503,
                detail="Table 'routines' not found. Please run migration 006_create_routines.sql in Supabase Dashboard > SQL Editor.",
            )
        raise HTTPException(status_code=500, detail=f"Failed to save routine: {e}")

    if not data.data:
        raise HTTPException(status_code=500, detail="Failed to save routine")

    return data.data[0]


@router.get("", response_model=list[RoutineResponse])
def list_routines(current_user: dict = Depends(get_current_user)) -> list[dict]:
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
        if "PGRST205" in msg or "routines" in msg and "schema cache" in msg:
            raise HTTPException(
                status_code=503,
                detail="Table 'routines' not found. Please run migration 006_create_routines.sql in Supabase Dashboard > SQL Editor.",
            )
        raise HTTPException(status_code=500, detail=f"Failed to list routines: {e}")
    return data.data or []


@router.get("/{routine_id}", response_model=RoutineResponse)
def get_routine(routine_id: str, current_user: dict = Depends(get_current_user)) -> dict:
    if current_user["id"] == "dev-user":
        raise HTTPException(status_code=404, detail="Routine not found")
    try:
        data = (
            supabase_admin.table(TABLE)
            .select("*")
            .eq("id", routine_id)
            .eq("user_id", current_user["id"])
            .execute()
        )
    except Exception as e:
        msg = str(e)
        if "PGRST205" in msg:
            raise HTTPException(
                status_code=503,
                detail="Table 'routines' not found. Please run migration 006_create_routines.sql.",
            )
        raise HTTPException(status_code=500, detail=f"Failed to get routine: {e}")
    if not data.data:
        raise HTTPException(status_code=404, detail="Routine not found")
    return data.data[0]


@router.delete("/{routine_id}", status_code=204)
def delete_routine(routine_id: str, current_user: dict = Depends(get_current_user)) -> None:
    if current_user["id"] == "dev-user":
        return None
    try:
        existing = (
            supabase_admin.table(TABLE)
            .select("id")
            .eq("id", routine_id)
            .eq("user_id", current_user["id"])
            .execute()
        )
    except Exception as e:
        msg = str(e)
        if "PGRST205" in msg:
            raise HTTPException(status_code=503, detail="Table 'routines' not found.")
        raise HTTPException(status_code=500, detail=f"Failed to check routine: {e}")
    if not existing.data:
        raise HTTPException(status_code=404, detail="Routine not found")
    try:
        supabase_admin.table(TABLE).delete().eq("id", routine_id).eq("user_id", current_user["id"]).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete routine: {e}")
    return None


@router.put("/{routine_id}", response_model=RoutineResponse)
def update_routine(routine_id: str, payload: RoutineCreate, current_user: dict = Depends(get_current_user)) -> dict:
    if current_user["id"] == "dev-user":
        import uuid
        from datetime import datetime, timezone

        return {
            "id": routine_id,
            "user_id": current_user["id"],
            "name": payload.name.strip(),
            "category": payload.category.strip().upper(),
            "exercises": payload.exercises or [],
            "note": (payload.note or "").strip(),
            "time_est": int(payload.time_est),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

    try:
        existing = (
            supabase_admin.table(TABLE)
            .select("id")
            .eq("id", routine_id)
            .eq("user_id", current_user["id"])
            .execute()
        )
    except Exception as e:
        msg = str(e)
        if "PGRST205" in msg:
            raise HTTPException(status_code=503, detail="Table 'routines' not found.")
        raise HTTPException(status_code=500, detail=f"Failed to check routine: {e}")
    if not existing.data:
        raise HTTPException(status_code=404, detail="Routine not found")

    row = {
        "name": payload.name.strip(),
        "category": payload.category.strip().upper(),
        "exercises": payload.exercises or [],
        "note": (payload.note or "").strip(),
        "time_est": int(payload.time_est),
    }

    try:
        data = supabase_admin.table(TABLE).update(row).eq("id", routine_id).eq("user_id", current_user["id"]).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update routine: {e}")

    if not data.data:
        raise HTTPException(status_code=500, detail="Failed to update routine")

    return data.data[0]
