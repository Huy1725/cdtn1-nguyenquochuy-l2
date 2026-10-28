# Nhật ký lỗi (Bug Log)

Ghi lại các lỗi thật sự phát sinh trong quá trình làm dự án (khác với `thay-doi-thiet-ke.md`, vốn ghi các **thay đổi thiết kế** so với BT1). Mỗi lỗi gồm bốn ý: **Triệu chứng · Nguyên nhân gốc · Cách sửa · File ảnh hưởng**.

---

## BUG-01. Khoá ngoại khai báo kiểu cột bị MySQL âm thầm bỏ qua

- **Mức độ:** Cao — toàn bộ ràng buộc tham chiếu giữa 5 bảng không tồn tại trên CSDL thật.
- **Triệu chứng:** CSDL tạo ra không có khoá ngoại nào dù DDL có ghi `REFERENCES`; có thể chèn `customer_id` không tồn tại vào bảng `device`/`ticket` mà không báo lỗi.
- **Nguyên nhân gốc:** `REFERENCES` khai báo ngay sau tên cột (column-level) — cú pháp này MySQL/InnoDB chấp nhận nhưng **âm thầm bỏ qua**, không tạo ràng buộc; phải khai báo bằng mệnh đề `FOREIGN KEY (...) REFERENCES ...` ở cấp bảng.
- **Cách sửa:** Viết lại toàn bộ `migrations/001_initial.sql` dùng `FOREIGN KEY` cấp bảng, thêm `ENGINE=InnoDB` tường minh cho cả 5 bảng.
- **File ảnh hưởng:** `migrations/001_initial.sql`.

---

## BUG-02. Ngày cuối cùng còn bảo hành bị tính nhầm thành đã hết hạn

- **Mức độ:** Trung bình — sai lệch quy tắc nghiệp vụ, ảnh hưởng trực tiếp tới kết quả hiển thị cho nhân viên.
- **Triệu chứng:** Phiếu tiếp nhận đúng vào ngày cuối cùng còn trong hạn bảo hành (ví dụ mua 15/01, bảo hành 12 tháng → hạn chót 15/01 năm sau) bị hệ thống báo **hết bảo hành**.
- **Nguyên nhân gốc:** `warrantyStatus()` so sánh thời điểm nhận máy với mốc 00:00 UTC của ngày hết hạn, thay vì so theo **ngày lịch** ở giờ Việt Nam (UTC+7) — lệch múi giờ làm hạn chót bị lùi lại gần 1 ngày.
- **Cách sửa:** Đổi phép so sánh sang so theo ngày lịch tại UTC+7 (ngày cuối cùng còn tính là còn hạn).
- **File ảnh hưởng:** `src/domain/warranty.js`.

---

## BUG-03. Xác định Chủ Nhật dùng giờ UTC thay vì giờ Việt Nam khi tính hạn cam kết (QT-04)

- **Mức độ:** Trung bình — hạn cam kết trả máy có thể lệch vì tính nhầm ngày làm việc.
- **Triệu chứng:** Phiếu nhận lúc giờ UTC rơi vào thứ Bảy nhưng thực ra đã là Chủ Nhật theo giờ Việt Nam (lệch +7 giờ) vẫn bị tính là ngày làm việc khi cộng thời hạn cam kết.
- **Nguyên nhân gốc:** `isSunday()`/`addBusinessHours()` gọi `getUTCDay()` trực tiếp trên giờ UTC, không quy đổi sang giờ địa phương trước khi kiểm tra.
- **Cách sửa:** Cộng thêm offset `+7h` trước khi gọi `getUTCDay()` để xác định đúng thứ theo giờ Việt Nam.
- **File ảnh hưởng:** `src/domain/warranty.js`.

---

## BUG-04. `AppError` mang cả mã HTTP, khiến tầng `services` biết về HTTP

