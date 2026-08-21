from collections import Counter, defaultdict
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query

from auth import get_current_user
from db import supabase_admin

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

# --- Mapping granular -> 6 groups (normalize lower) ---
GRANULAR_TO_GROUP: dict[str, str] = {
    # chest
    "chest": "chest",
    "upper chest": "chest",
    "pectorals": "chest",
    "pectoralis": "chest",
    # back
    "lats": "back",
    "lat": "back",
    "traps": "back",
    "trapezius": "back",
    "rhomboids": "back",
    # shoulders
    "shoulders": "shoulders",
    "anterior deltoids": "shoulders",
    "rear deltoids": "shoulders",
    "deltoids": "shoulders",
    "serratus anterior": "shoulders",
    "deltoid": "shoulders",
    # arms
    "biceps": "arms",
    "triceps": "arms",
    "forearms": "arms",
    "forearm": "arms",
    "grip": "arms",
    # core
    "core": "core",
    "rectus abdominis": "core",
    "lower abs": "core",
    "lower ab": "core",
    "obliques": "core",
    "oblique": "core",
    "hip flexors": "core",
    "hip flexor": "core",
    "abdominals": "core",
    # legs
    "quads": "legs",
    "quadriceps": "legs",
    "glutes": "legs",
    "glute": "legs",
    "hamstrings": "legs",
    "hamstring": "legs",
    "calves": "legs",
    "calf": "legs",
    "tibialis anterior": "legs",
    # lower back -> back (erector in SVG back group)
    "lower back": "back",
}

MUSCLE_META = {
    "chest": {"id": "chest", "name": "CHEST", "vietnameseName": "Ngực (Pectorals)", "skillsCategory": "Push", "color": "#00E5FF"},
    "back": {"id": "back", "name": "BACK", "vietnameseName": "Lưng & Xô (Lats & Traps)", "skillsCategory": "Pull", "color": "#00E5FF"},
    "legs": {"id": "legs", "name": "LEGS", "vietnameseName": "Chân & Đùi (Quads & Hamstrings)", "skillsCategory": "Legs", "color": "#00E5FF"},
    "shoulders": {"id": "shoulders", "name": "SHOULDERS", "vietnameseName": "Vai (Deltoids)", "skillsCategory": "Push / Skill", "color": "#00E5FF"},
    "arms": {"id": "arms", "name": "ARMS", "vietnameseName": "Tay trước/sau (Biceps & Triceps)", "skillsCategory": "Arms", "color": "#00E5FF"},
    "core": {"id": "core", "name": "CORE", "vietnameseName": "Cơ bụng & Trọng tâm (Abs & Compression)", "skillsCategory": "Core", "color": "#00E5FF"},
}

GROUP_ORDER = ["chest", "back", "legs", "shoulders", "arms", "core"]


def _normalize_muscle(name: str) -> str:
    return (name or "").strip().lower()


def _date_range(range_key: str) -> tuple[datetime, datetime]:
    now = datetime.now(timezone.utc)
    key = (range_key or "THIS_WEEK").strip().upper().replace(" ", "_")
    # normalize variations: this_week, thisWeek, THIS WEEK
    # handle camelCase inputs
    key_lower = range_key.strip().lower().replace(" ", "").replace("_", "").replace("-", "")
    if key_lower in ("thisweek",):
        key = "THIS_WEEK"
    elif key_lower in ("lastweek",):
        key = "LAST_WEEK"
    elif key_lower in ("thismonth",):
        key = "THIS_MONTH"

    if key == "LAST_WEEK":
        # Monday 00:00 of current week
        monday_this = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
        monday_last = monday_this - timedelta(days=7)
        sunday_last_end = monday_this - timedelta(microseconds=1)
        return monday_last, sunday_last_end
    if key == "THIS_MONTH":
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        return start, now
    # default THIS_WEEK
    monday = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
    return monday, now


def _fetch_exercises_map() -> tuple[dict, dict]:
    """Return (by_id, by_name_lower) -> {primary_muscles, secondary_muscles}"""
    try:
        data = supabase_admin.table("exercises").select("id, name, primary_muscles, secondary_muscles").execute()
        rows = data.data or []
    except Exception as e:
        msg = str(e)
        if "PGRST205" in msg or "schema cache" in msg:
            raise HTTPException(status_code=503, detail="Table 'exercises' not found")
        raise HTTPException(status_code=500, detail=f"Failed to fetch exercises: {e}")

    by_id: dict[str, dict] = {}
    by_name: dict[str, dict] = {}
    for r in rows:
        info = {
            "primary_muscles": r.get("primary_muscles") or [],
            "secondary_muscles": r.get("secondary_muscles") or [],
        }
        if r.get("id"):
            by_id[str(r["id"])] = info
        if r.get("name"):
            by_name[_normalize_muscle(r["name"])] = info
    return by_id, by_name


