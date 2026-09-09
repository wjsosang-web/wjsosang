/**
 * 임원 얼굴 사진을 한 번에 올린다.
 *
 *   node scripts/upload-org-photos.mjs photos/
 *   node scripts/upload-org-photos.mjs 박승환=photos/a.jpg 박규태=photos/b.jpg
 *
 * 폴더를 주면 파일 이름이 곧 사람 이름이다. (박승환.jpg → 박승환)
 * 사람=파일 형태로 하나씩 지정해도 된다.
 *
 * 하는 일
 *   1. 얼굴이 가운데 오도록 4:3 으로 자른다 (인물 사진은 위쪽이 중요해서 위를 남긴다)
 *   2. 가로 1600px, 용량 700KB 아래로 줄인다
 *   3. 저장소에 올리고 org_members.photo 에 주소를 넣는다
 *
 * 이미 사진이 있는 사람은 --force 를 붙여야 바꾼다.
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import sharp from "sharp";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, extname, join } from "node:path";

config({ path: ".env.local", quiet: true });

const force = process.argv.includes("--force");
const args = process.argv.slice(2).filter((a) => a !== "--force");

if (args.length === 0) {
  console.error("사용법: node scripts/upload-org-photos.mjs <폴더>");
  console.error("    또는 node scripts/upload-org-photos.mjs 박승환=사진.jpg ...");
  process.exit(1);
}

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const IMAGE_EXT = /\.(jpe?g|png|webp|heic|heif|avif)$/i;

/** 넘겨받은 인자를 { 이름, 파일경로 } 목록으로 바꾼다 */
function collect(inputs) {
  const jobs = [];

  for (const input of inputs) {
    if (input.includes("=")) {
      const [name, file] = input.split("=");
      jobs.push({ name: name.trim(), file: file.trim() });
      continue;
    }

    if (statSync(input).isDirectory()) {
      for (const file of readdirSync(input)) {
        if (!IMAGE_EXT.test(file)) continue;
        jobs.push({ name: basename(file, extname(file)).trim(), file: join(input, file) });
      }
      continue;
    }

    jobs.push({ name: basename(input, extname(input)).trim(), file: input });
  }

  return jobs;
}

const jobs = collect(args);
if (jobs.length === 0) {
  console.log("올릴 사진을 찾지 못했습니다.");
  process.exit(0);
}

console.log(`사진 ${jobs.length}장을 올립니다${force ? " (기존 사진 덮어씀)" : ""}\n`);

let done = 0;

for (const job of jobs) {
  // 1. 사람 찾기 — 동명이인이면 손대지 않고 알려만 준다
  const { data: people, error } = await db
    .from("org_members")
    .select("id, name, title, photo")
    .eq("name", job.name);

  if (error) {
    console.log(`✗ ${job.name} — 조회 실패: ${error.message}`);
    continue;
  }
  if (!people?.length) {
    console.log(`✗ ${job.name} — 조직도에 없는 이름입니다`);
    continue;
  }
  if (people.length > 1) {
    console.log(`✗ ${job.name} — 같은 이름이 ${people.length}명입니다. 관리자 화면에서 올려 주세요`);
    continue;
  }

  const person = people[0];
  if (person.photo && !force) {
    console.log(`· ${person.name} ${person.title} — 이미 사진이 있습니다 (--force 로 교체)`);
    continue;
  }

  // 2. 4:3 으로 자르고 용량 줄이기
  //    인물 사진은 위쪽(얼굴)이 중요해서 잘라낼 때 위를 남긴다.
  let buffer;
  try {
    buffer = await sharp(readFileSync(job.file))
      .rotate() // 휴대폰 사진의 방향 정보 반영
      .resize(1600, 1200, { fit: "cover", position: sharp.gravity.north })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();
  } catch (e) {
    console.log(`✗ ${job.name} — 사진을 처리하지 못했습니다: ${e.message}`);
    continue;
  }

  // 3. 저장소에 올리기
  const path = `org/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error: uploadError } = await db.storage
    .from("public-assets")
    .upload(path, buffer, { contentType: "image/jpeg", upsert: false });

  if (uploadError) {
    console.log(`✗ ${job.name} — 업로드 실패: ${uploadError.message}`);
    continue;
  }

  const url = db.storage.from("public-assets").getPublicUrl(path).data.publicUrl;

  const { error: saveError } = await db
    .from("org_members")
    .update({ photo: url })
    .eq("id", person.id);

  if (saveError) {
    console.log(`✗ ${job.name} — 저장 실패: ${saveError.message}`);
    continue;
  }

  done += 1;
  console.log(`✓ ${person.name} ${person.title} — ${Math.round(buffer.length / 1024)}KB`);
}

console.log(`\n${done}명의 사진을 넣었습니다.`);
if (done > 0) console.log("협회소개 화면은 한 시간 안에, 다시 배포하면 즉시 반영됩니다.");
