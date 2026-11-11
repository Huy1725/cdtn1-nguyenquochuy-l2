-- Phieu bao hanh MAU cho ban demo tren Render (Deployment Guide, muc 8). CHI duoc nap boi deploy/render/bake-db.sh khi dung image;
-- docker-compose.yml va bo test KHONG dung tep nay (du lieu mau cua goi chinh van la 0 phieu).
-- 14 phieu, du bon trang thai (MOI, DANG_XU_LY, HOAN_TAT, HUY), ba muc uu tien, hai nhan vien, ca thiet bi con va het bao hanh.
-- Han cam ket (QT-04), nhom su co (US6) va thoi diem nhat ky duoc tinh bang chinh ma nguon cua he thong (calculateDueDate,
-- ClassifyService); gio luu theo UTC nhu he thong that. Moi dong nhat ky do dung nhan vien tiep nhan phieu (quy tac chu phieu).
-- Phieu moi tao trong giao dien se co ma tiep theo (BH-000015/2026).

INSERT INTO ticket (ticket_id, ticket_code, customer_id, device_id, category_id, issue_desc, priority, status, received_at, due_date, received_by)
SELECT 1, 'BH-000001/2026', d.customer_id, d.device_id, 1, 'Pin chai nhanh, sac day van tut xuong nhanh', 'TRUNG_BINH', 'HOAN_TAT', '2026-11-02 02:10:00', '2026-11-05 02:10:00', 1
FROM device d WHERE d.serial_no = 'BULK-00002';
INSERT INTO ticket_status_log (ticket_id, from_status, to_status, note, changed_at, changed_by) VALUES
  (1, NULL, 'MOI', NULL, '2026-11-02 02:10:00', 1),
  (1, 'MOI', 'DANG_XU_LY', 'Da kiem tra pin, can thay pin moi', '2026-11-02 07:30:00', 1),
  (1, 'DANG_XU_LY', 'HOAN_TAT', 'Da thay pin, khach da nhan may', '2026-11-04 03:15:00', 1);

INSERT INTO ticket (ticket_id, ticket_code, customer_id, device_id, category_id, issue_desc, priority, status, received_at, due_date, received_by)
SELECT 2, 'BH-000002/2026', d.customer_id, d.device_id, 2, 'Man hinh bi soc, cam ung loan', 'CAO', 'HOAN_TAT', '2026-11-02 03:40:00', '2026-11-03 03:40:00', 2
FROM device d WHERE d.serial_no = 'BULK-00003';
INSERT INTO ticket_status_log (ticket_id, from_status, to_status, note, changed_at, changed_by) VALUES
  (2, NULL, 'MOI', NULL, '2026-11-02 03:40:00', 2),
  (2, 'MOI', 'DANG_XU_LY', 'Het bao hanh, da bao gia thay man hinh', '2026-11-02 08:00:00', 2),
  (2, 'DANG_XU_LY', 'HOAN_TAT', 'Khach dong y bao gia, da thay man hinh', '2026-11-03 09:20:00', 2);

INSERT INTO ticket (ticket_id, ticket_code, customer_id, device_id, category_id, issue_desc, priority, status, received_at, due_date, received_by)
SELECT 3, 'BH-000003/2026', d.customer_id, d.device_id, 3, 'May bi vao nuoc, khong len nguon', 'CAO', 'DANG_XU_LY', '2026-11-03 01:50:00', '2026-11-04 01:50:00', 1
FROM device d WHERE d.serial_no = 'A001';
INSERT INTO ticket_status_log (ticket_id, from_status, to_status, note, changed_at, changed_by) VALUES
  (3, NULL, 'MOI', NULL, '2026-11-03 01:50:00', 1),
  (3, 'MOI', 'DANG_XU_LY', 'Dang ve sinh bo mach, cho kho', '2026-11-03 04:00:00', 1);

