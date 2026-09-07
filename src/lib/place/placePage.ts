/**
 * 플레이스 페이지에서 대표사진 · 메뉴 · 대표키워드 · 영업시간을 읽어온다.
 *
 * 네이버는 플레이스 상세정보를 공개 API로 제공하지 않는다.
 * 그래서 페이지에 박혀 있는 JSON을 읽는 방식을 쓴다.
 *
 * 이 방식은 네이버가 페이지 구조를 바꾸면 깨진다. 그래서
 *   - 특정 경로를 콕 집어 읽지 않고, 객체 전체를 훑으며 모양으로 찾는다
 *   - 못 찾은 항목은 조용히 비워 두고 warnings 에 남긴다
 *   - 여기서 실패해도 공식 지역검색 API로 받은 값은 그대로 살아남는다
 * 로 만들었다. 관리자가 빈 칸만 직접 채우면 된다.
 */

import { UA } from "@/lib/place/url";
import type { PlaceDraft } from "@/lib/types";

type Json = unknown;

export interface PagePickResult {
  data: Partial<PlaceDraft>;
  warnings: string[];
}

export async function fetchPlacePage(canonicalUrl: string): Promise<PagePickResult> {
  const warnings: string[] = [];

  const res = await fetch(canonicalUrl, {
    headers: {
      "user-agent": UA,
      "accept-language": "ko-KR,ko;q=0.9",
      accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(12000),
  });

  if (!res.ok) {
    return { data: {}, warnings: [`플레이스 페이지를 열지 못했습니다 (${res.status})`] };
  }

  const html = await res.text();

  const fromLd = readJsonLd(html);
  const state = readApolloState(html);
  if (!state) warnings.push("플레이스 상세 데이터를 찾지 못했습니다. 사진·메뉴는 직접 등록해 주세요.");

  const fromState = state ? pickFromState(state) : {};

  const data: Partial<PlaceDraft> = {
    name: fromState.name ?? fromLd.name ?? null,
    category: fromState.category ?? null,
    address: fromState.address ?? fromLd.address ?? null,
    jibunAddress: fromState.jibunAddress ?? null,
    phone: fromState.phone ?? fromLd.phone ?? null,
    photo: fromState.photo ?? fromLd.photo ?? null,
    hours: fromState.hours ?? null,
    keywords: fromState.keywords ?? [],
    menus: fromState.menus ?? [],
    description: fromState.description ?? null,
    homepageUrl: fromState.homepageUrl ?? null,
    lat: fromState.lat ?? null,
    lng: fromState.lng ?? null,
  };

  if (!data.photo) warnings.push("플레이스 대표사진을 가져오지 못했습니다.");
  if (!data.menus?.length) warnings.push("메뉴 정보를 가져오지 못했습니다.");

  return { data, warnings };
}

/* ------------------------------------------------------------------ */
/* JSON-LD — 표준 스키마라 상대적으로 안정적이다                        */
/* ------------------------------------------------------------------ */

function readJsonLd(html: string): {
  name: string | null;
  address: string | null;
  phone: string | null;
  photo: string | null;
} {
  const empty = { name: null, address: null, phone: null, photo: null };
  const blocks = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)];

  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block[1].trim()) as Record<string, Json>;
      const nodes = Array.isArray(parsed) ? parsed : [parsed];

      for (const node of nodes as Array<Record<string, Json>>) {
        const address = node.address as Record<string, Json> | string | undefined;
        const image = node.image;

        const result = {
          name: asString(node.name),
          address:
            typeof address === "string"
              ? address
              : asString(address?.streetAddress) ?? asString(address?.addressLocality),
          phone: asString(node.telephone),
          photo: Array.isArray(image) ? asString(image[0]) : asString(image),
        };

        if (result.name || result.address) return result;
      }
    } catch {
      // 깨진 JSON-LD 는 그냥 건너뛴다
    }
  }

  return empty;
}

/* ------------------------------------------------------------------ */
/* 페이지에 박혀 있는 상태 객체                                          */
/* ------------------------------------------------------------------ */

function readApolloState(html: string): Json | null {
  // window.__APOLLO_STATE__ = {...};  형태를 찾는다
  const markers = ["window.__APOLLO_STATE__", "window.__PLACE_STATE__", "__NEXT_DATA__"];

  for (const marker of markers) {
    const at = html.indexOf(marker);
    if (at === -1) continue;

    const braceStart = html.indexOf("{", at);
    if (braceStart === -1) continue;

    const json = sliceBalancedJson(html, braceStart);
    if (!json) continue;

    try {
      return JSON.parse(json) as Json;
    } catch {
      // 다음 후보로
    }
  }

  return null;
}

