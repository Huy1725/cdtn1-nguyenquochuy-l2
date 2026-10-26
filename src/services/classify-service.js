// Thu tu uu tien: nhom cu the (vao nuoc, man hinh, pin) truoc nhom chung (nguon, phan mem).
const KEYWORDS = [
  [3, ["vao nuoc", "roi", "va dap", "bien dang", "got nuoc"]],
  [2, ["man hinh", "cam ung", "soc", "vo kinh", "hien thi"]],
  [1, ["pin", "sac", "chai", "phong"]],
  [5, ["nguon", "khong len", "khoi dong"]],
  [4, ["treo", "phan mem", "he dieu hanh", "mat du lieu", "update", "cap nhat"]]
];
const FALLBACK_CATEGORY_ID = 6;

function normalize(text) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase();
}

// De xuat nhom su co theo tu khoa trong mo ta loi (goi dong bo tu TicketService).
export class ClassifyService {
  constructor(categoryRepository) {
    this.categories = categoryRepository;
  }

  list() {
    return this.categories.list();
  }

  exists(categoryId) {
    return this.categories.findById(categoryId) !== null;
  }

  suggest(issueDesc) {
    const text = normalize(String(issueDesc ?? ""));
    const match = KEYWORDS.find(([, words]) => words.some((word) => text.includes(word)));
    const categoryId = match ? match[0] : FALLBACK_CATEGORY_ID;
    return this.exists(categoryId) ? categoryId : null;
  }
}
