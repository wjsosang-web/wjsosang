/**
 * 사이트의 실제 주소.
 *
 * 공유 카드(카톡·페이스북 미리보기)의 이미지 주소는 반드시 절대주소여야 한다.
 * 상대주소를 넣으면 미리보기에 사진이 안 나온다.
 *
 * 배포 환경에서는 Vercel 이 넣어주는 값을 쓰고, 내 컴퓨터에서는 localhost 를 쓴다.
 * 직접 도메인을 붙였다면 NEXT_PUBLIC_SITE_URL 을 넣으면 그것이 우선한다.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;

  return "http://localhost:3000";
}

/** 상대주소를 절대주소로. 이미 절대주소면 그대로 둔다. */
export function absoluteUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${siteUrl()}${path.startsWith("/") ? "" : "/"}${path}`;
}
