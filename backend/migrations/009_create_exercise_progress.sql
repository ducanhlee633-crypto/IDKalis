-- ============================================================
-- Migration 009: tạo table `exercise_progress` (per-set, normalized)
-- Chạy thủ công trong Supabase Dashboard > SQL Editor
-- Yêu cầu: lưu progress từng bài tập per-set để hiển thị previous
--          khi tập buổi mới: số rep / hold_seconds / weight+reps (jsonb)
-- Thiết kế: 1 row = 1 set đã done (done=true mới lưu), gắn workout_id
--          exercise_id nullable FK -> exercises(id) SET NULL,
--          exercise_name denormalized để routine custom (cx-...) vẫn lưu được
--          raw jsonb lưu snapshot gốc của set (time/weight/note/reps/rpe)
-- ============================================================

create table if not exists exercise_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_id uuid not null references workouts(id) on delete cascade,
  exercise_id uuid references exercises(id) on delete set null,
  exercise_name text not null check (char_length(btrim(exercise_name)) > 0),
  input_type text not null check (input_type in ('time','weight','note','reps_time')),
  set_number int not null check (set_number >= 1),
  reps int check (reps is null or reps >= 0),
  hold_seconds int check (hold_seconds is null or hold_seconds >= 0),
  weight numeric check (weight is null or weight >= 0),
  weight_raw text,
  rpe numeric(3,1) check (rpe is null or (rpe >= 0 and rpe <= 10)),
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  unique (workout_id, exercise_name, set_number)
);

create index if not exists idx_exercise_progress_user on exercise_progress(user_id);
create index if not exists idx_exercise_progress_workout on exercise_progress(workout_id);
create index if not exists idx_exercise_progress_exercise_id on exercise_progress(exercise_id);
create index if not exists idx_exercise_progress_user_ex_created on exercise_progress(user_id, exercise_name, created_at desc);
create index if not exists idx_exercise_progress_user_created on exercise_progress(user_id, created_at desc);

alter table exercise_progress enable row level security;

drop policy if exists "Users can view own exercise_progress" on exercise_progress;
create policy "Users can view own exercise_progress"
  on exercise_progress for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own exercise_progress" on exercise_progress;
create policy "Users can insert own exercise_progress"
  on exercise_progress for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own exercise_progress" on exercise_progress;
create policy "Users can update own exercise_progress"
  on exercise_progress for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own exercise_progress" on exercise_progress;
create policy "Users can delete own exercise_progress"
  on exercise_progress for delete
  using (auth.uid() = user_id);
