import { notFound, redirect } from "next/navigation";
import BusinessForm from "@/components/admin/BusinessForm";
import DeleteButton from "@/components/admin/DeleteButton";
import { deleteBusiness } from "@/lib/admin/actions";
import { getCurrentAdmin } from "@/lib/supabase/auth";
import { getBusinessByIdAdmin } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export default async function EditBusinessPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentAdmin())) redirect("/admin/login");

  const { id } = await params;
  const business = await getBusinessByIdAdmin(id);
  if (!business) notFound();

  return (
    <div className="space-y-6">
      <BusinessForm business={business} />

      <form action={deleteBusiness} className="rounded-xl border border-coral/25 bg-coral-tint p-5">
        <input type="hidden" name="id" value={business.id} />
        <p className="text-[13.5px] font-bold text-coral">업장 삭제</p>
        <p className="mt-1.5 text-[12.5px] text-ink-soft">
          삭제하면 되돌릴 수 없습니다. 공개만 중단하려면 위에서 공개 상태를 비공개로 바꾸세요.
        </p>
        <DeleteButton label="이 업장 삭제하기" confirmText="정말 삭제하시겠습니까?" />
      </form>
    </div>
  );
}
