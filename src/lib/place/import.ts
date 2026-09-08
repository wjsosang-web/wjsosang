/**
 * 플레이스 자동채움 전체 흐름.
 *
 *   관리자가 붙여넣은 주소
 *        ↓ 단축주소면 리다이렉트를 따라간다
 *   플레이스 id / 업종
 *        ↓
 *   ① 플레이스 페이지  → 상호, 대표사진, 메뉴, 대표키워드, 영업시간, 좌표
 *   ② 공식 지역검색 API → 주소, 업종, 전화, (좌표)
 *        ↓ 두 결과를 합친다 (주소·전화·업종은 공식 API 값을 우선)
 *   PlaceDraft + 채워진 항목 / 빈 항목 목록
 *
 * 중요: 이건 '자동 등록'이 아니라 '자동 채우기'다.
 * 대표자명처럼 플레이스에 없는 값은 애초에 채우지 않고 관리자가 직접 넣는다.
 * 반환값을 그대로 저장하지 말고, 관리자 확인 화면을 거치게 해야 한다.
 */

import { searchLocal, hasLocalApiKeys, extractDistrict } from "@/lib/place/naverLocal";
import { fetchPlacePage } from "@/lib/place/placePage";
import { isAllowedHost, parsePlaceUrl, resolveShortUrl } from "@/lib/place/url";
import type { PlaceDraft, PlaceImportResult } from "@/lib/types";

/** 화면에 "이건 직접 넣어주세요"라고 안내할 항목 이름 */
const FIELD_LABELS: Record<string, string> = {
  name: "업장명",
  category: "업종",
  address: "주소",
  district: "지역",
  phone: "전화번호",
  hours: "영업시간",
  photo: "대표사진",
  keywords: "대표키워드",
  menus: "메뉴",
  lat: "위치좌표",
  homepageUrl: "홈페이지",
  instagramUrl: "인스타그램",
  blogUrl: "블로그",
};

/** 플레이스에서 절대 가져올 수 없는 항목 — 관리자가 반드시 직접 입력한다. */
export const MANUAL_ONLY_FIELDS = ["대표자명", "한 줄 소개", "협회 등록 키워드"];

const emptyDraft = (): PlaceDraft => ({
  placeId: null,
  placeType: null,
  placeUrl: null,
  name: null,
  category: null,
  address: null,
  jibunAddress: null,
  district: null,
  phone: null,
  hours: null,
  lat: null,
  lng: null,
  photo: null,
  keywords: [],
  menus: [],
  description: null,
  homepageUrl: null,
  instagramUrl: null,
  blogUrl: null,
  snsUrl: null,
});

export async function importFromPlaceUrl(inputUrl: string): Promise<PlaceImportResult> {
  const draft = emptyDraft();
  const warnings: string[] = [];

  const trimmed = inputUrl.trim();
  if (!trimmed) {
    return fail(draft, "플레이스 주소를 입력해 주세요.");
  }
  if (!isAllowedHost(trimmed)) {
    return fail(draft, "네이버 플레이스 주소만 넣을 수 있습니다. (naver.me 또는 map.naver.com)");
  }

  // 1. 단축주소 펴기
  let resolvedUrl: string;
  try {
    resolvedUrl = await resolveShortUrl(trimmed);
  } catch (e) {
    return fail(draft, `주소를 여는 데 실패했습니다: ${message(e)}`);
  }

  // 2. 플레이스 id 뽑기
  const parsed = parsePlaceUrl(resolvedUrl);
  if (!parsed.placeId || !parsed.canonicalUrl) {
    return fail(
      draft,
      "이 주소에서 플레이스 번호를 찾지 못했습니다. 플레이스 상세페이지 주소인지 확인해 주세요.",
      resolvedUrl,
    );
  }

  draft.placeId = parsed.placeId;
  draft.placeType = parsed.placeType;
  draft.placeUrl = parsed.canonicalUrl;

  // 3. 플레이스 페이지에서 사진·메뉴·키워드
  try {
    const page = await fetchPlacePage(parsed.canonicalUrl);
    Object.assign(draft, stripNulls(page.data));
    warnings.push(...page.warnings);
  } catch (e) {
    warnings.push(`플레이스 페이지를 읽지 못했습니다: ${message(e)}`);
  }

  // 4. 공식 지역검색 API로 주소·업종·전화 보강
  //    페이지에서 상호를 못 얻었으면 검색할 말이 없으므로 건너뛴다.
  if (!hasLocalApiKeys()) {
    warnings.push(
      "네이버 검색 API 키가 설정되지 않아 주소·업종은 페이지에서 읽은 값만 사용했습니다.",
    );
  } else if (draft.name) {
    try {
      const local = await searchLocal(`${draft.name} 원주`);
      if (local) {
        // 공식 API 값이 더 믿을 만한 항목만 덮어쓴다
        draft.address = local.address ?? draft.address;
        draft.category = local.category ?? draft.category;
        draft.phone = local.phone ?? draft.phone;
        if (local.lat && local.lng) {
          draft.lat = local.lat;
          draft.lng = local.lng;
        }
      }
    } catch (e) {
      warnings.push(`지역검색 API 호출에 실패했습니다: ${message(e)}`);
    }
  }

  // 5. 지역(동) 추출
  //    도로명주소에는 '동'이 없는 경우가 많아 지번주소를 먼저 본다.
  draft.district =
    extractDistrict(draft.jibunAddress ?? "") ?? extractDistrict(draft.address ?? "");
  if (draft.address && !draft.district) {
    warnings.push("주소에서 읍·면·동을 자동으로 찾지 못했습니다. 지역을 직접 골라 주세요.");
  }

  const { filled, missing } = summarize(draft);
  const result = filled.length === 0 ? "failed" : missing.length > 0 ? "partial" : "ok";

  return { result, draft, filled, missing, warnings, resolvedUrl, error: null };
}

/* ------------------------------------------------------------------ */

function summarize(draft: PlaceDraft) {
  const filled: string[] = [];
  const missing: string[] = [];

  const check = (key: keyof PlaceDraft) => {
    const value = draft[key];
    const has = Array.isArray(value) ? value.length > 0 : value !== null && value !== "";
    (has ? filled : missing).push(FIELD_LABELS[key] ?? key);
  };

  (["name", "category", "address", "district", "phone", "hours", "photo", "keywords", "menus", "lat"] as const).forEach(
    check,
  );

  return { filled, missing };
}

/** null 값이 이미 채워진 값을 덮어쓰지 않도록 걸러낸다. */
function stripNulls<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== null && v !== undefined),
  ) as Partial<T>;
}

function fail(draft: PlaceDraft, error: string, resolvedUrl: string | null = null): PlaceImportResult {
  return {
    result: "failed",
    draft,
    filled: [],
    missing: Object.values(FIELD_LABELS),
    warnings: [],
    resolvedUrl,
    error,
  };
}

function message(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
