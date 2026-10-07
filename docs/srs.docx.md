# **MỤC 1 – BẢN SRS RÚT GỌN**

## **1.1. Giới thiệu và Phạm vi**

* **Luồng nghiệp vụ (L2):** Tiếp nhận và phân loại yêu cầu bảo hành.

* **Phạm vi:** Nhân viên tiếp nhận tra cứu/tạo mới khách hàng, ghi nhận tình trạng thiết bị, phân loại nhóm sự cố để hệ thống tự động tính toán hạn cam kết trả máy.

* **Ngoài phạm vi (WON'T):** Không bao gồm thuật toán gán kỹ thuật viên tự động (luồng L4). Không tích hợp hệ thống gửi SMS tự động cho khách hàng.

* **Bảng thuật ngữ:**

  * Khách hàng: Xác định bằng Số điện thoại duy nhất.

  * Thiết bị: Xác định bằng Serial/IMEI.

  * Phiếu bảo hành: Hồ sơ ghi nhận sự cố có mã duy nhất.

  * Hạn cam kết (due\_date): Thời điểm chậm nhất phải hoàn thành xử lý.

## **1.2. Các bên liên quan và vai trò**

* **Nhân viên tiếp nhận:** Người dùng chính, có quyền tra cứu khách hàng, thêm mới khách hàng, tạo phiếu bảo hành và cập nhật lịch sử. Không có quyền xóa phiếu.

* **Hệ thống nhắc hạn (Thời gian):** Actor tự động, làm nhiệm vụ tính toán hạn cam kết theo quy tắc 24h, 72h, 120h dựa trên thời điểm tạo phiếu.

## **1.3. Yêu cầu chức năng (FR)**

* **FR1:** Hệ thống cho phép tra cứu khách hàng bằng SĐT; nếu chưa có thì tự động mở form tạo mới (Phục vụ US1, US2).

* **FR2:** Hệ thống cho phép tạo phiếu bảo hành mới, bắt buộc nhập thông tin thiết bị và mô tả lỗi (Phục vụ US3).

* **FR3:** Hệ thống bắt buộc phân loại nhóm sự cố và ưu tiên từ danh mục có sẵn; tự động đối chiếu hạn bảo hành (Phục vụ US5, US6).

* **FR4:** Hệ thống tự động tính toán và thiết lập thời gian cam kết trả máy khi lưu phiếu thành công (Phục vụ US4).

**US1 (MUST)**\- Tra cứu khách hàng bằng số điện thoại: Là nhân viên tiếp nhận, tôi muốn tra cứu khách hàng bằng số điện thoại để không phải hỏi và nhập lại thông tin nếu khách đã từng giao dịch trong hệ thống. 

  \-AC1 (Luồng chính): GIVEN số điện thoại khách hàng đã tồn tại trong cơ sở dữ liệu, WHEN nhân viên nhập số điện thoại này vào ô tìm kiếm, THEN hệ thống tự động điền các thông tin họ tên, địa chỉ và lịch sử thiết bị khách đã mua lên màn hình. 

  \-AC2 (Luồng ngoại lệ \- Sai định dạng): GIVEN nhân viên nhập số điện thoại không hợp lệ (ví dụ: chứa chữ cái hoặc chưa đủ 10 số), WHEN nhân viên bấm tìm kiếm, THEN hệ thống hiển thị cảnh báo "Số điện thoại không hợp lệ" và từ chối thực hiện tra cứu.

**US2 (MUST)**\- Tạo khách hàng mới khi số điện thoại chưa tồn tại: Là nhân viên tiếp nhận, tôi muốn hệ thống tự động mở form điền thông tin tạo khách hàng mới khi số điện thoại chưa tồn tại để lưu trữ hồ sơ cho các giao dịch sau. 

  \-AC1 (Luồng chính): GIVEN số điện thoại nhân viên vừa nhập không khớp với bất kỳ hồ sơ nào trong hệ thống, WHEN quá trình tra cứu kết thúc, THEN hệ thống tự động mở form tạo khách hàng mới và điền sẵn số điện thoại vừa nhập vào ô tương ứng. 

  \-AC2 (Luồng ngoại lệ \- Thiếu thông tin bắt buộc): GIVEN form tạo khách hàng mới đang mở, WHEN nhân viên để trống trường "Họ tên" (trường bắt buộc) và bấm Lưu, THEN hệ thống chặn thao tác lưu, bôi đỏ trường "Họ tên" và hiển thị thông báo yêu cầu điền đầy đủ.

**US3 (MUST)**\- Tạo phiếu bảo hành mới ghi nhận thiết bị và mô tả lỗi: Là nhân viên tiếp nhận, tôi muốn tạo phiếu bảo hành mới ghi nhận thông tin thiết bị và mô tả lỗi để chính thức bắt đầu quy trình xử lý sự cố. 

  \-AC1 (Luồng chính): GIVEN nhân viên đã chọn đúng khách hàng, thiết bị và nhập đầy đủ mô tả lỗi cùng các trường bắt buộc khác, WHEN nhân viên bấm Lưu, THEN hệ thống tạo mã phiếu duy nhất, lưu phiếu ở trạng thái "MỚI" và hiển thị thông báo thành công. 

  \-AC2 (Luồng ngoại lệ \- Thiết bị không mua tại cửa hàng): GIVEN khách hàng mang đến thiết bị không có trong lịch sử mua hàng, WHEN nhân viên chọn chức năng nhập thiết bị ngoài, THEN hệ thống bắt buộc nhân viên phải gõ tay số Serial/IMEI và ghi chú nguồn gốc thì mới cho phép lưu phiếu.

**US4 (MUST)**\- Tự động tính toán hạn cam kết trả máy: Là nhân viên tiếp nhận, tôi muốn hệ thống tự động tính toán hạn cam kết trả máy dựa trên mức ưu tiên để hẹn khách hàng thời gian chính xác, tránh tính nhầm. 

  \-AC1 (Luồng chính): GIVEN nhân viên phân loại yêu cầu bảo hành ở mức ưu tiên CAO, WHEN hệ thống tiến hành lưu phiếu, THEN hệ thống tự động thiết lập hạn cam kết (due\_date) bằng cách cộng thêm đúng 24 giờ tính từ thời điểm tiếp nhận. 

  \-AC2 (Luồng ngoại lệ \- Rơi vào ngày nghỉ): GIVEN nhân viên tiếp nhận phiếu vào cuối ngày thứ Bảy, WHEN hệ thống tính toán hạn cam kết, THEN hệ thống tự động loại trừ ngày Chủ Nhật (chỉ tính ngày làm việc) và dời hạn trả máy sang tuần tiếp theo.

**US5 (SHOULD)**\- Xác định trạng thái bảo hành: Là nhân viên tiếp nhận, tôi muốn hệ thống tự động đối chiếu ngày mua với thời hạn bảo hành để xác định chính xác thiết bị còn trong diện sửa chữa miễn phí hay không.

**US6 (SHOULD)**\- Phân loại nhóm sự cố và mức ưu tiên: Là nhân viên tiếp nhận, tôi muốn chọn phân loại nhóm sự cố và mức ưu tiên từ danh mục có sẵn thay vì ghi văn bản tự do để hệ thống chuẩn hóa dữ liệu phục vụ thống kê. 

**US7 (SHOULD)**\- Cập nhật lịch sử trao đổi: Là nhân viên tiếp nhận, tôi muốn lưu lại lịch sử mỗi lần trao đổi với khách hàng (kèm thời điểm và tên người thực hiện) trên phiếu bảo hành để các nhân viên khác nắm bắt tình trạng thiết bị mà không cần hỏi lại tôi.

* **US8 (WON'T)**\- Gửi SMS thông báo tạo phiếu: Là khách hàng, tôi muốn nhận được tin nhắn SMS thông báo ngay sau khi phiếu bảo hành được tạo để an tâm giao máy.

## **1.4. Yêu cầu phi chức năng (NFR)**

* **NFR1 (Hiệu năng):** Kết quả tra cứu số điện thoại khách hàng phải hiển thị trong dưới 1.5 giây với 65,000 bản ghi dữ liệu mẫu.

* **NFR2 (Khả dụng):** Một nhân viên có thể hoàn thành luồng tạo 1 phiếu mới trong thời gian tối đa 3 phút.

* **NFR3 (Bảo mật):** Dữ liệu lịch sử trao đổi trên phiếu không được phép sửa/xóa sau khi đã nhấn Lưu (thời gian lưu giữ lịch sử $\geq$ 12 tháng).

## **1.5. Ràng buộc và quy tắc nghiệp vụ**

* **QT-01:** Một số điện thoại 10 số chỉ tương ứng với một hồ sơ khách hàng duy nhất.

* **QT-04:** Hạn cam kết trả máy: Mức CAO cộng 24h, TRUNG\_BINH cộng 72h, THẤP cộng 120h (loại trừ ngày Chủ Nhật).

* **QT-13:** Mọi thao tác trên phiếu phải được lưu vết, không cho phép xóa vật lý dữ liệu (soft delete).

# **1.6. Bảng truy vết yêu cầu (Traceability Matrix)**

| Mã FR | Yêu cầu chức năng | User Story | Use Case | MoSCoW | Test Case |
| :---- | :---- | :---- | :---- | :---- | :---- |
| FR1 | Tra cứu / Tạo KH bằng SĐT | US1, US2 | UC1, UC2 | MUST | BT-3 |
| FR2 | Tạo phiếu bảo hành mới | US3, US7 | UC3, UC6 | MUST, SHOULD | BT-3 |
| FR3 | Phân loại sự cố, đối chiếu ngày mua | US5, US6 | UC4 | SHOULD | BT-3 |
| FR4 | Tự động tính hạn cam kết | US4 | UC5 | MUST | BT-3 |

