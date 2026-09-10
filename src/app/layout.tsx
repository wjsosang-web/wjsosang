import type { Metadata } from "next";
import { absoluteUrl, siteUrl } from "@/lib/siteUrl";
import { getSeo, getSiteInfo } from "@/lib/repo";
import { getLogoAssets } from "@/lib/assets";
import "./globals.css";

/**
 * 검색 노출 정보.
 *
 * 관리자에서 고친 값을 쓰고, 아직 없으면 기본값으로 돈다.
 * 화면마다 정하는 제목·설명은 각 페이지의 generateMetadata 가 덮어쓴다.
 */
export async function generateMetadata(): Promise<Metadata> {
  const [seo, site] = await Promise.all([getSeo(), getSiteInfo()]);

  const title = seo.title || site.name;
  const description = seo.description;
  const image = absoluteUrl(seo.ogImage) ?? `${siteUrl()}/logo/wj-horizontal.png`;

  return {
    title: { default: title, template: `%s | ${site.name}` },
    description,
    keywords: seo.keywords,
    manifest: "/manifest.webmanifest",
    appleWebApp: { capable: true, title: site.shortName || "원청협", statusBarStyle: "default" },
    metadataBase: new URL(siteUrl()),

    // 네이버·구글 소유확인. 값이 없으면 아예 넣지 않는다.
    verification: {
      other: {
        ...(seo.naverVerification ? { "naver-site-verification": seo.naverVerification } : {}),
        ...(seo.googleVerification
          ? { "google-site-verification": seo.googleVerification }
          : {}),
      },
    },

    openGraph: {
      type: "website",
      siteName: site.name,
      locale: "ko_KR",
      title,
      description,
      url: siteUrl(),
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

/**
 * 최상위 틀 — html/body 와 공통 스타일만 담당한다.
 *
 * 공개 사이트의 헤더·푸터는 (site) 레이아웃에,
 * 관리자 화면의 틀은 admin 레이아웃에 각각 둔다.
 * 그래야 관리자 화면에 공개 사이트 헤더가 딸려 나오지 않는다.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const logo = getLogoAssets();

  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap"
        />
        {logo.symbol && <link rel="icon" href={logo.symbol} />}
      </head>
      <body>{children}</body>
    </html>
  );
}
