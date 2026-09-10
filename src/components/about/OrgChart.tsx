import { Icon } from "@/components/common/Icons";
import type { OrgMember } from "@/lib/types";

/**
 * 조직구성.
 *
 * 이미지를 올리는 방식이 아니라 임원 데이터로 그린다.
 * 관리자에서 직책·소속국을 바꾸면 조직도도 같이 바뀐다.
 *
 *   회장 ── 부회장
 *     │
 *   이사회
 *     │
 *   임원진 ─ 사무 · 재무 · 기획 · 홍보 · 관리 · 인사
 *
 * 연결선은 넓은 화면에서만 그린다. 좁은 화면에서는 선이 엉켜 보여서
 * 카드를 위아래로 쌓는 편이 읽기 쉽다.
 */

/** 국 순서·아이콘·색은 협회에서 쓰는 순서를 그대로 따른다. */
const DEPARTMENTS = [
  { name: "사무국", icon: "form", bar: "bg-brand", chip: "bg-brand-tint text-brand" },
  { name: "재무국", icon: "chart", bar: "bg-sky", chip: "bg-sky-tint text-sky" },
  { name: "기획국", icon: "bulb", bar: "bg-amber", chip: "bg-amber-tint text-amber" },
  { name: "홍보국", icon: "megaphone", bar: "bg-coral", chip: "bg-coral-tint text-coral" },
  { name: "관리국", icon: "gear", bar: "bg-violet", chip: "bg-violet-tint text-violet" },
  { name: "인사국", icon: "users", bar: "bg-leaf", chip: "bg-leaf-tint text-leaf" },
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
    <section className="relative isolate overflow-hidden bg-white px-5 py-14 md:py-20">
      {/* 배경 장식 — 옅게 깔아 화면이 허전하지 않게 한다 */}
      <span
        aria-hidden
        className="absolute -left-24 top-10 -z-10 block h-[280px] w-[280px] rounded-full border border-brand/10"
      />
      <span
        aria-hidden
        className="absolute -right-32 top-0 -z-10 block h-[420px] w-[420px] rounded-full bg-brand-tint-2"
      />

      <div className="mx-auto max-w-[1180px]">
        {/* 머리말 */}
        <div className="text-center">
          <p className="flex items-center justify-center gap-3 text-[12px] font-bold tracking-[0.22em] text-brand">
            <span aria-hidden className="block h-px w-8 bg-brand/35" />
            ORGANIZATION
            <span aria-hidden className="block h-px w-8 bg-brand/35" />
          </p>
          <h2 className="mt-3 text-[28px] font-bold tracking-[-0.03em] md:text-[34px]">
            조직구성
          </h2>
          <p className="mt-2.5 text-[14px] text-ink-soft">
            각자의 역할이 모여, 더 큰 변화를 만듭니다.
          </p>
        </div>

        {/* 회장 ── 부회장 */}
        <div className="mt-10 flex flex-col items-center gap-4 lg:flex-row lg:justify-center lg:gap-0">
          <div className="relative w-full max-w-[380px] overflow-hidden rounded-2xl bg-gradient-to-br from-forest via-[#12352b] to-brand-deep px-7 py-7 text-center shadow-[0_16px_40px_rgba(22,36,31,0.22)]">
            <span
              aria-hidden
              className="absolute -bottom-14 -right-10 block h-40 w-40 rounded-full bg-brand-light/10"
            />
            <span
              aria-hidden
              className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-amber/50 bg-white/10 text-amber"
            >
              <Icon name="crown" className="h-[22px] w-[22px]" />
            </span>
            <p className="mt-3.5 text-[12px] font-bold tracking-[0.14em] text-brand-light">회장</p>
            <p className="mt-1 text-[26px] font-bold leading-tight text-white">
              {president?.name ?? "—"}
            </p>
            {president?.intro && (
              <p className="mt-2.5 text-[12.5px] leading-relaxed text-white/60">
                {president.intro}
              </p>
            )}
          </div>

          {vices.length > 0 && (
            <>
              <span aria-hidden className="hidden h-px w-14 bg-line-strong lg:block" />

              <ul className="flex w-full max-w-[380px] flex-col gap-3 lg:w-[320px]">
                {vices.map((v) => (
                  <li
                    key={v.id}
                    className="flex items-center gap-3.5 rounded-2xl border border-line bg-white px-5 py-4 shadow-[0_6px_20px_rgba(22,36,31,0.05)]"
                  >
                    <span
                      aria-hidden
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-tint text-brand"
                    >
                      <Icon name="users" className="h-[18px] w-[18px]" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[11.5px] font-bold tracking-[0.12em] text-brand">
                        부회장
                      </span>
                      <span className="mt-0.5 block text-[19px] font-bold leading-tight">
                        {v.name}
                      </span>
                      {v.intro && (
                        <span className="mt-0.5 block truncate text-[12px] text-muted">
                          {v.intro}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* 이사회 */}
        {directors.length > 0 && (
          <>
            <Spine />

            <div className="rounded-3xl border border-line bg-mist/60 px-5 py-6 md:px-8">
              <div className="text-center">
                <GroupBadge icon="check-user" label="이사회" />
                <p className="mt-2.5 text-[13px] text-ink-soft">
                  다양한 시각과 경험이 더 나은 방향을 만듭니다.
                </p>
              </div>

              <ul className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
                {directors.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-line bg-white py-3.5 text-[14.5px] font-bold"
                  >
                    {d.name}
                    {d.subTitle && (
                      <span className="rounded bg-violet px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {d.subTitle}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* 임원진 */}
        <Spine />

        <div className="text-center">
          <GroupBadge icon="gear" label="임원진" />
          <p className="mt-2.5 text-[13px] text-ink-soft">
            전문성과 협력으로, 실행하는 변화를 만듭니다.
          </p>
        </div>

        {/* 6개 국 — 넓은 화면에서는 위로 연결선이 뻗는다 */}
        <div className="relative mt-6">
          <span
            aria-hidden
            className="absolute left-[8.333%] right-[8.333%] top-0 hidden h-px bg-line-strong lg:block"
          />

          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:gap-2.5">
            {byDepartment.map((d) => (
              <li key={d.name} className="relative lg:pt-7">
                <span
                  aria-hidden
                  className="absolute left-1/2 top-0 hidden h-7 w-px bg-line-strong lg:block"
                />

                <div className="h-full overflow-hidden rounded-2xl border border-line bg-white shadow-[0_6px_20px_rgba(22,36,31,0.05)]">
                  <span aria-hidden className={`block h-[5px] w-full ${d.bar}`} />

                  <div className="px-4 pb-4 pt-4">
                    <p className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${d.chip}`}
                      >
                        <Icon name={d.icon} className="h-[16px] w-[16px]" />
                      </span>
                      <span className="text-[14.5px] font-bold">{d.name}</span>
                    </p>

                    {d.head && (
                      <p className="mt-4 leading-tight">
                        <span className="block text-[19px] font-bold tracking-[-0.01em]">
                          {d.head.name}
                        </span>
                        <span className="mt-1 block text-[12px] text-muted">{d.head.title}</span>
                      </p>
                    )}

                    {d.rest.length > 0 && (
                      <ul className="mt-3.5 space-y-1.5 border-t border-line pt-3.5">
                        {d.rest.map((p) => (
                          <li
                            key={p.id}
                            className="flex items-baseline justify-between gap-2 text-[13px]"
                          >
                            <span className="font-bold">{p.name}</span>
                            <span className="shrink-0 text-[11.5px] text-muted">{p.title}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** 이사회·임원진 같은 묶음 이름표 */
function GroupBadge({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-forest to-brand-deep px-6 py-2.5 text-white shadow-[0_8px_20px_rgba(15,158,128,0.25)]">
      <Icon name={icon} className="h-[17px] w-[17px] text-brand-light" />
      <span className="text-[15px] font-bold tracking-[-0.01em]">{label}</span>
    </span>
  );
}

/** 단계 사이를 잇는 세로선 */
function Spine() {
  return (
    <div className="flex justify-center py-5" aria-hidden>
      <span className="relative block h-10 w-px bg-line-strong">
        <span className="absolute -bottom-1 left-1/2 block h-2 w-2 -translate-x-1/2 rounded-full bg-brand" />
      </span>
    </div>
  );
}
