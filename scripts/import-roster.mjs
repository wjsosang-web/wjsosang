/**
 * 회원명부 엑셀을 회원·업장 데이터로 옮긴다.
 *
 *   npm run roster:import -- "명부 파일 경로.xlsx"
 *
 * 엑셀 열: 번호 | 구분 | 직책 | 이름 | 상호 | 업종 | 연락처 | 법정동
 *
 * 하는 일
 *   1. 회원(members) — 이름·연락처
 *   2. 업장(businesses) — 상호·업종·대표자·연락처·지역
 *      연락처는 개인 휴대폰이라 phone_public = false (숨김)로 넣는다
 *   3. 회원-업장 소유관계
 *   4. 직책이 있는 사람은 조직도(org_members)에도 넣는다. 없으면 "회원"
 *
 * 여러 번 돌려도 상호(slug) 기준으로 갱신되므로 안전하다.
 */

import { createClient } from "@supabase/supabase-js";
import xlsx from "xlsx";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const file = process.argv[2];
if (!file) {
  console.error('사용법: npm run roster:import -- "명부.xlsx"');
  process.exit(1);
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error("NEXT_PUBLIC_SUPABASE_URL 과 SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.");
  process.exit(1);
}
const db = createClient(URL, KEY, { auth: { persistSession: false } });

/* ------------------------------------------------------------------ */
/* 엑셀 읽기                                                            */
/* ------------------------------------------------------------------ */

const wb = xlsx.readFile(file);
const sheet = wb.Sheets[wb.SheetNames[0]];
const raw = xlsx.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: "" });

const clean = (v) => String(v ?? "").replace(/\s+/g, " ").trim();

// 머리글 줄을 찾는다 ("이름" 이 들어 있는 줄)
const headerRow = raw.findIndex((r) => r.some((c) => clean(c) === "이름"));
const rows = raw.slice(headerRow + 1).filter((r) => clean(r[3]));

console.log(`${rows.length}명을 읽었습니다.\n`);

/* ------------------------------------------------------------------ */
/* 업종 분류 — 자유롭게 적힌 업종 글을 협회 분류 14가지로 맞춘다          */
/* ------------------------------------------------------------------ */

const CATEGORY_RULES = [
  ["카페·디저트", /카페|커피|디저트|베이커리|제과|빵|케이크|아이스크림|요거트|음료|핸드드립|공방/],
  ["외식", /요식|식당|한식|중식|일식|양식|분식|치킨|피자|고기|곱창|족발|보쌈|국밥|주점|호프|포차|술집|바베큐|정육식당|급식|도시락|반찬/],
  ["미용·뷰티", /미용|뷰티|헤어|네일|속눈썹|왁싱|피부|반영구|화장품|에스테틱|두피|메이크업|쥬얼리|주얼리/],
  ["자동차", /자동차|카센터|정비|렌터카|렌트|리스|세차|튜닝|중고차|타이어|카센타/],
  ["휴대폰·통신", /휴대폰|핸드폰|통신|모바일|스마트폰|애플|포스기|체크기/],
  ["건설·인테리어", /인테리어|건설|시공|미장|도배|샷시|리모델링|설비|배관|보일러|전기|소방|방역|철거|목공|간판|태양광/],
  ["금융·보험", /보험|금융|대출|자산|투자|재무설계/],
  ["세무·법무", /세무|회계|법무|변리|행정사|노무|법률/],
  ["제조", /제조|생산|가공|공장|방앗간|기름|정밀/],
  ["교육", /교육|학원|과외|아카데미|교습|무용|음악|미술|코딩/],
  ["유통", /유통|도매|판매|납품|의류|신발|잡화|정육|마트|식자재|꽃|화훼|농산물|쇼핑몰/],
  ["전문서비스", /디자인|사진|촬영|스튜디오|영상|컨텐츠|콘텐츠|마케팅|광고|개발|플랫폼|인쇄|번역|의료|병원|약국|한의원/],
  ["생활서비스", /청소|세탁|이사|수리|스포츠|헬스|필라테스|요가|골프|파티|행사|기획|체험|펜션|숙박|반려|애견|부동산/],
];

/** 구분(그룹)만으로도 어느 정도 짐작할 수 있다 */
const GROUP_HINT = {
  "뷰티&쥬얼리": "미용·뷰티",
  "요식업(1)": "외식",
  "요식업(2)": "외식",
  자동차: "자동차",
  "의류/신발/잡화": "유통",
  "카페/공방": "카페·디저트",
  "스포츠/행사기획/체험/파티": "생활서비스",
  "정육/기타서비스": "유통",
};

function toCategory(industry, group) {
  // 구분 그룹 이름에는 "전자/전기/통신/소방/방역/건설/서비스" 처럼 여러 업종이 섞여 있다.
  // 그걸 정규식에 함께 넣으면 엉뚱하게 잡히므로, 업종 글만 보고 판단한다.
  for (const [category, pattern] of CATEGORY_RULES) {
    if (pattern.test(industry)) return category;
  }
  return GROUP_HINT[group] ?? "기타";
}

/** "판부면 서곡리" → "판부면" 처럼 앞 단위만 쓴다 */
function toDistrict(dong) {
  const first = clean(dong).split(" ")[0];
  return first || "기타";
}

