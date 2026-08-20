import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from config import settings
from db import supabase

USERS_TABLE = "users"

# OAuth2: /token là endpoint login, các route protected sẽ dùng dependency get_current_user
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")


# ------------------- JWT (do Supabase Auth cấp) -------------------
def decode_token(token: str) -> str:
    """Giải mã access_token do Supabase Auth cấp, trả về user id (sub).
    Raise 401 nếu token hết hạn / không hợp lệ."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.supabase_jwt_secret, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise credentials_exception
    user_id = payload.get("sub")
    if not user_id:
        raise credentials_exception
    return user_id


# ------------------- Dependency cho route protected -------------------
def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """FastAPI dependency: lấy user hiện tại từ token (dùng cho /me và các route cần đăng nhập).
    Token chỉ được cấp sau khi user đã xác minh email (Supabase chặn khi chưa verify)."""
    user_id = decode_token(token)
    data = supabase.table(USERS_TABLE).select("*").eq("id", user_id).execute()
    if not data.data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return data.data[0]