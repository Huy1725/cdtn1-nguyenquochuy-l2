# Test Report — Luồng L2: Tiếp nhận và phân loại yêu cầu bảo hành

Sinh viên: Nguyễn Quốc Huy · 2374802010185 · Track SE · Bài tập 3
Kế hoạch kiểm thử: [test-plan.md](test-plan.md) · Nhật ký lỗi: [bug-log.md](bug-log.md) · Ảnh chụp: [screenshots/](screenshots/)

## 1. Tổng hợp

| Lần chạy | Ngày | Mã nguồn | Số TC chạy | PASS | FAIL | TC FAIL | Ảnh chụp |
|---|---|---|---:|---:|---:|---|---|
| 1 | 2026-11-07 | `887ca51` (chưa sửa gì) | 12 | 8 | 4 | TC-08, TC-09, TC-10, TC-11 | [run1-unit-fail.png](screenshots/run1-unit-fail.png), [TC-10-fail-bug08.png](screenshots/TC-10-fail-bug08.png) |
| 2 | 2026-11-08 | `14e5935` (đã sửa BUG-08) | 12 | 8 | 4 | TC-08, TC-09, TC-10 (lỗi khác), TC-11 | [TC-10-fail-bug09.png](screenshots/TC-10-fail-bug09.png) |
| 3 | 2026-11-08 | `2b5a157` (đã sửa BUG-09) | 12 | 9 | 3 | TC-08, TC-09, TC-11 | [run3-integration-pass.png](screenshots/run3-integration-pass.png) |
| 4 | 2026-11-08 | `41a1eb0` (đã sửa BUG-11) | 12 | 10 | 2 | TC-08, TC-09 | [run4-unit.png](screenshots/run4-unit.png) |
| 5 | 2026-11-08 | `7071796` (đã sửa BUG-10) | 12 | **12** | 0 | — | [run5-unit-pass.png](screenshots/run5-unit-pass.png), [run5-integration-pass.png](screenshots/run5-integration-pass.png) |
| 6 | 2026-11-10 | `abd0463` (một lệnh `npm test`: 34/34) | 12 | **12** | 0 | — | [run6-npm-test.png](screenshots/run6-npm-test.png) (cả bộ); mỗi TC một ảnh, xem mục 4 |

Cả năm loại test đều có: luồng đúng 5 (TC-01, 02, 03, 10, 11) · giá trị biên 2 (TC-04, 05) ·
dữ liệu sai 2 (TC-06, 07) · bảo mật 2 (TC-08, 09) · tái lập 1 (TC-12).
Ngoài 12 TC, bộ kiểm thử có 22 test hồi quy (`[regression]`, không tính vào 12 TC): 10 từ BT2, 1 cho BUG-09,
4 cho BUG-10 (đăng nhập sai, token hết hạn/bị sửa, mật khẩu băm, không giả mạo người thực hiện) và 7 thêm ở khâu
đóng gói/bảo mật (`/health` ×2, giao diện tĩnh + path traversal, kiểm tra cấu hình, log lỗi 500, chuỗi injection trong SĐT,
tên cột khi cập nhật khách). Ở lần chạy 5 bộ test còn tách hai lệnh (`npm test` 24/24 và `npm run test:integration` 3/3);
từ lần chạy 6 gộp thành một lệnh `npm test` (34/34).

**Lệnh chạy:**
- Cả bộ bằng **một lệnh**: `npm test` → 34 test (12 TC + 22 hồi quy); cần MySQL đang chạy vì có TC-10 và TC-12. Trong Docker: `docker compose exec app npm test` (cùng 34 test).
- Không có MySQL: `npm run test:unit` (TC-01…09, TC-11 + 20 hồi quy) · chỉ phần MySQL: `npm run test:integration`.
- **Chạy lại đúng một TC:** `npm run tc -- TC-07` (đổi số cho TC khác; tự tìm file chứa TC đó). Dòng đầu in commit đang
  kiểm — có thêm "(+ THAY ĐỔI CHƯA COMMIT)" nếu mã nguồn khác commit, khi đó ảnh chụp không dùng làm minh chứng.

## 2. Test case (8 cột)

