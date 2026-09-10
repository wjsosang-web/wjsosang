import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Badge from "@/components/common/Badge";
import PhotoGallery from "@/components/common/PhotoGallery";
import ShareButton from "@/components/common/ShareButton";
import { ClockIcon, PinIcon, UsersIcon } from "@/components/common/Icons";
import { getPostBySlug, getPublicPosts } from "@/lib/repo";
import { absoluteUrl, siteUrl } from "@/lib/siteUrl";

/**
 * 관리자가 저장하면 그 즉시 새로 만들어진다(refreshPublicPages).
 * 이 값은 혹시 그 갱신을 놓쳤을 때를 위한 안전망이다.
 * 하루로 두면 한 번 놓쳤을 때 꼬박 하루가 지나야 고쳐지므로 1분으로 둔다.
 */
export const revalidate = 60;

const formatDate = (iso: string) => iso.replace(/-/g, ".");
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

const TYPE_LABEL = {
  notice: "공지사항",
  activity: "활동소식",
  event: "행사",
} as const;

export async function generateStaticParams() {
  const posts = await getPublicPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "협회활동" };

  // 대표사진이 없으면 첫 번째 활동사진을 쓴다
  const image = absoluteUrl(post.coverImage ?? post.photos?.[0]?.url ?? null);
  const url = `${siteUrl()}/activities/${post.slug}`;

  return {
    title: post.title,
    description: post.summary,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      siteName: "원주청년소상공인협회",
      title: post.title,
      description: post.summary,
      url,
      publishedTime: post.date,
      images: image ? [{ url: image, width: 1200, height: 750, alt: post.title }] : [],
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: post.title,
      description: post.summary,
      images: image ? [image] : [],
    },
  };
}

/**
 * 활동 게시글 하나에 본문 + 여러 장의 사진 + 사진별 설명이 함께 들어간다.
 * 별도의 갤러리 게시판을 만들지 않는다 (기획안 28~29조).
 */
export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const photos = post.photos.slice().sort((a, b) => a.order - b.order);
  const key = post.startDate ?? post.date;
  const date = new Date(`${key}T00:00:00`);
  const dateLabel = `${formatDate(key)} (${WEEKDAYS[date.getDay()]})`;

  return (
    <article className="px-5 py-10 md:py-14">
      <div className="mx-auto max-w-[900px]">
        <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
          <Link
            href="/activities"
            className="flex items-center gap-1.5 text-[13.5px] font-semibold text-muted transition-colors hover:text-brand"
          >
            <span aria-hidden>←</span> 목록으로
          </Link>

          {/* 공유 링크는 서버 렌더만으로 동작하도록 링크 형태로 둔다 */}
          <p className="flex items-center gap-2 text-[13px] text-muted">공유하기</p>
        </div>

        <header className="pt-7">
          <p className="flex flex-wrap items-center gap-2">
            <Badge label={TYPE_LABEL[post.type]} size="md" className="bg-brand text-white" />
            {post.category && <Badge label={post.category} size="md" />}
          </p>

          <h1 className="mt-4 text-[25px] font-bold leading-[1.35] tracking-[-0.02em] md:text-[32px]">
            {post.title}
          </h1>

          <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13.5px] text-muted">
            <span className="tnum flex items-center gap-1.5">
              <ClockIcon className="h-[15px] w-[15px] shrink-0 text-brand" />
              {dateLabel}
              {post.time ? ` ${post.time}` : ""}
            </span>
            {post.place && (
              <span className="flex items-center gap-1.5">
                <PinIcon className="h-[15px] w-[15px] shrink-0 text-brand" />
                {post.place}
              </span>
            )}
            {post.participants !== null && (
              <span className="tnum flex items-center gap-1.5">
                <UsersIcon className="h-[15px] w-[15px] shrink-0 text-brand" />
                참여자 {post.participants}명
              </span>
            )}
          </p>
          <div className="mt-6">
            <ShareButton title={post.title} text={post.summary} />
          </div>
        </header>

        <div className="mt-8">
          {post.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.coverImage}
              alt=""
              className="mb-9 aspect-[16/9] w-full rounded-2xl object-cover"
            />
          ) : (
            photos.length > 0 && (
              <div aria-hidden className="ph mb-9 aspect-[16/9] w-full rounded-2xl" />
            )
          )}

          {post.summary && (
            <p className="text-[15.5px] font-semibold leading-[1.8] md:text-[16.5px]">
              {post.summary}
            </p>
          )}

          {post.body && (
            <p className="mt-5 whitespace-pre-line text-[14.5px] leading-[1.95] text-ink-soft md:text-[15.5px]">
              {post.body}
            </p>
          )}
        </div>

        {photos.length > 0 && (
          <section className="mt-12">
            <h2 className="flex items-center gap-2.5 text-[19px] font-bold tracking-[-0.02em]">
              <span aria-hidden className="block h-[18px] w-[3px] rounded bg-brand" />
              활동사진
              <span className="tnum text-[13px] font-semibold text-muted">{photos.length}장</span>
            </h2>

            {/* 눌러서 크게 보고 좌우로 넘긴다.
                사진 한 장마다 붙인 설명은 크게 볼 때도 함께 나온다. */}
            <PhotoGallery
              photos={photos.map((p) => ({ id: p.id, url: p.url, caption: p.caption }))}
            />
          </section>
        )}
      </div>
    </article>
  );
}