/** 여는 중괄호부터 짝이 맞는 닫는 중괄호까지 잘라낸다. 문자열 안의 괄호는 무시한다. */
function sliceBalancedJson(text: string, start: number): string | null {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];

    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }

    if (ch === '"') inString = true;
    else if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }

  return null;
}

/* ------------------------------------------------------------------ */
/* 상태 객체 훑기 — 경로가 아니라 '모양'으로 찾는다                      */
/* ------------------------------------------------------------------ */

interface Picked {
  name: string | null;
  category: string | null;
  address: string | null;
  jibunAddress: string | null;
  phone: string | null;
  photo: string | null;
  hours: string | null;
  description: string | null;
  homepageUrl: string | null;
  lat: number | null;
  lng: number | null;
  keywords: string[];
  menus: PlaceDraft["menus"];
}

function pickFromState(state: Json): Partial<Picked> {
  const out: Partial<Picked> = { keywords: [], menus: [] };
  const seenMenus = new Set<string>();

  walk(state, (node) => {
    // --- 업장 기본정보처럼 보이는 객체 ---
    const name = asString(node.name);
    const road = asString(node.roadAddress) ?? asString(node.address);
    const jibun = asString(node.address);

    if (!out.name && name && road) {
      out.name = name;
      out.address = road;
      out.jibunAddress = jibun;
      out.category = asString(node.category) ?? out.category ?? null;
      out.phone =
        asString(node.phone) ?? asString(node.virtualPhone) ?? asString(node.tel) ?? out.phone ?? null;
      out.description = asString(node.description) ?? out.description ?? null;
      out.homepageUrl = asString(node.homepage) ?? out.homepageUrl ?? null;
    }

    // --- 좌표 ---
    // 좌표는 { __typename: "Coordinate", x, y } 처럼 따로 떨어진 객체로 온다.
    if (out.lat == null || out.lng == null) {
      const lat = asNumber(node.y) ?? asNumber(node.lat) ?? asNumber(node.latitude);
      const lng = asNumber(node.x) ?? asNumber(node.lng) ?? asNumber(node.longitude);
      // 한반도 범위를 벗어나면 다른 뜻의 x/y 다. 버린다.
      if (lat && lng && lat > 32 && lat < 40 && lng > 124 && lng < 132) {
        out.lat = lat;
        out.lng = lng;
      }
    }

    // --- 대표사진 ---
    if (!out.photo) {
      const candidate =
        asString(node.imageUrl) ??
        asString(node.thumbUrl) ??
        asString(node.origin) ??
        (Array.isArray(node.images) ? pickImageFromArray(node.images) : null);
      if (candidate && looksLikeImage(candidate)) out.photo = candidate;
    }

    // --- 영업시간 ---
    // 문자열로 오기도 하고, 요일별 배열로 오기도 한다.
    if (!out.hours) {
      const asText =
        asString(node.bizHour) ??
        asString(node.timeDescription) ??
        asString(node.realtimeBizHours);

      if (asText) {
        out.hours = asText;
      } else if (Array.isArray(node.businessHours)) {
        const formatted = formatWorkingHours(node.businessHours);
        if (formatted) out.hours = formatted;
      }
    }

    // --- 대표키워드 ---
    const keywordish =
      node.keywords ?? node.keywordList ?? node.microReviews ?? node.tags ?? node.conveniences;
    if (Array.isArray(keywordish)) {
      for (const k of keywordish) {
        const text = asString(k) ?? asString((k as Record<string, Json>)?.name);
        if (text && text.length <= 30) out.keywords?.push(text);
      }
    }

    // --- 메뉴 ---
    // { name, price } 를 가진 객체를 메뉴로 본다. 가격은 숫자/문자 둘 다 온다.
    const menuName = asString(node.name);
    const rawPrice = node.price;
    const hasPrice = typeof rawPrice === "string" || typeof rawPrice === "number";

    if (menuName && hasPrice && !seenMenus.has(menuName)) {
      seenMenus.add(menuName);
      out.menus?.push({
        name: menuName,
        price: formatPrice(rawPrice),
        description: asString(node.description) ?? null,
        imageUrl: (() => {
          const img = asString(node.images) ?? asString(node.imageUrl);
          return img && looksLikeImage(img) ? img : null;
        })(),
      });
    }
  });

  // 중복 키워드 정리
  out.keywords = [...new Set(out.keywords ?? [])].slice(0, 20);
  out.menus = (out.menus ?? []).slice(0, 60);

  return out;
}

