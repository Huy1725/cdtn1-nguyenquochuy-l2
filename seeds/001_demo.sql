INSERT INTO customer (full_name, phone, email, segment)
VALUES ('Nguyen AB', '0901234567', 'ab@example.com', 'STANDARD')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), email = VALUES(email), segment = VALUES(segment);

INSERT INTO device (customer_id, serial_no, purchase_date, warranty_months)
SELECT customer_id, 'A001', '2026-01-15', 12 FROM customer WHERE phone = '0901234567'
ON DUPLICATE KEY UPDATE purchase_date = VALUES(purchase_date), warranty_months = VALUES(warranty_months);

INSERT INTO issue_category (category_id, category_name, description) VALUES
  (1, 'Pin', 'Chai pin, phong pin, sac khong vao, loi cong sac'),
  (2, 'Man hinh', 'Vo, soc, mat cam ung, loi hien thi'),
  (3, 'Vao nuoc / Hu hong vat ly', 'Vao nuoc, roi vo, bien dang'),
  (4, 'Phan mem', 'Treo may, loi he dieu hanh, mat du lieu'),
  (5, 'Nguon', 'Khong len nguon, khong khoi dong, tu tat nguon'),
  (6, 'Khac', 'Cac su co chua thuoc nhom nao')
ON DUPLICATE KEY UPDATE category_name = VALUES(category_name), description = VALUES(description);
