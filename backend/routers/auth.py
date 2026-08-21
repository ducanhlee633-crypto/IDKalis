from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from supabase_auth.errors import AuthApiError

from auth import get_current_user
from db import supabase_admin, supabase_auth
from schemas import Token, UserCreate, UserResponse

# Router auth: đăng ký (gửi email xác minh), đăng nhập (lấy token) và kiểm tra token
router = APIRouter(tags=["auth"])

USERS_TABLE = "users"


def _profile_by_username(username: str) -> str | None:
    """Tra id trong bảng users theo username (dùng cho login bằng username)."""
    try:
        data = (
            supabase_admin.table(USERS_TABLE)
            .select("id")
            .eq("username", username.strip().lower())
            .execute()
        )
        return data.data[0]["id"] if data.data else None
    except Exception:
        return None


def _email_by_id(user_id: str) -> str | None:
    """Lấy email từ auth.users qua admin API (cần service_role key)."""
    try:
        res = supabase_admin.auth.admin.get_user_by_id(user_id)
        if res and hasattr(res, "user") and res.user:
            return res.user.email
    except Exception:
        pass
    return None


# POST /register — tạo user mới qua Supabase Auth.
# Supabase sẽ gửi email xác minh; user phải bấm link xác minh mới login được.
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate) -> dict:
    username = payload.username.strip().lower()
    if _profile_by_username(username):
        raise HTTPException(status_code=409, detail="Username already taken")

    try:
        res = supabase_auth.auth.sign_up(
            {
                "email": payload.email.strip().lower(),
                "password": payload.password,
                "options": {"data": {"username": username}},
            }
        )
    except AuthApiError as e:
        msg = (e.message or "").lower()
        code = (getattr(e, "code", "") or "").lower()
        if code == "user_already_exists" or "already registered" in msg or "already exists" in msg:
            raise HTTPException(status_code=409, detail="Email already registered")
        if code == "weak_password" or "weak password" in msg:
            raise HTTPException(status_code=422, detail=e.message)
        raise HTTPException(status_code=400, detail=e.message or "Registration failed")

    user_id = res.user.id
    row = (
        supabase_admin.table(USERS_TABLE)
        .upsert({"id": user_id, "username": username})
        .execute()
    )
    if not row.data:
        raise HTTPException(status_code=500, detail="Failed to create user profile")
    return {"id": user_id, "username": username, "created_at": row.data[0].get("created_at")}


# POST /token — đăng nhập (form data theo chuẩn OAuth2, tương thích Swagger UI).
# Trường "username" của form chấp nhận cả email hoặc username.
# Nếu email chưa xác minh, Supabase từ chối cấp token (403).
@router.post("/token", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()) -> dict:
    identifier = form_data.username.strip().lower()
    email = identifier if "@" in identifier else None
    if not email:
        user_id = _profile_by_username(identifier)
        email = _email_by_id(user_id) if user_id else None

    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        res = supabase_auth.auth.sign_in_with_password(
            {"email": email, "password": form_data.password}
        )
    except AuthApiError as e:
        msg = (e.message or "").lower()
        code = (getattr(e, "code", "") or "").lower()
        if (
            code == "email_not_confirmed"
            or "email not confirmed" in msg
            or "not confirmed" in msg
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email not verified. Please check your inbox and confirm before logging in.",
            )
        if (
            code == "invalid_credentials"
            or "invalid login credentials" in msg
            or "invalid credentials" in msg
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message or "Login failed",
        )

    if not res.session:
        raise HTTPException(status_code=401, detail="Login failed")

    user = res.user
    data = supabase_admin.table(USERS_TABLE).select("*").eq("id", user.id).execute()
    if not data.data:
        # Tự động phục hồi profile nếu bản ghi chưa có trong bảng users
        user_meta = getattr(user, "user_metadata", {}) or {}
        fallback_username = (
            user_meta.get("username")
            or (email.split("@")[0] if email else f"user_{user.id[:8]}")
        ).lower()
        row = (
            supabase_admin.table(USERS_TABLE)
            .upsert({"id": user.id, "username": fallback_username})
            .execute()
        )
        profile = (
            row.data[0]
            if row.data
            else {"username": fallback_username, "created_at": None}
        )
    else:
        profile = data.data[0]

    return {
        "access_token": res.session.access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": profile["username"],
            "created_at": profile.get("created_at"),
        },
    }


# GET /me — kiểm tra token, trả về thông tin user hiện tại
@router.get("/me", response_model=UserResponse)
def me(current_user: dict = Depends(get_current_user)) -> dict:
    return {
        "id": current_user["id"],
        "username": current_user["username"],
        "created_at": current_user.get("created_at"),
    }