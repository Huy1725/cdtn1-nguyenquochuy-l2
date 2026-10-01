SRS
1. Giới thiệu và Phạm vi
	Luồng nghiệp vụ (L2): Tiếp nhận và phân loại yêu cầu bảo hành.
	Phạm vi: Nhân viên tiếp nhận tra cứu/tạo mới khách hàng, ghi nhận tình trạng thiết bị, phân loại nhóm sự cố để hệ thống tự động tính toán hạn cam kết trả máy.
	Ngoài phạm vi (WON'T): Không bao gồm thuật toán gán kỹ thuật viên tự động (luồng L4). Không tích hợp hệ thống gửi SMS tự động cho khách hàng.
	Bảng thuật ngữ:
	Khách hàng: Xác định bằng Số điện thoại duy nhất.
	Thiết bị: Xác định bằng Serial/IMEI.
	Phiếu bảo hành: Hồ sơ ghi nhận sự cố có mã duy nhất.
	Hạn cam kết (due_date): Thời điểm chậm nhất phải hoàn thành xử lý.
2. Các bên liên quan và vai trò
	Nhân viên tiếp nhận: Người dùng chính, có quyền tra cứu khách hàng, thêm mới khách hàng, tạo phiếu bảo hành và cập nhật lịch sử. Không có quyền xóa phiếu.
	Hệ thống nhắc hạn (Thời gian): Actor tự động, làm nhiệm vụ tính toán hạn cam kết theo quy tắc 24h, 72h, 120h dựa trên thời điểm tạo phiếu.
 
3. Yêu cầu chức năng (FR)
	FR1: Hệ thống cho phép tra cứu khách hàng bằng SĐT; nếu chưa có thì tự động mở form tạo mới (Phục vụ US1, US2).
	FR2: Hệ thống cho phép tạo phiếu bảo hành mới, bắt buộc nhập thông tin thiết bị và mô tả lỗi (Phục vụ US3).
	FR3: Hệ thống bắt buộc phân loại nhóm sự cố và ưu tiên từ danh mục có sẵn; tự động đối chiếu hạn bảo hành (Phục vụ US5, US6).
	FR4: Hệ thống tự động tính toán và thiết lập thời gian cam kết trả máy khi lưu phiếu thành công (Phục vụ US4).
4. Yêu cầu phi chức năng (NFR)
	NFR1 (Hiệu năng): Kết quả tra cứu số điện thoại khách hàng phải hiển thị trong dưới 1.5 giây với 65,000 bản ghi dữ liệu mẫu.
	NFR2 (Khả dụng): Một nhân viên có thể hoàn thành luồng tạo 1 phiếu mới trong thời gian tối đa 3 phút.
	NFR3 (Bảo mật): Dữ liệu lịch sử trao đổi trên phiếu không được phép sửa/xóa sau khi đã nhấn Lưu (thời gian lưu giữ lịch sử ≥ 12 tháng).
5. Ràng buộc và quy tắc nghiệp vụ
	QT-01: Một số điện thoại 10 số chỉ tương ứng với một hồ sơ khách hàng duy nhất.
	QT-04: Hạn cam kết trả máy: Mức CAO cộng 24h, TRUNG_BINH cộng 72h, THẤP cộng 120h (loại trừ ngày Chủ Nhật).
	QT-13: Mọi thao tác trên phiếu phải được lưu vết, không cho phép xóa vật lý dữ liệu (soft delete).
 
6. Bảng truy vết yêu cầu (Traceability Matrix)
Mã FR	Yêu cầu chức năng	User Story	Use Case	MoSCoW	Test Case
FR1	Tra cứu / Tạo KH bằng SĐT	US1, US2	UC1, UC2	MUST	
FR2	Tạo phiếu bảo hành mới	US3, US7	UC3, UC6	MUST, SHOULD	
FR3	Phân loại sự cố, đối chiếu ngày mua	US5, US6	UC4	SHOULD	
FR4	Tự động tính hạn cam kết	US4	UC5	MUST	