Cột 7–8 ghi kết quả của **lần chạy 6 (gần nhất, commit `abd0463`)**; TC từng FAIL ở lần chạy trước thì ghi kèm kết quả đó.

Tiền điều kiện chung của TC-01…09, TC-11 (hàm `setup()` trong `tests/unit/warranty.test.js`): repository bộ nhớ,
khách hàng `0901234567` "Nguyen AB", thiết bị `A001` mua 15/01/2026 bảo hành 12 tháng, 6 nhóm sự cố mặc định,
đồng hồ cố định **10/10/2026 16:00 giờ Việt Nam (thứ Bảy)**; server HTTP thật mở ở cổng ngẫu nhiên;
hai tài khoản demo `nv01`/`matkhau01` (staff_id 1, Nguyen Van An) và `nv02`/`matkhau02` (staff_id 2).
Từ lần chạy 5 (sau khi sửa BUG-10), mọi TC gọi API **đăng nhập `nv01` trước** (bước 0) và gửi
`Authorization: Bearer <token>`; phiếu tạo sẵn trong tiền điều kiện do `nv01` tiếp nhận.

| Mã TC | Tiền điều kiện | Các bước | Dữ liệu thử | Kết quả mong đợi | Ưu tiên | Kết quả thực tế | PASS/FAIL |
|---|---|---|---|---|---|---|---|
| **TC-01** [luồng đúng] QT-04, US5, US6 | Dữ liệu chung; chưa có phiếu nào. | 1. Gửi `POST /api/tickets`.<br>2. Đọc mã trạng thái và thân phản hồi. | `{"customer_id":1,"device_id":1,"issue_desc":"May bi vao nuoc khong len nguon","priority":"TRUNG_BINH"}` | `201`; `status`=`MOI`; `ticket_code` dạng `BH-000000/2026`; `due_date`=`2026-10-14T09:00:00.000Z` (+72 giờ, bỏ Chủ Nhật 11/10); `category_id`=3 (Vào nước); `warranty_status`=`CON_BAO_HANH`; nhật ký 1 dòng; `received_by`=1 (từ lần 5). | Cao | `201`, phiếu `MOI`, mã đúng dạng, hạn 14/10 16:00 giờ VN, nhóm 3, còn bảo hành, 1 dòng nhật ký, người tiếp nhận `nv01`. | **PASS** |
| **TC-02** [luồng đúng] QT-01 | Dữ liệu chung (đã có khách `0901234567`). | 1. `POST /api/customers` khách mới.<br>2. `POST /api/customers` với SĐT đã có.<br>3. `GET /api/customers?phone=0901234567`. | B1: `{"phone":"0912345678","full_name":"Tran Moi"}`<br>B2: `{"phone":"0901234567","full_name":"Trung Lap"}` | B1 `201`. B2 `409`, `error.code`=`CUSTOMER_EXISTS`, `error.fields.phone` có nội dung. B3 `full_name` vẫn là `"Nguyen AB"` (không bị ghi đè). | Cao | B1 `201`; B2 `409 CUSTOMER_EXISTS` nêu trường `phone`; B3 trả `"Nguyen AB"`. | **PASS** |
| **TC-03** [luồng đúng] QT-13 | Dữ liệu chung + 1 phiếu trạng thái `MOI`. | 1. `PATCH /api/tickets/{id}/status`.<br>2. `GET /api/tickets`. | `{"status":"HUY","note":"Khach doi y"}` | B1 `200`, `status`=`HUY`, nhật ký 2 dòng, dòng 2 = `MOI → HUY`, ghi chú `"Khach doi y"`. B2 `total`=1 (hủy không xóa phiếu). | Cao | B1 `200`, `HUY`, dòng 2 `MOI → HUY` "Khach doi y"; B2 `total`=1. | **PASS** |
| **TC-04** [biên] US5 | Không cần dữ liệu (hàm thuần `warrantyStatus`). | 1. Gọi `warrantyStatus(ngày mua, số tháng, thời điểm nhận)`. | `"2026-01-15"`, `12`, `2027-01-15T16:59:00Z` (= 23:59 ngày 15/01/2027 giờ VN, ngày cuối còn hạn) | `CON_BAO_HANH` | Cao | `CON_BAO_HANH` | **PASS** |
| **TC-05** [biên] US5 | Như TC-04. | 1. Gọi `warrantyStatus(...)`. | `"2026-01-15"`, `12`, `2027-01-15T17:00:00Z` (= 00:00 ngày 16/01/2027 giờ VN, ngày đầu hết hạn) | `HET_BAO_HANH` | Cao | `HET_BAO_HANH` | **PASS** |
| **TC-06** [dữ liệu sai] | Dữ liệu chung; chưa có phiếu nào. | 1. `POST /api/tickets` thiếu `issue_desc`.<br>2. `GET /api/tickets`. | `{"customer_id":1,"device_id":1,"priority":"CAO"}` | B1 `400`, `error.code`=`VALIDATION_FAILED`, `error.fields.issue_desc` có nội dung; thân phản hồi không chứa `stack`, `.js:<số dòng>`, `at ...(`. B2 `total`=0. | Cao | B1 `400 VALIDATION_FAILED`, nêu trường `issue_desc`, không có stack trace; B2 `total`=0. | **PASS** |
| **TC-07** [dữ liệu sai] | Dữ liệu chung; không có phiếu id 999. | 1. `GET /api/tickets/999`. | id `999` | `404`, `error.code`=`TICKET_NOT_FOUND`, `error.message`=`"Khong tim thay phieu"` (không phải `500`). | Trung bình | `404 TICKET_NOT_FOUND` "Khong tim thay phieu". | **PASS** |
| **TC-08** [bảo mật] OWASP A07 | Dữ liệu chung + 1 phiếu `MOI`. | 1. `PATCH /api/tickets/{id}/status` **không** có header `Authorization`.<br>2. Gọi lại với token giả.<br>3. Đọc lại trạng thái phiếu. | Body `{"status":"HUY"}`; B2 header `Authorization: Bearer abc.def.ghi` | B1 và B2 đều `401`, `error.code`=`UNAUTHORIZED`. B3 phiếu vẫn `MOI`. | Cao | Lần 1–4: B1 trả **`200`** và phiếu **bị hủy thật** (chuyển `HUY`) — API không yêu cầu đăng nhập → **BUG-10**.<br>Từ lần 5 (sau sửa BUG-10, đến lần 6): B1 `401 UNAUTHORIZED`, B2 `401`, B3 phiếu vẫn `MOI`. | **PASS** |
| **TC-09** [bảo mật] OWASP A01 | Dữ liệu chung + 2 tài khoản nhân viên `nv01`, `nv02`. | 1. Đăng nhập `nv01` → token A.<br>2. Đăng nhập `nv02` → token B.<br>3. `POST /api/tickets` bằng token A.<br>4. `PATCH .../status` bằng token B.<br>5. `PATCH .../status` bằng token A. | B1 `{"username":"nv01","password":"matkhau01"}`; B2 `{"username":"nv02","password":"matkhau02"}`; B4 `{"status":"HUY"}`; B5 `{"status":"DANG_XU_LY"}` | B1, B2 `200` có `token`; B3 `201`; B4 **`403`**, `error.code`=`FORBIDDEN`, phiếu không đổi; B5 `200`, nhật ký 2 dòng (chủ phiếu vẫn sửa được). | Cao | Lần 1–4: B1 `POST /api/auth/login` trả **`404`** — hệ thống không có đăng nhập, không biết phiếu thuộc nhân viên nào → **BUG-10**.<br>Từ lần 5 (đến lần 6): B1, B2 `200` có token; B3 `201`; B4 `403 FORBIDDEN`; B5 `200`, nhật ký 2 dòng. | **PASS** |
| **TC-10** [luồng đúng] US7, QT-13 (MySQL thật) | MySQL 8.0; CSDL `warranty_l2_test` dựng mới từ `migrations/` + `seeds/`. | 1. Tìm khách `0901234567` và thiết bị đầu tiên của khách.<br>2. Tạo phiếu qua `TicketService` dùng repository MySQL.<br>3. So `received_at` với `status_log[0].changed_at`. | `issue_desc`=`"Man hinh bi soc, cam ung loan"`, `priority`=`"CAO"` | Tạo phiếu thành công; thời điểm ghi nhật ký lệch thời điểm nhận phiếu **< 1 phút**. | Cao | Lần 1: lỗi `Data too long for column 'ticket_code'`, không tạo được phiếu → **BUG-08** (đã sửa `14e5935`).<br>Lần 2: tạo được phiếu nhưng `received_at=03:13:15Z`, `changed_at=10:13:15Z` — **lệch 420 phút** → **BUG-09**.<br>Từ lần 3 (sau sửa BUG-09, đến lần 6): tạo được phiếu, `changed_at` trùng `received_at` (lệch 0 phút). | **PASS** |
| **TC-11** [luồng đúng] US6 | Dữ liệu chung (6 nhóm sự cố, nhóm 3 có từ khóa "va dap"). | 1. Gọi `classifyService.suggest(mô tả)` với chữ thường.<br>2. Gọi lại với chữ HOA. | B1 `"may bi va đập"`; B2 `"MÁY BỊ VA ĐẬP MẠNH"` | Cả hai trả nhóm `3` (Vào nước / Hư hỏng vật lý). | Trung bình | Lần 1–3: B1 trả `3`; B2 trả **`6`** (Khác) — chữ `Đ` hoa không được chuẩn hóa → **BUG-11**.<br>Từ lần 4 (sau sửa BUG-11, đến lần 6): B1 và B2 đều trả `3`. | **PASS** |
| **TC-12** [tái lập] | MySQL 8.0 đang chạy; tài khoản trong `.env` có quyền `CREATE DATABASE`. | 1. `DROP` + `CREATE DATABASE warranty_l2_test`.<br>2. Chạy mọi file `migrations/*.sql` rồi `seeds/*.sql`.<br>3. Đếm số dòng mọi bảng.<br>4. Chạy lại bước 2.<br>5. Đếm lại. | Thư mục `migrations/`, `seeds/` của repo | B3: `customer`=101, `device`=139, `issue_category`=6 (từ lần 5 thêm `staff`=2). B4 không lỗi. B5 số dòng mọi bảng giống hệt B3. | Cao | B3: 101 / 139 / 6 (lần 5: thêm `staff`=2); B4 không lỗi, kể cả migration `002` thêm cột; B5 giống hệt. | **PASS** |

