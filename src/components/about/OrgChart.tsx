import { Icon } from "@/components/common/Icons";
import { accentAt } from "@/lib/accents";
import type { OrgMember } from "@/lib/types";

/**
 * 조직구성 (기획안 14조).
 *
 * 이미지를 올리는 방식이 아니라 임원 데이터로 그린다.
 * 관리자에서 사람의 직책·소속국을 바꾸면 조직도도 같이 바뀐다.
 *
 * 구조
 *   회장 ── 부회장
 *     │
 *   이사회 6명
 *     │
 *   사무국 · 재무국 · 기획국 · 홍보국 · 관리국 · 인사국
 */

/** 국 순서와 아이콘은 협회에서 쓰는 순서를 그대로 따른다. */
const DEPARTMENTS = [
  { name: "사무국", icon: "form" },
  { name: "재무국", icon: "chart" },
  { name: "기획국", icon: "chat" },
  { name: "홍보국", icon: "megaphone" },
  { name: "관리국", icon: "store" },
  { name: "인사국", icon: "users" },
];

/** 국장은 굵게, 나머지는 아래에 — 직급이 보이도록 */
function rankOf(title: string): number {
  if (/부국장$/.test(title)) return 2;
  if (/(국장|총장)$/.test(title)) return 1;
  if (/부장$/.test(title)) return 3;
  return 4;
}

export default function OrgChart({ org }: { org: OrgMember[] }) {
  const byOrder = (a: OrgMember, b: OrgMember) => a.order - b.order;

  const president = org.find((o) => o.title === "회장");
  const vices = org.filter((o) => o.title === "부회장").sort(byOrder);
  // 감사는 칸을 따로 두지 않는다. 겸직인 이사 이름 옆에 배지로 붙는다.
  const directors = org.filter((o) => o.group === "이사회·감사").sort(byOrder);

  const byDepartment = DEPARTMENTS.map((d) => {
    const people = org
      .filter((o) => o.department === d.name)
      .sort((a, b) => rankOf(a.title) - rankOf(b.title) || a.order - b.order);
    return { ...d, head: people[0] ?? null, rest: people.slice(1) };
  });

  return (
    <section className="px-5 py-12 md:py-16">
      <div className="mx-auto grid max-w-[1180px] gap-8 lg:grid-cols-[200px_1fr] lg:gap-10">
        <div>
          <h2 className="text-[22px] font-bold tracking-[-0.02em] md:text-[25px]">조직구성</h2>
          <p className="mt-3 text-[13.5px] leading-[1.7] text-ink-soft">
            각자의 역할이 모여,
            <br />더 큰 변화를 만듭니다.
          </p>
        </div>

        <div>
          {/* 회장 ── 부회장 */}
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-0">
            <div className="w-full max-w-[260px] rounded-xl bg-forest px-5 py-4 text-white">
              <p className="text-[11.5px] font-bold tracking-[0.12em] text-brand-light">회장</p>
              <p className="mt-1 text-[19px] font-bold leading-tight">{president?.name ?? "—"}</p>
            </div>

            {vices.length > 0 && (
              <>
                {/* 회장과 부회장을 잇는 가로선 */}
                <span aria-hidden className="hidden h-px w-10 bg-line-strong sm:block" />
                <div className="flex w-full max-w-[260px] flex-col gap-2 sm:w-auto">
                  {vices.map((v) => (
                    <div
                      key={v.id}
                      className="rounded-xl border border-line bg-white px-5 py-3.5 sm:min-w-[200px]"
                    >
                      <p className="text-[11.5px] font-bold tracking-[0.12em] text-brand">부회장</p>
                      <p className="mt-0.5 text-[16px] font-bold leading-tight">{v.name}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <Spine />

          {/* 이사회 */}
          {directors.length > 0 && (
            <div className="rounded-xl border border-line bg-white px-5 py-4">
              <p className="flex items-center gap-2">
                <span className="text-[14px] font-bold">이사회</span>
                <span className="tnum rounded bg-mist px-1.5 py-0.5 text-[11.5px] font-bold text-muted">
                  {directors.length}명
                </span>
              </p>

              <ul className="mt-3 flex flex-wrap gap-1.5">
                {directors.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center gap-1.5 rounded-lg bg-brand-tint px-3 py-1.5 text-[13px] font-semibold text-brand-deep"
                  >
                    {d.name}
                    {d.subTitle && (
                      <span className="rounded bg-violet px-1.5 py-0.5 text-[10.5px] font-bold text-white">
                        {d.subTitle}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Spine />

          {/* 6개 국 — 국장을 굵게, 국원은 아래에 */}
          <ul className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-6">
            {byDepartment.map((d, i) => {
              const accent = accentAt(i);
              return (
                <li
                  key={d.name}
                  className="overflow-hidden rounded-xl border border-line bg-white"
                >
                  <span aria-hidden className={`block h-1 w-full ${accent.fill}`} />

                  <div className="px-3.5 py-3.5">
                    <p className="flex items-center gap-1.5">
                      <span aria-hidden className={accent.text}>
                        <Icon name={d.icon} className="h-[15px] w-[15px]" />
                      </span>
                      <span className="text-[13.5px] font-bold">{d.name}</span>
                    </p>

                    {d.head && (
                      <p className="mt-2.5 text-[13.5px] font-bold leading-tight">
                        {d.head.name}
                        <span className="ml-1 text-[11px] font-semibold text-muted">
                          {d.head.title}
                        </span>
                      </p>
                    )}

                    {d.rest.length > 0 && (
                      <ul className="mt-1.5 space-y-0.5 border-t border-line pt-1.5">
                        {d.rest.map((p) => (
                          <li key={p.id} className="text-[12px] leading-[1.5] text-ink-soft">
                            {p.name}
                            <span className="ml-1 text-[10.5px] text-muted">{p.title}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** 단계 사이를 잇는 세로선 */
function Spine() {
  return (
    <div className="flex justify-center py-3" aria-hidden>
      <span className="block h-8 w-px bg-line-strong" />
    </div>
  );
}
