# Deploy & Local Dev Guide — IDK Calisthenics

Giải pháp cho vấn đề “đã deploy rồi thì chạy local bị chặn”.

## Nguyên nhân gốc

1. **Frontend** dùng `NEXT_PUBLIC_API_URL` để biết backend ở đâu:
   - Local: `http://localhost:8000`
   - Prod: `https://xxx.onrender.com`
   - Nếu không tạo `.env.local`, fallback là `localhost:8000` — nhưng nếu bạn `export NEXT_PUBLIC_API_URL=...` ở terminal thì local lại cố gọi Render.

2. **Backend** dùng `CORS_ORIGINS` để cho phép origin nào được gọi:
   - Trước đây `_cors_origins()` **replace** localhost khi `CORS_ORIGINS` có giá trị → local frontend (`http://localhost:3000`) gọi Render backend bị chặn.
   - Đã fix: luôn merge `localhost` + `CORS_ORIGINS` + regex `https://*.vercel.app`.

## Fix đã áp dụng (code)

### Backend `main.py:14`
```python
def _cors_origins():
    dev_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
    # merge với env, luôn giữ dev_origins
```
- Local frontend → local backend: `localhost` allowed (fallback)
- Local frontend → Render backend: `localhost` vẫn allowed dù Render set `CORS_ORIGINS=https://xxx.vercel.app`
- Vercel frontend → Render backend: `https://xxx.vercel.app` allowed qua `CORS_ORIGINS` + `allow_origin_regex=r"https://.*\.vercel\.app"`

### Frontend `lib/auth.js:1`
- `API_BASE` auto trim `/`, log ra console, hỗ trợ override runtime:
  ```js
  localStorage.setItem('idk_api_override','https://xxx.onrender.com') // debug
  localStorage.removeItem('idk_api_override') // quay về env
  ```
- Đồng bộ `API_BASE` về 1 chỗ (`@/lib/auth`), `app/exercise-library/page.jsx` đã import từ đó thay vì duplicate.
- Thêm `safeFetch` với message rõ: `Không kết nối được backend (URL). Kiểm tra ...`

### Env files
- `frontend/.env.example` — ghi rõ local vs Vercel
- `frontend/.env.local` — đã tạo sẵn `http://localhost:8000` (gitignore, không push)
- `backend/.env.example` — chỉ cần set Vercel URL, không cần localhost
- `render.yaml` — template cho Render Blueprint (set `CORS_ORIGINS` = Vercel prod URL)

## Cách chạy Local (không bị chặn nữa)

### Option A: Local frontend + Local backend (khuyên dùng khi dev)
```bash
# Terminal 1 — backend
cd backend
# .env đã có SUPABASE_* , không cần CORS_ORIGINS
uv run uvicorn main:app --reload --port 8000
# hoặc: uvicorn main:app --reload --port 8000

# Terminal 2 — frontend
cd frontend
cp .env.example .env.local   # giữ localhost:8000
npm run dev
# Mở http://localhost:3000 → console log: [IDK] API_BASE = http://localhost:8000
```

### Option B: Local frontend + Render backend (không cần chạy backend local)
```bash
cd frontend
# Cách 1: sửa .env.local
echo 'NEXT_PUBLIC_API_URL=https://your-backend.onrender.com' > .env.local
npm run dev

# Cách 2: không sửa file, dùng override runtime (không cần rebuild)
npm run dev
# Mở browser console:
localStorage.setItem('idk_api_override','https://your-backend.onrender.com')
location.reload()
# Đổi lại local:
localStorage.removeItem('idk_api_override'); location.reload()
```

## Cách deploy Production

### Render (backend)
- Dashboard → Service → Environment → thêm:
  ```
  SUPABASE_URL=...
  SUPABASE_ANON_KEY=...
  SUPABASE_SERVICE_ROLE_KEY=...
  SUPABASE_JWT_SECRET=...
  CORS_ORIGINS=https://your-app.vercel.app
  # Nếu có preview domains, thêm cách nhau phẩy:
  # CORS_ORIGINS=https://your-app.vercel.app,https://your-app-abc123.vercel.app
  ```
- Trick: `render.yaml` đã định nghĩa sẵn, có thể dùng Blueprint.

### Vercel (frontend)
- Dashboard → Project → Settings → Environment Variables:
  ```
  NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
  ```
  (không có `/` cuối)
- Redeploy sau khi đổi env.

## Verify nhanh

```bash
# Backend local health
curl http://localhost:8000/  # {"status":"ok",...}

# Backend Render health
curl https://your-backend.onrender.com/

# Frontend build không cần backend chạy
cd frontend && npm run build

# Check CORS thực tế
curl -H "Origin: http://localhost:3000" -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: authorization" -X OPTIONS --verbose \
  https://your-backend.onrender.com/api/routines 2>&1 | grep -i access-control
```

Nếu thấy `access-control-allow-origin: http://localhost:3000` hoặc `https://*.vercel.app` là ok.

## Troubleshooting

| Lỗi | Nguyên nhân | Fix |
|---|---|---|
| `Failed to fetch` + `Không kết nối được backend` | Backend chưa chạy hoặc sai `NEXT_PUBLIC_API_URL` | Kiểm tra console `[IDK] API_BASE`, chạy `uvicorn` hoặc sửa `.env.local` |
| `CORS policy` | Render `CORS_ORIGINS` thiếu Vercel URL | Thêm Vercel URL vào Render env, redeploy backend |
| Local gọi Render bị CORS | Trước fix `CORS_ORIGINS` replace localhost | Đã fix merge, pull code mới và redeploy Render |
| `NEXT_PUBLIC_API_URL` không đổi sau khi sửa | Next.js embed env lúc build | `rm -rf .next && npm run dev` hoặc `location.reload()` nếu dùng `localStorage` override |

## Lưu ý quan trọng

- `.env*` đã gitignore, không commit. Chỉ commit `.env.example` + `render.yaml`.
- `NEXT_PUBLIC_API_URL` là build-time var của Next.js: đổi xong phải restart dev hoặc rebuild/deploy.
- Luôn giữ `http://localhost:8000` trong `.env.local` khi dev local, không set `CORS_ORIGINS` ở backend local (để fallback tự cover).
