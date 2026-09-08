import { redirect } from "next/navigation";
import OrgMemberForm from "@/components/admin/OrgMemberForm";
import { getCurrentAdmin } from "@/lib/supabase/auth";
import { listBusinesses } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export default async function NewOrgMemberPage() {
  if (!(await getCurrentAdmin())) redirect("/admin/login");
  const businesses = await listBusinesses();
  return <OrgMemberForm businesses={businesses.map((b) => ({ id: b.id, name: b.name }))} />;
}