## 3. Truy vết TC FAIL → Bug

| TC | Bug | Mức độ | Trạng thái |
|---|---|---|---|
| TC-10 (lần 1) | [BUG-08](bug-log.md#bug-08--không-tạo-được-phiếu-bảo-hành-nào-trên-mysql-thật) — mã phiếu tạm dài hơn cột `ticket_code` | Critical | Đã sửa — `14e5935` |
| TC-10 (lần 2) | [BUG-09](bug-log.md#bug-09--lịch-sử-trạng-thái-phiếu-ghi-sai-giờ-lệch-7-tiếng-so-với-lúc-nhận-máy) — thời điểm nhật ký trạng thái lệch 7 giờ | Critical | Đã sửa — `2b5a157` |
| TC-08, TC-09 | [BUG-10](bug-log.md#bug-10--ai-cũng-sửahủy-được-mọi-phiếu-bảo-hành-mà-không-cần-đăng-nhập) — API không có đăng nhập và kiểm soát truy cập | Critical | Đã sửa — `7071796` |
| TC-11 | [BUG-11](bug-log.md#bug-11--mô-tả-lỗi-viết-hoa-có-chữ-đ-bị-phân-sai-nhóm-sự-cố) — chữ `Đ` hoa làm phân loại sai nhóm | Major | Đã sửa — `41a1eb0` |

## 4. Ảnh minh chứng từng test case

Mỗi TC có ảnh chụp lần chạy cuối ở [screenshots/](screenshots/), chụp từ lệnh `npm run tc -- TC-xx`: ảnh có tên lệnh (ở tên tab và dòng `> node scripts/run-tc.js TC-xx` do npm in),
commit đang kiểm, tên TC kèm dấu ✔, và các dòng `thực tế:` in giá trị đọc từ kết quả thật. TC từng FAIL có thêm ảnh FAIL
chụp trước khi sửa. Cột "Ảnh PASS" là ảnh **lần chạy 6** (commit `abd0463`; mã ứng dụng không đổi đến tag `v1.0`, xem `git diff --stat abd0463 v1.0 -- src tests`). Cách chụp: mở một cửa sổ Windows Terminal mới, chạy đúng lệnh ghi trên tab,
chụp nội dung cửa sổ đó ngay khi lệnh chạy xong; ảnh không qua chỉnh sửa. Giảng viên có thể tự chạy lại bất kỳ TC nào bằng `npm run tc -- TC-xx`.

| TC | Ảnh FAIL (trước khi sửa bug) | Ảnh PASS (lần chạy 6) |
|---|---|---|
| TC-01 | — (chưa từng FAIL) | [TC-01-pass.png](screenshots/TC-01-pass.png) |
| TC-02 | — | [TC-02-pass.png](screenshots/TC-02-pass.png) |
| TC-03 | — | [TC-03-pass.png](screenshots/TC-03-pass.png) |
| TC-04 | — | [TC-04-pass.png](screenshots/TC-04-pass.png) |
| TC-05 | — | [TC-05-pass.png](screenshots/TC-05-pass.png) |
| TC-06 | — | [TC-06-pass.png](screenshots/TC-06-pass.png) |
| TC-07 | — | [TC-07-pass.png](screenshots/TC-07-pass.png) |
| TC-08 | [run1-unit-fail.png](screenshots/run1-unit-fail.png) (lần 1), [run4-unit.png](screenshots/run4-unit.png) (lần 4: `200 !== 401`) — BUG-10 | [TC-08-pass.png](screenshots/TC-08-pass.png) |
| TC-09 | [run1-unit-fail.png](screenshots/run1-unit-fail.png) (lần 1), [run4-unit.png](screenshots/run4-unit.png) (lần 4: `404 !== 200`) — BUG-10 | [TC-09-pass.png](screenshots/TC-09-pass.png) |
| TC-10 | [TC-10-fail-bug08.png](screenshots/TC-10-fail-bug08.png) (`Data too long` — BUG-08), [TC-10-fail-bug09.png](screenshots/TC-10-fail-bug09.png) (lệch 420 phút — BUG-09) | [TC-10-pass.png](screenshots/TC-10-pass.png) |
| TC-11 | [run1-unit-fail.png](screenshots/run1-unit-fail.png) (lần 1) — BUG-11 | [TC-11-pass.png](screenshots/TC-11-pass.png) |
| TC-12 | — | [TC-12-pass.png](screenshots/TC-12-pass.png) |

Ảnh xác nhận chạy lại sau khi sửa từng bug: BUG-09 → [run3-integration-pass.png](screenshots/run3-integration-pass.png) ·
BUG-11 → [run4-unit.png](screenshots/run4-unit.png) · BUG-10 → [run5-unit-pass.png](screenshots/run5-unit-pass.png),
[run5-integration-pass.png](screenshots/run5-integration-pass.png).

### Ảnh từng test case (lần chạy 6)

**TC-01**

![TC-01](screenshots/TC-01-pass.png)

**TC-02**

![TC-02](screenshots/TC-02-pass.png)

**TC-03**

![TC-03](screenshots/TC-03-pass.png)

**TC-04**

![TC-04](screenshots/TC-04-pass.png)

**TC-05**

![TC-05](screenshots/TC-05-pass.png)

**TC-06**

![TC-06](screenshots/TC-06-pass.png)

**TC-07**

![TC-07](screenshots/TC-07-pass.png)

**TC-08**

![TC-08](screenshots/TC-08-pass.png)

**TC-09**

![TC-09](screenshots/TC-09-pass.png)

**TC-10**

![TC-10](screenshots/TC-10-pass.png)

**TC-11**

![TC-11](screenshots/TC-11-pass.png)

**TC-12**

![TC-12](screenshots/TC-12-pass.png)

**Cả bộ bằng một lệnh `npm test` — 34/34 PASS**

![npm test](screenshots/run6-npm-test.png)

## 5. Ảnh hệ thống chạy trong Docker

Chụp từ trình duyệt Edge thật mở `http://localhost:3000` của hệ thống dựng bằng `docker compose up -d --build` (mã nguồn `abd0463`):
đăng nhập, tra cứu số `0901234567` (hiện "Nguyen AB" và thiết bị `A001`), tạo phiếu `BH-000001/2026` với người tiếp nhận "Nguyen Van An".

![Trang đăng nhập](screenshots/ui-login.png)

![Tra cứu khách hàng](screenshots/ui-lookup.png)

![Chi tiết phiếu vừa tạo](screenshots/ui-ticket.png)

## 6. Phép thử máy trắng (clone từ GitHub, hai lệnh)

Làm đúng Deployment Guide trên thư mục trống: `git clone` repo từ GitHub (commit `fbe6e92`), `copy .env.example .env`, `docker compose up -d --build`
(lệnh thứ hai xong trong 28 giây), đợi vài giây như Guide mục 5 ghi, rồi kiểm tra. Kết quả: `docker compose ps` cả `db` và `app` `healthy`; `/health` trả
`{"status":"ok","db":"up"}`; API chưa đăng nhập trả `401`; `docker compose exec app npm test` PASS **34/34** (12 test case + 22 hồi quy).

![Phép thử máy trắng: clone, hai lệnh, kiểm tra](screenshots/blank-machine-setup.png)

![Bộ test chạy trong container](screenshots/blank-machine-test.png)

Lần thử máy trắng đầu tiên (commit `ac860e3`) lộ lỗi BUG-12: ngay sau lệnh dựng `app` còn `health: starting` và `/health` bị từ chối kết nối;
ảnh trước khi sửa: [blank-machine-before-fix.png](screenshots/blank-machine-before-fix.png). Xem [bug-log.md](bug-log.md).



## 7. CI trên GitHub Actions

File [.github/workflows/ci.yml](../.github/workflows/ci.yml) chạy mỗi lần `push` và `pull_request`: GitHub bật một máy Ubuntu sạch, dựng MySQL 8.0 tạm thời,
rồi chạy `npm ci`, `npm run build`, `npm test`. Trước khi push, các bước này đã được chạy thử trên một bản clone sạch (không có `.env`): 34/34 PASS.
Lần chạy đầu tiên trên GitHub (`CI #1`, commit `930fbdf`) **xanh, 44 giây**.

![CI #1 xanh trên tab Actions](screenshots/ci-green.png)

## 8. Bản demo trên Render

Địa chỉ công khai: **https://warranty-l2-nguyenquochuy.onrender.com** (gói Free, vùng Singapore; các bước dựng và biến môi trường ở [deployment-guide.md](deployment-guide.md) mục 8).
Kiểm tra từ bên ngoài, trên đúng địa chỉ đó: `/health` → `200 {"status":"ok","db":"up"}`; gọi HTTP thường → `301` sang HTTPS; `/api/tickets` không đăng nhập → `401`;
đăng nhập `nv01` rồi tra cứu `0901234567` → "Nguyen AB"; nhân viên `nv02` sửa phiếu của `nv01` → `403`, chủ phiếu → `200`.
Dữ liệu demo quay về dữ liệu mẫu mỗi khi Render khởi động lại (gói Free không có ổ đĩa bền); dữ liệu mẫu của bản demo gồm cả 14 phiếu mẫu để danh sách phiếu không trống.

![curl tới địa chỉ Render](screenshots/render-1-curl.png)

Giao diện mở trong Edge thật (thanh địa chỉ hiện địa chỉ Render và ổ khóa HTTPS): trang đăng nhập, tra cứu khách hàng sau khi đăng nhập, phiếu vừa tạo.

![Trang đăng nhập](screenshots/render-2-login.png)

![Tra cứu khách hàng](screenshots/render-3-lookup.png)

![Phiếu vừa tạo](screenshots/render-4-ticket.png)

Hai ảnh sau chụp từ trang quản lý của Render: dịch vụ ở trạng thái Live (gói Free, commit `92b70dc`) và tab Environment, nơi `DB_PASSWORD` và `JWT_SECRET` do Render tạo ra, giá trị đang được ẩn.

![Trang dịch vụ trên Render](screenshots/render-5-service.png)

![Tab Environment của dịch vụ](screenshots/render-6-env.png)
