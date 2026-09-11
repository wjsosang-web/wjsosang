import type { MetadataRoute } from "next";
import { getPublicBusinesses, getPublicPosts } from "@/lib/repo";
import { siteUrl } from "@/lib/siteUrl";

/**
 * 검색엔진에 우리 화면 목록을 알려준다.
 *
 * 업장 133곳과 활동 글은 메뉴에서 바로 닿지 않는 주소가 많다.
 * 이 목록이 없으면 검색엔진이 대부분을 찾지 못한다.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();

  const fixed: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/business`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/activities`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/support`, changeFrequency: "daily", priority: 0.85 },
    { url: `${base}/contact`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/join`, changeFrequency: "monthly", priority: 0.7 },
  ];

  try {
    const [businesses, posts] = await Promise.all([getPublicBusinesses(), getPublicPosts()]);

    return [
      ...fixed,
      ...businesses.map((b) => ({
        url: `${base}/business/${b.slug}`,
        lastModified: b.updatedAt ? new Date(b.updatedAt) : undefined,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...posts.map((p) => ({
        url: `${base}/activities/${p.slug}`,
        lastModified: p.date ? new Date(p.date) : undefined,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
    ];
  } catch {
    // 데이터를 못 읽어도 기본 화면 목록은 내보낸다
    return fixed;
  }
}