/** 상호에서 URL 슬러그를 만든다. 한글은 주소에 쓰기 어려우므로 번호를 붙인다. */
function toSlug(name, index) {
  const ascii = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return ascii.length >= 2 ? `${ascii}-${index}` : `member-${index}`;
}

/** 조직도에 넣을 직책인지. "회원"은 조직도에 넣지 않는다. */
const isOfficer = (title) => title && title !== "회원";

/** 명예임원 직책을 역대 회장 분류로 옮긴다 */
function orgGroupOf(group, title) {
  if (/초대|직전|명예/.test(`${group} ${title}`)) return "역대 회장";
  if (group === "이사회") return "이사회·감사";
  if (group === "집행부") return /감사/.test(title) ? "이사회·감사" : "회장단";
  return "임원진";
}

const DEPARTMENTS = ["사무국", "재무국", "관리국", "인사국", "홍보국", "기획국"];

/* ------------------------------------------------------------------ */
/* 변환                                                                */
/* ------------------------------------------------------------------ */

const people = rows.map((r, i) => {
  const group = clean(r[1]);
  const title = clean(r[2]) || "회원";
  const name = clean(r[3]);
  const shop = clean(r[4]) || `${name} 사업장`;
  const industry = clean(r[5]);
  const phone = clean(r[6]);
  const dong = clean(r[7]);

  return {
    index: i + 1,
    group,
    title,
    name,
    shop,
    industry,
    phone,
    district: toDistrict(dong),
    category: toCategory(industry, group),
    slug: toSlug(shop, i + 1),
  };
});

console.log("업종 분류 결과:");
const byCategory = {};
for (const p of people) byCategory[p.category] = (byCategory[p.category] ?? 0) + 1;
for (const [k, v] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(14)} ${v}곳`);
}

/* ------------------------------------------------------------------ */
/* 저장                                                                */
/* ------------------------------------------------------------------ */

console.log("\n회원 저장...");
const memberIdByName = new Map();
{
  // 이름이 같은 사람이 있을 수 있으므로 이름+연락처로 구분한다
  const { data: existing } = await db.from("members").select("id, name, phone");
  for (const m of existing ?? []) memberIdByName.set(`${m.name}|${m.phone ?? ""}`, m.id);

  const toInsert = people.filter((p) => !memberIdByName.has(`${p.name}|${p.phone}`));
  if (toInsert.length > 0) {
    const { data, error } = await db
      .from("members")
      .insert(
        toInsert.map((p) => ({
          name: p.name,
          phone: p.phone,
          role: "member",
          status: "active",
        })),
      )
      .select("id, name, phone");
    if (error) {
      console.error("  ✗", error.message);
      process.exit(1);
    }
    for (const m of data ?? []) memberIdByName.set(`${m.name}|${m.phone ?? ""}`, m.id);
  }
  console.log(`  ✓ ${people.length}명 (신규 ${toInsert.length}명)`);
}

console.log("업장 저장...");
const businessIdBySlug = new Map();
{
  const rowsToSave = people.map((p) => ({
    slug: p.slug,
    name: p.shop,
    category: p.category,
    tagline: "",
    description: p.industry,
    owner_name: p.name,
    address: `강원특별자치도 원주시 ${p.district}`,
    district: p.district,
    phone: p.phone,
    // 개인 휴대폰이므로 기본은 숨김. 회원 동의 후 관리자가 공개로 바꾼다.
    phone_public: false,
    keywords: p.industry ? [p.industry] : [],
    status: "public",
  }));

  const { data, error } = await db
    .from("businesses")
    .upsert(rowsToSave, { onConflict: "slug" })
    .select("id, slug");

  if (error) {
    console.error("  ✗", error.message);
    process.exit(1);
  }
  for (const b of data ?? []) businessIdBySlug.set(b.slug, b.id);
  console.log(`  ✓ ${rowsToSave.length}곳 (연락처는 전부 숨김 상태)`);
}

console.log("회원-업장 연결...");
{
  const links = people
    .map((p) => ({
      member_id: memberIdByName.get(`${p.name}|${p.phone}`),
      business_id: businessIdBySlug.get(p.slug),
      ownership: "owner",
      can_edit: true,
    }))
    .filter((l) => l.member_id && l.business_id);

  const { error } = await db
    .from("member_businesses")
    .upsert(links, { onConflict: "member_id,business_id" });
  console.log(error ? `  ✗ ${error.message}` : `  ✓ ${links.length}건`);
}

console.log("조직도...");
{
  const officers = people.filter((p) => isOfficer(p.title));
  await db.from("org_members").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  const rowsToSave = officers.map((p, i) => ({
    member_id: memberIdByName.get(`${p.name}|${p.phone}`) ?? null,
    business_id: businessIdBySlug.get(p.slug) ?? null,
    name: p.name,
    org_group: orgGroupOf(p.group, p.title),
    title: p.title,
    department: DEPARTMENTS.includes(p.group) ? p.group : null,
    intro: "",
    expertise: null,
    sort_order: i + 1,
  }));

  const { error } = await db.from("org_members").insert(rowsToSave);
  console.log(error ? `  ✗ ${error.message}` : `  ✓ 임원 ${rowsToSave.length}명`);
  console.log(`    (직책 없는 ${people.length - officers.length}명은 "회원"으로 두고 조직도에 넣지 않음)`);
}

console.log("\n완료.");
