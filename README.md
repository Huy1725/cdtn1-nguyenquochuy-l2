# THÔNG TIN DỰ ÁN
* **Sinh viên:** Nguyễn Quốc Huy - 2374802010185 - Track SE
* **Học phần:** Chuyên đề Tốt nghiệp 1, HK1 2026-2027
* **Luồng nghiệp vụ:** L2 – Tiếp nhận và phân loại yêu cầu bảo hành

## 1. Mục tiêu
Hệ thống hỗ trợ nhân viên cửa hàng tiếp nhận nhanh chóng và chính xác các yêu cầu bảo hành từ khách hàng. Chức năng lõi gồm tra cứu hồ sơ khách hàng, ghi nhận thiết bị, tự động đối chiếu hạn bảo hành, phân loại nhóm sự cố và tự động tính hạn cam kết trả máy (loại trừ Chủ Nhật).

## 2. Yêu cầu môi trường
* Node.js ≥ 22.9 (dùng cờ `--env-file-if-exists` có sẵn để nạp `.env`, không cần cài `dotenv`), npm 10
* MySQL 8.0 đang chạy (MySQL Workbench hoặc client `mysql`) — **bắt buộc**, API đọc/ghi trực tiếp MySQL
* Git
* Biến môi trường: xem `.env.example` (sao chép thành `.env`, **không** commit `.env`)

## 3. Hướng dẫn cài đặt và chạy
Mỗi bước là một lệnh (PowerShell/Bash). Phải tạo CSDL **trước** khi chạy `npm start`:

```bash
npm install                          # 1. cài thư viện đúng theo package-lock.json
cp .env.example .env                 # 2. tạo file cấu hình (Windows PowerShell: Copy-Item .env.example .env)
                                      #    sua DB_PASSWORD trong .env cho dung mat khau MySQL that
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS warranty_l2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
                                      # 3. tao database (chi can chay 1 lan)
mysql -u root -p warranty_l2 < migrations/001_initial.sql   # 4. dung bang, chay lai duoc, khong loi
mysql -u root -p warranty_l2 < migrations/002_staff_auth.sql  # 5. bang nhan vien + nguoi tiep nhan phieu
mysql -u root -p warranty_l2 < seeds/001_demo.sql           # 6. du lieu mau (~100 khach hang), chay lai khong nhan doi
mysql -u root -p warranty_l2 < seeds/002_staff.sql          # 7. hai tai khoan nhan vien demo (bang duoi)
npm test                             # 8. chay TOAN BO bo kiem thu bang mot lenh (27 test: 12 TC + 15 hoi quy, phai PASS het;
                                      #    can MySQL dang chay, tai khoan trong .env phai co quyen CREATE DATABASE)
npm start                            # 9. chay API tai http://localhost:3000 (doc/ghi MySQL that)
npm run dev                          # 10. (terminal thu hai) chay giao dien tai http://localhost:5173
```

Tài khoản demo (mật khẩu chỉ lưu dạng băm scrypt trong CSDL; chỉ dùng để chạy thử):

| Tên đăng nhập | Mật khẩu | Họ tên |
|---|---|---|
| `nv01` | `matkhau01` | Nguyen Van An |
| `nv02` | `matkhau02` | Tran Thi Binh |

Mọi API dưới `/api` (trừ `POST /api/auth/login`) cần header `Authorization: Bearer <token>`.
Chỉ nhân viên đã tiếp nhận phiếu mới được đổi trạng thái phiếu đó (người khác nhận `403`).

Kiểm tra hệ thống chạy đúng:

```bash
curl http://localhost:3000/api/tickets                     # 401: chưa đăng nhập
curl -X POST http://localhost:3000/api/auth/login -H "content-type: application/json" -d "{\"username\":\"nv01\",\"password\":\"matkhau01\"}"   # 200, trả token
curl "http://localhost:3000/api/customers?phone=0901234567" -H "authorization: Bearer <token>"   # trả hồ sơ Nguyen AB
```

