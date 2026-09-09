/**
 * 메인 히어로 슬라이드를 다룬다.
 *
 *   node scripts/hero-slides.mjs                    지금 슬라이드 보기
 *   node scripts/hero-slides.mjs --photos photos/히어로   폴더의 사진을 순서대로 배경으로 넣기
 *   node scripts/hero-slides.mjs --photo 1=photos/운동회.jpg   한 장만 지정해서 넣기
 *
 * 배경 사진은 가로가 넓어야 한다. 2000px 안팎을 권한다.
 * 글씨가 왼쪽에 얹히므로, 사람이 오른쪽에 있는 사진이 잘 어울린다.
 *
 * 슬라이드 문구와 버튼은 site_settings 의 hero_slides 에 들어 있다.
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import sharp from "sharp";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

config({ path: ".env.local", quiet: true });

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const argv = process.argv.slice(2);
const flag = (name) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : null;
};

/* 지금 값 읽기 — 없으면 시드에서 가져온다 */
const { data: row } = await db
  .from("site_settings")
  .select("value")
  .eq("key", "hero_slides")
  .maybeSingle();

const slides = row?.value ?? JSON.parse(readFileSync("src/lib/data/seed/site.json", "utf8")).heroSlides;

/** 배경으로 쓸 수 있게 가로로 넓게, 용량은 1MB 아래로 */
async function toBackground(buffer) {
  for (const quality of [82, 74, 66, 58]) {
    const out = await sharp(buffer)
      .rotate()
      .resize(2000, 1100, { fit: "cover", position: sharp.strategy.attention })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
    if (out.length <= 1024 * 1024) return out;
  }
  return sharp(buffer)
    .rotate()
    .resize(1600, 880, { fit: "cover", position: sharp.strategy.attention })
    .jpeg({ quality: 60, mozjpeg: true })
    .toBuffer();
}

async function upload(file) {
  const processed = await toBackground(readFileSync(file));
  const path = `hero/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;

  const { error } = await db.storage
    .from("public-assets")
    .upload(path, processed, { contentType: "image/jpeg", upsert: false });

  if (error) throw new Error(error.message);

  return {
    url: db.storage.from("public-assets").getPublicUrl(path).data.publicUrl,
    size: processed.length,
  };
}

/* ------------------------------------------------------------------ */

const folder = flag("photos");
const single = flag("photo");
let changed = false;

if (folder) {
  const files = readdirSync(folder)
    .filter((f) => /\.(jpe?g|png|webp|heic|heif|avif)$/i.test(f))
    .sort((a, b) => a.localeCompare(b, "ko", { numeric: true }));

  for (let i = 0; i < Math.min(files.length, slides.length); i += 1) {
    const { url, size } = await upload(join(folder, files[i]));
    slides[i].image = url;
    changed = true;
    console.log(`✓ ${i + 1}번 슬라이드 ← ${files[i]} (${Math.round(size / 1024)}KB)`);
  }

  if (files.length > slides.length) {
    console.log(`\n사진이 ${files.length}장인데 슬라이드는 ${slides.length}장입니다. 앞의 것만 넣었습니다.`);
  }
} else if (single) {
  const [n, file] = single.split("=");
  const index = Number(n) - 1;

  if (!(index >= 0 && index < slides.length)) {
    console.error(`슬라이드 번호는 1~${slides.length} 사이여야 합니다.`);
    process.exit(1);
  }

  const { url, size } = await upload(file);
  slides[index].image = url;
  changed = true;
  console.log(`✓ ${n}번 슬라이드 ← ${file} (${Math.round(size / 1024)}KB)`);
}

if (changed) {
  const { error } = await db
    .from("site_settings")
    .upsert({ key: "hero_slides", value: slides, updated_at: new Date().toISOString() });

  if (error) {
    console.error(`저장 실패: ${error.message}`);
    process.exit(1);
  }
  console.log("\n저장했습니다. 메인홈에 바로 반영됩니다.");
}

console.log(`\n지금 슬라이드 ${slides.length}장`);
for (const [i, s] of slides.entries()) {
  console.log(`\n  ${i + 1}. ${s.title.replace(/\n/g, " ")}`);
  console.log(`     ${s.description.replace(/\n/g, " ")}`);
  console.log(`     버튼: ${(s.links ?? []).map((l) => l.label).join(" / ") || "기본"}`);
  console.log(`     사진: ${s.image ? s.image.split("/").pop() : "없음 (무늬가 대신 나옵니다)"}`);
}
