import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PopupForm from "@/components/admin/PopupForm";
import { getCurrentAdmin } from "@/lib/supabase/auth";
import { getPopupById } from "@/lib/admin/queries";
import { listPopupSources } from "@/lib/admin/popupSources";
import { deletePopup } from "@/lib/admin/actions";

export const dynamic = "force-dynamic";

export default async function EditPopupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await getCurrentAdmin())) redirect("/admin/login");

  const { id } = await params;
  const [popup, sources] = await Promise.all([getPopupById(id), listPopupSources()]);
  if (!popup) notFound();

  return (
    <div className="space-y-6">
      <PopupForm popup={popup} sources={sources} />

      <form action={deletePopup} className="rounded-xl border border-line bg-white p-5">
        <input type="hidden" name="id" value={popup.id} />
        <h2 className="text-[15px] font-bold">팝업 삭제</h2>
        <p className="mt-1 text-[12.5px] text-muted">
          지우면 되돌릴 수 없습니다. 잠시 멈추려면 공개 상태를 비공개로 바꾸세요.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="submit"
            className="rounded-lg border border-coral px-5 py-2.5 text-[14px] font-bold text-coral transition-colors hover:bg-coral hover:text-white"
          >
            삭제
          </button>
          <Link
            href="/admin/popups"
            className="rounded-lg border border-line px-5 py-2.5 text-[14px] font-semibold text-muted hover:border-ink hover:text-ink"
          >
            목록으로
          </Link>
        </div>
      </form>
    </div>
  );
}
