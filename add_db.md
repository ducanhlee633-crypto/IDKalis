# Thêm table db cho tạo goal trong page Goals

## tổng quan
 - hiện tại phần page goal đnag thục hiện tác vụ lưu trũ mục tiêu ngừoi dùng. nhưng nó chỉ lưu local storeage thôi.

## Yêu cầu
- tạo cho tôi db table để lưu goal ngừoi dùng
- table bao gồm cột: FK user_id, goal name, Metric Type, target value, deadline (à mà convert hết ra week nhé)
- tạo file goals.py để kết nối supabase và để link với main.py để push data cho frontend
- xoá dữ liệu mock có sắn