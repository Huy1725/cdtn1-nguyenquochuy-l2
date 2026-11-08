-- Hai tai khoan nhan vien demo (mat khau chi luu dang bam scrypt):
--   nv01 / matkhau01   -  Nguyen Van An
--   nv02 / matkhau02   -  Tran Thi Binh
-- Chi dung de chay thu; trien khai that phai doi mat khau (xem docs/checklist-bao-mat.md).
INSERT INTO staff (staff_id, username, password_hash, full_name, is_active) VALUES
  (1, 'nv01', 'scrypt$487afa4ce4a383db5731aaa566676272$16e2015b24f79cd12e9e06d401b3180f4f33ffc7d24bafc9d16864702a407ed75c73f669eb88a6504c624b81dc4849478c22153ed20f4c79c9caddd67db53e29', 'Nguyen Van An', TRUE),
  (2, 'nv02', 'scrypt$fedd10775456230f6693894c2c6d036b$656836eff929ed1192c38e2fc5e8c7716714f7ee55a7ef5c457d412fff63a222eb25a8ed0f2e00a4242ac53c28fda45fa859c700243a37f1561dc816e652399f', 'Tran Thi Binh', TRUE)
ON DUPLICATE KEY UPDATE
  username = VALUES(username),
  password_hash = VALUES(password_hash),
  full_name = VALUES(full_name),
  is_active = VALUES(is_active);
