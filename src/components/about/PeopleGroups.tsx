"use client";

import Link from "next/link";
import { useState } from "react";
import Badge from "@/components/common/Badge";
import { resolveOrgPhoto } from "@/lib/images";
import type { Member, OrgGroup, OrgMember } from "@/lib/types";

/**
 * 각자의 자리에서, 하나의 이름으로 (기획안 15~18조 / 시안 기준).
 * 그룹 탭으로 회장단 / 이사회·감사 / 운영진 / 역대 회장을 나눠 본다.
 */

const GROUP_ORDER: OrgGroup[] = ["회장단", "이사회·감사", "운영진", "역대 회장"];

export default function PeopleGroups({
  org,
  members = [],
  businessById = {},
}: {
  org: OrgMember[];
  /** 조직도에 사진이 없을 때 회원 프로필 사진으로 대체하기 위해 넘긴다. */
  members?: Member[];
  /** businessId → { slug, name, category } */
  businessById?: Record<string, { slug: string; name: string; category: string }>;
}) {
  const groups = GROUP_ORDER.map((g) => ({
    name: g,
    people: org.filter((o) => o.group === g),
  })).filter((g) => g.people.length > 0);

  const [active, setActive] = useState(0);

  if (groups.length === 0) return null;
  const current = groups[Math.min(active, groups.length - 1)];
  const expertiseFirst = current.name === "역대 회장";

  return (
    <section className="bg-mist px-5 py-12 md:py-16">
      <div className="mx-auto max-w-[1180px]">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <h2 className="text-[22px] font-bold tracking-[-0.02em] md:text-[25px]">
              각자의 자리에서, 하나의 이름으로
            </h2>
            <p className="mt-2.5 text-[13.5px] text-ink-soft">
              다양한 분야의 청년 소상공인들이 모여, 더 강한 원주를 만들어갑니다.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="임원 분류"
            className="no-scrollbar flex gap-1 overflow-x-auto rounded-lg bg-white p-1"
          >
            {groups.map((g, i) => (
              <button
                key={g.name}
                type="button"
                role="tab"
                aria-selected={i === active}
                onClick={() => setActive(i)}
                className={`shrink-0 rounded-md px-4 py-2 text-[13px] font-bold transition-colors ${
                  i === active ? "bg-brand text-white" : "text-ink-soft hover:bg-mist"
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>

        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {current.people.map((p) => {
            const photo = resolveOrgPhoto(p, members);
            const business = p.businessId ? businessById[p.businessId] : undefined;

            return (
              <li
                key={p.id}
                className="flex flex-col overflow-hidden rounded-xl border border-line bg-white"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <div aria-hidden className="ph h-full w-full" />
                  )}
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <p className="flex items-center gap-2">
                    <Badge label={p.title} className="bg-brand-tint text-brand-deep" />
                    <span className="text-[15.5px] font-bold">{p.name}</span>
                  </p>

                  <dl className="mt-3 space-y-1 text-[12.5px]">
                    {expertiseFirst
                      ? p.expertise && (
                          <div className="flex gap-2">
                            <dt className="shrink-0 text-muted">전문분야</dt>
                            <dd className="font-semibold">{p.expertise}</dd>
                          </div>
                        )
                      : business && (
                          <>
                            <div className="flex gap-2">
                              <dt className="w-14 shrink-0 text-muted">업장명</dt>
                              <dd className="truncate font-semibold">{business.name}</dd>
                            </div>
                            <div className="flex gap-2">
                              <dt className="w-14 shrink-0 text-muted">업장분류</dt>
                              <dd className="truncate">{business.category}</dd>
                            </div>
                          </>
                        )}
                  </dl>

                  <p className="mt-3 border-t border-line pt-3 text-[12.5px] leading-[1.65] text-ink-soft">
                    {p.intro}
                  </p>

                  {business && (
                    <Link
                      href={`/business/${business.slug}`}
                      className="mt-3 text-[12.5px] font-bold text-brand hover:underline"
                    >
                      업장 보기 →
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
