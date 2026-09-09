/**
 * 플레이스에 있는 정보를 업장에 최대한 채워 넣는다.
 *
 *   npx tsx scripts/sync-places.mts             비어 있는 칸만 채운다
 *   npx tsx scripts/sync-places.mts --force     플레이스에서 온 값을 다시 덮어쓴다
 *   npx tsx scripts/sync-places.mts --only 픽폰  이름에 그 말이 들어간 업장만
 *
 * 가져오는 것
 *   전화번호 · 영업시간 · 주소 · 좌표 · 대표사진 · 업장사진 여러 장
 *   메뉴 · 대표키워드 · 소개글 · 홈페이지/인스타/블로그/그 밖의 SNS
 *
 * 손대지 않는 것
 *   대표자명, 협회 등록 키워드, 회원 혜택, 회원이 직접 올린 사진(cover_image)
 *   — 플레이스에 없거나 협회가 직접 관리하는 값이다.
 *
 * 전화번호는 플레이스에 공개된 업장 번호로 바꾸고 공개로 돌린다.
 * 명부에 있던 개인 연락처는 members 표에 그대로 남아 있어서 사라지지 않는다.
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { importFromPlaceUrl } from "../src/lib/place/import";

config({ path: ".env.local", quiet: true });

const force = process.argv.includes("--force");
const onlyIndex = process.argv.indexOf("--only");
const only = onlyIndex >= 0 ? process.argv[onlyIndex + 1] : null;

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

const UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

/** 페이지에 박힌 JSON 은 "/" 가 / 로 escape 되어 있다. 되돌린다. */
const BACKSLASH = String.fromCharCode(92);
function unescapeSlashes(text: string): string {
  return text.split(BACKSLASH + "u002F").join("/").split(BACKSLASH + "u0026").join("&");
}

/** 진짜 업장 사진만 통과시킨다 (지도 아이콘·파비콘 제외) */
function isPhoto(url: string): boolean {
  if (/(maps-service|\/assets\/|favicon|sprite|blank|noimage|default_|logo_)/i.test(url)) {
    return false;
  }
  return /(ldb-phinf|search\.pstatic\.net|myplace-phinf|pup-phinf)/i.test(url);
}

/**
 * 업장 사진 여러 장을 가져온다.
 *
 * 사진은 상세 페이지가 아니라 사진 탭에만 들어 있다.
 * 페이지 구조가 바뀌면 빈 배열이 돌아오고, 그래도 나머지 정보는 그대로 채워진다.
 */
