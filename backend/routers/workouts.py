import uuid as _uuid
from fastapi import APIRouter, Body, Depends, HTTPException, Query

from auth import get_current_user
from db import supabase_admin
from schemas import WorkoutCreate, WorkoutResponse

router = APIRouter(prefix="/api/workouts", tags=["workouts"])

TABLE = "workouts"
EXERCISE_PROGRESS_TABLE = "exercise_progress"


def _is_valid_uuid(value: str | None) -> bool:
    if not value or not isinstance(value, str):
        return False
    if value.startswith("cx-"):
        return False
    try:
        _uuid.UUID(value)
        return True
    except Exception:
        return False


def _parse_exercises_to_rows(user_id: str, workout_id: str, exercises_payload) -> list[dict]:
    """Flatten payload.exercises -> rows for exercise_progress (only done=true)."""
    if not exercises_payload or not isinstance(exercises_payload, list):
        return []
    rows: list[dict] = []
    # per-exercise counter for set_number (sequential among done sets)
    counters: dict[str, int] = {}
    for ex in exercises_payload:
        if not isinstance(ex, dict):
            continue
        ex_id_raw = ex.get("exerciseId") or ex.get("exercise_id") or ex.get("id")
        ex_name = ex.get("exerciseName") or ex.get("exercise_name") or ex.get("name")
        if not ex_name or not str(ex_name).strip():
            continue
        ex_name = str(ex_name).strip()
        input_type_raw = ex.get("inputType") or ex.get("input_type") or "note"
        input_type = str(input_type_raw).strip().lower()
        if input_type not in {"time", "weight", "note", "reps_time"}:
            input_type = "note"
        ex_id = ex_id_raw if _is_valid_uuid(ex_id_raw) else None
        # muscleGroups for custom cx- routines (fallback when exercises table has no entry)
        muscle_groups = (
            ex.get("muscleGroups")
            or ex.get("muscle_groups")
            or ex.get("muscle_groups_list")
            or ex.get("primaryMuscles")
            or ex.get("primary_muscles")
            or []
        )
        if isinstance(muscle_groups, str):
            muscle_groups = [muscle_groups]
        if not isinstance(muscle_groups, list):
            muscle_groups = []
        # also capture secondary if split provided
        secondary_groups = ex.get("secondaryMuscles") or ex.get("secondary_muscles") or []
        if isinstance(secondary_groups, str):
            secondary_groups = [secondary_groups]
        if not isinstance(secondary_groups, list):
            secondary_groups = []
        sets_list = ex.get("sets") or ex.get("defaultSets") or ex.get("default_sets") or []
        if not isinstance(sets_list, list):
            continue
        # init counter for this exercise
        if ex_name not in counters:
            counters[ex_name] = 1
        for s in sets_list:
            if not isinstance(s, dict):
                continue
            done = s.get("done")
            # Only persist done=true sets (yêu cầu user)
            if done is not True:
                # handle string "true" edge
                if str(done).lower() != "true":
                    continue
            reps_raw = s.get("reps")
            time_raw = s.get("time")
            weight_raw_val = s.get("weight")
            rpe_raw = s.get("rpe")

            reps = None
            if reps_raw is not None and str(reps_raw).strip() not in ("", "-", "–"):
                try:
                    reps = int(float(str(reps_raw).strip()))
                    if reps < 0:
                        reps = None
                except Exception:
                    reps = None

            hold_seconds = None
            if time_raw is not None and str(time_raw).strip() not in ("", "-", "–"):
                try:
                    t_str = str(time_raw).strip().replace("s", "").replace("S", "")
                    hold_seconds = int(float(t_str))
                    if hold_seconds < 0:
                        hold_seconds = None
                except Exception:
                    hold_seconds = None

            weight = None
            weight_raw_str = None
            if weight_raw_val is not None and str(weight_raw_val).strip() not in ("", "-", "–"):
                weight_raw_str = str(weight_raw_val).strip()
                try:
                    w_clean = weight_raw_str.replace("+", "").strip()
                    weight = float(w_clean)
                    if weight < 0:
                        weight = None
                except Exception:
                    weight = None

            rpe = None
            if rpe_raw is not None and str(rpe_raw).strip() not in ("", "-", "–"):
                try:
                    rpe = round(float(str(rpe_raw).replace(",", ".")), 1)
                    if rpe < 0 or rpe > 10:
                        rpe = None
                except Exception:
                    rpe = None

            raw = {k: v for k, v in s.items()}
            # embed exercise muscle info for dashboard fallback (custom cx- exercises)
            if muscle_groups:
                raw["_muscleGroups"] = muscle_groups
            if secondary_groups:
                raw["_secondaryMuscleGroups"] = secondary_groups
            set_number = counters[ex_name]
            counters[ex_name] += 1

            rows.append(
                {
                    "user_id": user_id,
                    "workout_id": workout_id,
                    "exercise_id": ex_id,
                    "exercise_name": ex_name,
                    "input_type": input_type,
                    "set_number": set_number,
                    "reps": reps,
                    "hold_seconds": hold_seconds,
                    "weight": weight,
                    "weight_raw": weight_raw_str,
                    "rpe": rpe,
                    "raw": raw,
                }
            )
    return rows


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

    workout_row = data.data[0]
    workout_id = workout_row["id"]

    # Lưu per-set progress vào exercise_progress (chỉ done=true)
    try:
        progress_rows = _parse_exercises_to_rows(user_id, workout_id, payload.exercises)
        if progress_rows:
            try:
                supabase_admin.table(EXERCISE_PROGRESS_TABLE).insert(progress_rows).execute()
            except Exception as e:
                msg = str(e)
                if "PGRST205" in msg or "schema cache" in msg or "exercise_progress" in msg:
                    # Rollback workout để tránh orphan, báo migration
                    try:
                        supabase_admin.table(TABLE).delete().eq("id", workout_id).execute()
                    except Exception:
                        pass
                    raise HTTPException(
                        status_code=503,
                        detail="Table 'exercise_progress' not found. Please run migration 009_create_exercise_progress.sql in Supabase Dashboard > SQL Editor.",
                    )
                # Không rollback nếu lỗi khác, nhưng log và trả warning trong detail?
                # Để atomic, xóa workout vừa tạo
                try:
                    supabase_admin.table(TABLE).delete().eq("id", workout_id).execute()
                except Exception:
                    pass
                raise HTTPException(status_code=500, detail=f"Failed to save exercise progress: {e}")
    except HTTPException:
        raise
    except Exception as e:
        # Không block workout chính nếu parse lỗi, nhưng log
        print(f"[workouts] failed to parse exercise_progress: {e}")

    return workout_row


