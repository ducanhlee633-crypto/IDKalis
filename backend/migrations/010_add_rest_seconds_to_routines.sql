-- ============================================================
-- Migration 010: bổ sung restSeconds per-exercise cho routines
-- Chạy thủ công trong Supabase Dashboard > SQL Editor (optional)
-- routines.exercises là jsonb snapshot, không cần ALTER COLUMN.
-- Mỗi exercise trong array giờ có thêm field restSeconds (int giây, 0-600, mặc định 90):
--   [{id, name, target, inputType, defaultSets:[...], supersetId, restSeconds, rest_seconds, note}]
-- Giữ backward compat: routine cũ thiếu restSeconds => frontend fallback 90s (REST_DEFAULT_SECONDS)
-- và ActiveWorkoutPage dùng getRestForExercise(ex) ?? 90
-- ============================================================

-- Chỉ cập nhật comment cho table để document field mới, không thay đổi schema
comment on column routines.exercises is 'Snapshot exercises với reps/sets + restSeconds per-exercise (0-600s, default 90). Ví dụ: [{id, name, target, inputType, defaultSets:[{reps,time,weight,note,rpe}], supersetId, restSeconds:90}]';
-- Không cần ALTER TABLE vì jsonb flexible; nếu muốn enforce check có thể add constraint nhưng để optional:
-- alter table routines drop constraint if exists exercises_rest_check;
-- Không enforce để giữ compat với data cũ.
