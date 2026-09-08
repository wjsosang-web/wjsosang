/**
 * 회원명부 엑셀을 예비 데이터(시드 JSON)로 만든다.
 *
 *   npm run roster:seed -- "명부.xlsx"
 *
 * 시드는 DB를 못 읽을 때 화면을 채우는 예비 자료이고, 저장소에 함께 올라간다.
 * 그래서 개인 연락처는 넣지 않는다. 연락처는 DB에만 두고 화면에서도 숨긴다.
 */

import xlsx from "xlsx";
import { writeFileSync } from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error('사용법: npm run roster:seed -- "명부.xlsx"');
  process.exit(1);
}

const clean = (v) => String(v ?? "").replace(/\s+/g, " ").trim();

const wb = xlsx.readFile(file);
const raw = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
  header: 1,
  blankrows: false,
  defval: "",
});
const headerRow = raw.findIndex((r) => r.some((c) => clean(c) === "이름"));
const rows = raw.slice(headerRow + 1).filter((r) => clean(r[3]));

/* 업종 분류 — import-roster.mjs 와 같은 규칙 */
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
const toCategory = (industry, group) =>
  CATEGORY_RULES.find(([, p]) => p.test(industry))?.[0] ?? GROUP_HINT[group] ?? "기타";

const toDistrict = (dong) => clean(dong).split(" ")[0] || "기타";
const toSlug = (name, i) => {
  const ascii = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return ascii.length >= 2 ? `${ascii}-${i}` : `member-${i}`;
};

const DEPARTMENTS = ["사무국", "재무국", "관리국", "인사국", "홍보국", "기획국"];
const orgGroupOf = (group, title) => {
  if (/초대|직전|명예/.test(`${group} ${title}`)) return "역대 회장";
  if (group === "이사회") return "이사회·감사";
  if (group === "집행부") return /감사/.test(title) ? "이사회·감사" : "회장단";
  return "임원진";
};

/* ------------------------------------------------------------------ */

const people = rows.map((r, i) => ({
  index: i + 1,
  group: clean(r[1]),
  title: clean(r[2]) || "회원",
  name: clean(r[3]),
  shop: clean(r[4]) || `${clean(r[3])} 사업장`,
  industry: clean(r[5]),
  district: toDistrict(r[7]),
}));

const businesses = people.map((p) => ({
  id: `b${String(p.index).padStart(3, "0")}`,
  slug: toSlug(p.shop, p.index),
  name: p.shop,
  category: toCategory(p.industry, p.group),
  tagline: "",
  description: p.industry,
  ownerName: p.name,
  address: `강원특별자치도 원주시 ${p.district}`,
  district: p.district,
  lat: null,
  lng: null,
  // 개인 연락처는 저장소에 올리지 않는다. DB 에만 두고 화면에서도 숨긴다.
  phone: null,
  hours: null,
  placeUrl: null,
  homepageUrl: null,
  instagramUrl: null,
  blogUrl: null,
  snsUrl: null,
  logoImage: null,
  benefit: null,
  phonePublic: false,
  memberSince: null,
  hideNewBadge: false,
  coverImage: null,
  photos: [],
  promo: [],
  placeId: null,
  placeType: null,
  placePhoto: null,
  placeKeywords: [],
  menus: [],
  placeSyncedAt: null,
  fieldSources: {},
  keywords: p.industry ? [p.industry] : [],
  priority: null,
  featured: false,
  status: "public",
  sourcedFromPlace: false,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
}));

const officers = people.filter((p) => p.title !== "회원");
const org = officers.map((p, i) => ({
  id: `o${String(i + 1).padStart(2, "0")}`,
  memberId: null,
  businessId: businesses[p.index - 1].id,
  name: p.name,
  group: orgGroupOf(p.group, p.title),
  title: p.title,
  subTitle: null,
  department: DEPARTMENTS.includes(p.group) ? p.group : null,
  photo: null,
  intro: "",
  expertise: null,
  order: i + 1,
}));

writeFileSync("src/lib/data/seed/businesses.json", JSON.stringify(businesses, null, 2) + "\n");
writeFileSync("src/lib/data/seed/org.json", JSON.stringify(org, null, 2) + "\n");
writeFileSync(
  "src/lib/data/seed/members.json",
  JSON.stringify(
    {
      _comment:
        "회원 개인정보(이름·연락처)는 저장소에 올리지 않습니다. 실제 회원 데이터는 Supabase 에만 있습니다.",
      members: [],
      memberBusinesses: [],
    },
    null,
    2,
  ) + "\n",
);

console.log(`업장 ${businesses.length}곳, 임원 ${org.length}명을 시드로 만들었습니다.`);
console.log("연락처는 넣지 않았습니다 (개인정보).");
