# Test Report — Luồng L2: Tiếp nhận và phân loại yêu cầu bảo hành

Sinh viên: Nguyễn Quốc Huy · 2374802010185 · Track SE · Bài tập 3
Kế hoạch kiểm thử: [test-plan.md](test-plan.md) · Nhật ký lỗi: [bug-log.md](bug-log.md) · Ảnh chụp: [screenshots/](screenshots/)

## 1. Tổng hợp

| Lần chạy | Ngày | Mã nguồn | Số TC chạy | PASS | FAIL | TC FAIL | Ảnh chụp |
|---|---|---|---:|---:|---:|---|---|
| 1 | 2026-11-07 | `887ca51` (chưa sửa gì) | 12 | 8 | 4 | TC-08, TC-09, TC-10, TC-11 | [run1-unit-fail.png](screenshots/run1-unit-fail.png), [TC-10-fail-bug08.png](screenshots/TC-10-fail-bug08.png) |
| 2 | 2026-11-08 | `14e5935` (đã sửa BUG-08) | 12 | 8 | 4 | TC-08, TC-09, TC-10 (lỗi khác), TC-11 | [TC-10-fail-bug09.png](screenshots/TC-10-fail-bug09.png) |

Theo loại (đủ 5 loại đề yêu cầu): luồng đúng 5 (TC-01, 02, 03, 10, 11) · giá trị biên 2 (TC-04, 05) ·
dữ liệu sai 2 (TC-06, 07) · bảo mật 2 (TC-08, 09) · tái lập 1 (TC-12).
Ngoài 12 TC, `npm test` chạy thêm 10 test hồi quy từ BT2 — cả hai lần đều 10/10 PASS.

**Lệnh chạy:** `npm test` (TC-01…09, TC-11, không cần CSDL) · `npm run test:integration` (TC-10, TC-12, cần MySQL) ·
chạy một TC: `npm test -- --test-name-pattern="TC-04"`.

## 2. Test case (8 cột)

Cột 7–8 ghi kết quả của **lần chạy gần nhất**; lần chạy trước khác kết quả thì ghi kèm.

Tiền điều kiện chung của TC-01…09, TC-11 (hàm `setup()` trong `tests/unit/warranty.test.js`): repository bộ nhớ,
khách hàng `0901234567` "Nguyen AB", thiết bị `A001` mua 15/01/2026 bảo hành 12 tháng, 6 nhóm sự cố mặc định,
đồng hồ cố định **10/10/2026 16:00 giờ Việt Nam (thứ Bảy)**; server HTTP thật mở ở cổng ngẫu nhiên.

