import type { Metadata } from "next";
import { siteUrl } from "@/lib/siteUrl";
import { getLogoAssets } from "@/lib/assets";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "원주청년소상공인협회",
    template: "%s | 원주청년소상공인협회",
  },
  description:
    "원주에서 청년으로, 소상공인으로 살아가는 사람들. 원주청년소상공인협회 공식 홈페이지입니다.",
  // 홈화면에 추가했을 때 앱처럼 열리게 한다
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "원청협", statusBarStyle: "default" },

  // 상대주소로 적은 이미지도 공유 카드에서 절대주소로 바뀌게 한다
  metadataBase: new URL(siteUrl()),
  openGraph: {
    type: "website",
    siteName: "원주청년소상공인협회",
    locale: "ko_KR",
    title: "원주청년소상공인협회",
    description:
      "원주에서 청년으로, 소상공인으로 살아가는 사람들. 원주청년소상공인협회 공식 홈페이지입니다.",
    url: siteUrl(),
    images: [{ url: "/logo/wj-horizontal.png", width: 668, height: 160 }],
  },
};

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
