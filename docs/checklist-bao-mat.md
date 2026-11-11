# Checklist bảo mật — Luồng L2: Tiếp nhận và phân loại yêu cầu bảo hành

Sinh viên: Nguyễn Quốc Huy · 2374802010185 · Track SE · Bài tập 3

Mỗi mục ghi **ĐÃ LÀM / CHƯA LÀM / KHÔNG ÁP DỤNG** kèm một dòng minh chứng và ảnh chụp lần chạy thật trong [screenshots/](screenshots/).
Ảnh `sec-N.png` chụp từ cửa sổ terminal chạy đúng các lệnh ghi trong ảnh; ảnh không qua chỉnh sửa.
Các lệnh ở mục 1, 2, 7 chạy trên mã nguồn tại commit `abd0463` (mã ứng dụng — `src/`, `tests/`, `migrations/`, `seeds/`, `Dockerfile` — không đổi từ commit đó đến tag `v1.0`; sau đó chỉ sửa `docker-compose.yml` (khoảng kiểm tra sức khỏe, BUG-12), thêm CI (`.github/`), gói deploy thử (`render.yaml`, `deploy/`, `.gitattributes`) và tài liệu); các lệnh ở mục 4, 5, 6 chạy trên hệ thống dựng bằng
`docker compose up -d --build` (xem [deployment-guide.md](deployment-guide.md)).

## 1. Không có secret nào trong repo — ĐÃ LÀM

Minh chứng: `git log --all --oneline -- .env` → rỗng; `git check-ignore -v .env` → `.gitignore:5`; mọi giá trị từng gán cho `DB_PASSWORD` / `JWT_SECRET` trong lịch sử git chỉ là rỗng hoặc giá trị mẫu (`change-me-…`).
`.env` nằm trong `.gitignore` và `.dockerignore` nên không vào repo lẫn image.
Ảnh: [sec-1.png](screenshots/sec-1.png)

> Lưu ý: repo có công khai hai tài khoản demo (`nv01`/`matkhau01`, `nv02`/`matkhau02`) trong README, test và seed — đây là dữ liệu mẫu, trong CSDL chỉ lưu dạng băm; phải đổi/xóa khi triển khai thật.

## 2. Dữ liệu vào được kiểm ở tầng ứng dụng — ĐÃ LÀM

Minh chứng: mọi dữ liệu vào đi qua `src/validators/` trước khi tới service; TC-06 (thiếu trường → 400 nêu đúng trường) PASS; test hồi quy A05: `phone=' OR '1'='1` → 400, không trả danh sách khách;
ba lệnh grep chống injection: không có `innerHTML`, không có lệnh hệ thống; lệnh grep SQL cho 3 kết quả đã xem xét từng chỗ — 2 chỗ là mảnh SQL cố định (`WHERE status = ?`), 1 chỗ là tên cột khi cập nhật khách,
đã chặn bằng danh sách cột cho phép và có test (`[regression] A05: repository tu choi ten cot la`); giá trị luôn đi qua tham số `?`.
Ảnh: [sec-2.png](screenshots/sec-2.png)

## 3. Kiểm soát truy cập theo chủ sở hữu — ĐÃ LÀM

Minh chứng: TC-09 — nhân viên `nv02` đổi trạng thái phiếu của `nv01` → `403 FORBIDDEN`, phiếu không đổi, còn `nv01` vẫn đổi được (`200`); TC-08 — không token / token giả → `401`. Cả hai PASS.
Lỗ hổng này từng có thật và đã sửa: BUG-10 trong [bug-log.md](bug-log.md).
Ảnh: [TC-09-pass.png](screenshots/TC-09-pass.png), [TC-08-pass.png](screenshots/TC-08-pass.png)

## 4. Mật khẩu, dữ liệu nhạy cảm băm/mã hóa — ĐÃ LÀM

Minh chứng: `SELECT username, LEFT(password_hash, 48) FROM staff` → `scrypt$<salt>$<hash>` (thuật toán scrypt của Node, không phải bcrypt); không cột nào chứa mật khẩu đọc được; test `[regression] S3` kiểm tra điều này.
Ảnh: [sec-4.png](screenshots/sec-4.png)

## 5. Thông báo lỗi không lộ cấu trúc bên trong — ĐÃ LÀM

Minh chứng: gửi JSON hỏng → `400 INVALID_JSON` gọn; tắt CSDL rồi gọi API → `500 {"code":"INTERNAL_ERROR","message":"Loi may chu"}`; `/health` → `503 {"status":"degraded","db":"down"}`;
không phản hồi nào có stack trace, tên bảng hay chuỗi kết nối (TC-06 và test `/health` cũng kiểm tra bằng regex).
Ảnh: [sec-5.png](screenshots/sec-5.png)

## 6. Nhật ký không ghi secret, dữ liệu cá nhân — ĐÃ LÀM

Minh chứng: `docker compose logs app | grep -iE "password|token|0[0-9]{9}"` → 0 kết quả; lỗi 500 chỉ ghi `{"level":"error","method":"GET","path":"/api/customers","code":"EAI_AGAIN"}` — không ghi query (số điện thoại), nội dung lỗi hay dữ liệu gửi lên
(có test `[regression] loi 500 duoc ghi log…`).
Ảnh: [sec-6.png](screenshots/sec-6.png)

## 7. Phụ thuộc ghim phiên bản, đã kiểm lỗ hổng — ĐÃ LÀM

