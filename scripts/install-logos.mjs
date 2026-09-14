/**
 * 로고 파일을 제자리에 넣어 준다.
 *
 *   npm run logo
 *
 * 「로고넣기」 폴더에 파일을 아무 이름으로 넣어두면, 파일 이름을 보고
 * 어느 기관 로고인지 알아내서 public/logo 에 올바른 이름으로 복사한다.
 *
 * 파일 이름을 외워서 바꿔 넣는 일은 사람이 할 일이 아니다.
 * "소상공인정책자금 로고.png" 처럼 받은 그대로 넣으면 된다.
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DROP_DIR = path.join(ROOT, "로고넣기");
const LOGO_DIR = path.join(ROOT, "public", "logo");
const ALLOWED = [".svg", ".png", ".jpg", ".jpeg", ".webp"];

/**
 * 파일 이름에서 찾을 말과, 그때 저장할 이름.
 *
 * 위에서부터 차례로 본다. 순서가 중요하다.
 * "소상공인24" 와 "소상공인365" 는 둘 다 "소상공인"을 품고 있어서,
 * 구체적인 것을 먼저 두지 않으면 엉뚱한 곳에 들어간다.
 */
const RULES = [
  { key: "svc-policy-fund", label: "소상공인 정책자금", words: ["정책자금", "policyfund", "ols"] },
  { key: "svc-sbiz365", label: "소상공인 365", words: ["365"] },
  { key: "svc-edu", label: "소상공인 지식배움터", words: ["지식배움터", "배움터", "edu"] },
  { key: "svc-sbiz24", label: "소상공인 24", words: ["소상공인24", "sbiz24", "소상공인이십사"] },
  { key: "svc-hope", label: "희망리턴패키지", words: ["희망리턴", "희망", "hope"] },
  { key: "svc-kstartup", label: "K-Startup", words: ["kstartup", "k-startup", "케이스타트업"] },
  { key: "svc-mss", label: "중소벤처기업부", words: ["중소벤처", "중기부", "mss"] },
  { key: "svc-semas", label: "소상공인시장진흥공단", words: ["시장진흥공단", "소진공", "semas"] },

  { key: "wonju-city", label: "원주시", words: ["원주시청", "원주시"] },
  { key: "partner-wonju-council", label: "원주시의회", words: ["시의회", "의회"] },
  { key: "partner-gangwon", label: "강원특별자치도", words: ["강원특별", "강원도"] },
  { key: "partner-gwcg", label: "강원신용보증재단", words: ["신용보증", "신보"] },
  { key: "partner-wonju-cci", label: "원주상공회의소", words: ["상공회의소", "상의"] },
  { key: "partner-semas", label: "소상공인시장진흥공단(협력기관)", words: ["협력-소진공"] },

  { key: "wj-horizontal", label: "협회 가로 로고", words: ["가로", "horizontal"] },
  { key: "wj-vertical", label: "협회 세로 로고", words: ["세로", "vertical"] },
  { key: "wj-symbol", label: "협회 심볼", words: ["심볼", "symbol"] },
];

/** 띄어쓰기·괄호·밑줄을 지우고 소문자로. "소상공인 정책자금_CI" → "소상공인정책자금ci" */
function normalize(name) {
  return name.toLowerCase().replace(/[\s_\-()[\]{}.]/g, "");
}

function matchRule(fileName) {
  const base = normalize(path.basename(fileName, path.extname(fileName)));
  for (const rule of RULES) {
    if (rule.words.some((w) => base.includes(normalize(w)))) return rule;
  }
  return null;
}

/* ------------------------------------------------------------------ */

if (!fs.existsSync(DROP_DIR)) {
  fs.mkdirSync(DROP_DIR, { recursive: true });
  console.log(`「로고넣기」 폴더를 만들었습니다:\n  ${DROP_DIR}\n`);
}

const files = fs
  .readdirSync(DROP_DIR)
  .filter((f) => ALLOWED.includes(path.extname(f).toLowerCase()));

if (files.length === 0) {
  console.log("「로고넣기」 폴더가 비어 있습니다.");
  console.log(`  ${DROP_DIR}`);
  console.log("\n이 폴더에 로고 파일을 넣고 다시 실행해 주세요.");
  console.log("파일 이름은 바꾸지 않아도 됩니다. (예: 소상공인정책자금 로고.png)");
  process.exit(0);
}

fs.mkdirSync(LOGO_DIR, { recursive: true });

const done = [];
const unknown = [];

for (const file of files) {
  const rule = matchRule(file);

  if (!rule) {
    unknown.push(file);
    continue;
  }

  const ext = path.extname(file).toLowerCase();
  const target = path.join(LOGO_DIR, `${rule.key}${ext}`);

  // 같은 자리에 다른 확장자 파일이 남아 있으면 그게 먼저 잡힌다. 지운다.
  for (const other of ALLOWED) {
    const stale = path.join(LOGO_DIR, `${rule.key}${other}`);
    if (other !== ext && fs.existsSync(stale)) fs.unlinkSync(stale);
  }

  fs.copyFileSync(path.join(DROP_DIR, file), target);
  done.push({ file, rule, saved: `${rule.key}${ext}` });
}

console.log(`「로고넣기」 폴더에서 ${files.length}개를 확인했습니다.\n`);

for (const d of done) {
  console.log(`  넣었습니다  ${d.file}`);
  console.log(`              → ${d.rule.label}  (public/logo/${d.saved})`);
}

if (unknown.length > 0) {
  console.log(`\n  어느 기관인지 몰라서 넘긴 파일 ${unknown.length}개:`);
  for (const f of unknown) console.log(`              ${f}`);
  console.log("\n  파일 이름에 기관 이름이 들어가게 바꿔서 다시 실행해 주세요.");
  console.log("  (예: 다운로드.png → 소상공인365.png)");
}

console.log(`\n${done.length}개를 넣었습니다.`);

if (done.length > 0) {
  console.log("\n다음으로 할 일 — 아래를 실행하면 홈페이지에 반영됩니다:");
  console.log('  git add -A && git commit -m "기관 로고 추가" && git push');
}
