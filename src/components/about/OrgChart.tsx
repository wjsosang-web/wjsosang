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
  const directors = org.filter((o) => o.group === "이사회·감사" && o.title === "이사");
  const auditors = org.filter((o) => o.group === "이사회·감사" && o.title === "감사");
  const advisorGroups = [
    { label: "고문단", people: org.filter((o) => o.group === "고문단") },
    { label: "자문위원", people: org.filter((o) => o.group === "자문위원") },
  ].filter((g) => g.people.length > 0);

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
          {/* 회장 + 고문단·자문위원 */}
          <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-start lg:justify-center">
            <div className="w-full max-w-[220px]">
              <Node
                title="회장"
                name={president?.name}
                tone="primary"
                icon="users"
              />
            </div>

            {advisorGroups.length > 0 && (
              <div className="flex w-full max-w-[220px] flex-col gap-2 lg:ml-16">
                {advisorGroups.map((g) => (
                  <Node
                    key={g.label}
                    title={g.label}
                    name={g.people.map((p) => p.name).join(", ")}
                    tone="tint"
                    icon="users"
                    dashed
                  />
                ))}
              </div>
            )}
          </div>

          <Spine />

          {/* 부회장 / 이사회 / 감사 */}
          <ul className="grid gap-2.5 sm:grid-cols-3">
            {vices.map((v) => (
              <li key={v.id}>
                <Node title="부회장" name={v.name} tone="tint" icon="users" />
              </li>
            ))}
            <li>
              <Node
                title="이사회"
                name={directors.length > 0 ? `이사 ${directors.length}명` : undefined}
                tone="tint"
                icon="users"
              />
            </li>
            <li>
              <Node
                title="감사"
                name={auditors.map((a) => a.name).join(", ") || undefined}
                tone="tint"
                icon="check-user"
              />
            </li>
          </ul>

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
