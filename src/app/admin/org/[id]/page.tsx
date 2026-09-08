import { notFound, redirect } from "next/navigation";
import OrgMemberForm from "@/components/admin/OrgMemberForm";
import DeleteButton from "@/components/admin/DeleteButton";
import { deleteOrgMember } from "@/lib/admin/actions";
import { getCurrentAdmin } from "@/lib/supabase/auth";
import { listBusinesses, listOrgMembers } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export default async function EditOrgMemberPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentAdmin())) redirect("/admin/login");

  const { id } = await params;
  const [org, businesses] = await Promise.all([listOrgMembers(), listBusinesses()]);
  const person = org.find((o) => o.id === id);
  if (!person) notFound();

  return (
    <div className="space-y-6">
      <OrgMemberForm
        person={person}
        businesses={businesses.map((b) => ({ id: b.id, name: b.name }))}
      />

      <form action={deleteOrgMember} className="rounded-xl border border-coral/25 bg-coral-tint p-5">
        <input type="hidden" name="id" value={person.id} />
        <p className="text-[13.5px] font-bold text-coral">임원 삭제</p>
        <p className="mt-1.5 text-[12.5px] text-ink-soft">
          조직도와 임원 카드에서 사라집니다. 회원 정보 자체는 지워지지 않습니다.
        </p>
        <DeleteButton label="이 임원 삭제하기" confirmText="정말 삭제하시겠습니까?" />
      </form>
    </div>
  );
}
