-- ============================================================
-- Migration 005: fix FK workouts.user_id -> auth.users(id)
-- Nếu đã chạy 004 với references users(id) thì cần chạy file này
-- để chuyển sang auth.users (bảng users mặc định của Supabase) cho check email valid
-- Nếu chưa chạy 004 thì 004 đã đúng, file này chạy idempotent
-- ============================================================

-- Xóa FK cũ nếu tồn tại (tên FK tự sinh nên phải dò)
do $$
declare
  r record;
begin
  for r in (
    select conname, conrelid::regclass as tbl
    from pg_constraint
    where contype = 'f'
      and conrelid = 'public.workouts'::regclass
      and confrelid = 'public.users'::regclass
  ) loop
    execute format('alter table public.workouts drop constraint %I', r.conname);
  end loop;
end $$;

-- Thêm FK mới tới auth.users nếu chưa có
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.workouts'::regclass
      and confrelid = 'auth.users'::regclass
      and contype = 'f'
  ) then
    alter table public.workouts
      add constraint workouts_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end $$;

-- Đảm bảo RLS vẫn đúng (auth.uid() = user_id so khớp auth.users.id)
-- Không cần đổi policy
