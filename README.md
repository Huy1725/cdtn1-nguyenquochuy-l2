# THÔNG TIN DỰ ÁN
* **Sinh viên:** Nguyễn Quốc Huy - 2374802010185 - Track SE
* **Học phần:** Chuyên đề Tốt nghiệp 1, HK1 2026-2027
* **Luồng nghiệp vụ:** L2 – Tiếp nhận và phân loại yêu cầu bảo hành

## 1. Mục tiêu
Hệ thống hỗ trợ nhân viên cửa hàng tiếp nhận nhanh chóng và chính xác các yêu cầu bảo hành từ khách hàng. Chức năng lõi gồm tra cứu hồ sơ khách hàng, ghi nhận thiết bị, tự động đối chiếu hạn bảo hành, phân loại nhóm sự cố và tự động tính hạn cam kết trả máy (loại trừ Chủ Nhật).

## 2. Yêu cầu môi trường
* Node.js 20 LTS, npm 10
* MySQL 8.0 (dùng MySQL Workbench hoặc client `mysql`) — chỉ cần khi nạp `migrations/` và `seeds/`
* Git
* Biến môi trường: xem `.env.example` (sao chép thành `.env`, **không** commit `.env`)

## 3. Hướng dẫn cài đặt và chạy
Mỗi bước là một lệnh (PowerShell/Bash):

```bash
npm install                          # 1. cài thư viện đúng theo package-lock.json
cp .env.example .env                 # 2. tạo file cấu hình (Windows PowerShell: Copy-Item .env.example .env)
npm test                             # 3. chạy bộ kiểm thử (phải PASS hết)
npm start                            # 4. chạy API tại http://localhost:3000 (có sẵn dữ liệu demo trong bộ nhớ)
npm run dev                          # 5. (terminal thứ hai) chạy giao diện tại http://localhost:5173
```

Nạp CSDL MySQL (tuỳ chọn; chạy lại nhiều lần không lỗi và không nhân đôi dữ liệu):

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS warranty_l2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
mysql -u root -p warranty_l2 < migrations/001_initial.sql
mysql -u root -p warranty_l2 < seeds/001_demo.sql
```

Kiểm tra hệ thống chạy đúng:

```bash
curl "http://localhost:3000/api/customers?phone=0901234567"   # trả hồ sơ Nguyen AB
curl -X POST http://localhost:3000/api/tickets -H "content-type: application/json" -d "{\"customer_id\":1,\"priority\":\"CAO\"}"   # 400, nêu rõ trường thiếu
```

> **Lưu ý trung thực:** API hiện dùng repository **trong bộ nhớ** (`src/repositories/in-memory.js`); dữ liệu mất khi tắt server. Migration và seed MySQL đã sẵn sàng nhưng chưa có repository MySQL — xem mục 6.

## 4. Cấu trúc thư mục

```text
cdtn1-nguyenquochuy-l2/
├── docs/                          # Tài liệu thiết kế
│   ├── srs.md                     #   SRS rút gọn (từ BT1)
│   ├── api-contract.md            #   Hợp đồng API
│   ├── thay-doi-thiet-ke.md       #   Nhật ký sai lệch so với thiết kế BT1 (BT2)
│   ├── ai-disclosure.md           #   Bảng khai báo sử dụng công cụ AI
│   ├── architecture.drawio        #   Sơ đồ kiến trúc dự kiến (BT1)
│   ├── erd.drawio                 #   Sơ đồ ERD
│   ├── usecase.drawio             #   Sơ đồ Use Case
│   └── taopbh.png, capnhatpbh.png, chitietpbh.png   # Wireframe 3 màn hình
├── migrations/                    # Dựng CSDL từ trạng thái trống (chạy theo số thứ tự)
│   └── 001_initial.sql            #   5 bảng: customer, device, issue_category, ticket, ticket_status_log
├── seeds/                         # Dữ liệu mẫu để hệ thống có gì đó để xem
│   └── 001_demo.sql
├── src/
│   ├── server.js                  # Điểm khởi động: nạp dữ liệu demo + listen (npm start)
│   ├── app.js                     # Ghép các tầng với nhau, không chứa logic
│   ├── routes/                    # TẦNG 1 – HTTP: nhận request, gọi validator + service, dịch mã lỗi → status
│   │   ├── index.js, http.js      #   router, bảng dịch mã lỗi → HTTP status, CORS
│   │   └── customer.routes.js, ticket.routes.js, category.routes.js
│   ├── validators/                # Kiểm tra định dạng/kiểu dữ liệu vào (chạy trước service)
│   │   └── common.js, customer.validator.js, ticket.validator.js
│   ├── services/                  # TẦNG 2 – Nghiệp vụ (QT-01, QT-04, QT-13), KHÔNG biết HTTP
│   │   └── customer-service.js, ticket-service.js, classify-service.js
│   ├── domain/
│   │   └── warranty.js            #   Quy tắc thuần: hạn cam kết (QT-04), trạng thái bảo hành, ưu tiên
│   ├── repositories/              # TẦNG 3 – Truy cập dữ liệu, KHÔNG chứa quy tắc nghiệp vụ
│   │   └── in-memory.js           #   (chưa có repository MySQL)
│   ├── errors/
│   │   └── AppError.js            #   Lỗi nghiệp vụ chỉ mang mã lỗi, không mang HTTP status
│   └── web/                       # Giao diện React (Vite)
│       ├── main.jsx, styles.css
│       ├── api/                   #   Lớp client duy nhất gọi API (client.js, tickets.api.js)
│       ├── pages/                 #   3 màn hình: tạo phiếu, theo dõi phiếu, chi tiết phiếu
│       └── components/            #   Layout, Field, ErrorNotice, nhãn hiển thị
├── tests/
│   └── warranty.test.js           # 12 kiểm thử: luồng đúng / giá trị biên / dữ liệu sai
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
npm test        # node --test, không cần MySQL hay dữ liệu có sẵn trên máy
```
Bộ kiểm thử (`tests/warranty.test.js`) dùng repository bộ nhớ và gồm ba loại:

| Loại | Ví dụ |
|---|---|
| Luồng đúng (`[happy]`) | Tạo phiếu → trạng thái `MOI`, hạn cam kết, nhóm sự cố, nhật ký đầu tiên; hủy phiếu (QT-13) |
| Giá trị biên (`[boundary]`) | Ngày cuối cùng còn bảo hành vs ngày đầu hết bảo hành; Chủ Nhật theo UTC+7; SĐT đúng 10 số |
| Dữ liệu sai (`[bad-data]`) | Thiếu `issue_desc` → HTTP 400 nêu đúng trường, không lộ stack trace; thiết bị ngoài thiếu serial/nguồn gốc |

## 6. Trạng thái hiện tại
- [x] Khởi tạo project, cấu hình linter và smoke test chạy thành công (Buổi 2).
- [x] Hoàn thành tài liệu Phân tích & Thiết kế (Bài tập 1): Sơ đồ Kiến trúc, ERD, Wireframe (Buổi 6).
- [x] Xây dựng API và lớp nghiệp vụ cho module Tiếp nhận yêu cầu (Buổi 8–10).
- [x] Viết Unit Test cho lớp Service xử lý các quy tắc QT-01, QT-04, QT-13 (Buổi 10–12).
