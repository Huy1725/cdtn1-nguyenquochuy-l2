# Nhật ký lỗi (Bug Log)

Hai phần: **Phần A — bốn bug do test case của Bài tập 3 phát hiện và một bug do phép thử máy trắng phát hiện**, mỗi bug đủ **bảy dòng** (mã và mức độ · phát hiện bởi test case nào · triệu chứng · cách tái lập · nguyên nhân thật · cách sửa · link commit và xác nhận chạy lại), mỗi bug một commit riêng;
**Phần B — bảy lỗi gặp trong giai đoạn BT2**, giữ nguyên định dạng bốn ý cũ (không dùng làm bug chấm Bài tập 3). Nhật ký này khác `thay-doi-thiet-ke.md`, vốn ghi các **thay đổi thiết kế**.

Mức độ đo bằng **tác động tới người dùng**, không phải độ khó sửa: **Critical** = hệ thống không dùng được, HOẶC dữ liệu bị sai, HOẶC có lỗ hổng bảo mật · **Major** = chức năng quan trọng chạy sai nhưng vẫn có cách làm tiếp · **Minor** = còn lại.

| Bug | Mức độ | Phát hiện bởi | Commit sửa |
|---|---|---|---|
| BUG-08 — không tạo được phiếu trên MySQL thật | Critical | TC-10 | [14e5935](https://github.com/Huy1725/cdtn1-nguyenquochuy-l2/commit/14e5935) |
| BUG-09 — nhật ký trạng thái lệch 7 giờ | Critical | TC-10 | [2b5a157](https://github.com/Huy1725/cdtn1-nguyenquochuy-l2/commit/2b5a157) |
| BUG-10 — thiếu đăng nhập và kiểm soát truy cập | Critical | TC-08, TC-09 | [7071796](https://github.com/Huy1725/cdtn1-nguyenquochuy-l2/commit/7071796) |
| BUG-11 — chữ "Đ" hoa phân loại sai nhóm sự cố | Major | TC-11 | [41a1eb0](https://github.com/Huy1725/cdtn1-nguyenquochuy-l2/commit/41a1eb0) |
| BUG-12 — ngay sau `docker compose up -d` hệ thống chưa `healthy`, `/health` từ chối kết nối | Minor | phép thử máy trắng | [fbe6e92](https://github.com/Huy1725/cdtn1-nguyenquochuy-l2/commit/fbe6e92) |

---

# Phần A — Bug phát hiện bởi test case (Bài tập 3)

## BUG-08 — Không tạo được phiếu bảo hành nào trên MySQL thật

1. **Mã và mức độ:** BUG-08 · **CRITICAL** — hệ thống không dùng được: chức năng chính của luồng L2 (tạo phiếu) luôn lỗi khi chạy với MySQL.
2. **Phát hiện bởi:** TC-10 (integration, MySQL thật).
3. **Triệu chứng:** Bấm tạo phiếu, API trả `500 {"code":"INTERNAL_ERROR"}`; không phiếu nào được lưu. Test in ra `Data too long for column 'ticket_code' at row 1`.
4. **Cách tái lập:** Dựng CSDL bằng `migrations/` + `seeds/` → `npm start` → `POST /api/tickets` với khách `0901234567`, thiết bị đầu tiên, `issue_desc` bất kỳ → nhận 500. (Hoặc `npm run test:integration` → TC-10 FAIL.)
5. **Nguyên nhân:** `MysqlTicketRepository.save()` chèn phiếu với mã tạm `BH-TMP-<Date.now()>-<6 ký tự ngẫu nhiên>` (27 ký tự) rồi mới đổi sang mã thật theo `ticket_id`; nhưng cột `ticket.ticket_code` chỉ là `VARCHAR(20)` nên MySQL (strict mode) từ chối câu `INSERT`. Test API cũ chạy trên repository bộ nhớ (không giới hạn độ dài) nên không bắt được.
6. **Cách sửa:** `src/repositories/mysql/ticket.repository.js` — mã tạm đổi thành `T` + 18 ký tự hex từ `crypto.randomBytes(9)` = 19 ký tự, vừa cột và vẫn không trùng; ghi chú ràng buộc độ dài ngay cạnh dòng sinh mã.
7. **Link commit và xác nhận:** https://github.com/Huy1725/cdtn1-nguyenquochuy-l2/commit/14e5935 — chạy lại TC-10: lỗi `Data too long` không còn, phiếu tạo được và nhận mã `BH-000001/2026`. TC-10 vẫn FAIL nhưng vì một lỗi khác (thời điểm nhật ký lệch 420 phút) → ghi thành BUG-09. Ảnh lỗi trước khi sửa: [TC-10-fail-bug08.png](screenshots/TC-10-fail-bug08.png); ảnh chạy lại sau khi sửa (lỗi mới): [TC-10-fail-bug09.png](screenshots/TC-10-fail-bug09.png).

## BUG-09 — Lịch sử trạng thái phiếu ghi sai giờ, lệch 7 tiếng so với lúc nhận máy

1. **Mã và mức độ:** BUG-09 · **CRITICAL** — dữ liệu bị sai: mốc thời gian trong nhật ký trạng thái (US7, QT-13) — chính là bằng chứng "ai làm gì lúc nào" — lệch 7 giờ so với thực tế.
2. **Phát hiện bởi:** TC-10 (lần chạy 2, sau khi sửa BUG-08).
3. **Triệu chứng:** Phiếu nhận lúc 10:13 giờ VN (`received_at = 03:13:15Z`) nhưng dòng nhật ký đầu tiên ghi `changed_at = 10:13:15Z` (= 17:13 giờ VN) — nhân viên thấy phiếu "được tạo" 7 tiếng sau khi nhận máy. TC-10 báo `lech 420.0 phut`.
4. **Cách tái lập:** Trên máy cài MySQL để múi giờ hệ thống là giờ Việt Nam (mặc định khi cài MySQL trên Windows ở VN; kiểm tra: `SELECT @@global.time_zone, NOW(), UTC_TIMESTAMP();` thấy `SYSTEM` và hai giờ lệch 7 tiếng) → `npm run test:integration` → TC-10 FAIL; hoặc tạo một phiếu rồi `GET /api/tickets/{id}` và so `received_at` với `status_log[0].changed_at`.
5. **Nguyên nhân:** Phiếu và nhật ký lấy giờ từ **hai đồng hồ khác nhau**. `received_at` do service tính từ đồng hồ ứng dụng và lưu dạng giờ UTC; còn `changed_at` không được truyền vào câu `INSERT` nên MySQL tự điền bằng `DEFAULT CURRENT_TIMESTAMP` — giá trị này theo **múi giờ của phiên kết nối** (`SYSTEM` = UTC+7), rồi tầng repository lại đọc nó như giờ UTC và gắn hậu tố `Z`. Test API chạy trên repository bộ nhớ (tự lấy `new Date().toISOString()`) nên không lộ; trong Docker, MySQL mặc định chạy UTC nên cũng không lộ.
6. **Cách sửa:** (a) `src/services/ticket-service.js` — truyền `changed_at` lấy từ **cùng** `this.clock()` cho cả lúc tạo phiếu và lúc đổi trạng thái; (b) `src/repositories/mysql/ticket.repository.js` — `appendStatusLog` ghi `changed_at` tường minh, không dựa vào giá trị mặc định của CSDL; (c) `src/repositories/mysql/pool.js` — mỗi kết nối mới chạy `SET time_zone = '+00:00'` để mọi cột `DEFAULT CURRENT_TIMESTAMP` khác (như `customer.created_at`) cũng là UTC; (d) thêm test hồi quy `[regression] BUG-09` trong `tests/integration/mysql.test.js` kiểm tra phiên kết nối dùng `+00:00` và `CURRENT_TIMESTAMP` khớp `UTC_TIMESTAMP()`. Dữ liệu nhật ký tạo trước bản sửa trong CSDL demo vẫn lệch 7 giờ — dựng lại CSDL bằng migration + seed.
7. **Link commit và xác nhận:** https://github.com/Huy1725/cdtn1-nguyenquochuy-l2/commit/2b5a157 — chạy lại `npm run test:integration`: TC-10 PASS (lệch 0 phút), test hồi quy BUG-09 PASS, TC-12 vẫn PASS (3/3). `npm test` không đổi (17/20, ba TC còn FAIL thuộc BUG-10 và BUG-11). Ảnh chạy lại: [run3-integration-pass.png](screenshots/run3-integration-pass.png); ảnh lỗi trước khi sửa: [TC-10-fail-bug09.png](screenshots/TC-10-fail-bug09.png).

## BUG-10 — Ai cũng sửa/hủy được mọi phiếu bảo hành mà không cần đăng nhập

1. **Mã và mức độ:** BUG-10 · **CRITICAL** — lỗ hổng bảo mật: thiếu xác thực (OWASP A07) và thiếu kiểm soát truy cập (OWASP A01); dữ liệu bị thay đổi thật.
2. **Phát hiện bởi:** TC-08 (gọi API không token / token giả) và TC-09 (nhân viên khác sửa phiếu không phải của mình).
3. **Triệu chứng:** Bất kỳ ai gọi được tới API đều xem toàn bộ khách hàng và hủy được phiếu bất kỳ: TC-08 gửi `PATCH /api/tickets/1/status` **không có** header `Authorization` → nhận `200` và phiếu chuyển sang `HUY` thật. TC-09: `POST /api/auth/login` trả `404` — hệ thống không có chức năng đăng nhập. Lịch sử phiếu ghi "NV #1" cho mọi thao tác, bất kể ai làm.
4. **Cách tái lập:** `npm start` → `curl -X PATCH http://localhost:3000/api/tickets/1/status -H "content-type: application/json" -d "{\"status\":\"HUY\"}"` (không token) → `200`, `GET /api/tickets/1` thấy `status` = `HUY`.
5. **Nguyên nhân:** Thiết kế BT1 có đăng nhập (`JWT_SECRET` trong `.env.example`) nhưng BT2 chưa hiện thực, và không có gì chặn lại: (a) `src/routes/index.js` chuyển thẳng mọi request tới handler, không có bước xác thực; (b) không có bảng nhân viên; (c) "người thực hiện" lấy từ trường `changed_by` **do client tự gửi** (giao diện gửi cứng `changed_by: 1`) nên giả mạo được; (d) bảng `ticket` không lưu ai tiếp nhận phiếu, nên `TicketService.changeStatus()` chỉ kiểm tra phiếu tồn tại, không thể kiểm tra quyền.
6. **Cách sửa:**
   - CSDL: `migrations/002_staff_auth.sql` thêm bảng `staff` và cột `ticket.received_by` (khóa ngoại, chạy lại không lỗi); `seeds/002_staff.sql` hai tài khoản demo, mật khẩu băm scrypt.
   - Bảo mật: `src/security/password.js` (băm/kiểm mật khẩu scrypt, so sánh hằng thời gian), `src/security/token.js` (token HS256 hạn 8 giờ, ký bằng `JWT_SECRET`).
   - Nghiệp vụ: `src/services/auth-service.js` (đăng nhập — sai tên hay sai mật khẩu đều cùng một lỗi; xác thực token); `src/services/ticket-service.js` nhận `actor` từ token, ghi `received_by`/`changed_by` theo actor, **chặn đổi trạng thái nếu actor không phải người tiếp nhận** (`FORBIDDEN`), trả kèm tên người thực hiện (US7).
   - HTTP: `src/routes/index.js` mặc định mọi route cần token, chỉ `POST /api/auth/login` được đánh dấu `public`; `src/routes/auth.routes.js` (`/api/auth/login`, `/api/auth/me`); `src/routes/http.js` dịch `UNAUTHORIZED`/`INVALID_CREDENTIALS` → 401, `FORBIDDEN` → 403, CORS cho phép header `authorization`; validators bỏ `changed_by` khỏi dữ liệu client.
   - `src/server.js` từ chối khởi động nếu `JWT_SECRET` < 32 ký tự. Giao diện: trang đăng nhập, gửi token ở mọi request, tự về trang đăng nhập khi token hết hạn, hiện tên nhân viên + nút đăng xuất, khóa ô đổi trạng thái nếu không phải chủ phiếu.
   - Test: TC-01…07 và các test hồi quy gọi API nay đăng nhập trước; thêm 4 test hồi quy (sai mật khẩu/sai tên cùng một lỗi; token hết hạn hoặc bị sửa → 401 và mọi API nghiệp vụ cần token; mật khẩu lưu dạng băm; người thực hiện lấy từ token, không giả mạo được).
7. **Link commit và xác nhận:** https://github.com/Huy1725/cdtn1-nguyenquochuy-l2/commit/7071796 — chạy lại: TC-08 PASS (không token và token giả đều `401`, phiếu vẫn `MOI`); TC-09 PASS (`nv02` nhận `403 FORBIDDEN`, `nv01` — chủ phiếu — vẫn đổi được, `200`). `npm test` 24/24, `npm run test:integration` 3/3. Chạy thử trên MySQL thật: không token `401`, sai mật khẩu `401`, `nv02` sửa phiếu của `nv01` → `403`, `nv01` → `200`, lịch sử ghi "Nguyen Van An". Ảnh chạy lại: [run5-unit-pass.png](screenshots/run5-unit-pass.png), [run5-integration-pass.png](screenshots/run5-integration-pass.png); ảnh lỗi trước khi sửa: [run1-unit-fail.png](screenshots/run1-unit-fail.png), [run4-unit.png](screenshots/run4-unit.png).

## BUG-11 — Mô tả lỗi viết HOA có chữ "Đ" bị phân sai nhóm sự cố

1. **Mã và mức độ:** BUG-11 · **MAJOR** — chức năng gợi ý nhóm sự cố (US6) cho kết quả sai, nhưng nhân viên vẫn chọn lại nhóm đúng bằng tay được nên không chặn công việc và không làm sai dữ liệu đã lưu.
2. **Phát hiện bởi:** TC-11.
3. **Triệu chứng:** Mô tả `"may bi va đập"` được gợi ý đúng nhóm 3 (Vào nước / Hư hỏng vật lý), nhưng cùng nội dung viết HOA `"MÁY BỊ VA ĐẬP MẠNH"` lại bị đưa vào nhóm 6 (Khác) — phiếu đi sai hàng xử lý nếu nhân viên không để ý.
4. **Cách tái lập:** `POST /api/tickets` không gửi `category_id`, với `issue_desc` = `"MÁY BỊ VA ĐẬP MẠNH"` → phản hồi có `category_id` = 6. (Hoặc chạy lại TC-11 trên mã trước commit sửa: `git checkout 41a1eb0~1` rồi `node --test --test-name-pattern="TC-11" tests/unit/warranty.test.js` → FAIL, `actual: 6, expected: 3`.)
5. **Nguyên nhân:** `normalize()` trong `src/services/classify-service.js` bỏ dấu, rồi `replace(/đ/g, "d")`, **sau đó** mới `toLowerCase()`. Chữ `Đ` (U+0110) không tách được dấu bằng NFD và không khớp `/đ/` (chữ thường) nên lọt qua; đến `toLowerCase()` nó thành `đ` nhưng lúc đó không còn bước thay nào nữa → chuỗi thành `"may bi va đap manh"`, không chứa từ khóa `"va dap"`.
6. **Cách sửa:** `src/services/classify-service.js` — đưa `toLowerCase()` lên **đầu** chuỗi xử lý, nên mọi `Đ` đã thành `đ` trước bước thay `đ → d`; ghi chú lý do thứ tự ngay trên hàm. Đã tìm trong toàn bộ `src/` — đây là chỗ chuẩn hóa chữ duy nhất.
7. **Link commit và xác nhận:** https://github.com/Huy1725/cdtn1-nguyenquochuy-l2/commit/41a1eb0 — chạy lại `npm test`: TC-11 PASS (cả chữ thường và chữ HOA đều ra nhóm 3); TC-01 (phân loại "vao nuoc" → nhóm 3) vẫn PASS; 18/20, hai TC còn FAIL là TC-08, TC-09 thuộc BUG-10. Ảnh chạy lại: [run4-unit.png](screenshots/run4-unit.png); ảnh lỗi trước khi sửa: [run1-unit-fail.png](screenshots/run1-unit-fail.png).

## BUG-12 — Ngay sau `docker compose up -d`, hệ thống chưa `healthy` và `/health` từ chối kết nối

1. **Mã và mức độ:** BUG-12 · **MINOR** — hệ thống vẫn lên được, nhưng trong vài giây đầu các bước kiểm tra của Deployment Guide cho kết quả sai: người chấm chạy kiểm tra ngay có thể kết luận hệ thống không chạy (rủi ro cho mục cốt lõi C1).
2. **Phát hiện bởi:** phép thử máy trắng (clone repo từ GitHub vào thư mục trống, chạy đúng hai lệnh, rồi chạy ngay Guide mục 5 bước 1–2) — không thuộc 12 test case.
3. **Triệu chứng:** Ngay sau lệnh dựng, `docker compose ps` ghi `app … Up Less than a second (health: starting)` và `curl http://localhost:3000/health` trả `HTTP 000` (kết nối bị từ chối). Sau đó `app` mới chuyển `healthy` và `/health` trả `200` (một lần đo muộn hơn ghi `Up 37 seconds (healthy)`).
4. **Cách tái lập:** `git clone` repo vào thư mục trống → `copy .env.example .env` → `docker compose up -d --build` → chạy ngay `docker compose ps` và `curl http://localhost:3000/health`.
5. **Nguyên nhân:** `docker compose up -d` trả về ngay khi container `app` được **khởi động**, không chờ nó khỏe. Tiến trình Node cần khoảng một giây để mở cổng, và healthcheck của `app` chỉ chạy mỗi 10 giây (`interval: 10s`) nên trạng thái `starting` kéo dài tới lần kiểm tra kế tiếp (chưa đo chính xác khoảng này). `depends_on: service_healthy` chỉ làm `app` chờ CSDL, không làm lệnh `up -d` chờ `app`.
6. **Cách sửa:** `docker-compose.yml` — healthcheck của `app` chạy mỗi 3 giây (`interval: 3s`, `timeout: 3s`, `retries: 10`); `docs/deployment-guide.md` mục 5 ghi rõ "nếu thấy `health: starting`, đợi vài giây rồi chạy lại" và mục 6 thêm dòng xử lý. Không dùng `up --wait` hay `start_interval` vì không chạy trên Docker/Compose cũ, làm hỏng lệnh người chấm.
7. **Link commit và xác nhận:** https://github.com/Huy1725/cdtn1-nguyenquochuy-l2/commit/fbe6e92 — chạy lại phép thử máy trắng từ bản clone GitHub: lệnh dựng xong trong 28 giây; sau khi đợi 6 giây như Guide ghi, `docker compose ps` báo `app … Up 6 seconds (healthy)`, `/health` trả 200, bộ test trong container 34/34 PASS (đo riêng trên bản sao thư mục làm việc: `healthy` sau 5,1 giây kể từ khi `up -d` trả về). Ảnh trước khi sửa: [blank-machine-before-fix.png](screenshots/blank-machine-before-fix.png); sau khi sửa: [blank-machine-setup.png](screenshots/blank-machine-setup.png).

---

# Phần B — Lỗi giai đoạn BT2 (định dạng bốn ý cũ)

BUG-01 → BUG-05 phát hiện trong giai đoạn dựng khung kiến trúc BT2 (Buổi 8–12); BUG-06, BUG-07 phát hiện khi hoàn thiện lớp MySQL repository và tự kiểm tra quy trình README trước khi nộp BT2. Mỗi lỗi gồm bốn ý: **Triệu chứng · Nguyên nhân gốc · Cách sửa · File ảnh hưởng**.

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
