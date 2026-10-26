# Kiến trúc THỰC TẾ (BT2) — luồng L2 Tiếp nhận và phân loại yêu cầu bảo hành

Sơ đồ dưới đây mô tả những gì **đang chạy**, khác với sơ đồ dự kiến `architecture.drawio` (BT1).
Khác biệt chính: tầng lưu trữ hiện là bộ nhớ, MySQL mới có migration + seed (xem `thay-doi-thiet-ke.md`).

```mermaid
flowchart TB
  subgraph Web["src/web  (React + Vite)"]
    Pages["pages/: tạo phiếu · theo dõi phiếu · chi tiết phiếu"]
    Client["api/client.js  (lớp client duy nhất gọi API)"]
    Pages --> Client
  end

  subgraph API["Backend Node.js"]
    Routes["routes/  — nhận HTTP, dịch mã lỗi → status"]
    Validators["validators/  — kiểm tra định dạng dữ liệu vào"]
    Services["services/  — nghiệp vụ QT-01, QT-04, QT-13<br/>TicketService · CustomerService · ClassifyService"]
    Domain["domain/warranty.js  — hạn cam kết, trạng thái bảo hành"]
    Repos["repositories/  — in-memory (hiện tại)"]
    Routes --> Validators
    Routes --> Services
    Services --> Domain
    Services --> Repos
    Services -. "gọi đồng bộ" .-> Services
  end

  Client -- "HTTP + JSON" --> Routes

  subgraph Storage["Lưu trữ"]
    Mem[("Bộ nhớ tiến trình<br/>(đang dùng)")]
    MySQL[("MySQL 8.0<br/>migrations/ + seeds/ đã sẵn sàng,<br/>CHƯA có repository MySQL")]
  end

  Repos --> Mem
  Repos -. "chưa nối" .-> MySQL
```

## Vị trí từng tầng trong repo

| Tầng | Thư mục | Quy tắc |
|---|---|---|
| Trình bày | `src/web/` | Chỉ gọi API qua `src/web/api/`; có ba trạng thái đang tải / rỗng / lỗi |
| Routes | `src/routes/` | Biết HTTP; không chứa nghiệp vụ |
| Validators | `src/validators/` | Kiểm tra định dạng/kiểu, chạy trước service |
| Services | `src/services/` | Nghiệp vụ; không có `req`, `res`, mã HTTP, SQL |
| Repositories | `src/repositories/` | Chỉ đọc/ghi dữ liệu; không chứa quy tắc nghiệp vụ |
| Lưu trữ | `migrations/`, `seeds/` | Dựng CSDL từ trạng thái trống và nạp dữ liệu mẫu |

Phụ thuộc một chiều: `routes → services → repositories`.

## Ngoài phạm vi (WON'T)
- Gửi SMS tự động cho khách hàng (US8).
- Thuật toán gán kỹ thuật viên tự động (luồng L4).
