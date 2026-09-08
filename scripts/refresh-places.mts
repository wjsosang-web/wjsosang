/**
 * 플레이스 주소가 등록된 업장의 빈 칸을 다시 채운다.
 *
 *   npx tsx scripts/refresh-places.mts          비어 있는 항목만 채운다
 *   npx tsx scripts/refresh-places.mts --force  플레이스에서 온 값을 다시 덮어쓴다
 *
 * 관리자가 직접 적은 값은 건드리지 않는 것이 기본이다.
 * 사진도 회원이 올린 사진(cover_image)이 있으면 그대로 두고,
 * 플레이스 사진칸(place_photo)만 채운다.
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { importFromPlaceUrl } from "../src/lib/place/import";

config({ path: ".env.local", quiet: true });

const force = process.argv.includes("--force");

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

const { data: businesses, error } = await db
  .from("businesses")
  .select("*")
  .not("place_url", "is", null)
  .order("name");

if (error) {
  console.error("업장을 읽지 못했습니다:", error.message);
  process.exit(1);
}

if (!businesses?.length) {
  console.log("플레이스 주소가 등록된 업장이 없습니다.");
  console.log("관리자 → 회원업장 → 수정 화면에서 플레이스 주소를 넣어 주세요.");
  process.exit(0);
}

console.log(`${businesses.length}곳을 확인합니다${force ? " (덮어쓰기)" : ""}\n`);

let changed = 0;

for (const b of businesses) {
  const result = await importFromPlaceUrl(b.place_url);

  if (result.result === "failed") {
    console.log(`✗ ${b.name} — ${result.error ?? "가져오지 못했습니다"}`);
    continue;
  }

  const d = result.draft;
  const patch: Record<string, unknown> = {};

  /** 비어 있을 때만 채운다 (--force 면 값이 있어도 덮어쓴다) */
  const fill = (column: string, value: unknown) => {
    if (value === null || value === undefined || value === "") return;
    if (Array.isArray(value) && value.length === 0) return;

    const current = b[column];
    const isEmpty = current === null || current === "" || (Array.isArray(current) && current.length === 0);
    if (isEmpty || force) patch[column] = value;
  };

  fill("place_photo", d.photo);
  fill("homepage_url", d.homepageUrl);
  fill("instagram_url", d.instagramUrl);
  fill("blog_url", d.blogUrl);
  fill("sns_url", d.snsUrl);
  fill("phone", d.phone);
  fill("hours", d.hours);
  fill("address", d.address);
  fill("district", d.district);
  fill("place_keywords", d.keywords);
  fill("menus", d.menus);
  fill("lat", d.lat);
  fill("lng", d.lng);

  if (Object.keys(patch).length === 0) {
    console.log(`· ${b.name} — 채울 것이 없습니다`);
    continue;
  }

  patch.place_synced_at = new Date().toISOString();

  const { error: saveError } = await db.from("businesses").update(patch).eq("id", b.id);

  if (saveError) {
    console.log(`✗ ${b.name} — 저장 실패: ${saveError.message}`);
    continue;
  }

  changed += 1;
  console.log(`✓ ${b.name} — ${Object.keys(patch).filter((k) => k !== "place_synced_at").join(", ")}`);
}

console.log(`\n${changed}곳을 갱신했습니다.`);
