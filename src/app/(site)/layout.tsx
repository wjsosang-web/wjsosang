import BrandClosing from "@/components/layout/BrandClosing";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getLogoAssets, publicFileExists } from "@/lib/assets";
import { getPartners, getSiteInfo } from "@/lib/repo";

/** 공개 사이트 공통 틀 — 헤더 / 본문 / 마무리 띠 / 푸터 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [site, partners] = await Promise.all([getSiteInfo(), getPartners()]);
  const logo = getLogoAssets();

  // 푸터에는 대표 기관 한 곳(원주시)만 보여준다. 로고 파일이 없으면 이름만.
  const first = partners[0] ?? null;
  const footerPartner = first
    ? { ...first, logo: first.logo && publicFileExists(first.logo) ? first.logo : null }
    : null;

  return (
    <>
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
    </>
  );
}
