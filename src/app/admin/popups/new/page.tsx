import { redirect } from "next/navigation";
import PopupForm from "@/components/admin/PopupForm";
import { getCurrentAdmin } from "@/lib/supabase/auth";
import { listPopupSources } from "@/lib/admin/popupSources";

export const dynamic = "force-dynamic";

export default async function NewPopupPage() {
  if (!(await getCurrentAdmin())) redirect("/admin/login");

  const sources = await listPopupSources();
  return <PopupForm sources={sources} />;
}