- **Mức độ:** Trung bình — vi phạm trực tiếp tiêu chí S2 (tách tầng) của rubric chấm điểm.
- **Triệu chứng:** Lớp nghiệp vụ (`services/`) ném lỗi kèm theo `status` HTTP (400/404/409...), nghĩa là tầng nghiệp vụ "biết" nó đang chạy sau một HTTP server — sai nguyên tắc `routes → services → repositories` một chiều.
- **Nguyên nhân gốc:** Thiết kế ban đầu gộp luôn mã lỗi nghiệp vụ và mã trạng thái HTTP vào cùng một đối tượng lỗi cho tiện, nhưng điều này làm `services` phụ thuộc ngược vào tầng `routes`.
- **Cách sửa:** `AppError` chỉ còn mang `{ code, message, fields }`; thêm bảng dịch mã lỗi → HTTP status (`statusForCode()`) ở `src/routes/http.js`, tách hẳn khỏi tầng nghiệp vụ.
- **File ảnh hưởng:** `src/errors/AppError.js`, `src/routes/http.js`.

---

## BUG-05. Tái cấu trúc làm mất endpoint `PATCH`/`DELETE /api/customers/{id}`

- **Mức độ:** Cao — một trong hai entity bắt buộc phải có CRUD đầy đủ (tiêu chí S1) bị thiếu 2 thao tác.
- **Triệu chứng:** Sau khi tách `routes/services/repositories` thành các tầng riêng, API cập nhật và xoá khách hàng biến mất khỏi `customer.routes.js`.
- **Nguyên nhân gốc:** Trong lúc tái cấu trúc, hai endpoint này bị coi nhầm là "ngoài phạm vi" luồng L2 và bị loại bỏ thay vì chuyển sang tầng mới.
- **Cách sửa:** Khôi phục `PATCH`/`DELETE /api/customers/{id}`; bổ sung thêm kiểm tra nghiệp vụ `CUSTOMER_IN_USE` (từ chối xoá khách hàng đã có thiết bị/phiếu bảo hành) để không vi phạm QT-13.
- **File ảnh hưởng:** `src/routes/customer.routes.js`, `src/services/customer-service.js`.

---

## BUG-06. Thư viện `mysql2` phiên bản cài lần đầu có lỗ hổng bảo mật mức cao

- **Mức độ:** Trung bình — rủi ro bảo mật từ phụ thuộc bên thứ ba, không phải lỗi logic tự viết.
- **Triệu chứng:** `npm audit` báo 1 lỗ hổng mức **high** sau khi cài `mysql2@3.11.5`.
- **Nguyên nhân gốc:** Mọi phiên bản `mysql2` ≤ 3.23.0 dính advisory liên quan đến auth plugin/giải nén dữ liệu.
- **Cách sửa:** Nâng lên `mysql2@3.24.6`; `npm audit` xác nhận còn 0 lỗ hổng.
- **File ảnh hưởng:** `package.json`, `package-lock.json`.

---

## BUG-07. `npm start` không bao giờ nạp `.env`, luôn kết nối MySQL bằng mật khẩu rỗng

- **Mức độ:** Cao — chặn hoàn toàn việc chạy hệ thống với MySQL thật, dù cấu hình `.env` đúng.
- **Ngày phát hiện:** 2026-10-28, khi tự kiểm tra lại đúng quy trình README trên môi trường sạch trước khi nộp bài.
- **Triệu chứng:** `npm start` luôn báo `ER_ACCESS_DENIED_ERROR` dù đã sửa `DB_PASSWORD` trong `.env` nhiều lần và xác nhận mật khẩu đúng trực tiếp trong MySQL Workbench.
- **Nguyên nhân gốc:** Script `start` trong `package.json` chỉ chạy `node src/server.js`; dự án không cài `dotenv` và cũng không có cờ nào nạp `.env` vào `process.env`. Do đó `process.env.DB_PASSWORD` luôn là `undefined`, `src/repositories/mysql/pool.js` rơi về giá trị mặc định `password: ""` — kết nối luôn dùng mật khẩu rỗng bất kể `.env` ghi gì.
- **Cách sửa:** Đổi script thành `node --env-file=.env src/server.js` (cờ dựng sẵn của Node ≥ 20.6, không cần thêm phụ thuộc); nâng yêu cầu `engines.node` lên `>=20.6.0`; kiểm chứng lại bằng mô phỏng clone sạch — `npm start` kết nối MySQL thành công.
- **File ảnh hưởng:** `package.json`.

---

**Ghi chú:** BUG-01 → BUG-05 phát hiện trong giai đoạn dựng khung kiến trúc BT2 (Buổi 8–12); BUG-06, BUG-07 phát hiện khi hoàn thiện lớp MySQL repository và tự kiểm tra quy trình README trước khi nộp bài.
