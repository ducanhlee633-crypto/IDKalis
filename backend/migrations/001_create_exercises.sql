-- ============================================================
-- Migration 001: tạo table `exercises` (Exercise Library)
-- Chạy thủ công trong Supabase Dashboard > SQL Editor
-- ============================================================

-- Table lưu bài tập: cột text[] = mảng (đổi thành mảng trong JSON khi API trả về)
create table if not exists exercises (
  id uuid primary key default gen_random_uuid(),  -- id tự sinh
  name text not null,                             -- Exercise Name
  description text default '',                    -- Description
  primary_muscles text[] not null,                -- Primary Muscles (bắt buộc)
  secondary_muscles text[] default '{}',          -- Secondary Muscles
  movement_type text not null,                    -- Movement Type: PUSH / PULL / LEGS / CORE
  input_type text not null default 'note',        -- Input Type: note / weight / time
  created_at timestamptz default now()            -- thời điểm tạo
);

-- Bật Row Level Security (mặc định chặn mọi truy cập qua API)
alter table exercises enable row level security;

-- Policy: cho phép đọc công khai (anon key cũng đọc được),
-- ghi chỉ qua service_role key (backend) — bảo mật theo kiến trúc hiện tại
create policy "exercises_public_read"
  on exercises for select
  using (true);