INSERT INTO ticket (ticket_id, ticket_code, customer_id, device_id, category_id, issue_desc, priority, status, received_at, due_date, received_by)
SELECT 4, 'BH-000004/2026', d.customer_id, d.device_id, 4, 'May treo logo, khong vao duoc he dieu hanh', 'TRUNG_BINH', 'HOAN_TAT', '2026-11-03 08:20:00', '2026-11-06 08:20:00', 2
FROM device d WHERE d.serial_no = 'BULK-00004';
INSERT INTO ticket_status_log (ticket_id, from_status, to_status, note, changed_at, changed_by) VALUES
  (4, NULL, 'MOI', NULL, '2026-11-03 08:20:00', 2),
  (4, 'MOI', 'DANG_XU_LY', 'Dang cai lai he dieu hanh', '2026-11-04 02:30:00', 2),
  (4, 'DANG_XU_LY', 'HOAN_TAT', 'Da cai lai phan mem, giu nguyen du lieu', '2026-11-05 07:00:00', 2);

INSERT INTO ticket (ticket_id, ticket_code, customer_id, device_id, category_id, issue_desc, priority, status, received_at, due_date, received_by)
SELECT 5, 'BH-000005/2026', d.customer_id, d.device_id, 1, 'Cong sac long, sac khong vao pin', 'THAP', 'HUY', '2026-11-04 03:05:00', '2026-11-10 03:05:00', 1
FROM device d WHERE d.serial_no = 'BULK-00015';
INSERT INTO ticket_status_log (ticket_id, from_status, to_status, note, changed_at, changed_by) VALUES
  (5, NULL, 'MOI', NULL, '2026-11-04 03:05:00', 1),
  (5, 'MOI', 'HUY', 'Khach doi y, tu sua ben ngoai', '2026-11-04 09:40:00', 1);

INSERT INTO ticket (ticket_id, ticket_code, customer_id, device_id, category_id, issue_desc, priority, status, received_at, due_date, received_by)
SELECT 6, 'BH-000006/2026', d.customer_id, d.device_id, 2, 'Man hinh co vet nut, khong hien thi mot goc', 'CAO', 'DANG_XU_LY', '2026-11-05 02:30:00', '2026-11-06 02:30:00', 2
FROM device d WHERE d.serial_no = 'BULK-00018';
INSERT INTO ticket_status_log (ticket_id, from_status, to_status, note, changed_at, changed_by) VALUES
  (6, NULL, 'MOI', NULL, '2026-11-05 02:30:00', 2),
  (6, 'MOI', 'DANG_XU_LY', 'Da nhan linh kien man hinh, dang thay', '2026-11-05 06:10:00', 2);

INSERT INTO ticket (ticket_id, ticket_code, customer_id, device_id, category_id, issue_desc, priority, status, received_at, due_date, received_by)
SELECT 7, 'BH-000007/2026', d.customer_id, d.device_id, 3, 'May roi vo, nut nguon bi ket', 'TRUNG_BINH', 'DANG_XU_LY', '2026-11-05 07:15:00', '2026-11-09 07:15:00', 1
FROM device d WHERE d.serial_no = 'BULK-00022';
INSERT INTO ticket_status_log (ticket_id, from_status, to_status, note, changed_at, changed_by) VALUES
  (7, NULL, 'MOI', NULL, '2026-11-05 07:15:00', 1),
  (7, 'MOI', 'DANG_XU_LY', 'Dang kiem tra khung may va nut nguon', '2026-11-06 01:45:00', 1);

INSERT INTO ticket (ticket_id, ticket_code, customer_id, device_id, category_id, issue_desc, priority, status, received_at, due_date, received_by)
SELECT 8, 'BH-000008/2026', d.customer_id, d.device_id, 5, 'May bi nong, tu tat nguon khi choi game', 'TRUNG_BINH', 'MOI', '2026-11-06 09:30:00', '2026-11-10 09:30:00', 2
FROM device d WHERE d.serial_no = 'BULK-00023';
INSERT INTO ticket_status_log (ticket_id, from_status, to_status, note, changed_at, changed_by) VALUES
  (8, NULL, 'MOI', NULL, '2026-11-06 09:30:00', 2);

INSERT INTO ticket (ticket_id, ticket_code, customer_id, device_id, category_id, issue_desc, priority, status, received_at, due_date, received_by)
SELECT 9, 'BH-000009/2026', d.customer_id, d.device_id, 1, 'Pin phong, nap lung bi day len', 'CAO', 'MOI', '2026-11-07 02:20:00', '2026-11-09 02:20:00', 1
FROM device d WHERE d.serial_no = 'BULK-00029';
INSERT INTO ticket_status_log (ticket_id, from_status, to_status, note, changed_at, changed_by) VALUES
  (9, NULL, 'MOI', NULL, '2026-11-07 02:20:00', 1);

