import { redirect } from "next/navigation";
import Badge from "@/components/common/Badge";
import DeleteButton from "@/components/admin/DeleteButton";
import { deleteInquiry, markInquiryHandled } from "@/lib/admin/actions";
import { getCurrentAdmin } from "@/lib/supabase/auth";
import { listInquiries } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

const formatWhen = (iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

export default async function AdminInquiriesPage() {
  if (!(await getCurrentAdmin())) redirect("/admin/login");

  const inquiries = await listInquiries();
  const pending = inquiries.filter((i) => !i.handled).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[22px] font-bold tracking-[-0.02em]">문의관리</h1>
        <p className="mt-1 text-[13px] text-muted">
          전체 <b className="tnum text-ink">{inquiries.length}</b>건 · 미확인{" "}
          <b className="tnum text-coral">{pending}</b>건
        </p>
      </div>

      {inquiries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-white py-16 text-center text-[14px] text-muted">
          아직 들어온 문의가 없습니다.
        </p>
      ) : (
        <ul className="space-y-3">
          {inquiries.map((q) => (
            <li
              key={q.id}
              className={`rounded-xl border bg-white p-5 ${
                q.handled ? "border-line opacity-70" : "border-brand/30"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge label={q.kind} />
                {!q.handled && <Badge label="미확인" className="bg-coral-tint text-coral" />}
                <span className="tnum ml-auto text-[12.5px] text-muted">
                  {formatWhen(q.createdAt)}
                </span>
              </div>

              <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-[13.5px] sm:grid-cols-2">
                <div className="flex gap-2">
                  <dt className="w-14 shrink-0 text-muted">이름</dt>
                  <dd className="font-semibold">{q.name}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-14 shrink-0 text-muted">연락처</dt>
                  <dd>
                    <a href={`tel:${q.phone.replace(/-/g, "")}`} className="font-semibold text-brand">
                      {q.phone}
                    </a>
                  </dd>
                </div>
                {q.company && (
                  <div className="flex gap-2">
                    <dt className="w-14 shrink-0 text-muted">업체명</dt>
                    <dd>{q.company}</dd>
                  </div>
                )}
                {q.email && (
                  <div className="flex gap-2">
                    <dt className="w-14 shrink-0 text-muted">이메일</dt>
                    <dd>
                      <a href={`mailto:${q.email}`} className="text-brand">
                        {q.email}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>

              <p className="mt-3 whitespace-pre-line rounded-lg bg-mist p-4 text-[13.5px] leading-[1.8]">
                {q.message}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <form action={markInquiryHandled}>
                  <input type="hidden" name="id" value={q.id} />
                  <input type="hidden" name="handled" value={q.handled ? "false" : "true"} />
                  <button
                    type="submit"
                    className="rounded-lg border border-line px-4 py-2 text-[13px] font-bold transition-colors hover:border-brand hover:text-brand"
                  >
                    {q.handled ? "미확인으로 되돌리기" : "확인 완료로 표시"}
                  </button>
                </form>

                <form action={deleteInquiry}>
                  <input type="hidden" name="id" value={q.id} />
                  <DeleteButton label="삭제" confirmText="이 문의를 삭제하시겠습니까?" />
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