def _fetch_custom_muscle_map(user_id: str) -> dict[str, dict]:
    """Build map name_lower -> {primary_muscles, secondary_muscles} from user's routines (cx- custom)."""
    try:
        data = supabase_admin.table("routines").select("exercises").eq("user_id", user_id).execute()
        rows = data.data or []
    except Exception:
        return {}
    cmap: dict[str, dict] = {}
    for r in rows:
        exs = r.get("exercises") or []
        if not isinstance(exs, list):
            continue
        for ex in exs:
            if not isinstance(ex, dict):
                continue
            name = (ex.get("name") or "").strip()
            if not name:
                continue
            key = _normalize_muscle(name)
            # muscleGroups is combined primary+secondary for custom; treat all as primary for +1 scoring
            mg = ex.get("muscleGroups") or ex.get("muscle_groups") or []
            if isinstance(mg, list) and mg:
                # avoid overwriting if already from exercises table? custom map is fallback, so keep first
                if key not in cmap:
                    cmap[key] = {"primary_muscles": mg, "secondary_muscles": []}
            # also handle explicit primary/secondary if present
            if ex.get("primaryMuscles") or ex.get("primary_muscles"):
                pm = ex.get("primaryMuscles") or ex.get("primary_muscles") or []
                sm = ex.get("secondaryMuscles") or ex.get("secondary_muscles") or []
                if key not in cmap:
                    cmap[key] = {"primary_muscles": pm, "secondary_muscles": sm}
    return cmap


def _fetch_progress(user_id: str, from_dt: datetime, to_dt: datetime) -> list[dict]:
    """Fetch exercise_progress for user in [from_dt, to_dt] with pagination."""
    rows: list[dict] = []
    page_size = 1000
    offset = 0
    from_iso = from_dt.isoformat()
    to_iso = to_dt.isoformat()
    while True:
        try:
            q = (
                supabase_admin.table("exercise_progress")
                .select("exercise_id, exercise_name, created_at, raw")
                .eq("user_id", user_id)
                .gte("created_at", from_iso)
                .lte("created_at", to_iso)
                .order("created_at", desc=False)
                .range(offset, offset + page_size - 1)
            )
            data = q.execute()
        except Exception as e:
            msg = str(e)
            if "PGRST205" in msg or "schema cache" in msg:
                raise HTTPException(
                    status_code=503,
                    detail="Table 'exercise_progress' not found. Please run migration 009_create_exercise_progress.sql in Supabase Dashboard > SQL Editor.",
                )
            raise HTTPException(status_code=500, detail=f"Failed to fetch exercise progress: {e}")
        batch = data.data or []
        rows.extend(batch)
        if len(batch) < page_size:
            break
        offset += page_size
        if offset > 10000:  # safety cap
            break
    return rows


# --- Performance Trend helpers ---

def _performance_range_to_dates(range_key: str | None) -> tuple[datetime | None, datetime]:
    """Map ProgressHeader timeframe (7d/30d/90d/year/all) -> (from_dt | None, to_dt)."""
    now = datetime.now(timezone.utc)
    if not range_key:
        range_key = "30d"
    key = range_key.strip().lower().replace(" ", "").replace("_", "").replace("-", "")
    # normalize common aliases
    if key in ("7d", "7days", "last7days", "7"):
        return now - timedelta(days=7), now
    if key in ("30d", "30days", "last30days", "30"):
        return now - timedelta(days=30), now
    if key in ("90d", "90days", "last90days", "90"):
        return now - timedelta(days=90), now
    if key in ("year", "thisyear", "12months", "365d"):
        start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        return start, now
    if key in ("all", "alltime"):
        return None, now
    # fallback: treat as 30d
    return now - timedelta(days=30), now


def _fetch_progress_by_exercise(
    user_id: str,
    exercise_name: str,
    from_dt: datetime | None,
    to_dt: datetime,
) -> list[dict]:
    """Fetch exercise_progress filtered by exercise_name with pagination."""
    rows: list[dict] = []
    page_size = 1000
    offset = 0
    to_iso = to_dt.isoformat()
    while True:
        try:
            q = (
                supabase_admin.table("exercise_progress")
                .select("exercise_id, exercise_name, input_type, reps, hold_seconds, weight, weight_raw, rpe, raw, created_at, workout_id, set_number")
                .eq("user_id", user_id)
                .eq("exercise_name", exercise_name)
                .lte("created_at", to_iso)
                .order("created_at", desc=False)
                .range(offset, offset + page_size - 1)
            )
            if from_dt is not None:
                q = q.gte("created_at", from_dt.isoformat())
            data = q.execute()
        except Exception as e:
            msg = str(e)
            if "PGRST205" in msg or "schema cache" in msg:
                raise HTTPException(
                    status_code=503,
                    detail="Table 'exercise_progress' not found. Please run migration 009_create_exercise_progress.sql in Supabase Dashboard > SQL Editor.",
                )
            raise HTTPException(status_code=500, detail=f"Failed to fetch exercise progress: {e}")
        batch = data.data or []
        rows.extend(batch)
        if len(batch) < page_size:
            break
        offset += page_size
        if offset > 10000:
            break
    return rows


