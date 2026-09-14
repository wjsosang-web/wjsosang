"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";

export default function MemberSignOut() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await getBrowserSupabase().auth.signOut();
        router.replace("/");
        router.refresh();
      }}
      className="rounded-lg border border-line px-4 py-2 text-[13px] font-semibold text-muted transition-colors hover:border-ink hover:text-ink disabled:opacity-50"
    >
      로그아웃
    </button>
  );
}
