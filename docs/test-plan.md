# Test Plan rút gọn — Luồng L2: Tiếp nhận và phân loại yêu cầu bảo hành

Sinh viên: Nguyễn Quốc Huy · 2374802010185 · Track SE · Bài tập 3

## 1. Phạm vi kiểm thử và phần chủ ý KHÔNG kiểm

**Kiểm:** toàn bộ quy tắc nghiệp vụ đã hiện thực của luồng L2, qua API thật:
tạo phiếu (QT-04 hạn cam kết, US5 trạng thái bảo hành, US6 phân loại sự cố), quản lý khách hàng (QT-01),
đổi trạng thái / hủy phiếu và lưu vết (QT-13, US7), đăng nhập và kiểm soát truy cập theo chủ sở hữu
(OWASP A07, A01), dựng CSDL bằng migration + seed và chạy lại lần hai (tái lập).

**Chủ ý không kiểm (kèm lý do):**

| Phần không kiểm | Lý do |
|---|---|
| Giao diện React bằng test tự động | Giao diện không chứa quy tắc nghiệp vụ (mọi quy tắc nằm ở `src/services/`, `src/validators/`); ba trạng thái đang tải/rỗng/lỗi đã kiểm thủ công và có ảnh ở BT2. Test UI tốn kém, dễ vỡ, khi vỡ không chỉ ra lỗi nằm ở đâu. |
| `GET /api/categories` | Chỉ đọc danh mục tĩnh 6 nhóm, không có quy tắc nghiệp vụ. |
| Thứ tự chuyển trạng thái (VD `HOAN_TAT → MOI`) | SRS chưa đặc tả máy trạng thái của phiếu nên không có kết quả mong đợi để đối chiếu — ghi nhận là hạn chế, không phải bug. |
| Hiệu năng, tải, kiểm thử xâm nhập | Ngoài phạm vi Bài tập 3 (đề mục 1). |
| Luồng L3/L4 (phân công kỹ thuật viên, sửa chữa) | Không thuộc luồng L2 (WON'T trong SRS). |

**Kỹ thuật chọn dữ liệu:** phân vùng tương đương (thiết bị còn bảo hành / hết bảo hành / không xác định;
token: không có / bị sửa / hợp lệ của người khác / hợp lệ của chủ phiếu) và giá trị biên (ranh giới hết bảo hành
tính theo ngày lịch giờ Việt Nam: 23:59 ngày cuối và 00:00 ngày kế tiếp).

## 2. Loại test và số lượng mỗi tầng

| Tầng | Số TC | Mã TC | Công cụ |
|---|---:|---|---|
| Unit (hàm thuần, service) | 3 | TC-04, TC-05, TC-11 | `node:test` |
| API (HTTP thật, repository bộ nhớ) | 7 | TC-01, TC-02, TC-03, TC-06, TC-07, TC-08, TC-09 | `node:test` + `fetch` |
| Integration (MySQL thật) | 2 | TC-10, TC-12 | `node:test` + `mysql2` |
| **Tổng** | **12** | | |

Theo loại: luồng đúng 5 (TC-01, 02, 03, 10, 11) · giá trị biên 2 (TC-04 và TC-05, hai bên cùng một ranh giới) ·
dữ liệu sai 2 (TC-06, 07) · bảo mật 2 (TC-08 A07, TC-09 A01) · tái lập 1 (TC-12).
Ngoài 12 TC trên, `npm test` còn chạy 10 test hồi quy từ BT2 (đánh dấu `[regression]`).

Tầng API nhiều hơn tỉ lệ gợi ý vì nhiều quy tắc chỉ thấy đủ khi đi qua cả validator, service và bảng dịch mã lỗi
sang HTTP; chạy với repository bộ nhớ nên vẫn nhanh (< 50 ms/test) và không cần CSDL.

## 3. Tiêu chí thành công đo được

1. 12/12 TC PASS ở lần chạy cuối bằng hai lệnh `npm test` và `npm run test:integration`.
2. Mỗi quy tắc nghiệp vụ đã hiện thực (QT-01, QT-04, QT-13, US5, US6, US7, quy tắc chủ sở hữu phiếu) có ít nhất một TC
   luồng đúng; US5 có hai TC biên ở hai bên ranh giới.
3. Không còn bug mức Critical nào đang mở trong `docs/bug-log.md`.
4. Mọi TC dữ liệu sai / bảo mật: đúng mã HTTP **và** đúng mã lỗi nghiệp vụ, thân phản hồi không chứa stack trace.
5. Chạy migration + seed lần hai: số bản ghi của mọi bảng không đổi.

## 4. Môi trường và dữ liệu thử

- **Unit + API:** Node.js; mỗi test tự dựng dữ liệu bằng hàm `setup()` (khách `0901234567`, thiết bị `A001`
  mua 15/01/2026 bảo hành 12 tháng) trên repository bộ nhớ, mở server ở cổng ngẫu nhiên rồi đóng; đồng hồ cố định
  10/10/2026 16:00 giờ Việt Nam (thứ Bảy) để TC về hạn cam kết lặp lại được. Không phụ thuộc dữ liệu có sẵn trên máy.
- **Integration:** MySQL 8.0. Test tự `DROP` + `CREATE` CSDL riêng `warranty_l2_test` rồi chạy toàn bộ
  `migrations/` và `seeds/` (101 khách hàng, 139 thiết bị, 6 nhóm sự cố) — không đụng CSDL `warranty_l2` đang dùng.
- **Lệnh chạy:** `npm test` · `npm run test:integration` · một TC: `npm test -- --test-name-pattern="TC-04"`.
- **Minh chứng:** ảnh chụp mỗi lần chạy lưu ở `docs/screenshots/` theo mã test (`TC-08-fail.png`, `TC-08-pass.png`).
