import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";

// Phuc vu ban build cua giao dien React (thu muc dist/) de nguoi dung chi can mo mot cong.
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".map": "application/json; charset=utf-8"
};

async function readIfFile(path) {
  try {
    return (await stat(path)).isFile() ? await readFile(path) : null;
  } catch {
    return null;
  }
}

// Tra ve { status, type, body, cache } hoac null neu khong phai file tinh.
export function createStaticHandler(rootDir) {
  const root = resolve(rootDir);

  return async function serve(pathname) {
    let decoded;
    try {
      decoded = decodeURIComponent(pathname);
    } catch {
      return null;
    }
    if (decoded.includes("\0")) return null;

    // Chong path traversal: duong dan sau khi giai ma phai nam TRONG thu muc goc.
    const target = resolve(join(root, decoded));
    if (target !== root && !target.startsWith(root + sep)) return null;

    const file = await readIfFile(target);
    if (file) {
      const type = TYPES[extname(target).toLowerCase()] ?? "application/octet-stream";
      const hashed = decoded.startsWith("/assets/"); // vite dat ten co ma bam -> cache dai han
      return { status: 200, type, body: file, cache: hashed ? "public, max-age=31536000, immutable" : "no-cache" };
    }
    // Duong dan trang (khong co duoi tep) -> index.html de React tu xu ly; thieu tep tinh -> khong co gi.
    if (extname(decoded) === "") {
      const index = await readIfFile(join(root, "index.html"));
      if (index) return { status: 200, type: TYPES[".html"], body: index, cache: "no-cache" };
    }
    return null;
  };
}
