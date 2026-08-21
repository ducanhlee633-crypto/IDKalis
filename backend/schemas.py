from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from pydantic.alias_generators import to_camel


# Domain model: phản ánh 1 hàng trong table `exercises` của Supabase (dùng snake_case để khớp cột DB).
# Thường dùng cho nội bộ / seeding; không ràng buộc kiểu trả về API.
class Exercise(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: str | None = None
    name: str
    description: str = ""
    primary_muscles: list[str]
    secondary_muscles: list[str] = []
    movement_type: str
    input_type: str = "note"
    created_at: str | None = None


# Schema nhận dữ liệu từ client khi tạo bài tập mới (POST /api/exercises).
# Dùng alias_generator=to_camel để frontend gửi camelCase (primaryMuscles, movementType...) trong khi DB vẫn là snake_case.
class ExerciseCreate(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    name: str = Field(min_length=1)
    description: str = ""
    primary_muscles: list[str] = Field(min_length=1)
    secondary_muscles: list[str] = []
    movement_type: str
    input_type: str = "note"


# Schema trả về cho client (GET/POST). Kế thừa ExerciseCreate nên cũng xuất ra camelCase,
# thêm id + created_at do Supabase tự sinh.
class ExerciseResponse(ExerciseCreate):
    id: str
    created_at: str | None = None


# ------------------- Auth -------------------

# Schema nhận dữ liệu đăng ký: email và username chuẩn hoá về lowercase trước khi lưu
# (kiểm tra user có tồn tại hay không luôn case-insensitive).
class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=30)
    email: EmailStr
    password: str = Field(min_length=8)

    @field_validator("username")
    @classmethod
    def normalize_username(cls, value: str) -> str:
        return value.strip().lower()

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()


# Schema trả về thông tin user (không bao gồm email / password_hash để bảo vệ thông tin cá nhân)
class UserResponse(BaseModel):
    id: str
    username: str
    created_at: str | None = None


# Schema trả về khi login thành công: token + thông tin user hiện tại
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ------------------- Workouts -------------------

# Schema nhận dữ liệu khi lưu buổi tập (POST /api/workouts).
# Frontend gửi camelCase, DB lưu snake_case. session_number do backend tự sinh.
class WorkoutCreate(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    name: str = Field(min_length=1, description="Tên buổi tập")
    completed_sets: int = Field(ge=0, description="Số set hoàn thành (done=true)")
    avg_rpe: float | None = Field(default=None, ge=0, le=10, description="RPE trung bình trên set hoàn thành")
    duration_minutes: int = Field(ge=0, description="Thời lượng đã convert từ seconds sang minutes (round)")


# Schema trả về cho client sau khi lưu. Kế thừa WorkoutCreate nên cũng xuất camelCase.
class WorkoutResponse(WorkoutCreate):
    id: str
    user_id: str
    session_number: int
    created_at: str | None = None