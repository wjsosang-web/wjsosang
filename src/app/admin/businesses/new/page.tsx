import { redirect } from "next/navigation";
import BusinessForm from "@/components/admin/BusinessForm";
import { getCurrentAdmin } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function NewBusinessPage() {
  if (!(await getCurrentAdmin())) redirect("/admin/login");
  return <BusinessForm />;
}