Minh chứng: `package-lock.json` đã commit và Docker cài bằng `npm ci` (đúng phiên bản trong lock); `npm audit --omit=dev` và `npm audit` đều `found 0 vulnerabilities`.
Ảnh: [sec-7.png](screenshots/sec-7.png)

> Lưu ý: `package.json` khai báo khoảng phiên bản (`^`), việc ghim chính xác nằm ở `package-lock.json`; image nền được ghim theo thẻ `node:24-alpine` và `mysql:8.0`, chưa ghim theo digest.
> Lỗ hổng thật từng gặp: `mysql2@3.11.5` bị `npm audit` báo mức high, đã nâng lên 3.24.6 (BUG-06).

---

## Tự kiểm bổ sung của track SE

| Việc cần kiểm | Trạng thái | Minh chứng |
|---|---|---|
| Đã chạy 3 lệnh grep chống injection và ghi kết quả | ĐÃ LÀM | `sec-2.png` |
| `JWT_SECRET` lấy từ biến môi trường, ≥ 32 ký tự, thiếu thì dừng | ĐÃ LÀM | `src/config.js`; test `[regression] cau hinh`; thử thật: bỏ `JWT_SECRET` → `Thieu bien moi truong: JWT_SECRET - xem .env.example`, thoát mã 1 |
| Hàm xác thực token chỉ nhận HS256, không dùng decode để cấp quyền | ĐÃ LÀM | `src/security/token.js`: kiểm tra tiêu đề cố định + chữ ký bằng `timingSafeEqual` + hạn; test `BUG-10 token het han hoac bi sua noi dung` |
| Payload token chỉ có id, hạn dùng — không có dữ liệu cá nhân | ĐÃ LÀM | payload gồm `sub`, `iat`, `exp` |
| Kiểm soát truy cập theo chủ sở hữu, có test | ĐÃ LÀM | TC-09 |
| CORS chỉ mở cho origin trong biến môi trường, không dùng `*` kèm credentials | ĐÃ LÀM | `CORS_ORIGIN` (một origin); không có cookie/credentials |
| Cookie có HttpOnly/SameSite | KHÔNG ÁP DỤNG | Hệ thống không dùng cookie; token gửi bằng header `Authorization` |
| Không có secret/token/mật khẩu trong URL | ĐÃ LÀM | Chỉ `phone`, `status`, `page`, `size` nằm trong query; token ở header |
| Thông báo lỗi không lộ stack trace, tên bảng, chuỗi kết nối | ĐÃ LÀM | mục 5 |
| API docs đủ mọi endpoint, mỗi endpoint bảy mục, ví dụ thật | ĐÃ LÀM | [api-docs/README.md](api-docs/README.md) (13 endpoint) |
| Deployment Guide có phần nói cách bật HTTPS khi triển khai thật | ĐÃ LÀM | [deployment-guide.md](deployment-guide.md) mục 7 |

## OWASP Top 10:2025 — mục nào đã tự kiểm

| Nhóm | Liên quan tới | Mục checklist |
|---|---|---|
| A01 Broken Access Control | quyền sửa phiếu theo chủ sở hữu | 3 |
| A02 Security Misconfiguration | `.env`, cổng CSDL không mở ra ngoài, lỗi không lộ cấu trúc | 1, 5 |
| A03 Software Supply Chain Failures | phụ thuộc npm | 7 |
| A04 Cryptographic Failures | băm mật khẩu, ký token | 4 |
| A05 Injection | tham số hóa SQL, validator | 2 |
| A07 Authentication Failures | đăng nhập, token, thông báo lỗi chung cho sai tên/sai mật khẩu | 3, 4 |
| A09 Security Logging and Alerting Failures | log lỗi 500 không chứa dữ liệu cá nhân | 6 |
| A10 Mishandling of Exceptional Conditions | CSDL chết, JSON hỏng | 5 |
| A06, A08 | thuộc Chuyên đề tốt nghiệp 2 | — |

## Giới hạn đã biết (CHƯA LÀM)

| Giới hạn | Rủi ro | Hướng xử lý nếu triển khai thật |
|---|---|---|
| Không giới hạn số lần đăng nhập sai (không rate limit) | Dò mật khẩu bằng vét cạn (A07) | Giới hạn theo IP/tài khoản, khóa tạm |
| Chỉ chạy HTTP trên localhost, chưa có TLS | Token và mật khẩu đi qua mạng dạng rõ nếu không có proxy | Đặt sau reverse proxy có chứng chỉ TLS (mô tả ở Deployment Guide mục 7) |
| Ứng dụng và test kết nối MySQL bằng tài khoản `root` trong mạng nội bộ của compose (bản deploy thử trên Render đã dùng tài khoản riêng `app` chỉ có SELECT/INSERT/UPDATE/DELETE — Guide mục 8) | Một lỗ hổng trong app có quyền quá rộng trên CSDL | Tạo tài khoản riêng chỉ có quyền trên CSDL `warranty_l2`; chạy test tích hợp ở chỗ khác |
| Token (8 giờ) lưu trong `sessionStorage` của trình duyệt, không thể thu hồi trước hạn | Nếu có XSS thì token bị đọc; token bị lộ vẫn dùng được đến khi hết hạn | Giữ React tự escape (đã grep không có `innerHTML`); thêm refresh token + danh sách thu hồi |
| Mật khẩu hai tài khoản demo công khai trong repo | Ai cũng đăng nhập được hệ thống demo | Đổi hoặc xóa tài khoản demo khi triển khai thật |
| Chưa kiểm thử xâm nhập, chưa mô hình hóa mối đe dọa | — | Thuộc Chuyên đề tốt nghiệp 2 |
