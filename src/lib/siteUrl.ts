/**
 * 사이트의 실제 주소.
 *
 * 공유 카드(카톡·페이스북 미리보기)의 이미지 주소는 반드시 절대주소여야 한다.
 * 상대주소를 넣으면 미리보기에 사진이 안 나온다.
 *
 * 배포 환경에서는 Vercel 이 넣어주는 값을 쓰고, 내 컴퓨터에서는 localhost 를 쓴다.
 * 직접 도메인을 붙였다면 NEXT_PUBLIC_SITE_URL 을 넣으면 그것이 우선한다.
 *
 * 한글 도메인
 *   "원주청년소상공인협회.com" 같은 한글 주소는 실제 통신에서는
 *   "xn--ob0bs5f49qgxas6q62aq1f9zklywf9a.com" 이라는 암호 같은 글자로 바뀐다.
 *   검색엔진이나 sitemap 에는 그 형태가 맞지만, 사람에게 보여줄 때는
 *   한글 그대로여야 한다. 회원 단톡방에 xn-- 로 시작하는 주소를 올리면
 *   피싱 링크로 오해받는다.
 *
 *   그래서 두 가지를 나눠 둔다.
 *     siteUrl()        기계가 읽는 주소 (sitemap, canonical, og:url)
 *     siteDisplayUrl() 사람에게 보여주는 주소 (안내문, 화면에 적는 링크)
 */

import { toUnicodeUrl } from "@/lib/idn";

function raw(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;

  return "http://localhost:3000";
}

/**
 * 기계가 읽는 주소.
 *
 * 한글 도메인을 넣어 두었더라도 여기서는 xn-- 형태로 바꿔 준다.
 * sitemap.xml 규격이 아스키 주소를 요구하고, 검색엔진도 그쪽을 기준으로 본다.
 */
export function siteUrl(): string {
  const value = raw();
  try {
    // new URL 은 호스트를 자동으로 퓨니코드로 바꾼다
    return new URL(value).origin;
  } catch {
    return value;
  }
}

/**
 * 사람에게 보여주는 주소. 한글 도메인이면 한글 그대로.
 *
 * 설정값에 xn-- 형태가 들어 있어도 한글로 되돌린다. Vercel 설정 화면이
 * 한글 도메인을 xn-- 로 보여주기 때문에, 그대로 복사해 넣기 쉽다.
 * 사람이 설정을 정확히 넣어야만 제대로 나오는 구조는 언젠가 어긋난다.
 *
 * 브라우저는 한글 주소를 알아서 바꿔 주므로, 링크로 써도 잘 열린다.
 */
export function siteDisplayUrl(): string {
  return toUnicodeUrl(raw());
}

/** 상대주소를 절대주소로. 이미 절대주소면 그대로 둔다. */
export function absoluteUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${siteUrl()}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** 사람에게 보여줄 절대주소 (안내문에 적는 링크 등) */
export function displayUrl(path: string): string {
  return `${siteDisplayUrl()}${path.startsWith("/") ? "" : "/"}${path}`;
}
