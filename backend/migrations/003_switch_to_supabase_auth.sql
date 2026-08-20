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

-- Bật RLS: backend đọc/ghi bằng service_role key (RLS không ảnh hưởng), anon không truy cập được.
alter table users enable row level security;