def _fetch_distinct_exercise_names(user_id: str) -> tuple[Counter, list[dict]]:
    """Fetch all exercise_name for user and return (Counter, raw rows) for frequency sorting."""
    rows: list[dict] = []
    page_size = 1000
    offset = 0
    while True:
        try:
            q = (
                supabase_admin.table("exercise_progress")
                .select("exercise_name, created_at")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .range(offset, offset + page_size - 1)
            )
            data = q.execute()
        except Exception as e:
            msg = str(e)
            if "PGRST205" in msg or "schema cache" in msg:
                raise HTTPException(
                    status_code=503,
                    detail="Table 'exercise_progress' not found. Please run migration 009_create_exercise_progress.sql in Supabase Dashboard > SQL Editor.",
                )
            raise HTTPException(status_code=500, detail=f"Failed to fetch exercise names: {e}")
        batch = data.data or []
        rows.extend(batch)
        if len(batch) < page_size:
            break
        offset += page_size
        if offset > 10000:
            break
    counter = Counter()
    # also track latest timestamp per name for secondary sort
    latest_map: dict[str, str] = {}
    for r in rows:
        name = (r.get("exercise_name") or "").strip()
        if not name:
            continue
        counter[name] += 1
        if name not in latest_map:
            latest_map[name] = r.get("created_at") or ""
    return counter, rows


