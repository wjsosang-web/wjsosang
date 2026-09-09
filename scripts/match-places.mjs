/**
 * 네이버 "저장한 장소" 목록을 회원업장과 짝지어 플레이스 주소를 채운다.
 *
 *   node scripts/match-places.mjs                  짝만 맞춰보고 표로 보여준다 (저장 안 함)
 *   node scripts/match-places.mjs --apply          확실한 것만 저장한다
 *   node scripts/match-places.mjs --apply --all    애매한 것까지 저장한다 (권하지 않음)
 *
 * 이름이 서로 달라서(예: PICKPHONE&PICKCAR ↔ 휴대폰성지 픽폰&자동차성지 픽카)
 * 글자만으로는 못 맞추는 것이 있다. 그래서
 *   확실  = 이름이 사실상 같거나 한쪽이 다른 쪽을 포함하고 동네도 같다
 *   애매  = 닮았지만 확신할 수 없다
 *   못찾음 = 짝이 없다
 * 세 가지로 나눠서 보여주고, 기본은 '확실'만 저장한다.
 *
 * 잘못 붙으면 남의 가게 정보가 회원 업장에 들어가므로 기본값을 보수적으로 잡았다.
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const SHARE_ID = process.env.NAVER_PLACE_LIST_ID ?? "df665b76ac3042148613b3a96563beff";
const UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

const apply = process.argv.includes("--apply");
/** --pair "우리업장명=플레이스이름" 으로 직접 짝지어 준다 (여러 번 쓸 수 있다) */
const manualPairs = process.argv
  .map((a, i) => (a === "--pair" ? process.argv[i + 1] : null))
  .filter(Boolean)
  .map((s) => {
    const [left, right] = String(s).split("=");
    return { business: (left ?? "").trim(), place: (right ?? "").trim() };
  })
  .filter((p) => p.business && p.place);
const includeMaybe = process.argv.includes("--all");

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

/* ------------------------------------------------------------ 목록 가져오기 */

const res = await fetch(
  `https://pages.map.naver.com/save-pages/api/maps-bookmark/v3/shares/${SHARE_ID}/bookmarks?start=1&limit=500`,
  {
    headers: {
      "user-agent": UA,
      accept: "application/json",
      // 이 줄이 없으면 가게 이름이 영문 표기로 넘어와서 짝을 못 맞춘다
      "accept-language": "ko-KR,ko;q=0.9",
      referer: `https://pages.map.naver.com/save-pages/web/detail-list/${SHARE_ID}?at=u`,
    },
  },
);

if (!res.ok) {
  console.error(`장소 목록을 가져오지 못했습니다 (${res.status})`);
  process.exit(1);
}

const { bookmarkList = [] } = await res.json();
const places = bookmarkList
  .filter((b) => b.type === "place" && b.sid)
  .map((b) => ({
    sid: String(b.sid),
    name: String(b.name ?? "").trim(),
    address: String(b.address ?? "").trim(),
    category: String(b.mcidName ?? "").trim(),
    lat: b.py ?? null,
    lng: b.px ?? null,
  }));

const { data: businesses, error } = await db
  .from("businesses")
  .select("id, name, owner_name, district, place_url")
  .order("name");

if (error) {
  console.error(`업장을 읽지 못했습니다: ${error.message}`);
  process.exit(1);
}

console.log(`저장한 장소 ${places.length}곳 / 회원업장 ${businesses.length}곳\n`);

/* -------------------------------------------------------------- 이름 맞추기 */

