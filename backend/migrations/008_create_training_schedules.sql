-- ============================================================
-- Migration 008: tạo table `training_schedules` (Weekly Training Schedule)
-- Chạy thủ công trong Supabase Dashboard > SQL Editor
-- Yêu cầu: mỗi user có lịch tập cố định 7 ngày trong tuần,
--          mỗi ngày assign 1 routine (nullable = Rest Day)
-- Thiết kế chuẩn hoá: (user_id, day_of_week) unique,
--          routine_id nullable FK -> routines(id) ON DELETE SET NULL
-- day_of_week: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
-- ============================================================

create table if not exists training_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  routine_id uuid references routines(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, day_of_week)
);

create index if not exists idx_training_schedules_user on training_schedules(user_id);
create index if not exists idx_training_schedules_user_day on training_schedules(user_id, day_of_week);
create index if not exists idx_training_schedules_routine on training_schedules(routine_id);

-- trigger updated_at
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_training_schedules_updated_at on training_schedules;
create trigger trg_training_schedules_updated_at
  before update on training_schedules
  for each row execute function set_updated_at();

alter table training_schedules enable row level security;

drop policy if exists "Users can view own training_schedules" on training_schedules;
create policy "Users can view own training_schedules"
  on training_schedules for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own training_schedules" on training_schedules;
create policy "Users can insert own training_schedules"
  on training_schedules for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own training_schedules" on training_schedules;
create policy "Users can update own training_schedules"
  on training_schedules for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own training_schedules" on training_schedules;
create policy "Users can delete own training_schedules"
  on training_schedules for delete
  using (auth.uid() = user_id);
