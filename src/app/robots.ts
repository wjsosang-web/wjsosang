import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/siteUrl";

/**
 * 검색 로봇 안내.
 * 관리자 화면과 로그인은 검색에 걸리면 안 되므로 막는다.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/login", "/my", "/dev"],
      },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
