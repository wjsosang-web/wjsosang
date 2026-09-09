/**
 * 사진 폴더 하나를 협회활동 글로 만든다.
 *
 *   node scripts/new-activity.mjs photos/운동회 --title "원청협 웰니스 운동회" --date 2026-05-31
 *   node scripts/new-activity.mjs photos/운동회 --post wellness-2026   (기존 글에 사진만 더하기)
 *
 * 하는 일
 *   1. 폴더 안 사진을 가로 1600px, 700KB 아래로 줄여서 저장소에 올린다
 *   2. 파일 이름을 사진 설명으로 쓴다 (01 줄다리기.jpg → "줄다리기")
 *   3. 첫 사진을 대표사진으로 삼아 글을 만든다
 *
 * 만들어진 글은 비공개(draft)다. 관리자 화면에서 내용을 다듬고 공개로 바꾸면 된다.
 * 사진이 잘못 올라가도 글을 지우면 사진도 같이 지워진다.
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import sharp from "sharp";
import { readdirSync, readFileSync } from "node:fs";
import { basename, extname, join } from "node:path";

config({ path: ".env.local", quiet: true });

/* ---------------------------------------------------------------- 인자 읽기 */

const argv = process.argv.slice(2);
const folder = argv.find((a) => !a.startsWith("--"));
const flag = (name) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : null;
};

if (!folder) {
  console.error('사용법: node scripts/new-activity.mjs <사진폴더> --title "제목" --date 2026-05-31');
  console.error("        node scripts/new-activity.mjs <사진폴더> --post <기존글주소>");
  process.exit(1);
}

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

/* ------------------------------------------------------------------ 사진 정리 */

const IMAGE = /\.(jpe?g|png|webp|heic|heif|avif)$/i;

const files = readdirSync(folder)
  .filter((f) => IMAGE.test(f))
  .sort((a, b) => a.localeCompare(b, "ko", { numeric: true }));

if (files.length === 0) {
  console.error(`${folder} 안에 사진이 없습니다.`);
  process.exit(1);
}

console.log(`사진 ${files.length}장을 준비합니다\n`);

/** 파일 이름에서 설명을 뽑는다. 앞의 번호는 정렬용이라 뺀다. */
function captionOf(file) {
  return basename(file, extname(file))
    .replace(/^[\d\s._-]+/, "")
    .replace(/[_-]+/g, " ")
    .trim();
}

/** 목표 용량 아래로 내려갈 때까지 화질을 낮춘다 */
async function shrink(buffer) {
  const TARGET = 700 * 1024;
  for (const quality of [82, 72, 62, 52]) {
    const out = await sharp(buffer)
      .rotate()
      .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
    if (out.length <= TARGET) return out;
  }
  return sharp(buffer)
    .rotate()
    .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 50, mozjpeg: true })
    .toBuffer();
}

const uploaded = [];

for (const file of files) {
  try {
    const shrunk = await shrink(readFileSync(join(folder, file)));
    const path = `posts/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;

    const { error } = await db.storage
      .from("public-assets")
      .upload(path, shrunk, { contentType: "image/jpeg", upsert: false });

    if (error) {
      console.log(`✗ ${file} — ${error.message}`);
      continue;
    }

    uploaded.push({
      url: db.storage.from("public-assets").getPublicUrl(path).data.publicUrl,
      caption: captionOf(file),
    });
    console.log(`✓ ${file} — ${Math.round(shrunk.length / 1024)}KB`);
  } catch (e) {
    console.log(`✗ ${file} — ${e.message}`);
  }
}

if (uploaded.length === 0) {
  console.error("\n올라간 사진이 없습니다.");
  process.exit(1);
}

/* -------------------------------------------------------------------- 글 만들기 */

const existingSlug = flag("post");
let postId;
let slug;

if (existingSlug) {
  const { data, error } = await db
    .from("posts")
    .select("id, slug, title")
    .eq("slug", existingSlug)
    .maybeSingle();

  if (error || !data) {
    console.error(`\n"${existingSlug}" 글을 찾지 못했습니다.`);
    process.exit(1);
  }
  postId = data.id;
  slug = data.slug;
  console.log(`\n기존 글에 붙입니다: ${data.title}`);
} else {
  const title = flag("title") ?? basename(folder);
  const date = flag("date") ?? new Date().toISOString().slice(0, 10);

  // 주소는 날짜 + 임의 문자로 만든다. 한글 제목은 주소에 쓰지 않는다.
  slug = `activity-${date.replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6)}`;

  const { data, error } = await db
    .from("posts")
    .insert({
      type: "activity",
      slug,
      title,
      category: flag("category"),
      date,
      place: flag("place"),
      summary: flag("summary") ?? "",
      body: flag("body") ?? "",
      cover_image: uploaded[0].url,
      status: "draft", // 확인하고 공개로 바꾸도록 비공개로 만든다
    })
    .select("id")
    .single();

  if (error) {
    console.error(`\n글을 만들지 못했습니다: ${error.message}`);
    process.exit(1);
  }
  postId = data.id;
  console.log(`\n글을 만들었습니다: ${title} (${date})`);
}

const { count } = await db
  .from("post_photos")
  .select("id", { count: "exact", head: true })
  .eq("post_id", postId);

const { error: photoError } = await db.from("post_photos").insert(
  uploaded.map((p, i) => ({
    post_id: postId,
    url: p.url,
    caption: p.caption,
    sort_order: (count ?? 0) + i + 1,
  })),
);

if (photoError) {
  console.error(`사진을 붙이지 못했습니다: ${photoError.message}`);
  process.exit(1);
}

console.log(`사진 ${uploaded.length}장을 붙였습니다.`);
console.log(`\n관리자 → 협회활동에서 내용을 다듬고 '공개'로 바꿔 주세요.`);
console.log(`글 주소: ${slug}`);
