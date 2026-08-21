import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from config import settings
from db import supabase_admin

USERS_TABLE = "users"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")

# Hỗ trợ test local không cần Supabase (frontend/lib/auth.js:6)
DEV_TOKEN = "dev-quick-login-token"
DEV_USER_ID = "dev-user"


def _decode_via_supabase(token: str) -> str | None:
    """Fallback: xác thực qua Supabase Auth API (hỗ trợ cả HS256/ES256, JWKS)."""
    try:
        res = supabase_admin.auth.get_user(token)
        user_obj = None
        if res is not None:
            if hasattr(res, "user") and res.user:
                user_obj = res.user
            elif isinstance(res, dict) and res.get("user"):
                user_obj = res["user"]
            elif hasattr(res, "id"):
                user_obj = res
        if user_obj:
            uid = getattr(user_obj, "id", None)
            if uid is None and isinstance(user_obj, dict):
                uid = user_obj.get("id")
            if uid:
                return str(uid)
    except Exception:
        return None
    return None


def decode_token(token: str) -> str:
    """Trả về user_id (sub) từ access_token. Ưu tiên local verify, fallback Supabase API."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Dev token cho phép test UI không cần DB
    if token == DEV_TOKEN:
        return DEV_USER_ID

    # Thiếu secret -> không thể verify local, thử qua Supabase API ngay
    if not settings.supabase_jwt_secret:
        uid = _decode_via_supabase(token)
        if uid:
            return uid
        raise credentials_exception

    # Thử verify local với HS256 ( Supabase project này dùng HS256, đã verify anon token ok )
    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        user_id = payload.get("sub")
        if user_id:
            return str(user_id)
        raise credentials_exception
    except jwt.ExpiredSignatureError:
        # Hết hạn thì không fallback – yêu cầu login lại
        raise credentials_exception
    except jwt.PyJWTError:
        # Secret sai / alg khác (ES256/JWKS) -> fallback Supabase API
        uid = _decode_via_supabase(token)
        if uid:
            return uid
        raise credentials_exception


def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """Lấy user hiện tại, auto-create public.users nếu chưa có."""
    user_id = decode_token(token)

    # Dev user – mock để test workouts không cần FK auth.users
    if user_id == DEV_USER_ID:
        return {"id": DEV_USER_ID, "username": "dev_user", "created_at": None}

    data = supabase_admin.table(USERS_TABLE).select("*").eq("id", user_id).execute()
    if data.data:
        return data.data[0]

    try:
        res = supabase_admin.auth.admin.get_user_by_id(user_id)
        if res and hasattr(res, "user") and res.user:
            meta = getattr(res.user, "user_metadata", {}) or {}
            fallback_username = (
                meta.get("username")
                or (res.user.email.split("@")[0] if res.user.email else f"user_{user_id[:8]}")
            ).lower()
            row = (
                supabase_admin.table(USERS_TABLE)
                .upsert({"id": user_id, "username": fallback_username})
                .execute()
            )
            if row.data:
                return row.data[0]
    except Exception:
        pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="User not found",
        headers={"WWW-Authenticate": "Bearer"},
    )
