# Thêm Authencation (log_in, create_user)
## tông quan
 - tôi cần bạn thêm cho tôi authencation để làm log in, sign up và authorization

## yêu cầu
- hãy tạo một bảng để store đăng nhập/ đăng kí đó
- password phai hash và khi check ngừoi dùng có tồn tại hay không thì phải bỏ uppercase,
- tạo jwt, hash pass và verfiy pass trong auth.py và dùng pydantic settings để quản lí key api tron env.

- tạo thêm phần endpoint log-in("/token"), và /me (kiểm tra token) trong main để xác minh

- hãy tạo logic backend trước rồi sau đó tôi với bạn sẽ làm frontend đăng nhập sau