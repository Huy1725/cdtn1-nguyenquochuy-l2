export const priorities = [
  ["THAP", "Thấp"],
  ["TRUNG_BINH", "Trung bình"],
  ["CAO", "Cao"]
];
export const priorityLabels = Object.fromEntries(priorities);
export const statuses = { MOI: "Mới tiếp nhận", DANG_XU_LY: "Đang xử lý", HOAN_TAT: "Hoàn tất", HUY: "Đã hủy" };
export const warrantyLabels = { CON_BAO_HANH: "Còn bảo hành", HET_BAO_HANH: "Hết bảo hành", KHONG_XAC_DINH: "Chưa xác minh" };

export function formatDate(value, withTime = false) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("vi-VN", withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" }).format(new Date(value));
}

export function isDueSoon(value) {
  return new Date(value).getTime() - Date.now() < 86_400_000;
}
