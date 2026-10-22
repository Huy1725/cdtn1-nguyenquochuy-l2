CREATE TABLE IF NOT EXISTS customer (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(10) NOT NULL UNIQUE CHECK (phone REGEXP '^[0-9]{10}$'),
  full_name VARCHAR(160) NOT NULL,
  address TEXT,
  deleted_at DATETIME
);

CREATE TABLE IF NOT EXISTS device (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customer(id),
  serial VARCHAR(120) NOT NULL,
  purchased_at DATETIME,
  warranty_months INTEGER CHECK (warranty_months >= 0),
  deleted_at DATETIME,
  UNIQUE (customer_id, serial)
);

CREATE TABLE IF NOT EXISTS ticket (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ticket_code VARCHAR(40) NOT NULL UNIQUE,
  customer_id BIGINT NOT NULL REFERENCES customer(id),
  device_id BIGINT REFERENCES device(id),
  serial VARCHAR(120) NOT NULL,
  issue_desc TEXT NOT NULL,
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('CAO', 'TRUNG_BINH', 'THAP')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('MOI', 'DANG_XU_LY', 'HOAN_TAT', 'DA_HUY')),
  warranty_status VARCHAR(30) NOT NULL,
  received_at DATETIME NOT NULL,
  due_date DATETIME NOT NULL,
  deleted_at DATETIME
);

CREATE TABLE IF NOT EXISTS ticket_status_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ticket_id BIGINT NOT NULL REFERENCES ticket(id),
  from_status VARCHAR(20),
  to_status VARCHAR(20) NOT NULL,
  actor VARCHAR(160) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
