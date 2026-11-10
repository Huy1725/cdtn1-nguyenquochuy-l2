// Chay DUNG MOT test case trong bao cao: npm run tc -- TC-04
// Tu tim file test chua TC do (tests/unit hoac tests/integration), khong can nho TC nam o tang nao.
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const id = process.argv[2];
if (!/^TC-\d{2}$/.test(id ?? "")) {
  console.error("Cach dung: npm run tc -- TC-04   (TC-01 ... TC-12)");
  process.exit(2);
}

const root = new URL("../", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const files = ["tests/unit", "tests/integration"].flatMap((dir) =>
  readdirSync(join(root, dir))
    .filter((name) => name.endsWith(".test.js"))
    .map((name) => join(dir, name))
);
const file = files.find((path) => readFileSync(join(root, path), "utf8").includes(`test("${id} `));
if (!file) {
  console.error(`Khong tim thay ${id} trong tests/unit hoac tests/integration`);
  process.exit(2);
}

// Dong dau cho biet ma nguon nao dang duoc kiem (anh chup phai doi chieu duoc voi commit).
const git = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: root, encoding: "utf8" });
let commit = git.status === 0 ? git.stdout.trim() : "khong co git";
// Co file da theo doi bi sua ma chua commit thi anh chup khong tuong ung dung voi commit nay.
const dirty = spawnSync("git", ["status", "--porcelain", "--untracked-files=no"], { cwd: root, encoding: "utf8" });
if (git.status === 0 && dirty.stdout.trim()) commit += " (+ THAY DOI CHUA COMMIT)";
console.log(`> ${id} | ${file} | commit ${commit} | node ${process.version}\n`);

const result = spawnSync(
  process.execPath,
  ["--env-file-if-exists=.env", "--test", `--test-name-pattern=^${id} `, file],
  { cwd: root, stdio: "inherit" }
);
process.exit(result.status ?? 1);
