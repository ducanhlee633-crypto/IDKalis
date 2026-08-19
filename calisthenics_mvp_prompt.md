# Prompt Hướng Dẫn AI Coding Agent: Xây Dựng MVP Calisthenics Workout Tracker App

## 1. Tổng Quan Dự Án & Yêu Cầu Core (Project Overview)
Bạn là một Full-stack AI Engineer xuất sắc. Hãy xây dựng phiên bản MVP cho ứng dụng **Calisthenics & Fitness Tracking App** dựa trên giao diện thiết kế dark-mode hiện đại (tham khảo UI Stryd) nhưng được tùy chỉnh riêng cho bộ môn **Calisthenics / Bodyweight Training**.

---

## 2. Tech Stack Chi Tiết

* **Frontend Framework**: Next.js (App Router, React, TypeScript).
* **Styling**: Tailwind CSS, Lucide React (Icons), Shadcn UI / Radix UI components.
* **Charts & Visualizations**: Recharts hoặc Chart.js (cho Weekly Activity, Muscle Focus, Daily Progress).
* **Backend Framework (Thiết kế kiến trúc ready-to-integrate)**: FastAPI + Python + Supabase (Sẽ kết nối ở Phase 2, MVP hiện tại mock API / mock service layer).

---

## 3. Định Hướng UI/UX Tùy Biến Cho Calisthenics

Thay vì bài tập Weights/Gym truyền thống, UI/UX sẽ tập trung đậm chất **Calisthenics**:
1. **Muscle Focus / Calisthenics Skills Breakdown**:
   * Pushing (Chest/Triceps/Front Delts - Planche, Dip, Push-up)
   * Pulling (Back/Biceps/Rear Delts - Muscle-up, Front Lever, Pull-up)
   * Core / Compression (L-sit, Dragon Flag, Ab Wheel)
   * Legs / Lower Body (Pistol Squat, Nordic Curl)
   * Skill / Mobility (Handstand, Rings Mobility)
2. **Các chỉ số Calisthenics chuyên biệt**:
   * Theo dõi **RPE (Rate of Perceived Exertion: 1 - 10)**.
   * Theo dõi **Hold Duration (giây)** cho Isometric Skills (Front Lever, Planche hold) bên cạnh **Reps** truyền thống.
   * Visual theme: Dark theme (#0D0D0D, #1A1A1A, #262626) với accent neon blue (`#00E5FF`) và emerald green (`#10B981`).
nhìn chung bạn làm giống UI trong ảnh nhưng đổi sang calisthenics thôi
---