INSERT INTO ticket (ticket_id, ticket_code, customer_id, device_id, category_id, issue_desc, priority, status, received_at, due_date, received_by)
SELECT 10, 'BH-000010/2026', d.customer_id, d.device_id, 4, 'May cham, hay bi do khi mo ung dung, can cap nhat he dieu hanh', 'THAP', 'DANG_XU_LY', '2026-11-07 04:45:00', '2026-11-13 04:45:00', 2
FROM device d WHERE d.serial_no = 'BULK-00005';
INSERT INTO ticket_status_log (ticket_id, from_status, to_status, note, changed_at, changed_by) VALUES
  (10, NULL, 'MOI', NULL, '2026-11-07 04:45:00', 2),
  (10, 'MOI', 'DANG_XU_LY', 'Da nhan may, dang cap nhat phan mem', '2026-11-09 02:00:00', 2);

INSERT INTO ticket (ticket_id, ticket_code, customer_id, device_id, category_id, issue_desc, priority, status, received_at, due_date, received_by)
SELECT 11, 'BH-000011/2026', d.customer_id, d.device_id, 6, 'Loa ngoai nho, mat tieng khi goi dien', 'TRUNG_BINH', 'DANG_XU_LY', '2026-11-09 01:40:00', '2026-11-12 01:40:00', 1
FROM device d WHERE d.serial_no = 'BULK-00034';
INSERT INTO ticket_status_log (ticket_id, from_status, to_status, note, changed_at, changed_by) VALUES
  (11, NULL, 'MOI', NULL, '2026-11-09 01:40:00', 1),
  (11, 'MOI', 'DANG_XU_LY', 'Dang thay loa', '2026-11-09 08:00:00', 1);

INSERT INTO ticket (ticket_id, ticket_code, customer_id, device_id, category_id, issue_desc, priority, status, received_at, due_date, received_by)
SELECT 12, 'BH-000012/2026', d.customer_id, d.device_id, 2, 'Man hinh bi soc, hien thi soc doc', 'CAO', 'DANG_XU_LY', '2026-11-09 06:25:00', '2026-11-10 06:25:00', 2
FROM device d WHERE d.serial_no = 'BULK-00008';
INSERT INTO ticket_status_log (ticket_id, from_status, to_status, note, changed_at, changed_by) VALUES
  (12, NULL, 'MOI', NULL, '2026-11-09 06:25:00', 2),
  (12, 'MOI', 'DANG_XU_LY', 'Da bao gia, cho khach xac nhan', '2026-11-10 02:15:00', 2);

INSERT INTO ticket (ticket_id, ticket_code, customer_id, device_id, category_id, issue_desc, priority, status, received_at, due_date, received_by)
SELECT 13, 'BH-000013/2026', d.customer_id, d.device_id, 2, 'Cam ung loan, hay tu bam', 'THAP', 'MOI', '2026-11-10 03:10:00', '2026-11-16 03:10:00', 1
FROM device d WHERE d.serial_no = 'BULK-00037';
INSERT INTO ticket_status_log (ticket_id, from_status, to_status, note, changed_at, changed_by) VALUES
  (13, NULL, 'MOI', NULL, '2026-11-10 03:10:00', 1);

INSERT INTO ticket (ticket_id, ticket_code, customer_id, device_id, category_id, issue_desc, priority, status, received_at, due_date, received_by)
SELECT 14, 'BH-000014/2026', d.customer_id, d.device_id, 3, 'May bi roi nuoc, bat khong len', 'TRUNG_BINH', 'MOI', '2026-11-11 02:05:00', '2026-11-14 02:05:00', 2
FROM device d WHERE d.serial_no = 'BULK-00001';
INSERT INTO ticket_status_log (ticket_id, from_status, to_status, note, changed_at, changed_by) VALUES
  (14, NULL, 'MOI', NULL, '2026-11-11 02:05:00', 2);
