import type { Metadata } from "next";
import BrandClosing from "@/components/layout/BrandClosing";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getLogoAssets, publicFileExists } from "@/lib/assets";
import { getPartners, getSiteInfo } from "@/lib/repo";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "원주청년소상공인협회",
    template: "%s | 원주청년소상공인협회",
  },
  description:
    "원주에서 청년으로, 소상공인으로 살아가는 사람들. 원주청년소상공인협회 공식 홈페이지입니다.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [site, partners] = await Promise.all([getSiteInfo(), getPartners()]);
  const logo = getLogoAssets();

  // 푸터에는 대표 기관 한 곳(원주시)만 보여준다. 로고 파일이 없으면 이름만.
  const first = partners[0] ?? null;
  const footerPartner = first
    ? { ...first, logo: first.logo && publicFileExists(first.logo) ? first.logo : null }
    : null;

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
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-forest focus:px-4 focus:py-2 focus:text-white"
        >
          본문 바로가기
        </a>
        <Header logo={logo.horizontal} phone={site.phone} />
        <main id="main">{children}</main>
        <BrandClosing site={site} logo={logo.horizontal} />
        <Footer site={site} partner={footerPartner} />
      </body>
    </html>
  );
}