async function fetchPlacePhotos(placeId: string, limit = 12): Promise<string[]> {
  try {
    const res = await fetch(`https://m.place.naver.com/place/${placeId}/photo`, {
      headers: { "user-agent": UA, "accept-language": "ko-KR,ko;q=0.9" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];

    const html = unescapeSlashes(await res.text());
    const found = html.match(/"originalUrl":"(https:\/\/[^"]+)"/g) ?? [];

    const urls = found
      .map((m) => m.slice('"originalUrl":"'.length, -1))
      .filter(isPhoto);

    return [...new Set(urls)].slice(0, limit);
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */

let query = db.from("businesses").select("*").not("place_url", "is", null);
if (only) query = query.ilike("name", `%${only}%`);

const { data: businesses, error } = await query.order("name");

if (error) {
  console.error(`업장을 읽지 못했습니다: ${error.message}`);
  process.exit(1);
}
if (!businesses?.length) {
  console.log("플레이스 주소가 등록된 업장이 없습니다.");
  process.exit(0);
}

console.log(`${businesses.length}곳을 채웁니다${force ? " (덮어쓰기)" : ""}\n`);

/** 네이버가 연달아 오는 요청을 막는다. 사이를 조금 띄운다. */
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

let done = 0;
let photoCount = 0;
let menuCount = 0;

for (const b of businesses) {
  // 한 번 실패하면 잠깐 쉬었다가 다시 해본다. 대부분 요청이 몰려서 막힌 것이다.
  let result = await importFromPlaceUrl(b.place_url as string);

  if (result.result === "failed") {
    await pause(4000);
    result = await importFromPlaceUrl(b.place_url as string);
  }

  if (result.result === "failed") {
    console.log(`✗ ${b.name} — ${result.error ?? "가져오지 못했습니다"}`);
    continue;
  }

  const d = result.draft;
  const patch: Record<string, unknown> = {};
  const filled: string[] = [];

  /** 비어 있을 때만 채운다 (--force 면 값이 있어도 덮어쓴다) */
  const fill = (column: string, value: unknown, label = column) => {
    if (value === null || value === undefined || value === "") return;
    if (Array.isArray(value) && value.length === 0) return;

    const current = (b as Record<string, unknown>)[column];
    const isEmpty =
      current === null || current === "" || (Array.isArray(current) && current.length === 0);

    if (isEmpty || force) {
      patch[column] = value;
      filled.push(label);
    }
  };

  // 전화번호는 플레이스에 공개된 업장 번호를 쓴다.
  // 명부의 개인 연락처는 members 표에 그대로 남는다.
  if (d.phone && (force || d.phone !== b.phone)) {
    patch.phone = d.phone;
    patch.phone_public = true;
    filled.push("전화번호");
  }

  fill("hours", d.hours, "영업시간");
  fill("address", d.address, "주소");
  fill("district", d.district, "지역");
  fill("lat", d.lat, "좌표");
  fill("lng", d.lng);
  fill("place_photo", d.photo, "대표사진");
  fill("place_keywords", d.keywords, "키워드");
  fill("homepage_url", d.homepageUrl, "홈페이지");
  fill("instagram_url", d.instagramUrl, "인스타");
  fill("blog_url", d.blogUrl, "블로그");
  fill("sns_url", d.snsUrl, "SNS");

  // 소개글 — 명부에서 온 값은 업종 한 단어뿐이라 플레이스 소개가 더 낫다.
  if (d.description) {
    const current = String(b.description ?? "");
    if (force || current.length < 20) {
      patch.description = d.description;
      filled.push("소개글");
    }
    if (!b.tagline) {
      // 한 줄 소개는 첫 문장만 짧게 쓴다
      const first = d.description.split(/(?<=[.!?])\s|\n/)[0].trim();
      if (first && first.length <= 80) {
        patch.tagline = first;
        filled.push("한줄소개");
      }
    }
  }

  if (Object.keys(patch).length > 0) {
    patch.place_synced_at = new Date().toISOString();
    const { error: saveError } = await db.from("businesses").update(patch).eq("id", b.id);
    if (saveError) {
      console.log(`✗ ${b.name} — 저장 실패: ${saveError.message}`);
      continue;
    }
  }

  /* 메뉴 — 플레이스에서 온 것만 갈아 끼운다. 사람이 넣은 것은 남긴다. */
  if (d.menus.length > 0) {
    const { count: existing } = await db
      .from("business_menus")
      .select("id", { count: "exact", head: true })
      .eq("business_id", b.id)
      .eq("source", "place");

    if (force || (existing ?? 0) === 0) {
      await db.from("business_menus").delete().eq("business_id", b.id).eq("source", "place");

      const rows = d.menus.slice(0, 60).map((m, i) => ({
        business_id: b.id,
        name: m.name,
        price: m.price,
        description: m.description,
        image_url: m.imageUrl,
        source: "place",
        sort_order: i + 1,
      }));

      const { error: menuError } = await db.from("business_menus").insert(rows);
      if (!menuError) {
        menuCount += rows.length;
        filled.push(`메뉴 ${rows.length}개`);
      }
    }
  }

  /* 업장 사진 — 이미 있으면 건드리지 않는다 */
  if (d.placeId) {
    const { count: existing } = await db
      .from("business_photos")
      .select("id", { count: "exact", head: true })
      .eq("business_id", b.id);

    if ((existing ?? 0) === 0) {
      const photos = await fetchPlacePhotos(d.placeId);

      if (photos.length > 0) {
        const rows = photos.map((url, i) => ({
          business_id: b.id,
          url,
          caption: "",
          sort_order: i + 1,
        }));

        const { error: photoError } = await db.from("business_photos").insert(rows);
        if (!photoError) {
          photoCount += rows.length;
          filled.push(`사진 ${rows.length}장`);
        }
      }
    }
  }

  if (filled.length === 0) {
    console.log(`· ${b.name} — 채울 것이 없습니다`);
    continue;
  }

  done += 1;
  console.log(`✓ ${b.name} — ${filled.join(", ")}`);

  await pause(800);
}

console.log(`\n${done}곳을 채웠습니다. 사진 ${photoCount}장, 메뉴 ${menuCount}개를 새로 넣었습니다.`);