> **Lưu ý:** `npm start` đọc/ghi MySQL thật qua `src/repositories/mysql/`. `npm test` chạy 10 TC trên repository bộ nhớ (nhanh, độc lập dữ liệu máy) và 2 TC tích hợp trên MySQL thật, trong CSDL riêng `warranty_l2_test` tự dựng rồi xóa-dựng lại — **không đụng** CSDL `warranty_l2`. Xem mục 5.

## 4. Cấu trúc thư mục

```text
cdtn1-nguyenquochuy-l2/
├── docs/                          # Tài liệu thiết kế và kiểm thử
│   ├── test-plan.md, test-report.md   #   Test Plan (4 mục) và Test Report (12 TC × 8 cột + ảnh chụp)
│   ├── screenshots/               #   Ảnh chụp kết quả chạy thật, đặt tên theo TC (TC-01-pass.png, …)
│   ├── srs.md                     #   SRS rút gọn (từ BT1)
│   ├── api-contract.md            #   Hợp đồng API
│   ├── thay-doi-thiet-ke.md       #   Nhật ký sai lệch so với thiết kế BT1 (BT2)
│   ├── bug-log.md                 #   Nhật ký lỗi thật gặp phải: triệu chứng, nguyên nhân gốc, cách sửa
│   ├── ai-disclosure.md           #   Bảng khai báo sử dụng công cụ AI
│   ├── architecture.drawio        #   Sơ đồ kiến trúc dự kiến (BT1)
│   ├── erd.drawio                 #   Sơ đồ ERD
│   ├── usecase.drawio             #   Sơ đồ Use Case
│   └── taopbh.png, capnhatpbh.png, chitietpbh.png   # Wireframe 3 màn hình
├── migrations/                    # Dựng CSDL từ trạng thái trống (chạy theo số thứ tự, chạy lại không lỗi)
│   ├── 001_initial.sql            #   5 bảng: customer, device, issue_category, ticket, ticket_status_log
│   └── 002_staff_auth.sql         #   bảng staff + cột ticket.received_by (đăng nhập, quy tắc chủ phiếu)
├── seeds/                         # Dữ liệu mẫu để hệ thống có gì đó để xem
│   ├── 001_demo.sql               #   101 khách hàng, 139 thiết bị, 6 nhóm sự cố
│   └── 002_staff.sql              #   2 tài khoản nhân viên demo (mật khẩu băm scrypt)
├── src/
│   ├── server.js                  # Điểm khởi động: kết nối MySQL thật rồi listen (npm start)
│   ├── app.js                     # Ghép các tầng với nhau, không chứa logic
│   ├── routes/                    # TẦNG 1 – HTTP: nhận request, gọi validator + service, dịch mã lỗi → status
│   │   ├── index.js, http.js      #   router, bảng dịch mã lỗi → HTTP status, CORS
│   │   └── auth.routes.js, customer.routes.js, ticket.routes.js, category.routes.js
│   ├── validators/                # Kiểm tra định dạng/kiểu dữ liệu vào (chạy trước service)
│   │   └── common.js, auth.validator.js, customer.validator.js, ticket.validator.js
│   ├── services/                  # TẦNG 2 – Nghiệp vụ (QT-01, QT-04, QT-13), KHÔNG biết HTTP
│   │   └── auth-service.js, customer-service.js, ticket-service.js, classify-service.js
│   ├── security/                  # Băm mật khẩu (scrypt) và token HS256 bằng node:crypto, không phụ thuộc thư viện ngoài
│   ├── domain/
│   │   └── warranty.js            #   Quy tắc thuần: hạn cam kết (QT-04), trạng thái bảo hành, ưu tiên
│   ├── repositories/              # TẦNG 3 – Truy cập dữ liệu, KHÔNG chứa quy tắc nghiệp vụ
│   │   ├── in-memory.js           #   dùng cho npm test (không cần MySQL)
│   │   └── mysql/                 #   dùng cho npm start: pool.js, customer/ticket/category/staff.repository.js
│   ├── errors/
│   │   └── AppError.js            #   Lỗi nghiệp vụ chỉ mang mã lỗi, không mang HTTP status
│   └── web/                       # Giao diện React (Vite)
│       ├── main.jsx, styles.css
│       ├── api/                   #   Lớp client duy nhất gọi API (client.js gắn token, auth.api.js, tickets.api.js)
│       ├── pages/                 #   4 màn hình: đăng nhập, tạo phiếu, theo dõi phiếu, chi tiết phiếu
│       └── components/            #   Layout, Field, ErrorNotice, nhãn hiển thị
├── tests/
│   ├── unit/warranty.test.js      # TC-01…09, TC-11 + 14 test hồi quy (repository bộ nhớ, không cần MySQL)
│   └── integration/mysql.test.js  # TC-10, TC-12 + 1 test hồi quy (MySQL thật, CSDL warranty_l2_test)
├── scripts/run-tc.js              # npm run tc -- TC-07: chạy đúng một test case
├── index.html, vite.config.js     # Điểm vào và cấu hình giao diện
├── .env.example                   # Liệt kê mọi biến môi trường (giá trị mẫu)
├── .gitignore                     # Chặn .env, node_modules/, dist/
├── package.json, package-lock.json
└── README.md
```

