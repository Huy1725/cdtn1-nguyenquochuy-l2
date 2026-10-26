CREATE TABLE IF NOT EXISTS customer (
  customer_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(120),
  segment VARCHAR(20),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS device (
  device_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT NOT NULL,
  serial_no VARCHAR(50) NOT NULL UNIQUE,
  purchase_date DATE,
  warranty_months INT CHECK (warranty_months >= 0),
  FOREIGN KEY (customer_id) REFERENCES customer (customer_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS issue_category (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL,
  description TEXT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ticket (
  ticket_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ticket_code VARCHAR(20) NOT NULL UNIQUE,
  customer_id BIGINT NOT NULL,
  device_id BIGINT NOT NULL,
  category_id INT NULL,
  issue_desc TEXT NOT NULL,
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('CAO', 'TRUNG_BINH', 'THAP')),
  status VARCHAR(12) NOT NULL CHECK (status IN ('MOI', 'DANG_XU_LY', 'HOAN_TAT', 'HUY')),
  received_at DATETIME NOT NULL,
  due_date DATETIME NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customer (customer_id),
  FOREIGN KEY (device_id) REFERENCES device (device_id),
  FOREIGN KEY (category_id) REFERENCES issue_category (category_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ticket_status_log (
  log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ticket_id BIGINT NOT NULL,
  from_status VARCHAR(12) NULL,
  to_status VARCHAR(12) NOT NULL,
  note TEXT,
  changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  changed_by BIGINT NOT NULL,
  FOREIGN KEY (ticket_id) REFERENCES ticket (ticket_id)
) ENGINE=InnoDB;