| Mã TC | Tiền điều kiện | Các bước | Dữ liệu thử | Kết quả mong đợi | Ưu tiên | Kết quả thực tế | PASS/FAIL |
|---|---|---|---|---|---|---|---|
| **TC-01** [luồng đúng] QT-04, US5, US6 | Dữ liệu chung; chưa có phiếu nào. | 1. Gửi `POST /api/tickets`.<br>2. Đọc mã trạng thái và thân phản hồi. | `{"customer_id":1,"device_id":1,"issue_desc":"May bi vao nuoc khong len nguon","priority":"TRUNG_BINH"}` | `201`; `status`=`MOI`; `ticket_code` dạng `BH-000000/2026`; `due_date`=`2026-10-14T09:00:00.000Z` (+72 giờ, bỏ Chủ Nhật 11/10); `category_id`=3 (Vào nước); `warranty_status`=`CON_BAO_HANH`; nhật ký 1 dòng. | Cao | `201`, phiếu `MOI`, mã đúng dạng, hạn 14/10 16:00 giờ VN, nhóm 3, còn bảo hành, 1 dòng nhật ký. | **PASS** |
| **TC-02** [luồng đúng] QT-01 | Dữ liệu chung (đã có khách `0901234567`). | 1. `POST /api/customers` khách mới.<br>2. `POST /api/customers` với SĐT đã có.<br>3. `GET /api/customers?phone=0901234567`. | B1: `{"phone":"0912345678","full_name":"Tran Moi"}`<br>B2: `{"phone":"0901234567","full_name":"Trung Lap"}` | B1 `201`. B2 `409`, `error.code`=`CUSTOMER_EXISTS`, `error.fields.phone` có nội dung. B3 `full_name` vẫn là `"Nguyen AB"` (không bị ghi đè). | Cao | B1 `201`; B2 `409 CUSTOMER_EXISTS` nêu trường `phone`; B3 trả `"Nguyen AB"`. | **PASS** |
| **TC-03** [luồng đúng] QT-13 | Dữ liệu chung + 1 phiếu trạng thái `MOI`. | 1. `PATCH /api/tickets/{id}/status`.<br>2. `GET /api/tickets`. | `{"status":"HUY","note":"Khach doi y"}` | B1 `200`, `status`=`HUY`, nhật ký 2 dòng, dòng 2 = `MOI → HUY`, ghi chú `"Khach doi y"`. B2 `total`=1 (hủy không xóa phiếu). | Cao | B1 `200`, `HUY`, dòng 2 `MOI → HUY` "Khach doi y"; B2 `total`=1. | **PASS** |
| **TC-04** [biên] US5 | Không cần dữ liệu (hàm thuần `warrantyStatus`). | 1. Gọi `warrantyStatus(ngày mua, số tháng, thời điểm nhận)`. | `"2026-01-15"`, `12`, `2027-01-15T16:59:00Z` (= 23:59 ngày 15/01/2027 giờ VN, ngày cuối còn hạn) | `CON_BAO_HANH` | Cao | `CON_BAO_HANH` | **PASS** |
| **TC-05** [biên] US5 | Như TC-04. | 1. Gọi `warrantyStatus(...)`. | `"2026-01-15"`, `12`, `2027-01-15T17:00:00Z` (= 00:00 ngày 16/01/2027 giờ VN, ngày đầu hết hạn) | `HET_BAO_HANH` | Cao | `HET_BAO_HANH` | **PASS** |
| **TC-06** [dữ liệu sai] | Dữ liệu chung; chưa có phiếu nào. | 1. `POST /api/tickets` thiếu `issue_desc`.<br>2. `GET /api/tickets`. | `{"customer_id":1,"device_id":1,"priority":"CAO"}` | B1 `400`, `error.code`=`VALIDATION_FAILED`, `error.fields.issue_desc` có nội dung; thân phản hồi không chứa `stack`, `.js:<số dòng>`, `at ...(`. B2 `total`=0. | Cao | B1 `400 VALIDATION_FAILED`, nêu trường `issue_desc`, không có stack trace; B2 `total`=0. | **PASS** |
| **TC-07** [dữ liệu sai] | Dữ liệu chung; không có phiếu id 999. | 1. `GET /api/tickets/999`. | id `999` | `404`, `error.code`=`TICKET_NOT_FOUND`, `error.message`=`"Khong tim thay phieu"` (không phải `500`). | Trung bình | `404 TICKET_NOT_FOUND` "Khong tim thay phieu". | **PASS** |
| **TC-08** [bảo mật] OWASP A07 | Dữ liệu chung + 1 phiếu `MOI`. | 1. `PATCH /api/tickets/{id}/status` **không** có header `Authorization`.<br>2. Gọi lại với token giả.<br>3. Đọc lại trạng thái phiếu. | Body `{"status":"HUY"}`; B2 header `Authorization: Bearer abc.def.ghi` | B1 và B2 đều `401`, `error.code`=`UNAUTHORIZED`. B3 phiếu vẫn `MOI`. | Cao | B1 trả **`200`** và phiếu **bị hủy thật** (chuyển `HUY`) — API không yêu cầu đăng nhập. → **BUG-10** | **FAIL** |
| **TC-09** [bảo mật] OWASP A01 | Dữ liệu chung + 2 tài khoản nhân viên `nv01`, `nv02`. | 1. Đăng nhập `nv01` → token A.<br>2. Đăng nhập `nv02` → token B.<br>3. `POST /api/tickets` bằng token A.<br>4. `PATCH .../status` bằng token B.<br>5. `PATCH .../status` bằng token A. | B1 `{"username":"nv01","password":"matkhau01"}`; B2 `{"username":"nv02","password":"matkhau02"}`; B4 `{"status":"HUY"}`; B5 `{"status":"DANG_XU_LY"}` | B1, B2 `200` có `token`; B3 `201`; B4 **`403`**, `error.code`=`FORBIDDEN`, phiếu không đổi; B5 `200`, nhật ký 2 dòng (chủ phiếu vẫn sửa được). | Cao | B1 `POST /api/auth/login` trả **`404`** — hệ thống không có đăng nhập, không biết phiếu thuộc nhân viên nào. → **BUG-10** | **FAIL** |
| **TC-10** [luồng đúng] US7, QT-13 (MySQL thật) | MySQL 8.0; CSDL `warranty_l2_test` dựng mới từ `migrations/` + `seeds/`. | 1. Tìm khách `0901234567` và thiết bị đầu tiên của khách.<br>2. Tạo phiếu qua `TicketService` dùng repository MySQL.<br>3. So `received_at` với `status_log[0].changed_at`. | `issue_desc`=`"Man hinh bi soc, cam ung loan"`, `priority`=`"CAO"` | Tạo phiếu thành công; thời điểm ghi nhật ký lệch thời điểm nhận phiếu **< 1 phút**. | Cao | Lần 1: lỗi `Data too long for column 'ticket_code'`, không tạo được phiếu → **BUG-08** (đã sửa `14e5935`).<br>Lần 2: tạo được phiếu nhưng `received_at=03:13:15Z`, `changed_at=10:13:15Z` — **lệch 420 phút** → **BUG-09** | **FAIL** |
| **TC-11** [luồng đúng] US6 | Dữ liệu chung (6 nhóm sự cố, nhóm 3 có từ khóa "va dap"). | 1. Gọi `classifyService.suggest(mô tả)` với chữ thường.<br>2. Gọi lại với chữ HOA. | B1 `"may bi va đập"`; B2 `"MÁY BỊ VA ĐẬP MẠNH"` | Cả hai trả nhóm `3` (Vào nước / Hư hỏng vật lý). | Trung bình | B1 trả `3`; B2 trả **`6`** (Khác) — chữ `Đ` hoa không được chuẩn hóa. → **BUG-11** | **FAIL** |
| **TC-12** [tái lập] | MySQL 8.0 đang chạy; tài khoản trong `.env` có quyền `CREATE DATABASE`. | 1. `DROP` + `CREATE DATABASE warranty_l2_test`.<br>2. Chạy mọi file `migrations/*.sql` rồi `seeds/*.sql`.<br>3. Đếm số dòng 5 bảng.<br>4. Chạy lại bước 2.<br>5. Đếm lại. | Thư mục `migrations/`, `seeds/` của repo | B3: `customer`=101, `device`=139, `issue_category`=6. B4 không lỗi. B5 số dòng cả 5 bảng giống hệt B3. | Cao | B3: 101 / 139 / 6; B4 không lỗi; B5 giống hệt. | **PASS** |

## 3. Truy vết TC FAIL → Bug

| TC | Bug | Mức độ | Trạng thái |
|---|---|---|---|
| TC-10 (lần 1) | [BUG-08](bug-log.md#bug-08--không-tạo-được-phiếu-bảo-hành-nào-trên-mysql-thật) — mã phiếu tạm dài hơn cột `ticket_code` | Critical | Đã sửa — `14e5935` |
| TC-10 (lần 2) | BUG-09 — thời điểm nhật ký trạng thái lệch 7 giờ | Critical | Đang sửa |
| TC-08, TC-09 | BUG-10 — API không có đăng nhập và kiểm soát truy cập | Critical | Đang sửa |
| TC-11 | BUG-11 — chữ `Đ` hoa làm phân loại sai nhóm | Major | Đang sửa |
