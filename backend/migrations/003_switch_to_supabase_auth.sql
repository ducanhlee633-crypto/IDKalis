-- ============================================================
-- Migration 003: chuyển sang Supabase Auth (GoTrue) + email verification
-- Chạy thủ công trong Supabase Dashboard > SQL Editor
-- ============================================================
-- Giờ đây Supabase Auth (bảng auth.users) quản lý email/password/verification.
-- Bảng `users` chỉ còn là profile: id tham chiếu auth.users, lưu username.
-- Chú ý: drop table cũ (nếu đã chạy 002, dữ liệu users cũ bị xoá — project đang dev nên chấp nhận được).

drop table if exists users;

create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  created_at timestamptz default now()
);

-- Bật RLS
alter table users enable row level security;

-- Policies cho users table:
-- 1. Cho phép tất cả user đã authenticate hoặc anon xem profile công khai (username, id, created_at)
create policy "Allow public read access to user profiles"
  on users for select
  using (true);

-- 2. Cho phép user insert profile của chính mình
create policy "Allow users to insert their own profile"
  on users for insert
  with check (auth.uid() = id);

-- 3. Cho phép user update profile của chính mình
create policy "Allow users to update their own profile"
  on users for update
  using (auth.uid() = id);
