import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/supabase/auth";
import { listPopups } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  public: "공개",
  private: "비공개",
  draft: "임시저장",
};

/** 지금 이 팝업이 화면에 뜨고 있는지 */
function stateOf(startAt: string, endAt: string, status: string, now: Date) {
  if (status !== "public") return { text: "안 뜸", tone: "bg-mist text-muted" };
  if (now < new Date(startAt)) return { text: "예정", tone: "bg-amber-tint text-amber" };
  if (now > new Date(endAt)) return { text: "지남", tone: "bg-mist text-muted" };
  return { text: "지금 뜨는 중", tone: "bg-brand text-white" };
}

const day = (iso: string) => new Date(iso).toISOString().slice(0, 10);

export default async function AdminPopupsPage() {
  if (!(await getCurrentAdmin())) redirect("/admin/login");

  const popups = await listPopups();
  const now = new Date();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.02em]">팝업 관리</h1>
          <p className="mt-1 text-[13px] text-muted">
            메인홈에 뜨는 알림창입니다. 정한 기간에만 나오고 지나면 저절로 사라집니다.
          </p>
        </div>
        <Link
          href="/admin/popups/new"
          className="rounded-lg bg-brand px-5 py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-brand-deep"
        >
          + 팝업 만들기
        </Link>
      </div>

      <p className="rounded-xl border border-line bg-white px-4 py-3 text-[12.5px] leading-[1.7] text-muted">
        오늘 열리는 행사는 팝업을 만들지 않아도 자동으로 뜹니다. 여기서 만드는 팝업은
        그 밖에 따로 알리고 싶은 내용을 위한 것입니다. 모든 팝업에는 [오늘 하루 보지 않기] 와
        [닫기] 가 함께 나옵니다.
      </p>

      {popups.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-white py-16 text-center text-[14px] text-muted">
          아직 만든 팝업이 없습니다.
        </p>
      ) : (
        <ul className="overflow-hidden rounded-xl border border-line bg-white">
          {popups.map((p, i) => {
            const state = stateOf(p.startAt, p.endAt, p.status, now);
            return (
              <li key={p.id} className={i > 0 ? "border-t border-line" : ""}>
                <Link
                  href={`/admin/popups/${p.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-mist"
                >
                  <span className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-mist">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span aria-hidden className="grid h-full w-full place-items-center text-[10px] text-muted">
                        글만
                      </span>
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14.5px] font-bold">{p.title}</span>
                    <span className="tnum mt-0.5 block text-[12.5px] text-muted">
                      {day(p.startAt)} ~ {day(p.endAt)}
                    </span>
                  </span>

                  <span className={`shrink-0 rounded px-2 py-1 text-[11.5px] font-bold ${state.tone}`}>
                    {state.text}
                  </span>

                  <span className="shrink-0 rounded bg-mist px-2 py-1 text-[11.5px] font-bold text-muted">
                    {STATUS_LABEL[p.status] ?? p.status}
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
