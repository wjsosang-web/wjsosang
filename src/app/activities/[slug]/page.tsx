import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Badge from "@/components/common/Badge";
import { ClockIcon, PinIcon, UsersIcon } from "@/components/common/Icons";
import { getPostBySlug, getPublicPosts } from "@/lib/repo";

export const revalidate = 86400;

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
  return { title: post.title, description: post.summary };
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
            </h2>

            <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {photos.map((photo) => (
                <li key={photo.id}>
                  <figure>
                    {photo.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo.url}
                        alt=""
                        className="aspect-[4/3] w-full rounded-xl object-cover"
                      />
                    ) : (
                      <div aria-hidden className="ph aspect-[4/3] w-full rounded-xl" />
                    )}
                    {/* 사진 한 장마다 설명을 붙인다. 몇 년 뒤 활동기록의 가치가 달라진다. */}
                    {photo.caption && (
                      <figcaption className="mt-2.5 text-[12.5px] leading-[1.6] text-muted">
                        {photo.caption}
                      </figcaption>
                    )}
                  </figure>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </article>
  );
}
