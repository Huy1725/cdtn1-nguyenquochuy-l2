INSERT INTO customer (phone, full_name, address)
VALUES ('0901234567', 'Nguyen AB', 'Ha Noi')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), address = VALUES(address);
