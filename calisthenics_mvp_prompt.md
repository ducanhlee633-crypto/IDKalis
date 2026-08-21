# Thêm table db cho tạo routine trong pgae workouts

## tổng quan
- hiên tại app đã có db table cho các workout session nhưng khi tạo routine thì vẫn chưa lưu được. 

## Yêu cầu
- tôi muốn bạn tạo cho tôi table tên là routines để lưu routine được tạo
- table cần có 1. name,  category (push, pull,...), bài tập (nên lưu bàng jsonb), note, time est

- tạo file routines ở backend để connect với backend rồi liên kết vô main.py để push data cho frontend.

- sau đó nhớ hay xoá mock data đi