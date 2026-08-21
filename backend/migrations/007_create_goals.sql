-- ============================================================
-- Migration 007: tạo table `goals` (Calisthenics Goals)
-- Chạy thủ công trong Supabase Dashboard > SQL Editor
-- Yêu cầu: title, metric_type/value, time_amount/unit, deadline (timestamptz),
--          category, status, progress, current, target
-- Mỗi goal gắn với user (FK auth.users), RLS per-user, service_role bypass
-- ============================================================

create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) > 0),
  metric_type text not null check (metric_type in ('seconds','weighted','reps')),
  metric_value numeric not null check (metric_value > 0),
  time_amount int not null check (time_amount > 0),
  time_unit text not null check (time_unit in ('weeks','months')),
  deadline timestamptz not null,
  -- fields hiển thị suy ra nhưng lưu để UI không vỡ
  category text not null check (category in ('Time Skill','Strength','Endurance')),
  status text not null default 'Starting' check (status in ('Starting','In Progress','Near Completion','Completed')),
  progress int not null default 0 check (progress >= 0 and progress <= 100),
  current text not null default 'Not started',
  target text not null,
  created_at timestamptz default now()
);

create index if not exists idx_goals_user_id on goals(user_id);
create index if not exists idx_goals_user_created on goals(user_id, created_at desc);
create index if not exists idx_goals_deadline on goals(user_id, deadline);

alter table goals enable row level security;

drop policy if exists "Users can view own goals" on goals;
create policy "Users can view own goals"
  on goals for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own goals" on goals;
create policy "Users can insert own goals"
  on goals for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own goals" on goals;
create policy "Users can update own goals"
  on goals for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own goals" on goals;
create policy "Users can delete own goals"
  on goals for delete
  using (auth.uid() = user_id);
