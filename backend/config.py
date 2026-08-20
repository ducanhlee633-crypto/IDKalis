import secrets

from pydantic_settings import BaseSettings, SettingsConfigDict


# Cấu hình chung của backend qua pydantic-settings.
# Đọc biến môi trường từ file .env (xem .env.example để biết danh sách đầy đủ).
class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""

    # JWT secret của Supabase (Dashboard > Settings > API > JWT Secret).
    # Dùng để xác minh access_token do Supabase Auth cấp — không phải secret tự sinh.
    supabase_jwt_secret: str = ""


settings = Settings()
