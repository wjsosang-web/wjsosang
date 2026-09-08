import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Badge from "@/components/common/Badge";
import { ClockIcon, LinkIcon, PhoneIcon, PinIcon, UsersIcon } from "@/components/common/Icons";
import { resolveBusinessCover } from "@/lib/images";
import { getBusinessBySlug, getPublicBusinesses } from "@/lib/repo";

export const revalidate = 86400;

export async function generateStaticParams() {
  const businesses = await getPublicBusinesses();
  return businesses.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) return { title: "회원업장" };
  return { title: business.name, description: business.tagline };
}

/** 업장별 독립 URL — /business/cafe-oneuldo (기획안 21조) */
export default async function BusinessDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) notFound();

  // 회원이 올린 사진 → 회원 사진 첫 장 → 플레이스 대표사진 순
  const cover = resolveBusinessCover(business);
  const photos = business.photos.slice().sort((a, b) => a.order - b.order);
  const menus = business.menus.slice().sort((a, b) => a.order - b.order);

  const rows = [
    { icon: UsersIcon, label: "대표자", value: business.ownerName },
    { icon: PinIcon, label: "주소", value: business.address },
    { icon: PhoneIcon, label: "전화번호", value: business.phone, tel: true },
    { icon: ClockIcon, label: "영업시간", value: business.hours },
  ].filter((r) => r.value);

  const links = [
    { label: "네이버 플레이스", href: business.placeUrl },
    { label: "홈페이지", href: business.homepageUrl },
    { label: "SNS", href: business.snsUrl },
  ].filter((l) => l.href);

  return (
    <article className="px-5 py-10 md:py-14">
      <div className="mx-auto max-w-[1180px]">
        <Link
          href="/business"
          className="flex items-center gap-1.5 text-[13.5px] font-semibold text-muted transition-colors hover:text-brand"
        >
          <span aria-hidden>←</span> 회원업장 목록
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)] lg:gap-10">
          {/* 사진 */}
          <div>
            <div className="overflow-hidden rounded-2xl">
              {cover.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cover.url}
                  alt=""
                  className="aspect-[4/3] w-full object-cover"
                />
              ) : (
                <div aria-hidden className="ph aspect-[4/3] w-full" />
              )}
            </div>

            {photos.length > 0 && (
              <ul className="mt-3 grid grid-cols-4 gap-2.5">
                {photos.slice(0, 4).map((photo) => (
                  <li key={photo.id}>
                    <figure>
                      {photo.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={photo.url}
                          alt=""
                          className="aspect-square w-full rounded-lg object-cover"
                        />
                      ) : (
                        <div aria-hidden className="ph aspect-square w-full rounded-lg" />
                      )}
                      {photo.caption && (
                        <figcaption className="mt-1.5 truncate text-[11.5px] text-muted">
                          {photo.caption}
                        </figcaption>
                      )}
                    </figure>
                  </li>
                ))}
              </ul>
            )}

            {cover.source === "place" && (
              <p className="mt-3 text-[11.5px] text-muted">
                대표사진은 네이버 플레이스에서 가져왔습니다. 회원이 사진을 등록하면 그
                사진으로 바뀝니다.
              </p>
            )}
          </div>

          {/* 정보 */}
          <div>
            <p className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-brand-tint px-2.5 py-1 text-[11.5px] font-bold text-brand-deep">
                <span
                  aria-hidden
                  className="grid h-4 w-4 place-items-center rounded-sm bg-brand text-[8px] text-white"
                >
                  wj
                </span>
                원주청년소상공인협회 회원사
              </span>
              <Badge label={business.category} />
            </p>

            <h1 className="mt-3.5 text-[26px] font-bold tracking-[-0.02em] md:text-[32px]">
              {business.name}
            </h1>
            <p className="mt-2 text-[14.5px] text-ink-soft">{business.tagline}</p>

            <dl className="mt-6 space-y-3 border-t border-line pt-6">
              {rows.map((row) => (
                <div key={row.label} className="flex gap-3">
                  <dt className="flex w-[92px] shrink-0 items-center gap-1.5 text-[13px] text-muted">
                    <row.icon className="h-[15px] w-[15px] shrink-0 text-brand" />
                    {row.label}
                  </dt>
                  <dd className="min-w-0 flex-1 text-[13.5px] font-semibold leading-relaxed">
                    {row.tel && row.value ? (
                      <a
                        href={`tel:${row.value.replace(/-/g, "")}`}
                        className="text-brand hover:underline"
                      >
                        {row.value}
                      </a>
                    ) : (
                      row.value
                    )}
                  </dd>
                </div>
              ))}

              {links.map((link) => (
                <div key={link.label} className="flex gap-3">
                  <dt className="flex w-[92px] shrink-0 items-center gap-1.5 text-[13px] text-muted">
                    <LinkIcon className="h-[15px] w-[15px] shrink-0 text-brand" />
                    {link.label}
                  </dt>
                  <dd className="min-w-0 flex-1">
                    <a
                      href={link.href as string}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="break-all text-[13.5px] font-semibold text-brand hover:underline"
                    >
                      {link.href}
                    </a>
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 border-t border-line pt-6">
              <h2 className="text-[15px] font-bold">업장 소개</h2>
              <p className="mt-2.5 whitespace-pre-line text-[13.5px] leading-[1.9] text-ink-soft">
                {business.description || business.tagline}
              </p>
            </div>
          </div>
        </div>

        {/* 메뉴 */}
        {menus.length > 0 && (
          <section className="mt-12">
            <h2 className="flex items-center gap-2.5 text-[19px] font-bold tracking-[-0.02em]">
              <span aria-hidden className="block h-[18px] w-[3px] rounded bg-brand" />
              메뉴
            </h2>
            <ul className="mt-4 overflow-hidden rounded-xl border border-line">
              {menus.map((m, i) => (
                <li
                  key={m.id}
                  className={`flex items-baseline justify-between gap-6 px-5 py-3.5 ${
                    i > 0 ? "border-t border-line" : ""
                  }`}
                >
                  <span className="min-w-0">
                    <span className="text-[14.5px] font-semibold">{m.name}</span>
                    {m.description && (
                      <span className="mt-1 block text-[12.5px] text-muted">
                        {m.description}
                      </span>
                    )}
                  </span>
                  {m.price && (
                    <span className="tnum shrink-0 text-[14.5px] font-bold text-brand">
                      {m.price}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-2.5 text-[11.5px] text-muted">
              메뉴와 가격은 변경될 수 있습니다. 방문 전 업장에 확인해 주세요.
            </p>
          </section>
        )}

        {/* 회원이 직접 작성하는 홍보 영역. 2단계에서 회원이 수정하는 핵심 블록. */}
        {business.promo.length > 0 && (
          <section className="mt-12">
            <h2 className="flex items-center gap-2.5 text-[19px] font-bold tracking-[-0.02em]">
              <span aria-hidden className="block h-[18px] w-[3px] rounded bg-brand" />
              우리 업장을 소개합니다
            </h2>
            <div className="mt-5 space-y-6">
              {business.promo
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((block) =>
                  block.type === "image" ? (
                    <figure key={block.id}>
                      {block.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={block.imageUrl}
                          alt=""
                          className="w-full rounded-2xl object-cover"
                        />
                      ) : (
                        <div aria-hidden className="ph aspect-[16/9] w-full rounded-2xl" />
                      )}
                      {block.caption && (
                        <figcaption className="mt-2.5 text-[12.5px] text-muted">
                          {block.caption}
                        </figcaption>
                      )}
                    </figure>
                  ) : (
                    <p
                      key={block.id}
                      className="whitespace-pre-line text-[14.5px] leading-[1.9] text-ink-soft"
                    >
                      {block.text}
                    </p>
                  ),
                )}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
