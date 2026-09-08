import Link from "next/link";
import { redirect } from "next/navigation";
import Badge from "@/components/common/Badge";
import OrgGroupOrder from "@/components/admin/OrgGroupOrder";
import { getOrgGroupOrder } from "@/lib/repo";
import { getCurrentAdmin } from "@/lib/supabase/auth";
import { listBusinesses, listOrgMembers } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export default async function AdminOrgPage() {
  if (!(await getCurrentAdmin())) redirect("/admin/login");

  const [org, businesses, groupOrder] = await Promise.all([
    listOrgMembers(),
    listBusinesses(),
    getOrgGroupOrder(),
  ]);
  const nameById = Object.fromEntries(businesses.map((b) => [b.id, b.name]));

  const groups = groupOrder.map((g) => ({
    name: g,
    people: org.filter((o) => o.group === g).sort((a, b) => a.order - b.order),
  })).filter((g) => g.people.length > 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.02em]">조직도 관리</h1>
          <p className="mt-1 text-[13px] text-muted">
            여기서 고치면 협회소개의 조직도와 임원 카드가 함께 바뀝니다. 총{" "}
            <b className="tnum text-ink">{org.length}</b>명
          </p>
        </div>
        <Link
          href="/admin/org/new"
          className="rounded-lg bg-brand px-5 py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-brand-deep"
        >
          + 임원 추가
        </Link>
      </div>

      <OrgGroupOrder current={groupOrder} />

      {groups.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-white py-16 text-center text-[14px] text-muted">
          아직 등록된 임원이 없습니다.
        </p>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <section key={group.name}>
              <h2 className="text-[15px] font-bold">
                {group.name}
                <span className="ml-2 text-[13px] font-semibold text-muted">
                  {group.people.length}명
                </span>
              </h2>

              <ul className="mt-2.5 overflow-hidden rounded-xl border border-line bg-white">
                {group.people.map((p, i) => (
                  <li key={p.id} className={i > 0 ? "border-t border-line" : ""}>
                    <Link
                      href={`/admin/org/${p.id}`}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-mist"
                    >
                      <span className="tnum w-7 shrink-0 text-center text-[12px] text-muted">
                        {p.order}
                      </span>

                      <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-mist">
                        {p.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.photo} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span aria-hidden className="ph block h-full w-full" />
                        )}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="text-[14.5px] font-bold">{p.name}</span>
                          <Badge label={p.title} />
                          {p.department && <Badge label={p.department} />}
                        </span>
                        <span className="mt-0.5 block truncate text-[12.5px] text-muted">
                          {p.businessId ? (nameById[p.businessId] ?? "연결된 업장 없음") : p.intro}
                        </span>
                      </span>

                      <span aria-hidden className="shrink-0 text-[13px] text-line-strong">
                        수정 →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
