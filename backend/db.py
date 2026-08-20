from supabase import create_client

from config import settings

# Cấu hình kết nối Supabase từ pydantic-settings (đọc từ file .env)
SUPABASE_URL = settings.supabase_url
SUPABASE_SERVICE_ROLE_KEY = settings.supabase_service_role_key

# Client supabase dùng service_role key (quyền cao nhất, chỉ dùng phía server, KHÔNG để lộ ra frontend)
# Các file khác import từ đây: `from db import supabase`
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