/** 객체 트리를 모두 돌면서 각 객체를 콜백에 넘긴다. 순환 참조를 막는다. */
function walk(root: Json, visit: (node: Record<string, Json>) => void, limit = 50_000) {
  const stack: Json[] = [root];
  const seen = new WeakSet<object>();
  let count = 0;

  while (stack.length > 0 && count < limit) {
    const current = stack.pop();
    if (!current || typeof current !== "object") continue;
    if (seen.has(current as object)) continue;
    seen.add(current as object);
    count += 1;

    if (Array.isArray(current)) {
      stack.push(...current);
      continue;
    }

    const node = current as Record<string, Json>;
    visit(node);
    stack.push(...Object.values(node));
  }
}

/* ------------------------------------------------------------------ */
/* 작은 도우미들                                                        */
/* ------------------------------------------------------------------ */

function asString(v: Json): string | null {
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

function asNumber(v: Json): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return null;
}

function looksLikeImage(url: string): boolean {
  return /^https?:\/\//.test(url) && /(pstatic\.net|naver\.net|\.(jpg|jpeg|png|webp))/i.test(url);
}

function pickImageFromArray(images: Json[]): string | null {
  for (const img of images) {
    const url = asString(img) ?? asString((img as Record<string, Json>)?.url) ?? asString((img as Record<string, Json>)?.origin);
    if (url && looksLikeImage(url)) return url;
  }
  return null;
}

function formatPrice(price: string | number): string | null {
  if (typeof price === "number") {
    return Number.isFinite(price) ? `${price.toLocaleString("ko-KR")}원` : null;
  }
  const trimmed = price.trim();
  if (trimmed === "") return null;
  // 숫자만 온 경우 원 단위를 붙여 준다
  return /^\d+$/.test(trimmed) ? `${Number(trimmed).toLocaleString("ko-KR")}원` : trimmed;
}

/* ------------------------------------------------------------------ */
/* 영업시간 정리                                                        */
/* ------------------------------------------------------------------ */

const DAY_ORDER = ["월", "화", "수", "목", "금", "토", "일"];

/**
 * 요일별 영업시간 배열을 사람이 읽는 한 줄로 만든다.
 *
 *   [{day:"월", businessHours:{start:"11:00",end:"22:00"},
 *     breakHours:[{start:"14:30",end:"16:30"}]}, ...]
 *     → "월~금 11:00-22:00 (브레이크 14:30-16:30), 토·일 11:00-21:00"
 *
 * 같은 시간대가 이어지는 요일은 묶어서 표시한다.
 */
function formatWorkingHours(list: Json[]): string | null {
  const byDay = new Map<string, string>();

  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, Json>;

    const day = asString(row.day);
    if (!day || byDay.has(day)) continue;

    const hours = row.businessHours as Record<string, Json> | undefined;
    const start = asString(hours?.start);
    const end = asString(hours?.end);

    if (!start || !end) {
      byDay.set(day, "휴무");
      continue;
    }

    let text = `${start}-${end}`;
    const firstBreak = Array.isArray(row.breakHours)
      ? (row.breakHours[0] as Record<string, Json> | undefined)
      : undefined;
    const breakStart = asString(firstBreak?.start);
    const breakEnd = asString(firstBreak?.end);
    if (breakStart && breakEnd) text += ` (브레이크 ${breakStart}-${breakEnd})`;

    byDay.set(day, text);
  }

  if (byDay.size === 0) return null;

  // 요일 순서대로 훑으면서 같은 시간대가 이어지면 하나로 묶는다
  const groups: Array<{ days: string[]; text: string }> = [];
  for (const day of DAY_ORDER) {
    const text = byDay.get(day);
    if (!text) continue;

    const last = groups[groups.length - 1];
    if (last && last.text === text) last.days.push(day);
    else groups.push({ days: [day], text });
  }

  return groups.map((g) => `${joinDays(g.days)} ${g.text}`).join(", ");
}

function joinDays(days: string[]): string {
  if (days.length === 1) return days[0];
  const indexes = days.map((d) => DAY_ORDER.indexOf(d));
  const consecutive = indexes.every((v, i) => i === 0 || v === indexes[i - 1] + 1);
  return consecutive ? `${days[0]}~${days[days.length - 1]}` : days.join("·");
}
