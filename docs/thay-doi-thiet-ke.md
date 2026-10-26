# Nhật ký thay đổi thiết kế

Mọi sai lệch so với thiết kế ban đầu (Bài tập 1) đều được ghi ở đây, mỗi thay đổi gồm ba ý rõ ràng: **Thay đổi gì · Vì sao · Ảnh hưởng tới thành phần nào**. Đây là mục kiểm chứng tiêu chí 3 (Nhất quán và Tích luỹ) trong Rubric chấm điểm.

---

## 1. Điều chỉnh cấu trúc 5 bảng CSDL: Loại bỏ `technician`, bổ sung `issue_category` và `ticket_status_log`

- **Thay đổi gì:** Bỏ bảng `technician` khỏi ERD và DDL; bổ sung bảng `issue_category` (nhóm sự cố) và bảng `ticket_status_log` (lịch sử cập nhật trạng thái và ghi chú trao đổi).
- **Vì sao:** Bảng `technician` thuộc phạm vi luồng L4 (phân công kỹ thuật viên - đã khai báo WON'T trong phạm vi L2). Bảng `issue_category` cần thiết để phục vụ yêu cầu FR3/US6 (phân loại nhóm sự cố). Bảng `ticket_status_log` được bổ sung thêm trường `note` để đáp ứng US7/UC6 (lưu vết lịch sử trao đổi với khách hàng) và tuân thủ quy tắc QT-13 (soft delete, không xóa dữ liệu).
- **Ảnh hưởng:** `docs/srs.md` (Mục 4.1 ERD & Mục 4.2 DDL), `erd.drawio`, `DDL-skeleton.sql`.

---

## 2. Loại bỏ nút "Xóa" trên giao diện Wireframe màn hình Cập nhật

- **Thay đổi gì:** Loại bỏ nút "Xóa" trên Wireframe màn hình Cập nhật phiếu bảo hành, thay thế bằng nút "Hủy phiếu (Soft Delete)".
- **Vì sao:** Quy tắc nghiệp vụ QT-13 nghiêm cấm xóa vật lý (hard delete) dữ liệu trong CSDL để đảm bảo tính truy vết. Thao tác "Hủy phiếu" bản chất là cập nhật cột `status` thành `'HUY'` trong bảng `ticket` và ghi nhận một bản ghi log tương ứng vào `ticket_status_log`.
- **Ảnh hưởng:** `wireframe.drawio`, `docs/wireframe.png`, `docs/srs.md` (Mục 5 - Wireframe).

---

## 3. Bổ sung chú thích ký hiệu (Legend) cho Sơ đồ Use Case và ERD

- **Thay đổi gì:** Thêm bảng ghi chú ký hiệu chuẩn (Legend) trực tiếp vào Sơ đồ Use Case (Mục 2.1) và Sơ đồ ERD (Mục 4.1).
- **Vì sao:** Khắc phục góp ý kỹ thuật từ BT1, giúp sơ đồ tuân thủ đầy đủ ký pháp UML chuẩn (`<<include>>`, `<<extend>>`) và ký pháp Crow's Foot notation (`||`, `|o`, `>|`, `>o`), tăng tính minh bạch khi chấm bài.
- **Ảnh hưởng:** `usecase.drawio`, `erd.drawio`, `docs/srs.md` (Mục 2.1 & 4.1).

---

## 4. Chuyển đổi cú pháp SQL DDL từ PostgreSQL sang MySQL 8.0

- **Thay đổi gì:** Chuyển đổi toàn bộ cú pháp khởi tạo bảng DDL từ kiểu dữ liệu PostgreSQL (`BIGSERIAL`, `TIMESTAMPTZ`) sang cú pháp chuẩn MySQL Workbench (`BIGINT AUTO_INCREMENT`, `DATETIME`, `TINYINT(1)`).
- **Vì sao:** Môi trường thực thi thực tế của dự án sử dụng MySQL Workbench làm CSDL quan hệ chính thức thay vì PostgreSQL như dự kiến ban đầu.
- **Ảnh hưởng:** `DDL-skeleton.sql` (Mục 4.2 trong bản SRS), `README.md` (Mục 2 - Yêu cầu môi trường).
---

## 5. Thống nhất mã trạng thái hủy phiếu: `DA_HUY` → `HUY`

- **Thay đổi gì:** Trạng thái hủy phiếu dùng giá trị `'HUY'` ở mọi nơi (CHECK trong CSDL, `TICKET_STATUSES`, giao diện). Trước đó mã nguồn dùng `DA_HUY`, lệch với mục 2 của nhật ký này.
- **Vì sao:** Mục 2 đã chốt "Hủy phiếu" = cập nhật `status` thành `'HUY'`; mã nguồn phải khớp tài liệu thiết kế.
- **Ảnh hưởng:** `migrations/001_initial.sql`, `src/domain/warranty.js`, `src/frontend/main.jsx`.

---

## 6. Đồng bộ CSDL thực tế với ERD (5 bảng, tên cột, khóa ngoại)

- **Thay đổi gì:** Viết lại `migrations/001_initial.sql` theo đúng ERD: thêm bảng `issue_category`; khóa chính đổi thành `customer_id`, `device_id`, `ticket_id`, `log_id`; `device.serial_no` UNIQUE toàn bảng; `ticket.device_id` NOT NULL, `ticket.category_id` cho phép NULL; `ticket_status_log` dùng `note`, `changed_at`, `changed_by`. Bỏ các cột không có trong ERD (`address`, `deleted_at`, `ticket.serial`, `ticket.warranty_status`, `actor`). Khóa ngoại khai báo ở mức bảng (`FOREIGN KEY ... REFERENCES`) kèm `ENGINE=InnoDB` vì MySQL bỏ qua `REFERENCES` khai báo ngay trên cột.
- **Vì sao:** Bản migration cũ lệch ERD và thực tế không tạo ra khóa ngoại nào. API contract yêu cầu tên trường khớp tên cột CSDL.
- **Ảnh hưởng:** `migrations/001_initial.sql`, `seeds/001_demo.sql`, `data.md`, toàn bộ `src/` (đổi `id` → `*_id`).

---

## 7. Các quyết định thiết kế bổ sung khi hiện thực

- **Thay đổi gì:**
  - `ticket_status_log.changed_by` là BIGINT NOT NULL **không có khóa ngoại**: ERD ghi FK nhưng bảng nhân viên/`technician` đã bị loại (mục 1). Mặc định nhân viên tiếp nhận có mã `1`.
  - ERD không có cột nguồn gốc thiết bị ngoài: ghi chú nguồn gốc (US3 AC2) được lưu vào `note` của dòng log đầu tiên.
  - Trạng thái bảo hành (US5) được **tính** từ `device.purchase_date` + `warranty_months`, không lưu trong `ticket`.
  - Thiết bị ngoài được tạo thành một dòng `device` (serial nhập tay) trước khi tạo phiếu, vì `ticket.device_id` là NOT NULL.
  - Hủy phiếu dùng chung `PATCH /api/tickets/{id}/status` (status = `HUY`, kèm `note`); bỏ `softDelete` dựa trên `deleted_at` vì ticket không còn cột này (QT-13).
  - Thêm `GET /api/categories` để giao diện chọn nhóm sự cố (US6); thêm trường `note`, `changed_by` vào body PATCH status (US7).
  - Bỏ ngoài phạm vi: lọc `assignee` (thuộc L4), trường `center_id`, `accessories` — không có trong ERD. (`PATCH/DELETE /api/customers` ban đầu cũng bị bỏ nhưng đã được khôi phục, xem mục 11.)
  - Ngày Chủ Nhật trong QT-04 được xác định theo múi giờ UTC+7 (trước đây theo UTC).
- **Vì sao:** Giữ mã nguồn bám sát ERD đã duyệt và phạm vi L2; mọi dữ liệu thừa so với ERD đều được loại hoặc ghi chú rõ ở đây.
- **Ảnh hưởng:** `src/services/*`, `src/routes/*`, `src/repositories/in-memory.js`, `docs/api-contract.md` (đã cập nhật: bỏ `assignee`, bổ sung `/api/categories`).

---

## 8. Bổ sung ClassifyService và chỉnh lại tên tài liệu

- **Thay đổi gì:** Thêm `ClassifyService` (đề xuất nhóm sự cố theo từ khóa, gọi đồng bộ từ `TicketService`) đúng sơ đồ kiến trúc. Các tham chiếu `DDL-skeleton.sql` trong mục 1, 3, 4 thực chất là `migrations/001_initial.sql`. Hình kiến trúc ghi 4 bảng ở lớp lưu trữ, thực tế là 5 bảng (thêm `issue_category`).
- **Vì sao:** Sơ đồ kiến trúc có ClassifyService nhưng mã nguồn chưa có; tên file và số bảng trong tài liệu cần khớp thực tế.
- **Ảnh hưởng:** `src/services/classify-service.js`, `src/app.js`, `docs/architecture.drawio` (cần cập nhật danh sách bảng trong hình; kiến trúc thực tế xem `docs/architecture-thuc-te.md`).

---

## 9. Tách nhóm sự cố "Nguồn / Pin" thành hai nhóm

- **Thay đổi gì:** Danh mục `issue_category` tăng từ 5 lên 6 nhóm: mã 1 = "Pin", mã 5 = "Nguon", mã 6 = "Khac"; mã 2 (Man hinh), 3 (Vao nuoc / Hu hong vat ly), 4 (Phan mem) giữ nguyên.
- **Vì sao:** Lỗi nguồn (không lên máy) và lỗi pin/sạc là hai nhóm xử lý khác nhau, cần thống kê riêng (US6).
- **Ảnh hưởng:** `seeds/001_demo.sql`, `src/repositories/in-memory.js`, `src/services/classify-service.js`, `tests/warranty.test.js`.

---

## 10. Sắp xếp lại cấu trúc thư mục theo đề BT2 và đổi tên tài liệu

- **Thay đổi gì:** Mã nguồn tách thành `src/routes/` (HTTP), `src/validators/` (định dạng dữ liệu vào), `src/services/` (nghiệp vụ), `src/repositories/` (dữ liệu), `src/errors/`; điểm khởi động tách thành `src/app.js` (ghép tầng) và `src/server.js` (listen). Giao diện chuyển từ `src/frontend/` thành `src/web/` với `pages/`, `components/`, `api/`. Kiểm thử chuyển từ `src/tests/` ra `tests/` ở gốc. Tài liệu đổi tên cho đúng đề: `srs.docx.md` → `srs.md`, `ai-disclosure.docx.md` → `ai-disclosure.md`, `api-contract.docx.md` → `api-contract.md`. Các tham chiếu `wireframe.drawio`, `docs/wireframe.png` trong mục 2 và 3 thực chất là ba ảnh `taopbh.png`, `capnhatpbh.png`, `chitietpbh.png` (không có file `wireframe.*`).
- **Vì sao:** Đề BT2 (mục 3.2) và tiêu chí C2/S2 yêu cầu ba tầng nằm ở ba nơi khác nhau; thiết kế BT1 (kiến trúc) chỉ nêu lớp, chưa quy định thư mục. Tên file tài liệu phải đúng quy ước nộp bài.
- **Ảnh hưởng:** toàn bộ `src/`, `tests/`, `docs/`, `package.json` (`npm start` chạy `src/server.js`), `index.html`, `README.md` (mục 4).

---

## 11. Lỗi nghiệp vụ không mang mã HTTP; khôi phục CRUD khách hàng

- **Thay đổi gì:** `AppError` chỉ có `(code, message, fields)`; các service ném mã nghiệp vụ (`CUSTOMER_EXISTS`, `TICKET_NOT_FOUND`, `CUSTOMER_IN_USE`, `INVALID_REFERENCE`…) và `routes/http.js` dịch sang HTTP (400/404/409/422/500). Khôi phục `PATCH /api/customers/{id}` (sửa họ tên, email, segment, SĐT — vẫn kiểm tra QT-01) và `DELETE /api/customers/{id}` (từ chối bằng `CUSTOMER_IN_USE` nếu khách đã có thiết bị hoặc phiếu, ngược lại xóa). Kiểm tra định dạng dữ liệu vào chuyển từ service sang `validators/`.
- **Vì sao:** Tiêu chí S2 cấm dấu vết HTTP (mã trạng thái) trong service; tiêu chí S1 yêu cầu hai thực thể có đủ tạo/đọc/sửa/xóa — mục 7 đã bỏ nhầm customer PATCH/DELETE. Phiếu bảo hành vẫn không bao giờ bị xóa (QT-13); chỉ khách hàng chưa phát sinh dữ liệu mới được xóa.
- **Ảnh hưởng:** `src/errors/AppError.js`, `src/services/*`, `src/validators/*`, `src/routes/*`, `docs/api-contract.md`.

---

## 12. Ngày cuối cùng của thời hạn bảo hành tính theo ngày lịch UTC+7

- **Thay đổi gì:** `warrantyStatus` so sánh theo **ngày lịch** giờ Việt Nam: ngày cuối cùng của thời hạn (ví dụ mua 15/01/2026, bảo hành 12 tháng → hết hạn hết ngày 15/01/2027) vẫn là `CON_BAO_HANH`, ngày kế tiếp là `HET_BAO_HANH`. Cộng tháng có cắt về ngày cuối tháng (31/01 + 1 tháng = 28/02).
- **Vì sao:** Bản cũ so với 00:00 UTC của ngày hết hạn nên phiếu nhận trong chính ngày cuối cùng bị tính nhầm là hết bảo hành. SRS (US5) chưa nêu rõ ngày biên; đây là quyết định kỹ thuật, có kiểm thử biên.
- **Ảnh hưởng:** `src/domain/warranty.js`, `tests/warranty.test.js` (`[boundary] warranty…`).

---

## 13. Giao diện: địa chỉ API lấy từ biến môi trường, đủ ba trạng thái ở mọi màn hình

- **Thay đổi gì:** `src/web/api/client.js` đọc `VITE_API_BASE_URL`; CORS phía backend đọc `CORS_ORIGIN` (cả hai có trong `.env.example`). Màn hình Chi tiết phiếu có trạng thái đang tải và lỗi kèm nút Thử lại (trước đây thất bại thì rơi về form tạo phiếu); danh sách phiếu có nút Xóa bộ lọc khi lọc không ra kết quả. Bỏ dữ liệu cứng: số điện thoại mặc định, avatar "AB", nhãn "Bước 1 / 3".
- **Vì sao:** Đề BT2 mục 2.3 và tài liệu buổi 9: không ghi cứng địa chỉ/dữ liệu, phải thấy đủ ba trạng thái (đang tải, rỗng, lỗi).
- **Ảnh hưởng:** `src/web/*`, `.env.example`, `src/app.js`.
