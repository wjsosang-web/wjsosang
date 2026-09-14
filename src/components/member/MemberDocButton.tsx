"use client";

import { useState } from "react";
import { downloadMemberDoc } from "@/lib/member/actions";

/**
 * 회원 전용 자료 내려받기.
 *
 * 협회소개 화면에서는 코드를 적어야 하지만, 여기는 이미 로그인한 회원이라
 * 누르면 바로 내려받는다. 주소는 5분 뒤에 만료되므로 퍼뜨려도 오래 못 쓴다.
 */
export default function MemberDocButton({ fileName }: { fileName: string | null }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          const result = await downloadMemberDoc();
          if (result.ok && result.url) {
            window.location.href = result.url;
          } else {
            setError(result.message);
          }
          setBusy(false);
        }}
        className="rounded-lg bg-brand px-6 py-3 text-[14.5px] font-bold text-white transition-colors hover:bg-brand-deep disabled:opacity-50"
      >
        {busy ? "여는 중…" : "내려받기"}
        {fileName && <span className="ml-1.5 font-medium opacity-75">({fileName})</span>}
      </button>

      {error && <p className="mt-2.5 text-[13px] text-coral">{error}</p>}
    </div>
  );
}
