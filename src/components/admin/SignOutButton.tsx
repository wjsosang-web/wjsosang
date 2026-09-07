"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await getBrowserSupabase().auth.signOut();
        router.replace("/admin/login");
        router.refresh();
      }}
      className="rounded-md border border-line px-3 py-1.5 font-semibold text-muted transition-colors hover:border-ink hover:text-ink disabled:opacity-50"
    >
      로그아웃
    </button>
  );
}