@router.get("/exercise-names")
def get_exercise_names(
    search: str | None = Query(None, description="Filter by substring, case-insensitive"),
    limit: int = Query(50, ge=1, le=100, description="Max number of names to return"),
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Distinct exercise_name từ exercise_progress của user (chỉ bài đã tập)."""
    user_id = current_user["id"]
    if user_id == "dev-user":
        # Mock for dev login: return empty but valid shape
        return {"exercise_names": [], "count": 0, "search": search or ""}

    counter, _rows = _fetch_distinct_exercise_names(user_id)
    if not counter:
        return {"exercise_names": [], "count": 0, "search": search or ""}

    # Sort by frequency desc, then alphabetically
    sorted_names = sorted(counter.items(), key=lambda kv: (-kv[1], kv[0].lower()))
    names = [name for name, _cnt in sorted_names]

    if search and search.strip():
        q = search.strip().lower()
        names = [n for n in names if q in n.lower()]

    limited = names[:limit]
    # also provide count per name for convenience
    counts = {name: counter[name] for name in limited}
    return {"exercise_names": limited, "count": len(limited), "total_distinct": len(counter), "search": search or "", "counts": counts}


@router.get("/performance-trend")
def get_performance_trend(
    exercise_name: str = Query(..., min_length=1, description="Exact exercise_name as stored in exercise_progress"),
    range: str = Query("30d", description="Timeframe: 7d|30d|90d|year|all"),
    timeframe: str | None = Query(None, description="Alias for range (7d|30d|90d|year|all)"),
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Time-series cho Performance Trend: aggregate per-workout từ exercise_progress."""
    user_id = current_user["id"]
    ex_name_clean = (exercise_name or "").strip()
    if not ex_name_clean:
        raise HTTPException(status_code=400, detail="exercise_name is required")

    # Support alias ?timeframe= as well (frontend may send timeframe instead of range)
    effective_range = timeframe if timeframe is not None else range

    from_dt, to_dt = _performance_range_to_dates(effective_range)

    if user_id == "dev-user":
        return {
            "exercise_name": ex_name_clean,
            "input_type": "note",
            "unit": "reps",
            "range": effective_range,
            "from": from_dt.isoformat() if from_dt else None,
            "to": to_dt.isoformat(),
            "points": [],
        }

    rows = _fetch_progress_by_exercise(user_id, ex_name_clean, from_dt, to_dt)

    if not rows:
        # Try to guess input_type from exercises table or fallback to note
        unit = "reps"
        guessed_input = "note"
        try:
            # quick lookup by name
            by_id, by_name = _fetch_exercises_map()
            info = by_name.get(_normalize_muscle(ex_name_clean))
            if info is not None:
                # infer from movement? not reliable; use input_type via DB fetch of exercises row
                data = supabase_admin.table("exercises").select("input_type").eq("name", ex_name_clean).limit(1).execute()
                if data.data and data.data[0].get("input_type"):
                    guessed_input = str(data.data[0]["input_type"]).strip().lower()
                    if guessed_input == "time":
                        unit = "s"
                    elif guessed_input == "weight":
                        unit = "kg"
                    elif guessed_input in ("note", "reps_time"):
                        unit = "reps"
        except Exception:
            pass
        return {
            "exercise_name": ex_name_clean,
            "input_type": guessed_input,
            "unit": unit,
            "range": effective_range,
            "from": from_dt.isoformat() if from_dt else None,
            "to": to_dt.isoformat(),
            "points": [],
        }

    # Determine dominant input_type
    type_counter = Counter()
    for r in rows:
        it = (r.get("input_type") or "note").strip().lower()
        if it not in {"time", "weight", "note", "reps_time"}:
            it = "note"
        type_counter[it] += 1
    dominant = type_counter.most_common(1)[0][0] if type_counter else "note"

    # Unit mapping for dominant
    if dominant == "time":
        unit = "s"
    elif dominant == "weight":
        unit = "kg"
    else:
        unit = "reps"

    # Group by workout_id -> keep earliest created_at per workout
    groups: dict[str, list[dict]] = defaultdict(list)
    workout_earliest: dict[str, datetime] = {}
    workout_raw_created: dict[str, str] = {}
    for r in rows:
        wid = r.get("workout_id") or "unknown"
        groups[wid].append(r)
        ca_raw = r.get("created_at")
        try:
            ca = datetime.fromisoformat(str(ca_raw).replace("Z", "+00:00"))
            if ca.tzinfo is None:
                ca = ca.replace(tzinfo=timezone.utc)
        except Exception:
            ca = to_dt
        if wid not in workout_earliest or ca < workout_earliest[wid]:
            workout_earliest[wid] = ca
            workout_raw_created[wid] = ca_raw or ca.isoformat()

    # Sort workouts by earliest timestamp
    sorted_wids = sorted(groups.keys(), key=lambda wid: workout_earliest.get(wid, to_dt))

    points: list[dict] = []
    for wid in sorted_wids:
        grp = groups[wid]
        sets_count = len(grp)
        # compute max per metric in this workout
        max_reps = None
        max_hold = None
        max_weight = None
        max_weight_reps = None  # reps associated with max weight set
        max_hold_reps = None
        for s in grp:
            reps = s.get("reps")
            if isinstance(reps, (int, float)) and reps is not None:
                try:
                    reps_i = int(reps)
                    if max_reps is None or reps_i > max_reps:
                        max_reps = reps_i
                except Exception:
                    pass
            hs = s.get("hold_seconds")
            if isinstance(hs, (int, float)) and hs is not None:
                try:
                    hs_i = int(hs)
                    if max_hold is None or hs_i > max_hold:
                        max_hold = hs_i
                        # also capture reps for this hold set if any
                        if s.get("reps") is not None:
                            try:
                                max_hold_reps = int(s.get("reps"))
                            except Exception:
                                max_hold_reps = None
                except Exception:
                    pass
            w = s.get("weight")
            if w is not None:
                try:
                    wf = float(w)
                    if max_weight is None or wf > max_weight:
                        max_weight = wf
                        # capture reps for max weight
                        if s.get("reps") is not None:
                            try:
                                max_weight_reps = int(s.get("reps"))
                            except Exception:
                                max_weight_reps = None
                        else:
                            max_weight_reps = None
                except Exception:
                    pass

        # decide primary value for this workout
        primary_val: float | int | None = None
        label = ""
        if dominant == "time":
            primary_val = max_hold
            if primary_val is not None:
                label = f"{primary_val}s"
        elif dominant == "weight":
            if max_weight is not None:
                primary_val = max_weight
                # format weight without trailing .0 if integer
                w_str = str(int(primary_val)) if float(primary_val).is_integer() else str(round(float(primary_val), 1))
                if max_weight_reps is not None:
                    label = f"{w_str}kg x {max_weight_reps} reps"
                else:
                    label = f"{w_str}kg"
            elif max_reps is not None:
                primary_val = max_reps
                unit = "reps"
                label = f"{primary_val} reps"
        elif dominant == "reps_time":
            # prefer hold if present else reps
            if max_hold is not None and max_hold > 0:
                primary_val = max_hold
                unit = "s"
                label = f"{primary_val}s"
            elif max_reps is not None:
                primary_val = max_reps
                unit = "reps"
                label = f"{primary_val} reps"
        else:  # note or fallback
            if max_reps is not None:
                primary_val = max_reps
                label = f"{primary_val} reps"
            elif max_hold is not None:
                primary_val = max_hold
                unit = "s"
                label = f"{primary_val}s"
            elif max_weight is not None:
                primary_val = max_weight
                unit = "kg"
                w_str = str(int(primary_val)) if float(primary_val).is_integer() else str(round(float(primary_val), 1))
                label = f"{w_str}kg"

        if primary_val is None:
            # skip workouts with no valid metric
            continue

        ca_iso = workout_raw_created.get(wid) or workout_earliest[wid].isoformat()
        # date string for display: e.g., Aug 19
        try:
            dt = workout_earliest[wid]
            date_disp = dt.strftime("%b %d")
            date_iso = dt.date().isoformat()
        except Exception:
            date_disp = ""
            date_iso = ""

        points.append({
            "workout_id": wid,
            "date": date_iso,
            "date_display": date_disp,
            "created_at": ca_iso,
            "value": float(primary_val) if isinstance(primary_val, float) else int(primary_val),
            "label": label,
            "unit": unit,
            "max_reps": max_reps,
            "max_hold_seconds": max_hold,
            "max_weight": max_weight,
            "max_weight_reps": max_weight_reps,
            "sets_count": sets_count,
        })

    # For consistency, ensure unit reflects dominant even if points adjusted for fallback
    # If no points, unit already set
    # Sort points by created_at asc (already)
    return {
        "exercise_name": ex_name_clean,
        "input_type": dominant,
        "unit": unit,
        "range": effective_range,
        "from": from_dt.isoformat() if from_dt else None,
        "to": to_dt.isoformat(),
        "points": points,
        "total_sets": len(rows),
        "total_workouts": len(points),
    }


@router.get("/training-consistency")
def get_training_consistency(
    weeks: int = Query(4, ge=1, le=12, description="Number of weeks to display (1-12), default 4"),
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Heatmap & stats cho Training Consistency dựa trên training_schedule + workouts."""
    from datetime import time as dt_time

    user_id = current_user["id"]
    today = datetime.now(timezone.utc).date()
    days_since_monday = today.weekday()  # Mon=0
    this_monday = today - timedelta(days=days_since_monday)
    start_monday = this_monday - timedelta(days=(weeks - 1) * 7)
    end_sunday = start_monday + timedelta(days=weeks * 7 - 1)

    from_dt = datetime.combine(start_monday, dt_time.min, tzinfo=timezone.utc)
    to_dt = datetime.now(timezone.utc)  # up to now, not future

    # --- Dev-user mock ---
    if user_id == "dev-user":
        # Mock schedule: 5 days/week (Mon-Fri)
        mock_schedule = [
            {"day_of_week": 0, "routine_id": "mock-push", "routine_name": "Push & Planche"},
            {"day_of_week": 1, "routine_id": "mock-pull", "routine_name": "Pull & Front Lever"},
            {"day_of_week": 2, "routine_id": "mock-hand", "routine_name": "Handstand & Mobility"},
            {"day_of_week": 3, "routine_id": "mock-upper", "routine_name": "Upper Body Power"},
            {"day_of_week": 4, "routine_id": "mock-core", "routine_name": "L-Sit & Core"},
            {"day_of_week": 5, "routine_id": None, "routine_name": None},
            {"day_of_week": 6, "routine_id": None, "routine_name": None},
        ]
        trainingDaysPerWeek = 5
        restDaysPerWeek = 2
        # Build matrix with same logic but use mock workouts set to simulate 86% consistency
        # Mock workout dates: all Mon-Fri except a few misses to get 86%
        mock_workout_dates = set()
        for w in range(weeks):
            base = start_monday + timedelta(days=w * 7)
            for d in range(7):
                cur = base + timedelta(days=d)
                if cur > today:
                    continue
                dow = cur.weekday()
                # Miss on Sat of week0 and Fri of week1 pattern, else train on scheduled days
                is_miss = (w == 0 and dow in (5, 6)) or (w == 1 and dow == 4)
                if dow < 5 and not is_miss:
                    mock_workout_dates.add(cur.isoformat())
                elif w == 1 and dow == 5:  # Sat trained in week1
                    mock_workout_dates.add(cur.isoformat())
                elif w == 2 and dow == 5:  # Sat rest but not missed (rest)
                    pass
        # Now build matrix
        matrix = []
        expectedPast = 0
        trainedOnScheduled = 0
        trainedTotal = 0
        restCount = 0
        missedCount = 0
        pastDays = 0
        # Also build list of all dates for streak calc
        compliance_streak_candidates = []
        training_dates_sorted = sorted(mock_workout_dates)
        for w in range(weeks):
            row = []
            for d in range(7):
                cur = start_monday + timedelta(days=w * 7 + d)
                dow = cur.weekday()
                sched = next((s for s in mock_schedule if s["day_of_week"] == dow), {"routine_id": None, "routine_name": None})
                scheduled = sched["routine_id"] is not None
                is_future = cur > today
                date_iso = cur.isoformat()
                date_display = cur.strftime("%b %d")
                day_label = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"][dow]
                has_workout = date_iso in mock_workout_dates
                if is_future:
                    state = "future"
                elif has_workout:
                    state = "trained"
                elif not scheduled:
                    state = "rest"
                else:
                    state = "missed"
                label = sched["routine_name"] if scheduled and sched["routine_name"] else "Rest Day"
                if state == "trained":
                    # keep routine name
                    pass
                elif state == "missed":
                    label = f"Missed: {label}" if scheduled else "Missed Session"
                elif state == "rest":
                    label = "Rest Day"
                elif state == "future":
                    label = "Upcoming"

                if not is_future:
                    pastDays += 1
                    if scheduled:
                        expectedPast += 1
                        if has_workout:
                            trainedOnScheduled += 1
                        else:
                            missedCount += 1
                    else:
                        if not has_workout:
                            restCount += 1
                    if has_workout:
                        trainedTotal += 1

                row.append({
                    "date": date_iso,
                    "date_display": date_display,
                    "day": day_label,
                    "day_of_week": dow,
                    "state": state,
                    "label": label,
                    "routine_name": sched["routine_name"],
                    "routine_id": sched["routine_id"],
                    "is_future": is_future,
                    "scheduled": scheduled,
                })
            matrix.append(row)

        # streak: longest consecutive trained days (calendar consecutive)
        training_dates = sorted([d for d in mock_workout_dates if d <= today.isoformat()])
        best_streak = 0
        cur_streak = 0
        prev_date = None
        for ds in training_dates:
            cur_d = datetime.fromisoformat(ds).date()
            if prev_date and (cur_d - prev_date).days == 1:
                cur_streak += 1
            else:
                cur_streak = 1
            best_streak = max(best_streak, cur_streak)
            prev_date = cur_d

        consistency = round(trainedOnScheduled / expectedPast * 100) if expectedPast else 0

        return {
            "weeks": weeks,
            "from": start_monday.isoformat(),
            "to": end_sunday.isoformat(),
            "today": today.isoformat(),
            "schedule": mock_schedule,
            "trainingDaysPerWeek": trainingDaysPerWeek,
            "restDaysPerWeek": restDaysPerWeek,
            "totalExpectedFull": trainingDaysPerWeek * weeks,
            "matrix": matrix,
            "stats": {
                "trainingDaysPerWeek": trainingDaysPerWeek,
                "restDaysPerWeek": restDaysPerWeek,
                "totalExpectedFull": trainingDaysPerWeek * weeks,
                "expectedPast": expectedPast,
                "trainedTotal": trainedTotal,
                "trainedOnScheduled": trainedOnScheduled,
                "missed": missedCount,
                "restDays": restCount,
                "consistency": consistency,
                "bestStreak": best_streak,
                "totalDays": weeks * 7,
                "pastDays": pastDays,
            },
        }

    # --- Real user: fetch schedule ---
    schedule_map: dict[int, dict] = {i: {"routine_id": None, "routine_name": None, "day_of_week": i} for i in range(7)}
    try:
        s_data = (
            supabase_admin.table("training_schedules")
            .select("day_of_week, routine_id")
            .eq("user_id", user_id)
            .execute()
        )
        rows = s_data.data or []
        routine_ids = [r["routine_id"] for r in rows if r.get("routine_id")]
        routine_names: dict[str, str] = {}
        if routine_ids:
            try:
                r_data = (
                    supabase_admin.table("routines")
                    .select("id, name")
                    .eq("user_id", user_id)
                    .in_("id", routine_ids)
                    .execute()
                )
                for r in (r_data.data or []):
                    routine_names[str(r["id"])] = r.get("name") or "Routine"
            except Exception:
                pass
        for r in rows:
            dow = int(r["day_of_week"])
            rid = r.get("routine_id")
            schedule_map[dow] = {
                "day_of_week": dow,
                "routine_id": rid,
                "routine_name": routine_names.get(str(rid)) if rid else None,
            }
    except Exception as e:
        msg = str(e)
        if "PGRST205" in msg or "schema cache" in msg:
            # table missing -> treat as all rest
            pass
        else:
            raise HTTPException(status_code=500, detail=f"Failed to fetch training schedule: {e}")

    schedule_list = [schedule_map[i] for i in range(7)]
    trainingDaysPerWeek = sum(1 for s in schedule_list if s["routine_id"] is not None)
    restDaysPerWeek = 7 - trainingDaysPerWeek

    # --- Fetch workouts in range ---
    workout_dates_set: set[str] = set()
    workouts_by_date: dict[str, list[dict]] = defaultdict(list)
    try:
        # Need pagination for workouts
        page_size = 1000
        offset = 0
        while True:
            q = (
                supabase_admin.table("workouts")
                .select("id, name, created_at, completed_sets, duration_minutes")
                .eq("user_id", user_id)
                .gte("created_at", from_dt.isoformat())
                .lte("created_at", to_dt.isoformat())
                .order("created_at", desc=False)
                .range(offset, offset + page_size - 1)
            )
            data = q.execute()
            batch = data.data or []
            for w in batch:
                ca = w.get("created_at")
                try:
                    dt = datetime.fromisoformat(str(ca).replace("Z", "+00:00"))
                    if dt.tzinfo is None:
                        dt = dt.replace(tzinfo=timezone.utc)
                    d_iso = dt.date().isoformat()
                except Exception:
                    continue
                workout_dates_set.add(d_iso)
                workouts_by_date[d_iso].append(w)
            if len(batch) < page_size:
                break
            offset += page_size
            if offset > 10000:
                break
    except Exception as e:
        msg = str(e)
        if "PGRST205" in msg or "schema cache" in msg:
            # workouts table missing? treat as no workouts
            workout_dates_set = set()
        else:
            raise HTTPException(status_code=500, detail=f"Failed to fetch workouts: {e}")

    # --- Build matrix ---
    matrix = []
    expectedPast = 0
    trainedOnScheduled = 0
    trainedTotal = 0
    restCount = 0
    missedCount = 0
    pastDays = 0

    for w in range(weeks):
        row = []
        for d in range(7):
            cur = start_monday + timedelta(days=w * 7 + d)
            dow = cur.weekday()
            sched = schedule_map.get(dow, {"routine_id": None, "routine_name": None, "day_of_week": dow})
            scheduled = sched["routine_id"] is not None
            is_future = cur > today
            date_iso = cur.isoformat()
            date_display = cur.strftime("%b %d")
            day_label = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"][dow]
            has_workout = date_iso in workout_dates_set
            if is_future:
                state = "future"
            elif has_workout:
                state = "trained"
            elif not scheduled:
                state = "rest"
            else:
                state = "missed"

            # label
            routine_name = sched.get("routine_name")
            if state == "trained":
                # prefer workout name if available
                wnames = workouts_by_date.get(date_iso, [])
                if wnames:
                    label = wnames[0].get("name") or routine_name or "Workout"
                else:
                    label = routine_name or "Workout"
            elif state == "missed":
                label = f"Missed: {routine_name}" if routine_name else "Missed Session"
            elif state == "rest":
                label = "Rest Day"
            elif state == "future":
                label = routine_name or "Upcoming"
                if scheduled and routine_name:
                    label = f"Upcoming: {routine_name}"
                else:
                    label = "Upcoming Rest"
            else:
                label = routine_name or "Rest Day"

            if not is_future:
                pastDays += 1
                if scheduled:
                    expectedPast += 1
                    if has_workout:
                        trainedOnScheduled += 1
                    else:
                        missedCount += 1
                else:
                    if not has_workout:
                        restCount += 1
                if has_workout:
                    trainedTotal += 1

            row.append({
                "date": date_iso,
                "date_display": date_display,
                "day": day_label,
                "day_of_week": dow,
                "state": state,
                "label": label,
                "routine_name": routine_name,
                "routine_id": sched.get("routine_id"),
                "is_future": is_future,
                "scheduled": scheduled,
            })
        matrix.append(row)

    # best streak: consecutive trained days (calendar)
    sorted_training = sorted([d for d in workout_dates_set if d <= today.isoformat()])
    best_streak = 0
    cur_streak = 0
    prev_date = None
    for ds in sorted_training:
        try:
            cur_d = datetime.fromisoformat(ds).date()
        except Exception:
            continue
        if prev_date and (cur_d - prev_date).days == 1:
            cur_streak += 1
        else:
            cur_streak = 1
        best_streak = max(best_streak, cur_streak)
        prev_date = cur_d
    # if no training days, streak 0
    if not sorted_training:
        best_streak = 0

    consistency = round(trainedOnScheduled / expectedPast * 100) if expectedPast else 0

    return {
        "weeks": weeks,
        "from": start_monday.isoformat(),
        "to": end_sunday.isoformat(),
        "today": today.isoformat(),
        "schedule": schedule_list,
        "trainingDaysPerWeek": trainingDaysPerWeek,
        "restDaysPerWeek": restDaysPerWeek,
        "totalExpectedFull": trainingDaysPerWeek * weeks,
        "matrix": matrix,
        "stats": {
            "trainingDaysPerWeek": trainingDaysPerWeek,
            "restDaysPerWeek": restDaysPerWeek,
            "totalExpectedFull": trainingDaysPerWeek * weeks,
            "expectedPast": expectedPast,
            "trainedTotal": trainedTotal,
            "trainedOnScheduled": trainedOnScheduled,
            "missed": missedCount,
            "restDays": restCount,
            "consistency": consistency,
            "bestStreak": best_streak,
            "totalDays": weeks * 7,
            "pastDays": pastDays,
        },
    }


@router.get("/muscle-focus")
def get_muscle_focus(
    range: str = Query("THIS_WEEK", description="THIS_WEEK | LAST_WEEK | THIS_MONTH"),
    current_user: dict = Depends(get_current_user),
) -> dict:
    user_id = current_user["id"]

    # validate range first
    norm = range.strip().upper().replace(" ", "_")
    # allow camelCase
    low = range.strip().lower().replace(" ", "").replace("_", "").replace("-", "")
    if low in ("thisweek",):
        norm = "THIS_WEEK"
    elif low in ("lastweek",):
        norm = "LAST_WEEK"
    elif low in ("thismonth",):
        norm = "THIS_MONTH"
    if norm not in ("THIS_WEEK", "LAST_WEEK", "THIS_MONTH"):
        raise HTTPException(status_code=400, detail="range must be THIS_WEEK | LAST_WEEK | THIS_MONTH")

    # dev-user: return empty structure (no DB rows) after validation
    if user_id == "dev-user":
        groups = []
        for gid in GROUP_ORDER:
            meta = MUSCLE_META[gid]
            groups.append({**meta, "points": 0, "percentage": 0, "setsCount": 0, "exercises": []})
        return {
            "range": norm,
            "from": None,
            "to": None,
            "totalSets": 0,
            "totalPoints": 0,
            "skippedSets": 0,
            "groups": groups,
        }

    from_dt, to_dt = _date_range(norm)

    by_id, by_name = _fetch_exercises_map()
    custom_map = _fetch_custom_muscle_map(user_id)
    progress_rows = _fetch_progress(user_id, from_dt, to_dt)

    total_sets = len(progress_rows)
    skipped = 0

    # aggregate
    group_points: dict[str, float] = defaultdict(float)
    group_exercise_counter: dict[str, Counter] = {gid: Counter() for gid in GROUP_ORDER}

    for row in progress_rows:
        ex_id = row.get("exercise_id")
        ex_name = (row.get("exercise_name") or "").strip()
        raw = row.get("raw") or {}
        info = None
        if ex_id:
            info = by_id.get(str(ex_id))
        if info is None and ex_name:
            info = by_name.get(_normalize_muscle(ex_name))
        # fallback: custom routine map
        if info is None and ex_name:
            info = custom_map.get(_normalize_muscle(ex_name))
        # fallback: raw stored muscle info for future workouts (muscleGroups / primaryMuscles)
        if info is None and isinstance(raw, dict):
            mg = (
                raw.get("_muscleGroups")
                or raw.get("muscleGroups")
                or raw.get("muscle_groups")
                or raw.get("primaryMuscles")
                or raw.get("primary_muscles")
            )
            if isinstance(mg, list) and mg:
                info = {
                    "primary_muscles": mg,
                    "secondary_muscles": raw.get("_secondaryMuscleGroups") or raw.get("secondaryMuscles") or raw.get("secondary_muscles") or [],
                }
            elif isinstance(mg, str) and mg.strip():
                info = {"primary_muscles": [mg], "secondary_muscles": []}
        if info is None:
            skipped += 1
            continue

        primary = info.get("primary_muscles") or []
        secondary = info.get("secondary_muscles") or []

        # per-group max weight for this set (dedup)
        group_weight_this_set: dict[str, float] = {}
        for m in primary:
            grp = GRANULAR_TO_GROUP.get(_normalize_muscle(m))
            if not grp:
                continue
            # primary 1 overrides secondary 0.5
            if group_weight_this_set.get(grp, 0) < 1:
                group_weight_this_set[grp] = 1
        for m in secondary:
            grp = GRANULAR_TO_GROUP.get(_normalize_muscle(m))
            if not grp:
                continue
            if grp not in group_weight_this_set:
                group_weight_this_set[grp] = 0.5
            # if already 1, keep 1

        if not group_weight_this_set:
            skipped += 1
            continue

        for grp, w in group_weight_this_set.items():
            group_points[grp] += w
            # count exercise for this group
            if ex_name:
                group_exercise_counter[grp][ex_name] += 1

    total_points = sum(group_points.values())

    groups = []
    for gid in GROUP_ORDER:
        meta = MUSCLE_META[gid]
        pts = round(group_points.get(gid, 0), 2)
        pct = round((pts / total_points * 100) if total_points > 0 else 0, 1)
        # top 1-3 exercises for this group
        counter = group_exercise_counter[gid]
        top = counter.most_common(3)
        exercises = [{"name": name, "count": cnt} for name, cnt in top]
        # also need exercises as string array for backward compat
        exercises_str = [name for name, _ in top]

        groups.append({
            **meta,
            "points": pts,
            "percentage": pct,
            "setsCount": sum(counter.values()),
            "exercises": exercises,  # new shape
            "exercisesStr": exercises_str,  # compat
        })

    # For backward compat with existing UI that expects exercises as string[]
    # we will also ensure groups have exercisesStr; but frontend will adapt.

    return {
        "range": norm,
        "from": from_dt.isoformat(),
        "to": to_dt.isoformat(),
        "totalSets": total_sets - skipped if total_sets else 0,
        "totalSetsRaw": total_sets,
        "totalPoints": round(total_points, 2),
        "skippedSets": skipped,
        "groups": groups,
    }
