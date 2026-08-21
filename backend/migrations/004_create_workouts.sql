-- ============================================================
-- Migration 004: tạo table `workouts` (Track Workout)
-- Chạy thủ công trong Supabase Dashboard > SQL Editor
-- Yêu cầu: 1. tên buổi tập, 2. số set (completed), 3. rpe trung bình, 4. buổi tập thứ bao nhiêu
-- Bổ sung: duration_minutes (đổi từ timerSeconds), FK tới users(id) bắt buộc
-- ============================================================

create table if not exists workouts (
  id uuid primary key default gen_random_uuid(),
  -- FK tới auth.users (bảng users mặc định của Supabase) để check email hợp lệ.
  -- Trước đó từng là references users(id) nhưng nếu check username ở public.users thì không valid
  -- khi profile chưa đồng bộ; dùng auth.users đảm bảo luôn tồn tại khi đã xác thực.
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, -- 1. tên buổi tập
  completed_sets int not null check (completed_sets >= 0), -- 2. số set hoàn thành (done=true)
  avg_rpe numeric(3,1) check (avg_rpe is null or (avg_rpe >= 0 and avg_rpe <= 10)), -- 3. rpe trung bình (chỉ set done)
  session_number int not null check (session_number > 0), -- 4. buổi tập thứ bao nhiêu (per user, auto increment)
  duration_minutes int not null check (duration_minutes >= 0), -- timerSeconds convert sang minute (round)
  created_at timestamptz default now(),
  unique (user_id, session_number)
);

create index if not exists idx_workouts_user_id on workouts(user_id);
create index if not exists idx_workouts_user_session on workouts(user_id, session_number);

alter table workouts enable row level security;

-- Policies: user chỉ thao tác trên workout của chính mình (backend service_role bypass RLS)
drop policy if exists "Users can view own workouts" on workouts;
create policy "Users can view own workouts"
  on workouts for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own workouts" on workouts;
create policy "Users can insert own workouts"
  on workouts for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own workouts" on workouts;
create policy "Users can update own workouts"
  on workouts for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own workouts" on workouts;
create policy "Users can delete own workouts"
  on workouts for delete
  using (auth.uid() = user_id);
