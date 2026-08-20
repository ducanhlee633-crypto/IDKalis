-- ============================================================
-- Migration 002: tạo table `users` (Authentication)
-- Chạy thủ công trong Supabase Dashboard > SQL Editor
-- ============================================================

-- Table lưu người dùng: email luôn lưu ở dạng lowercase (backend chuẩn hoá trước khi insert)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,           -- tên hiển thị, chuẩn hoá lowercase
  email text unique not null,
  password_hash text not null,             -- bcrypt hash, không bao giờ lưu plaintext
  created_at timestamptz default now()
);

-- Bật Row Level Security: chặn mọi truy cập qua API (khác với `exercises`, users KHÔNG public).
-- Backend chỉ đọc/ghi bằng service_role key nên không cần policy nào cho anon.
alter table users enable row level security;