/** 비교하기 좋게 다듬는다. 띄어쓰기·기호·흔한 꼬리말을 뗀다. */
function normalize(text) {
  return String(text)
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[\s·・.,'"~!@#$%^&*()\-_+=[\]{}|\\/<>?:;]/g, "")
    .replace(/(원주점|본점|지점|점포|매장|주식회사|㈜)$/g, "");
}

/** 두 글자열이 얼마나 닮았는지 0~1. 두 글자씩 끊어 견준다. */
function similarity(a, b) {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return a === b ? 1 : 0;

  const pairs = (s) => {
    const out = new Map();
    for (let i = 0; i < s.length - 1; i += 1) {
      const p = s.slice(i, i + 2);
      out.set(p, (out.get(p) ?? 0) + 1);
    }
    return out;
  };

  const pa = pairs(a);
  const pb = pairs(b);
  let shared = 0;

  for (const [p, n] of pa) shared += Math.min(n, pb.get(p) ?? 0);

  return (2 * shared) / (a.length - 1 + (b.length - 1));
}

/** 주소에서 읍·면·동을 뽑는다 */
function districtOf(address) {
  return address.match(/([가-힣]+(?:동|읍|면))/)?.[1] ?? null;
}

const results = [];

for (const business of businesses) {
  const bn = normalize(business.name);

  let best = null;
  for (const place of places) {
    const pn = normalize(place.name);
    if (!pn || !bn) continue;

    let score = similarity(bn, pn);

    // 품고 있는 방향에 따라 뜻이 다르다.
    //
    // 우리 이름이 플레이스 이름 안에 있으면 같은 가게일 가능성이 높다.
    // 플레이스는 "원주에어컨청소 세탁기청소 뉴케어"처럼 홍보 문구를 덧붙이기 때문이다.
    //
    // 반대로 플레이스 이름이 우리 이름 안에 있는 경우는 우연일 수 있다.
    // ("소다모터스" 안에 "다모") 그래서 길이가 비슷할 때만 인정한다.
    if (bn.length >= 3 && pn.includes(bn)) {
      score = Math.max(score, 0.9);
    } else if (pn.length >= 3 && bn.includes(pn) && pn.length / bn.length >= 0.6) {
      score = Math.max(score, 0.9);
    }

    // 동네까지 같으면 확신이 올라간다
    const sameDistrict =
      business.district && districtOf(place.address) === business.district;
    if (sameDistrict) score += 0.06;

    if (!best || score > best.score) best = { place, score, sameDistrict };
  }

  // 직접 짝지어 준 것이 있으면 그것을 따른다
  const manual = manualPairs.find((m) => m.business === business.name);
  if (manual) {
    const found = places.find((p) => p.name === manual.place);
    if (found) {
      results.push({ business, place: found, score: 1, sameDistrict: false, level: "확실" });
      continue;
    }
    console.log(`직접 지정한 "${manual.place}" 를 목록에서 찾지 못했습니다`);
  }

  const level =
    !best || best.score < 0.5
      ? "못찾음"
      : best.score >= 0.82 || (best.score >= 0.7 && best.sameDistrict)
        ? "확실"
        : "애매";

  results.push({ business, ...(best ?? {}), level });
}

/* ------------------------------------------------------------------ 보여주기 */

const bucket = (l) => results.filter((r) => r.level === l);

for (const level of ["확실", "애매", "못찾음"]) {
  const rows = bucket(level);
  console.log(`\n[${level}] ${rows.length}곳`);

  for (const r of rows.slice(0, level === "확실" ? 200 : 60)) {
    const already = r.business.place_url ? " (이미 있음)" : "";
    if (level === "못찾음") {
      console.log(`   ${r.business.name}${already}`);
    } else {
      console.log(
        `   ${r.business.name}  →  ${r.place.name}  (${r.score.toFixed(2)}${
          r.sameDistrict ? ", 같은 동네" : ""
        })${already}`,
      );
    }
  }
}

// 한 장소를 두 업장이 가져간 경우 — 업장이 중복 등록됐을 수 있다
const claims = new Map();
for (const r of results) {
  if (r.level === "못찾음") continue;
  const list = claims.get(r.place.sid) ?? [];
  list.push(r.business.name);
  claims.set(r.place.sid, list);
}
const doubled = [...claims.entries()].filter(([, names]) => names.length > 1);
if (doubled.length > 0) {
  console.log(`
[한 장소를 여러 업장이 가리킴] ${doubled.length}건 — 업장이 중복 등록됐는지 확인해 주세요`);
  for (const [sid, names] of doubled) {
    const place = places.find((p) => p.sid === sid);
    console.log(`   ${place?.name} ← ${names.join(", ")}`);
  }
}

// 목록에는 있는데 회원업장과 안 붙은 장소
const used = new Set(results.filter((r) => r.level !== "못찾음").map((r) => r.place.sid));
const leftover = places.filter((p) => !used.has(p.sid));
console.log(`\n[목록에만 있고 안 붙은 장소] ${leftover.length}곳`);
for (const p of leftover.slice(0, 40)) console.log(`   ${p.name} — ${p.address}`);

/* -------------------------------------------------------------------- 저장 */

if (!apply) {
  console.log(
    `\n확인만 했습니다. 저장하려면 --apply 를 붙이세요.` +
      `\n  node scripts/match-places.mjs --apply        확실한 것 ${bucket("확실").length}곳만` +
      `\n  node scripts/match-places.mjs --apply --all  애매한 것 ${bucket("애매").length}곳까지`,
  );
  process.exit(0);
}

const targets = results.filter(
  (r) => r.level === "확실" || (includeMaybe && r.level === "애매"),
);

let saved = 0;

for (const r of targets) {
  if (r.business.place_url) continue; // 이미 있는 것은 건드리지 않는다

  const { error: saveError } = await db
    .from("businesses")
    .update({
      place_url: `https://m.place.naver.com/place/${r.place.sid}`,
      place_id: r.place.sid,
      lat: r.place.lat,
      lng: r.place.lng,
    })
    .eq("id", r.business.id);

  if (saveError) {
    console.log(`✗ ${r.business.name} — ${saveError.message}`);
    continue;
  }
  saved += 1;
}

console.log(`\n${saved}곳에 플레이스 주소를 넣었습니다.`);
console.log("이어서 아래를 실행하면 사진·링크·메뉴가 채워집니다.");
console.log("  npx tsx scripts/refresh-places.mts");