**Quy tắc phụ thuộc một chiều:** `routes → services → repositories`, không bao giờ ngược lại.
`services` không được chứa `req`, `res`, mã HTTP hay câu SQL (có một kiểm thử tự quét việc này);
`repositories` chỉ đọc/ghi dữ liệu; `validators` chỉ kiểm tra định dạng, còn quy tắc nghiệp vụ nằm ở `services`.

## 5. Kiểm thử
```bash
npm test                  # TOÀN BỘ bộ kiểm thử bằng một lệnh: 12 TC + 15 hồi quy = 27 test (cần MySQL)
npm run tc -- TC-07       # chạy lại đúng MỘT test case (đổi số cho TC khác)
npm run test:unit         # chỉ phần không cần MySQL (10 TC + 14 hồi quy)
npm run test:integration  # chỉ phần MySQL thật (TC-10, TC-12)
```
12 test case trong [docs/test-report.md](docs/test-report.md) (8 cột, kèm ảnh chụp từng TC) thuộc năm loại; Test Plan ở [docs/test-plan.md](docs/test-plan.md):

| Loại | Test case |
|---|---|
| Luồng đúng (`[happy]`) | TC-01 tạo phiếu (hạn cam kết, nhóm sự cố, bảo hành) · TC-02 SĐT trùng → 409 · TC-03 hủy phiếu giữ nhật ký · TC-10 giờ nhật ký trên MySQL thật · TC-11 phân loại chữ hoa có "Đ" |
| Giá trị biên (`[boundary]`) | TC-04 ngày cuối còn bảo hành · TC-05 ngày đầu hết bảo hành |
| Dữ liệu sai (`[bad-data]`) | TC-06 thiếu `issue_desc` → 400 nêu đúng trường, không lộ stack trace · TC-07 phiếu không tồn tại → 404 |
| Bảo mật (`[security]`) | TC-08 không token / token giả → 401 (A07) · TC-09 nhân viên khác sửa phiếu không phải của mình → 403 (A01) |
| Tái lập (`[reproducibility]`) | TC-12 chạy lại migration + seed lần hai, số bản ghi không đổi |

## 6. Trạng thái hiện tại
- [x] Khởi tạo project, cấu hình linter và smoke test chạy thành công (Buổi 2).
- [x] Hoàn thành tài liệu Phân tích & Thiết kế (Bài tập 1): Sơ đồ Kiến trúc, ERD, Wireframe (Buổi 6).
- [x] Xây dựng API và lớp nghiệp vụ cho module Tiếp nhận yêu cầu (Buổi 8–10).
- [x] Viết Unit Test cho lớp Service xử lý các quy tắc QT-01, QT-04, QT-13 (Buổi 10–12).
- [x] Repository MySQL thật cho `npm start` (`src/repositories/mysql/`); `npm test` vẫn dùng bộ nhớ.
- [x] Đăng nhập nhân viên (token HS256, mật khẩu băm scrypt) và quy tắc chủ phiếu — sửa BUG-10 (Bài tập 3).
- [ ] Dockerfile / docker-compose — thuộc Bài tập 3.
