from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from supabase_auth.errors import AuthApiError

from auth import get_current_user
from db import supabase
from schemas import Token, UserCreate, UserResponse

# Router auth: đăng ký (gửi email xác minh), đăng nhập (lấy token) và kiểm tra token
router = APIRouter(tags=["auth"])

USERS_TABLE = "users"


def _profile_by_username(username: str) -> str | None:
    """Tra id trong bảng users theo username (dùng cho login bằng username)."""
    data = supabase.table(USERS_TABLE).select("id").eq("username", username).execute()
    return data.data[0]["id"] if data.data else None


def _email_by_id(user_id: str) -> str | None:
    """Lấy email từ auth.users qua admin API (cần service_role key)."""
    user = supabase.auth.admin.get_user_by_id(user_id)
    return user.user.email


# POST /register — tạo user mới qua Supabase Auth.
# Supabase sẽ gửi email xác minh; user phải bấm link xác minh mới login được.
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate) -> dict:
    username = payload.username.lower()
    if _profile_by_username(username):
        raise HTTPException(status_code=409, detail="Username already taken")

    try:
        res = supabase.auth.sign_up(
            {
                "email": payload.email,
                "password": payload.password,
                "options": {"data": {"username": username}},
            }
        )
    except AuthApiError as e:
        if e.code == "user_already_exists":
            raise HTTPException(status_code=409, detail="Email already registered")
        if e.code == "weak_password":
            raise HTTPException(status_code=422, detail=e.message)
        raise HTTPException(status_code=400, detail=e.message)

    user_id = res.user.id
    row = supabase.table(USERS_TABLE).insert({"id": user_id, "username": username}).execute()
    if not row.data:
        raise HTTPException(status_code=500, detail="Failed to create user profile")
    return {"id": user_id, "username": username, "created_at": row.data[0].get("created_at")}


# POST /token — đăng nhập (form data theo chuẩn OAuth2, tương thích Swagger UI).
# Trường "username" của form chấp nhận cả email hoặc username.
# Nếu email chưa xác minh, Supabase từ chối cấp token (403).
@router.post("/token", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()) -> dict:
    identifier = form_data.username.lower()
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
        res = supabase.auth.sign_in_with_password({"email": email, "password": form_data.password})
    except AuthApiError as e:
        if e.code == "email_not_confirmed":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email not verified. Please check your inbox and confirm before logging in.",
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not res.session:
        raise HTTPException(status_code=401, detail="Login failed")
    user = res.user
    data = supabase.table(USERS_TABLE).select("*").eq("id", user.id).execute()
    if not data.data:
        raise HTTPException(status_code=500, detail="User profile not found")
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