import { Icon } from "@/components/common/Icons";
import { accentAt } from "@/lib/accents";
import type { OrgMember } from "@/lib/types";

/**
 * 조직구성 (기획안 14조 / 시안 기준).
 *
 * 이미지를 올리는 방식이 아니라 임원 데이터로 그린다.
 * 관리자에서 사람의 직책·소속국을 바꾸면 조직도도 같이 바뀐다.
 */

/** 국 순서와 아이콘은 협회에서 쓰는 순서를 그대로 따른다. */
const DEPARTMENTS = [
  { name: "사무국", icon: "form" },
  { name: "재무국", icon: "chart" },
  { name: "관리국", icon: "store" },
  { name: "인사국", icon: "users" },
  { name: "홍보국", icon: "megaphone" },
  { name: "기획국", icon: "chat" },
];

export default function OrgChart({ org }: { org: OrgMember[] }) {
  const president = org.find((o) => o.title === "회장");
  const vices = org.filter((o) => o.title === "부회장");
  // 감사는 칸을 따로 두지 않는다. 겸직인 이사 이름 옆에 배지로 붙인다.
  const directors = org
    .filter((o) => o.group === "이사회·감사")
    .sort((a, b) => a.order - b.order);

  const byDepartment = DEPARTMENTS.map((d) => ({
    ...d,
    people: org.filter((o) => o.department === d.name),
  }));

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
          {/* 회장 */}
          <div className="flex justify-center">
            <div className="w-full max-w-[220px]">
              <Node title="회장" name={president?.name} tone="primary" icon="users" />
            </div>
          </div>

          <Spine />

          {/* 부회장 / 이사회 */}
          <div className="grid gap-2.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <ul className="space-y-2.5">
              {vices.map((v) => (
                <li key={v.id}>
                  <Node title="부회장" name={v.name} tone="tint" icon="users" />
                </li>
              ))}
            </ul>

            {directors.length > 0 && (
              <div className="rounded-xl bg-brand-tint px-4 py-3.5">
                <p className="flex items-center gap-2 text-[13.5px] font-bold">
                  <span
                    aria-hidden
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-brand"
                  >
                    <Icon name="users" className="h-[16px] w-[16px]" />
                  </span>
                  이사회
                  <span className="tnum text-[12px] font-semibold text-ink-soft">
                    {directors.length}명
                  </span>
                </p>

                <ul className="mt-2.5 flex flex-wrap gap-1.5">
                  {directors.map((d) => (
                    <li
                      key={d.id}
                      className="flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-[12.5px]"
                    >
                      <span className="font-semibold">{d.name}</span>
                      {d.subTitle && (
                        <span className="rounded bg-violet-tint px-1.5 py-0.5 text-[10.5px] font-bold text-violet">
                          {d.subTitle}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <Spine />

          {/* 6개 국 */}
          <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
            {byDepartment.map((d, i) => (
              <li key={d.name}>
                <div className="rounded-xl bg-mist px-3 py-3.5 text-center">
                  <span
                    aria-hidden
                    className={`mx-auto grid h-8 w-8 place-items-center rounded-full bg-white ${accentAt(i).text}`}
                  >
                    <Icon name={d.icon} className="h-[16px] w-[16px]" />
                  </span>
                  <p className="mt-2 text-[13.5px] font-bold">{d.name}</p>
                  {d.people.length > 0 && (
                    <p className="mt-1 text-[11.5px] text-ink-soft">
                      {d.people.map((p) => p.name).join(", ")}
                    </p>
                  )}
                </div>
              </li>
            ))}
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
      <span className="block h-7 w-px bg-line-strong" />
    </div>
  );
}

function Node({
  title,
  name,
  tone,
  icon,
  dashed = false,
}: {
  title: string;
  name?: string;
  tone: "primary" | "tint";
  icon: string;
  dashed?: boolean;
}) {
  const styles =
    tone === "primary"
      ? "bg-brand text-white"
      : `bg-brand-tint text-ink ${dashed ? "border border-dashed border-brand/35" : ""}`;

  return (
    <div className={`flex items-center gap-2.5 rounded-xl px-4 py-3.5 ${styles}`}>
      <span
        aria-hidden
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
          tone === "primary" ? "bg-white/20 text-white" : "bg-white text-brand"
        }`}
      >
        <Icon name={icon} className="h-[16px] w-[16px]" />
      </span>
      <span className="min-w-0">
        <span className="block text-[13.5px] font-bold leading-tight">{title}</span>
        {name && (
          <span
            className={`mt-0.5 block truncate text-[12.5px] ${
              tone === "primary" ? "text-white/85" : "text-ink-soft"
            }`}
          >
            {name}
          </span>
        )}
      </span>
    </div>
  );
}
