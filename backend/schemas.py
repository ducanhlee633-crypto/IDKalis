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
# Mở rộng: exercises chứa per-set detail để lưu vào exercise_progress (1 row = 1 set done=true).
class WorkoutCreate(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    name: str = Field(min_length=1, description="Tên buổi tập")
    completed_sets: int = Field(ge=0, description="Số set hoàn thành (done=true)")
    avg_rpe: float | None = Field(default=None, ge=0, le=10, description="RPE trung bình trên set hoàn thành")
    duration_minutes: int = Field(ge=0, description="Thời lượng đã convert từ seconds sang minutes (round)")
    # Per-exercise sets để lưu exercise_progress — chỉ set done=true mới được persist
    # Shape FE gửi: [{exerciseId?, exerciseName, inputType, sets:[{reps?, time?, weight?, note?, rpe?, done}]}]
    exercises: list[dict] | None = Field(default=None, description="Per-exercise sets để lưu exercise_progress")


# Schema trả về cho client sau khi lưu. Kế thừa WorkoutCreate nên cũng xuất camelCase.
class WorkoutResponse(WorkoutCreate):
    id: str
    user_id: str
    session_number: int
    created_at: str | None = None


# ------------------- Exercise Progress -------------------

# 1 row = 1 set done=true trong exercise_progress
class ExerciseProgressCreate(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    exercise_id: str | None = Field(default=None, description="FK exercises.id, nullable cho routine custom cx-...")
    exercise_name: str = Field(min_length=1, description="Tên bài tập (denormalized)")
    input_type: str = Field(description="time|weight|note|reps_time")
    set_number: int = Field(ge=1, description="1-indexed")
    reps: int | None = Field(default=None, ge=0)
    hold_seconds: int | None = Field(default=None, ge=0)
    weight: float | None = Field(default=None, ge=0)
    weight_raw: str | None = None
    rpe: float | None = Field(default=None, ge=0, le=10)
    raw: dict = Field(default_factory=dict, description="Snapshot gốc {time, weight, note, reps, rpe, done}")

    @field_validator("input_type")
    @classmethod
    def normalize_input_type(cls, value: str) -> str:
        v = value.strip().lower()
        allowed = {"time", "weight", "note", "reps_time"}
        if v not in allowed:
            raise ValueError(f"input_type must be one of {', '.join(sorted(allowed))}")
        return v


class ExerciseProgressResponse(ExerciseProgressCreate):
    id: str
    user_id: str
    workout_id: str
    created_at: str | None = None


# ------------------- Routines -------------------

# Schema nhận dữ liệu khi tạo routine (POST /api/routines).
# Frontend gửi camelCase (timeEst), DB lưu snake_case (time_est).
# exercises là snapshot jsonb: mỗi exercise gồm reps/sets (defaultSets) để giữ đủ thông tin tập.
class RoutineCreate(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    name: str = Field(min_length=1, description="Tên routine")
    category: str = Field(description="PUSH/PULL/CORE/LEGS/SKILLS")
    exercises: list[dict] = Field(default_factory=list, description="Snapshot exercises với reps/sets")
    note: str = ""
    time_est: int = Field(ge=0, description="Time estimate minutes (locked number)")

    @field_validator("category")
    @classmethod
    def normalize_category(cls, value: str) -> str:
        v = value.strip().upper()
        allowed = {"PUSH", "PULL", "CORE", "LEGS", "SKILLS"}
        if v not in allowed:
            raise ValueError(f"category must be one of {', '.join(sorted(allowed))}")
        return v


# Schema trả về cho client. Kế thừa RoutineCreate nên cũng xuất camelCase.
class RoutineResponse(RoutineCreate):
    id: str
    user_id: str
    created_at: str | None = None


# ------------------- Goals -------------------

# Schema nhận dữ liệu khi tạo goal (POST /api/goals).
# Frontend gửi camelCase, DB lưu snake_case. deadline/category/target do backend tự sinh.
class GoalCreate(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    title: str = Field(min_length=1, description="Tên goal")
    metric_type: str = Field(description="seconds|weighted|reps")
    metric_value: float = Field(gt=0, description="Target value")
    time_amount: int = Field(gt=0, description="Estimated time amount")
    time_unit: str = Field(description="weeks|months")

    @field_validator("metric_type")
    @classmethod
    def normalize_metric_type(cls, value: str) -> str:
        v = value.strip().lower()
        allowed = {"seconds", "weighted", "reps"}
        if v not in allowed:
            raise ValueError(f"metric_type must be one of {', '.join(sorted(allowed))}")
        return v

    @field_validator("time_unit")
    @classmethod
    def normalize_time_unit(cls, value: str) -> str:
        v = value.strip().lower()
        allowed = {"weeks", "months"}
        if v not in allowed:
            raise ValueError(f"time_unit must be one of {', '.join(sorted(allowed))}")
        return v


# Schema trả về cho client. Kế thừa GoalCreate nên cũng xuất camelCase.
class GoalResponse(GoalCreate):
    id: str
    user_id: str
    category: str
    status: str
    progress: int
    current: str
    target: str
    deadline: str
    created_at: str | None = None


# ------------------- Training Schedules -------------------

# Schema nhận dữ liệu khi cập nhật 1 ngày trong lịch tập (PUT /api/training-schedule/{day_of_week}).
# Frontend gửi camelCase (routineId), DB lưu snake_case (routine_id). null = Rest Day.
class TrainingScheduleUpdate(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    routine_id: str | None = Field(default=None, description="FK routines.id, null = Rest Day")


# Dùng cho bulk update (PUT /api/training-schedule) — gửi cả tuần 1 lần
class TrainingScheduleBulkUpdate(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    schedules: list[dict] = Field(description="Mảng {dayOfWeek: int 0-6, routineId: str|null}")


# Schema trả về cho client. routine được enrich từ join routines nếu có.
class TrainingScheduleResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    id: str
    user_id: str
    day_of_week: int = Field(ge=0, le=6, description="0=Mon .. 6=Sun")
    routine_id: str | None = None
    routine: dict | None = Field(default=None, description="Enriched routine object nếu routine_id != null")
    created_at: str | None = None
    updated_at: str | None = None