from supabase import create_client

from config import settings

# Cấu hình kết nối Supabase từ pydantic-settings (đọc từ file .env)
SUPABASE_URL = settings.supabase_url
SUPABASE_SERVICE_ROLE_KEY = settings.supabase_service_role_key
SUPABASE_ANON_KEY = settings.supabase_anon_key or settings.supabase_service_role_key

# 1. Admin client: dùng service_role key cho các thao tác quản trị DB (vượt RLS) và Admin Auth API.
# KHÔNG gọi sign_in_with_password trên client này để tránh bị ghi đè Authorization header.
supabase_admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# 2. Auth client: dùng cho đăng ký (sign_up) và đăng nhập (sign_in_with_password) người dùng.
supabase_auth = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# Giữ biến `supabase` trỏ tới `supabase_admin` để tương thích ngược với các module khác
supabase = supabase_admin
