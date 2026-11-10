# THÔNG TIN DỰ ÁN
* **Sinh viên:** Nguyễn Quốc Huy - 2374802010185 - Track SE
* **Học phần:** Chuyên đề Tốt nghiệp 1, HK1 2026-2027
* **Luồng nghiệp vụ:** L2 – Tiếp nhận và phân loại yêu cầu bảo hành

## 1. Mục tiêu
Hệ thống hỗ trợ nhân viên cửa hàng tiếp nhận nhanh chóng và chính xác các yêu cầu bảo hành từ khách hàng. Chức năng lõi gồm tra cứu hồ sơ khách hàng, ghi nhận thiết bị, tự động đối chiếu hạn bảo hành, phân loại nhóm sự cố và tự động tính hạn cam kết trả máy (loại trừ Chủ Nhật).

## 2. Yêu cầu môi trường
**Cách chính (khuyến nghị, đúng cách người chấm làm): chỉ cần Docker + Git.**
* Docker Engine 24+ có Docker Compose v2, Git 2.30+, cổng `3000` còn trống. **Không** cần cài Node.js hay MySQL.
* Hướng dẫn đầy đủ (tiếng Anh, có bảng biến môi trường, dữ liệu mẫu, kiểm tra hệ thống đã chạy đúng và xử lý sự cố): [docs/deployment-guide.md](docs/deployment-guide.md).

**Cách thay thế (không dùng Docker):** Node.js ≥ 22.9 (dùng cờ `--env-file-if-exists` có sẵn để nạp `.env`, không cần `dotenv`), npm 10 và MySQL 8.0 đang chạy.

## 3. Hướng dẫn cài đặt và chạy

### 3.1. Bằng Docker — đúng hai lệnh từ thư mục trống
```bash
git clone --branch v1.0 https://github.com/Huy1725/cdtn1-nguyenquochuy-l2.git
cd cdtn1-nguyenquochuy-l2
cp .env.example .env                 # lệnh 1 (Windows cmd: copy .env.example .env)
docker compose up -d --build         # lệnh 2: dựng image, chạy MySQL + ứng dụng, tự nạp bảng và dữ liệu mẫu
```

Rồi mở **http://localhost:3000** và đăng nhập bằng tài khoản demo (mật khẩu chỉ lưu dạng băm scrypt trong CSDL; chỉ dùng để chạy thử):

| Tên đăng nhập | Mật khẩu | Họ tên |
|---|---|---|
| `nv01` | `matkhau01` | Nguyen Van An |
| `nv02` | `matkhau02` | Tran Thi Binh |

Kiểm tra hệ thống đã chạy đúng (kết quả mong đợi chi tiết ở [deployment guide](docs/deployment-guide.md) mục 5):

```bash
docker compose ps                        # db và app đều (healthy); nếu app còn "starting" thì đợi vài giây rồi chạy lại
curl http://localhost:3000/health        # {"status":"ok","db":"up"}  (Windows PowerShell: gõ curl.exe thay cho curl)
docker compose exec app npm test         # 34 test PASS (12 test case + 22 hồi quy)
```

Dữ liệu mẫu nạp sẵn: 101 khách hàng, 139 thiết bị, 6 nhóm sự cố, 2 nhân viên. Xóa hết và dựng lại từ đầu: `docker compose down -v`.

### 3.2. Không dùng Docker (MySQL cài sẵn)
Mỗi bước là một lệnh (chạy trong **cmd** hoặc **Git Bash**; PowerShell không hỗ trợ toán tử `<` ở các bước 4–7). Phải tạo CSDL **trước** khi chạy `npm start`:

