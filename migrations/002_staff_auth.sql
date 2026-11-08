-- BUG-10: tai khoan nhan vien (dang nhap) va nguoi tiep nhan phieu (quy tac chu phieu).
-- Chay lai nhieu lan khong loi (TC-12): CREATE ... IF NOT EXISTS va chi ADD COLUMN khi chua co.

CREATE TABLE IF NOT EXISTS staff (
  staff_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

-- MySQL 8.0 chua co "ADD COLUMN IF NOT EXISTS" nen kiem tra information_schema truoc.
-- Phieu tao truoc BUG-10 de received_by = NULL: khong ai sua duoc (xem docs/thay-doi-thiet-ke.md).
SET @has_received_by := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ticket' AND COLUMN_NAME = 'received_by'
);
SET @ddl := IF(
  @has_received_by = 0,
  'ALTER TABLE ticket ADD COLUMN received_by BIGINT NULL, ADD CONSTRAINT fk_ticket_received_by FOREIGN KEY (received_by) REFERENCES staff (staff_id)',
  'DO 0'
);
PREPARE add_received_by FROM @ddl;
EXECUTE add_received_by;
DEALLOCATE PREPARE add_received_by;
