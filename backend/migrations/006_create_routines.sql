-- ============================================================
-- Migration 006: tạo table `routines` (Create Routine)
-- Chạy thủ công trong Supabase Dashboard > SQL Editor
-- Yêu cầu: name, category (PUSH/PULL/CORE/LEGS/SKILLS), exercises (jsonb), note, time_est (int minutes)
-- Mỗi routine gắn với user (FK auth.users), RLS per-user, exercises lưu snapshot gồm reps/sets
-- ============================================================

create table if not exists routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) > 0),
  category text not null check (category in ('PUSH','PULL','CORE','LEGS','SKILLS')),
  exercises jsonb not null default '[]'::jsonb, -- snapshot: [{id, name, target, inputType, description, muscleGroups, tips, note, defaultSets:[{time/weight/note, reps, rpe}]}]
  note text default '',
  time_est int not null check (time_est >= 0), -- locked integer minutes (frontend select)
  created_at timestamptz default now()
);

create index if not exists idx_routines_user_id on routines(user_id);
create index if not exists idx_routines_user_created on routines(user_id, created_at desc);
create index if not exists idx_routines_category on routines(category);

alter table routines enable row level security;

-- Policies: user chỉ thao tác trên routine của chính mình (backend service_role bypass RLS)
drop policy if exists "Users can view own routines" on routines;
create policy "Users can view own routines"
  on routines for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own routines" on routines;
create policy "Users can insert own routines"
  on routines for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own routines" on routines;
create policy "Users can update own routines"
  on routines for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own routines" on routines;
create policy "Users can delete own routines"
  on routines for delete
  using (auth.uid() = user_id);
