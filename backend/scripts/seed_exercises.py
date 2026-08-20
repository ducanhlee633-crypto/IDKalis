# ============================================================
# Script seed: chạy 1 lần để đổ 12 bài tập mẫu vào table `exercises`
# Cách chạy (từ folder backend/): uv run python -m scripts.seed_exercises
# Idempotent: không insert trùng tên bài tập đã có.
# ============================================================
from db import supabase

EXERCISES = [
    {
        "name": "Push-Up",
        "description": "Classic pushing exercise. Lower chest to ground with elbows at 45 degrees, press back up with a tight core.",
        "primary_muscles": ["Chest", "Triceps"],
        "secondary_muscles": ["Anterior Deltoids", "Core"],
        "movement_type": "PUSH",
        "input_type": "note",
    },
    {
        "name": "Pull-Up",
        "description": "Vertical pulling movement. Pull chin over the bar with controlled tempo, avoid kipping.",
        "primary_muscles": ["Lats", "Biceps"],
        "secondary_muscles": ["Rear Deltoids", "Forearms", "Core"],
        "movement_type": "PULL",
        "input_type": "note",
    },
    {
        "name": "Ring Dips",
        "description": "Weighted ring dips with controlled descent. Lock out fully at the top with rings turned out.",
        "primary_muscles": ["Chest", "Triceps"],
        "secondary_muscles": ["Anterior Deltoids", "Core"],
        "movement_type": "PUSH",
        "input_type": "weight",
    },
    {
        "name": "Planche Lean",
        "description": "Lean forward on straight arms with protracted scapula. Maintain hollow body position with hands turned out slightly.",
        "primary_muscles": ["Anterior Deltoids"],
        "secondary_muscles": ["Chest", "Serratus Anterior"],
        "movement_type": "PUSH",
        "input_type": "time",
    },
    {
        "name": "Front Lever",
        "description": "Hang from the bar with body straight and parallel to the ground. Hold with lats fully engaged.",
        "primary_muscles": ["Lats", "Core"],
        "secondary_muscles": ["Rear Deltoids", "Biceps"],
        "movement_type": "PULL",
        "input_type": "time",
    },
    {
        "name": "Dragon Flag",
        "description": "Lower and raise a straight body from a bench or pole. Core dominant with slow eccentric control.",
        "primary_muscles": ["Core", "Hip Flexors"],
        "secondary_muscles": ["Lats", "Obliques"],
        "movement_type": "CORE",
        "input_type": "note",
    },
    {
        "name": "Pistol Squat",
        "description": "Single leg squat to full depth. Drive through the heel and keep the standing leg straight on the way down.",
        "primary_muscles": ["Quads", "Glutes"],
        "secondary_muscles": ["Calves", "Core"],
        "movement_type": "LEGS",
        "input_type": "note",
    },
    {
        "name": "Hanging Leg Raises",
        "description": "Hang from the bar and raise straight legs to horizontal or above. Control the negative phase.",
        "primary_muscles": ["Core", "Hip Flexors"],
        "secondary_muscles": ["Lats", "Obliques"],
        "movement_type": "CORE",
        "input_type": "note",
    },
    {
        "name": "Handstand Push-Up",
        "description": "Vertical push in a handstand position. Lower until the head touches the ground and press back up.",
        "primary_muscles": ["Shoulders", "Triceps"],
        "secondary_muscles": ["Upper Chest", "Core"],
        "movement_type": "PUSH",
        "input_type": "note",
    },
    {
        "name": "Muscle-Up",
        "description": "Explosive transition from pull-up to dip on the bar or rings. Drive high then turn the wrists over.",
        "primary_muscles": ["Lats", "Triceps"],
        "secondary_muscles": ["Chest", "Biceps", "Core"],
        "movement_type": "PULL",
        "input_type": "note",
    },
    {
        "name": "Nordic Hamstring Curls",
        "description": "Eccentric-focused hamstring curls. Lower yourself as slowly as possible with hips fully extended.",
        "primary_muscles": ["Hamstrings"],
        "secondary_muscles": ["Glutes", "Calves"],
        "movement_type": "LEGS",
        "input_type": "note",
    },
    {
        "name": "Ab Wheel Rollout",
        "description": "Roll the wheel out to full extension while keeping the hips tucked, then pull back with the core.",
        "primary_muscles": ["Core", "Lats"],
        "secondary_muscles": ["Shoulders", "Triceps"],
        "movement_type": "CORE",
        "input_type": "note",
    },
]


def main() -> None:
    data = supabase.table("exercises").select("name").execute()
    existing = {row["name"] for row in data.data}

    to_insert = [ex for ex in EXERCISES if ex["name"] not in existing]
    if not to_insert:
        print(f"Already seeded ({len(existing)} exercises). Nothing to do.")
        return

    result = supabase.table("exercises").insert(to_insert).execute()
    print(f"Seeded {len(result.data)} exercises. Total now: {len(existing) + len(result.data)}")


if __name__ == "__main__":
    main()