```bash
npm install                          # 1. cài thư viện đúng theo package-lock.json
cp .env.example .env                 # 2. tạo file cấu hình (Windows cmd: copy .env.example .env)
                                     #    sửa DB_PASSWORD trong .env cho đúng mật khẩu MySQL của bạn
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS warranty_l2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
                                     # 3. tạo database (chỉ cần chạy 1 lần)
mysql -u root -p warranty_l2 < migrations/001_initial.sql     # 4. dựng bảng, chạy lại được, không lỗi
mysql -u root -p warranty_l2 < migrations/002_staff_auth.sql  # 5. bảng nhân viên + người tiếp nhận phiếu
mysql -u root -p warranty_l2 < seeds/001_demo.sql             # 6. dữ liệu mẫu (101 khách hàng), chạy lại không nhân đôi
mysql -u root -p warranty_l2 < seeds/002_staff.sql            # 7. hai tài khoản nhân viên demo
npm test                             # 8. chạy TOÀN BỘ bộ kiểm thử bằng một lệnh (34 test: 12 TC + 22 hồi quy, phải PASS hết;
                                     #    cần MySQL đang chạy, tài khoản trong .env phải có quyền CREATE DATABASE)
npm run build && npm start           # 9. dựng giao diện rồi chạy API + giao diện tại http://localhost:3000
npm run dev                          # 10. (thay cho bước 9, khi sửa giao diện) giao diện tại http://localhost:5173
```

Mọi API dưới `/api` (trừ `POST /api/auth/login`) cần header `Authorization: Bearer <token>`. Chỉ nhân viên đã tiếp nhận phiếu mới được đổi trạng thái phiếu đó (người khác nhận `403`). Tài liệu API: [docs/api-docs/README.md](docs/api-docs/README.md).

## 4. Cấu trúc thư mục

```text
cdtn1-nguyenquochuy-l2/
├── docs/                          # Tài liệu thiết kế và kiểm thử
│   ├── test-plan.md, test-report.md   #   Test Plan (4 mục) và Test Report (12 TC × 8 cột + ảnh chụp)
│   ├── deployment-guide.md        #   Hướng dẫn triển khai (tiếng Anh, 5 mục)
│   ├── checklist-bao-mat.md       #   Checklist bảo mật 7 mục, mỗi mục có minh chứng
│   ├── api-docs/README.md         #   Tài liệu API (tiếng Anh): 13 endpoint, ví dụ thật
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
│   ├── server.js                  # Điểm khởi động: kiểm tra cấu hình, kết nối MySQL thật rồi listen (npm start)
│   ├── config.js                  # Đọc/kiểm tra biến môi trường một lần, thiếu thì dừng ngay
│   ├── app.js                     # Ghép các tầng với nhau, không chứa logic
│   ├── routes/                    # TẦNG 1 – HTTP: nhận request, gọi validator + service, dịch mã lỗi → status
│   │   ├── index.js, http.js      #   router, /health, bảng dịch mã lỗi → HTTP status, CORS
│   │   ├── static.js              #   phục vụ bản build giao diện (chống path traversal)
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
├── Dockerfile, docker-compose.yml, .dockerignore   # Đóng gói: image Node (API + giao diện) và MySQL
├── tests/
│   ├── unit/warranty.test.js      # TC-01…09, TC-11 + 15 test hồi quy (repository bộ nhớ, không cần MySQL)
│   ├── unit/packaging.test.js     # 5 test hồi quy: /health, giao diện tĩnh, cấu hình, log lỗi 500
│   └── integration/mysql.test.js  # TC-10, TC-12 + 2 test hồi quy (MySQL thật, CSDL warranty_l2_test)
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
npm test                  # TOÀN BỘ bộ kiểm thử bằng một lệnh: 12 TC + 22 hồi quy = 34 test (cần MySQL)
docker compose exec app npm test   # cùng 34 test, chạy trong container (cách của người chấm)
npm run tc -- TC-07       # chạy lại đúng MỘT test case (đổi số cho TC khác)
npm run test:unit         # chỉ phần không cần MySQL (10 TC + 20 hồi quy)
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
- [x] Đóng gói Docker (Dockerfile + docker-compose, healthcheck, dữ liệu mẫu tự nạp, `/health`) — hai lệnh dựng từ thư mục trống (Bài tập 3).
- [x] Test Plan, Test Report (12 TC có ảnh), Bug Log (4 bug), Deployment Guide, checklist bảo mật, API docs (Bài tập 3).
