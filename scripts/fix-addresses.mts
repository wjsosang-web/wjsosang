/**
 * 회원업장 주소를 네이버 플레이스의 실제 주소로 바꾼다.
 *
 *   npx tsx scripts/fix-addresses.mts         무엇이 바뀔지만 보여준다
 *   npx tsx scripts/fix-addresses.mts --apply 실제로 저장한다
 *
 * 처음 명단을 옮길 때 주소를 "강원특별자치도 원주시 ○○동" 으로만 넣어 두었다.
 * 플레이스가 연결된 업장은 도로명 주소를 받아올 수 있으므로 그것으로 바꾼다.
 *
 * 안전장치
 *   - 플레이스가 도로명(로·길 + 번지)을 주지 않으면 건드리지 않는다.
 *     받아온 값이 지금 값보다 나을 때만 바꾼다.
 *   - 관리자가 직접 고친 주소(field_sources.address === "manual")는 그대로 둔다.
 *   - 지역(district)·좌표는 비어 있을 때만 채운다.
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { importFromPlaceUrl } from "../src/lib/place/import";

config({ path: ".env.local", quiet: true });

const apply = process.argv.includes("--apply");

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

/** 번지까지 있는 도로명 주소인가. "원주시 무실동" 같은 값과 구분한다. */
function isFullAddress(value: string | null | undefined): boolean {
  return typeof value === "string" && /(로|길)\s*\d/.test(value);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * 플레이스를 읽어 온다.
 *
 * 쉬지 않고 연달아 부르면 네이버가 중간부터 막는다. 한 곳마다 잠깐 쉬고,
 * 막히면 기다렸다가 다시 부른다. 88곳이면 몇 분 걸리지만 한 번만 하면 된다.
 */
async function load(placeUrl: string) {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const result = await importFromPlaceUrl(placeUrl);
    if (result.result !== "failed") return result;
    if (attempt < 4) await sleep(attempt * 6000);
  }
  return importFromPlaceUrl(placeUrl);
}

const { data: businesses, error } = await db
  .from("businesses")
  .select("id, name, address, district, lat, lng, place_url, field_sources")
  .not("place_url", "is", null)
  .order("name");

if (error) {
  console.error("업장을 읽지 못했습니다:", error.message);
  process.exit(1);
}

console.log(
  `플레이스가 연결된 ${businesses!.length}곳을 확인합니다` +
    (apply ? " (저장합니다)\n" : " — 미리보기입니다. 저장하려면 --apply 를 붙이세요\n"),
);

let updated = 0;
let kept = 0;
let failed = 0;

for (const b of businesses!) {
  const sources = (b.field_sources ?? {}) as Record<string, string>;

  if (sources.address === "manual") {
    console.log(`· ${b.name} — 직접 적으신 주소라 그대로 둡니다`);
    kept += 1;
    continue;
  }

  const result = await load(b.place_url);
  await sleep(1500);

  if (result.result === "failed") {
    console.log(`✗ ${b.name} — ${result.error ?? "플레이스를 읽지 못했습니다"}`);
    failed += 1;
    continue;
  }

  const found = result.draft.address;

  if (!isFullAddress(found)) {
    console.log(`· ${b.name} — 플레이스에도 번지가 없습니다 (${found ?? "주소 없음"})`);
    kept += 1;
    continue;
  }

  if (found === b.address) {
    kept += 1;
    continue;
  }

  const patch: Record<string, unknown> = {
    address: found,
    field_sources: { ...sources, address: "place" },
    place_synced_at: new Date().toISOString(),
  };

  // 지역과 좌표는 비어 있을 때만 채운다. 지도를 붙일 때 필요하다.
  if (!b.district && result.draft.district) patch.district = result.draft.district;
  if (b.lat == null && result.draft.lat != null) patch.lat = result.draft.lat;
  if (b.lng == null && result.draft.lng != null) patch.lng = result.draft.lng;

  console.log(`✓ ${b.name}\n    전 ${b.address}\n    후 ${found}`);
  updated += 1;

  if (!apply) continue;

  const { error: saveError } = await db.from("businesses").update(patch).eq("id", b.id);
  if (saveError) {
    console.log(`  ✗ 저장 실패: ${saveError.message}`);
    updated -= 1;
    failed += 1;
  }
}

console.log(
  `\n${apply ? "바꿨습니다" : "바꿀 수 있습니다"}: ${updated}곳 / 그대로: ${kept}곳 / 실패: ${failed}곳`,
);
