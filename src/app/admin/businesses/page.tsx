import Link from "next/link";
import { redirect } from "next/navigation";
import Badge from "@/components/common/Badge";
import { getCurrentAdmin } from "@/lib/supabase/auth";
import { listBusinesses } from "@/lib/admin/queries";
import { resolveBusinessCover } from "@/lib/images";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  public: "공개",
  private: "비공개",
  draft: "임시저장",
};

export default async function AdminBusinessesPage() {
  if (!(await getCurrentAdmin())) redirect("/admin/login");

  const businesses = await listBusinesses();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.02em]">회원업장 관리</h1>
          <p className="mt-1 text-[13px] text-muted">
            총 <b className="tnum text-ink">{businesses.length}</b>곳
          </p>
        </div>
        <Link
          href="/admin/businesses/new"
          className="rounded-lg bg-brand px-5 py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-brand-deep"
        >
          + 새 업장 등록
        </Link>
      </div>

      {businesses.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-white py-16 text-center text-[14px] text-muted">
          아직 등록된 업장이 없습니다.
        </p>
      ) : (
        <ul className="overflow-hidden rounded-xl border border-line bg-white">
          {businesses.map((b, i) => {
            const cover = resolveBusinessCover(b);
            return (
              <li key={b.id} className={i > 0 ? "border-t border-line" : ""}>
                <Link
                  href={`/admin/businesses/${b.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-mist"
                >
                  <span className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-mist">
                    {cover.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cover.url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span aria-hidden className="ph block h-full w-full" />
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[14.5px] font-bold">{b.name}</span>
                      {b.featured && <Badge label="추천" className="bg-amber-tint text-amber" />}
                    </span>
                    <span className="mt-0.5 block truncate text-[12.5px] text-muted">
                      {b.ownerName} · {b.district}
                    </span>
                  </span>

                  <Badge label={b.category} />

                  {!b.phonePublic && b.phone && (
                    <span className="shrink-0 rounded bg-mist px-2 py-1 text-[11px] font-semibold text-muted">
                      연락처 숨김
                    </span>
                  )}

                  {b.priority !== null && (
                    <span className="tnum shrink-0 rounded bg-mist px-2 py-1 text-[11.5px] font-bold text-muted">
                      {b.priority}순위
                    </span>
                  )}

                  <span
                    className={`shrink-0 rounded px-2 py-1 text-[11.5px] font-bold ${
                      b.status === "public" ? "bg-brand-tint text-brand-deep" : "bg-mist text-muted"
                    }`}
                  >
                    {STATUS_LABEL[b.status] ?? b.status}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