@router.post("/previous-sets", status_code=200)
def get_previous_sets_batch(
    payload: dict = Body(..., description="{exerciseNames: string[]}"),
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Batch lấy previous sets cho placeholder. FE gửi {exerciseNames: [...]} hoặc {exercise_names: [...]}

    Trả về dict { "Planche Lean": [{setNumber, reps, holdSeconds, weight, weightRaw, rpe, inputType, raw}], ... }
    Mỗi exercise lấy toàn bộ sets của workout gần nhất chứa exercise đó (chỉ user hiện tại).
    """
    user_id = current_user["id"]
    if user_id == "dev-user":
        return {}
    # Hỗ trợ cả camelCase / snake_case
    names_raw = payload.get("exerciseNames") or payload.get("exercise_names") or payload.get("names") or []
    if isinstance(names_raw, str):
        # comma-separated fallback
        names_raw = [n.strip() for n in names_raw.split(",")]
    if not isinstance(names_raw, list):
        raise HTTPException(status_code=400, detail="exerciseNames must be an array of strings")
    cleaned: list[str] = []
    seen: set[str] = set()
    for n in names_raw:
        if not isinstance(n, str):
            continue
        t = n.strip()
        if not t or t in seen:
            continue
        seen.add(t)
        cleaned.append(t)
    if not cleaned:
        return {}
    result: dict[str, list[dict]] = {}
    for name in cleaned:
        try:
            latest = (
                supabase_admin.table(EXERCISE_PROGRESS_TABLE)
                .select("workout_id, created_at")
                .eq("user_id", user_id)
                .eq("exercise_name", name)
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )
            if not latest.data:
                result[name] = []
                continue
            w_id = latest.data[0]["workout_id"]
            sets_data = (
                supabase_admin.table(EXERCISE_PROGRESS_TABLE)
                .select("*")
                .eq("user_id", user_id)
                .eq("workout_id", w_id)
                .eq("exercise_name", name)
                .order("set_number")
                .execute()
            )
            rows = sets_data.data or []
            result[name] = [
                {
                    "setNumber": r.get("set_number"),
                    "reps": r.get("reps"),
                    "holdSeconds": r.get("hold_seconds"),
                    "weight": r.get("weight"),
                    "weightRaw": r.get("weight_raw"),
                    "rpe": r.get("rpe"),
                    "inputType": r.get("input_type"),
                    "raw": r.get("raw") or {},
                    "exerciseName": r.get("exercise_name"),
                    "exerciseId": r.get("exercise_id"),
                }
                for r in rows
            ]
        except Exception as e:
            msg = str(e)
            if "PGRST205" in msg or "schema cache" in msg:
                raise HTTPException(
                    status_code=503,
                    detail="Table 'exercise_progress' not found. Please run migration 009_create_exercise_progress.sql in Supabase Dashboard > SQL Editor.",
                )
            # Lỗi riêng lẻ không block các exercise khác
            result[name] = []
    return result


@router.get("/previous-sets", status_code=200)
def get_previous_sets_get(
    names: str = Query(..., description="Comma-separated exercise names"),
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Alias GET cho previous-sets để test nhanh bằng URL. Dùng chung logic với POST batch."""
    payload = {"exerciseNames": [s.strip() for s in names.split(",") if s.strip()]}
    return get_previous_sets_batch(payload, current_user)


@router.get("/stats/summary", status_code=200)
def get_workout_stats(current_user: dict = Depends(get_current_user)) -> dict:
    """Dashboard metrics: tổng workout time & avg RPE thực từ table workouts.

    Tính cho 7 ngày gần nhất vs 7 ngày trước đó để ra % change.
    Trả về shape để frontend map thẳng vào MetricCards.
    """
    from datetime import datetime, timedelta, timezone

    user_id = current_user["id"]
    if user_id == "dev-user":
        return {
            "workoutTime": {
                "totalMinutesCurrent7d": 0,
                "totalMinutesPrev7d": 0,
                "changePercent": None,
                "trend": None,
            },
            "avgRpe": {
                "avgCurrent7d": None,
                "avgPrev7d": None,
                "changePercent": None,
                "trend": None,
            },
            "totalWorkouts": {
                "countCurrent7d": 0,
                "countPrev7d": 0,
                "changePercent": None,
                "trend": None,
            },
        }

    now = datetime.now(timezone.utc)
    start_current = now - timedelta(days=7)
    start_prev = now - timedelta(days=14)

    try:
        data = (
            supabase_admin.table(TABLE)
            .select("duration_minutes, avg_rpe, created_at")
            .eq("user_id", user_id)
            .gte("created_at", start_prev.isoformat())
            .execute()
        )
        rows = data.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch workout stats: {e}")

    def _parse_created_at(v):
        try:
            # supabase trả ISO string, có thể có Z hoặc +00:00
            s = str(v).replace("Z", "+00:00")
            dt = datetime.fromisoformat(s)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except Exception:
            return None

    current_rows = []
    prev_rows = []
    for r in rows:
        dt = _parse_created_at(r.get("created_at"))
        if dt is None:
            continue
        if dt >= start_current:
            current_rows.append(r)
        elif dt >= start_prev:
            prev_rows.append(r)

    total_current = sum(int(r.get("duration_minutes") or 0) for r in current_rows)
    total_prev = sum(int(r.get("duration_minutes") or 0) for r in prev_rows)

    rpes_current = [float(r["avg_rpe"]) for r in current_rows if r.get("avg_rpe") is not None]
    rpes_prev = [float(r["avg_rpe"]) for r in prev_rows if r.get("avg_rpe") is not None]
    avg_current = (sum(rpes_current) / len(rpes_current)) if rpes_current else None
    avg_prev = (sum(rpes_prev) / len(rpes_prev)) if rpes_prev else None

    count_current = len(current_rows)
    count_prev = len(prev_rows)

    def _change(cur, prev):
        if prev is None or prev == 0:
            return None
        try:
            return round(((cur - prev) / prev * 100), 1)
        except Exception:
            return None

    def _trend(change):
        if change is None:
            return None
        if change > 0:
            return "up"
        if change < 0:
            return "down"
        return "flat"

    wt_change = _change(total_current, total_prev)
    # avg rpe change
    rpe_change = _change(avg_current, avg_prev) if avg_current is not None and avg_prev is not None else None
    count_change = _change(count_current, count_prev)

    return {
        "workoutTime": {
            "totalMinutesCurrent7d": total_current,
            "totalMinutesPrev7d": total_prev,
            "changePercent": wt_change,
            "trend": _trend(wt_change),
        },
        "avgRpe": {
            "avgCurrent7d": round(avg_current, 1) if avg_current is not None else None,
            "avgPrev7d": round(avg_prev, 1) if avg_prev is not None else None,
            "changePercent": rpe_change,
            "trend": _trend(rpe_change),
        },
        "totalWorkouts": {
            "countCurrent7d": count_current,
            "countPrev7d": count_prev,
            "changePercent": count_change,
            "trend": _trend(count_change),
        },
    }


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
