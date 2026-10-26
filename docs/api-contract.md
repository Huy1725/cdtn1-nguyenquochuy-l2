**API CONTRACT**

**1\. Danh sách Endpoint**

Bảng tổng hợp các API endpoint phục vụ cho các User Story trong luồng L2: 

| Phương thức | Đường dẫn (Path) | Mục đích | User Story liên quan |
| :---- | :---- | :---- | :---- |
| **GET** | /api/customers?phone={phone} | Tra cứu khách hàng theo số điện thoại | US1  |
| **POST** | /api/customers | Tạo khách hàng mới khi chưa tồn tại | US2  |
| **GET** | /api/customers/{id}/devices | Lấy danh sách thiết bị khách đã mua | US1  |
| **POST** | /api/tickets | Tạo phiếu bảo hành mới | US1, US4  |
| **GET** | /api/tickets?status=\&page=\&size= | Lấy danh sách phiếu, có lọc theo trạng thái và phân trang | US3  |
| **GET** | /api/tickets/{id} | Xem chi tiết phiếu kèm lịch sử trạng thái | US7  |
| **PATCH** | /api/tickets/{id}/status | Chuyển trạng thái phiếu (`MOI`, `DANG_XU_LY`, `HOAN_TAT`, `HUY`), kèm `note`, `changed_by` | US5, US7  |
| **GET** | /api/categories | Lấy danh mục nhóm sự cố | US6  |
| **PATCH** | /api/customers/{id} | Sửa thông tin khách hàng (vẫn kiểm tra QT-01) | US2  |
| **DELETE** | /api/customers/{id} | Xóa khách hàng chưa có thiết bị/phiếu; ngược lại trả 409 `CUSTOMER_IN_USE` | US2  |

*Ghi chú (BT2):* bỏ tham số `assignee` (thuộc luồng L4); mã lỗi nghiệp vụ được ánh xạ sang HTTP: `VALIDATION_FAILED`/`INVALID_JSON` → 400, `*_NOT_FOUND` → 404, `*_EXISTS`/`*_IN_USE` → 409, `INVALID_REFERENCE` → 422. Xem `docs/thay-doi-thiet-ke.md` mục 7 và 11.

**2\. Quy ước chung**

**Định dạng dữ liệu:** JSON, mã hóa UTF-8. Header bắt buộc đối với các request có body: Content-Type: application/json. 

**Quy chuẩn đặt tên:** Tên trường sử dụng định dạng snake\_case, khớp chính xác với tên cột trong cơ sở dữ liệu để thuận lợi cho việc truy vết. 

**Định dạng thời gian:** Sử dụng chuẩn ISO 8601 kèm múi giờ (Ví dụ: 2026-09-08T14:30:00+07:00). 

**Định dạng tiền tệ:** Số nguyên VND, không có phần thập phân, không chứa dấu phân cách nghìn. 

**Phân trang (Pagination):** Sử dụng tham số query page (bắt buộc, bắt đầu từ 1\) và size (tùy chọn, mặc định 20, tối đa 100). Response trả về kèm theo tổng số bản ghi (total).

**Cấu trúc trả về khi lỗi:** Mọi lỗi phát sinh đều tuân thủ cấu trúc chung thống nhất. Vd:

{

  "error": {

    "code": "MA\_LOI",

    "message": "Mo ta chi tiet loi",

    "fields": { "ten\_truong": "Thong bao loi cu the cua truong" }

  }

}

**3\. Chi tiết Endpoint Trọng Tâm: POST /api/tickets**

API dùng để khởi tạo một phiếu bảo hành mới. 

**Mục đích:** Ghi nhận yêu cầu bảo hành từ khách hàng (Phục vụ US1, US4). 

**Request Body (Mẫu):**

{

  "customer\_id": 1024,

  "device\_id": 3311,

  "center\_id": 2,

  "issue\_desc": "Máy sạc không vào, cắm sạc báo lỗi phụ kiện",

  "priority": "TRUNG\_BINH",

  "accessories": \["SAC", "HOP"\]

}

**Response 201 Created (Thành công)**:

{

  "ticket\_id": 88231,

  "ticket\_code": "BH-000231/2026",

  "status": "MOI",

  "category\_id": 3,

  "received\_at": "2026-09-08T14:30:00+07:00",

  "due\_date": "2026-09-11T14:30:00+07:00"

}

**Các mã trạng thái HTTP (HTTP Status Codes) và Response lỗi:**

\-400 Bad Request: Dữ liệu đầu vào không hợp lệ (vi phạm định dạng/validation).

{

  "error": {

    "code": "VALIDATION\_FAILED",

    "message": "Du lieu khong hop le",

    "fields": { "issue\_desc": "Truong bat buoc, khong duoc de trong" }

  }

}

