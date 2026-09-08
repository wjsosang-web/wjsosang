import { Icon } from "@/components/common/Icons";
import { accentAt } from "@/lib/accents";
import type { OrgMember } from "@/lib/types";

/**
 * 조직구성 (기획안 14조).
 *
 * 이미지를 올리는 방식이 아니라 임원 데이터로 그린다.
 * 관리자에서 사람의 직책·소속국을 바꾸면 조직도도 같이 바뀐다.
 *
 *   회장 ─ 부회장
 *     │
 *   이사회 6명
 *     │
 *   ┌──┬──┬──┬──┬──┐
 *  사무 재무 기획 홍보 관리 인사
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

/** 국장이 맨 위로 오도록 직급을 숫자로 바꾼다 */
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
    <section className="bg-mist px-5 py-12 md:py-16">
      <div className="mx-auto max-w-[1180px]">
        <div className="text-center">
          <p className="text-[12.5px] font-bold tracking-[0.16em] text-brand">ORGANIZATION</p>
          <h2 className="mt-2 text-[22px] font-bold tracking-[-0.02em] md:text-[25px]">조직구성</h2>
          <p className="mt-2.5 text-[13.5px] leading-[1.7] text-ink-soft">
            각자의 역할이 모여, 더 큰 변화를 만듭니다.
          </p>
        </div>

        <div className="mt-9">
          {/* 회장 ─ 부회장 */}
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-stretch sm:justify-center sm:gap-0">
            <div className="relative w-full max-w-[280px] overflow-hidden rounded-2xl bg-forest px-6 py-6 text-center shadow-[0_10px_30px_rgba(22,36,31,0.18)] sm:text-left">
              <span
                aria-hidden
                className="absolute -right-10 -top-10 block h-28 w-28 rounded-full bg-brand/30 blur-2xl"
              />
              <span
                aria-hidden
                className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-white/15 text-brand-light sm:mx-0"
              >
                <Icon name="users" className="h-[19px] w-[19px]" />
              </span>
              <p className="mt-3 text-[11.5px] font-bold tracking-[0.14em] text-brand-light">회장</p>
              <p className="mt-1 text-[22px] font-bold leading-tight text-white">
                {president?.name ?? "—"}
              </p>
            </div>

            {vices.length > 0 && (
              <>
                <span aria-hidden className="hidden w-10 self-center sm:block">
                  <span className="block h-px w-full bg-line-strong" />
                </span>

                <ul className="flex w-full max-w-[280px] flex-col justify-center gap-2 sm:w-auto sm:min-w-[210px]">
                  {vices.map((v) => (
                    <li
                      key={v.id}
                      className="rounded-xl border border-line bg-white px-5 py-4 text-center sm:text-left"
                    >
                      <p className="text-[11.5px] font-bold tracking-[0.14em] text-brand">부회장</p>
                      <p className="mt-1 text-[17px] font-bold leading-tight">{v.name}</p>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <Spine />

          {/* 이사회 */}
          {directors.length > 0 && (
            <div className="mx-auto max-w-[760px] overflow-hidden rounded-2xl border border-line bg-white">
              <div className="flex items-center gap-2 border-b border-line bg-brand-tint-2 px-5 py-3">
                <span aria-hidden className="text-brand">
                  <Icon name="check-user" className="h-[16px] w-[16px]" />
                </span>
                <span className="text-[14px] font-bold">이사회</span>
                <span className="tnum rounded bg-white px-1.5 py-0.5 text-[11.5px] font-bold text-brand-deep">
                  {directors.length}명
                </span>
              </div>

              <ul className="flex flex-wrap justify-center gap-1.5 px-5 py-4">
                {directors.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center gap-1.5 rounded-lg bg-mist px-3.5 py-2 text-[13.5px] font-semibold"
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

          {/* 6개 국 */}
          <div className="relative">
            {/* 가로 레일 — 한 줄에 여섯 칸이 들어가는 넓은 화면에서만 그린다 */}
            <span
              aria-hidden
              className="absolute left-[8.333%] right-[8.333%] top-0 hidden h-px bg-line-strong lg:block"
            />

            <ul className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-6">
              {byDepartment.map((d, i) => {
                const accent = accentAt(i);
                return (
                  <li key={d.name} className="relative lg:pt-6">
                    <span
                      aria-hidden
                      className="absolute left-1/2 top-0 hidden h-6 w-px bg-line-strong lg:block"
                    />

                    <div className="h-full overflow-hidden rounded-xl border border-line bg-white transition-shadow hover:shadow-[0_8px_24px_rgba(22,36,31,0.07)]">
                      <span aria-hidden className={`block h-1 w-full ${accent.fill}`} />

                      <div className="px-3.5 pb-3.5 pt-3">
                        <p className="flex items-center gap-1.5">
                          <span
                            aria-hidden
                            className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${accent.chip}`}
                          >
                            <Icon name={d.icon} className="h-[13px] w-[13px]" />
                          </span>
                          <span className="text-[13.5px] font-bold">{d.name}</span>
                        </p>

                        {d.head && (
                          <p className="mt-3 leading-tight">
                            <span className="block text-[15px] font-bold">{d.head.name}</span>
                            <span className="mt-0.5 block text-[11px] font-semibold text-muted">
                              {d.head.title}
                            </span>
                          </p>
                        )}

                        {d.rest.length > 0 && (
                          <ul className="mt-2.5 space-y-1 border-t border-line pt-2.5">
                            {d.rest.map((p) => (
                              <li
                                key={p.id}
                                className="flex items-baseline justify-between gap-1.5 text-[12px] leading-[1.5]"
                              >
                                <span className="font-semibold text-ink-soft">{p.name}</span>
                                <span className="shrink-0 text-[10.5px] text-muted">{p.title}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/** 단계 사이를 잇는 세로선 */
function Spine() {
  return (
    <div className="flex justify-center py-4" aria-hidden>
      <span className="block h-8 w-px bg-line-strong" />
    </div>
  );
}
