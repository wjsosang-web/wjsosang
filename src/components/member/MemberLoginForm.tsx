"use client";

import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";

/**
 * 회원 로그인 · 가입 시작.
 *
 * 카카오로 한 번에 들어오는 길을 먼저 두고, 카카오를 안 쓰는 분을 위해
 * 이메일 길을 함께 둔다. 어느 쪽으로 들어와도 그다음은 같은 신청서를 쓴다.
 *
 * 네이버 로그인은 Supabase 가 기본으로 지원하지 않아 지금은 넣지 않았다.
 * 넣으려면 네이버에서 받은 정보를 우리 서버가 받아 계정으로 바꿔주는
 * 중간 다리를 따로 만들어야 한다.
 */
export default function MemberLoginForm({ next = "/my" }: { next?: string }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const field =
    "w-full rounded-lg border border-line bg-white px-4 py-3 text-[15px] outline-none transition-colors focus:border-brand";

  async function withKakao() {
    setBusy(true);
    setMessage(null);

    const supabase = getBrowserSupabase();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });

    if (error) {
      setBusy(false);
      setMessage({
        ok: false,
        text:
          /provider is not enabled/i.test(error.message)
            ? "카카오 로그인이 아직 준비되지 않았습니다. 이메일로 가입해 주세요."
            : error.message,
      });
    }
  }

  async function withEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);

    const supabase = getBrowserSupabase();

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
      });

      setBusy(false);
      setMessage(
        error
          ? { ok: false, text: error.message }
          : {
              ok: true,
              text: "가입 확인 메일을 보냈습니다. 메일함에서 링크를 눌러 주세요.",
            },
      );
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);

    if (error) {
      setMessage({
        ok: false,
        text: /invalid login/i.test(error.message)
          ? "이메일 또는 비밀번호가 맞지 않습니다."
          : error.message,
      });
      return;
    }

    window.location.href = next;
  }

  return (
    <div>
      <button
        type="button"
        onClick={withKakao}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#FEE500] px-5 py-3.5 text-[15px] font-bold text-[#191600] transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 3C6.5 3 2 6.6 2 11c0 2.8 1.9 5.3 4.7 6.7l-1 3.7c-.1.3.3.6.6.4l4.4-2.9c.4 0 .9.1 1.3.1 5.5 0 10-3.6 10-8S17.5 3 12 3z" />
        </svg>
        카카오로 시작하기
      </button>

      <div className="my-5 flex items-center gap-3" aria-hidden>
        <span className="h-px flex-1 bg-line" />
        <span className="text-[12px] text-muted">또는</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={withEmail} className="space-y-2.5">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일"
          autoComplete="email"
          className={field}
        />
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호 (8자 이상)"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          className={field}
        />

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-brand px-5 py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-brand-deep disabled:bg-line-strong"
        >
          {busy ? "잠시만요…" : mode === "signup" ? "이메일로 가입하기" : "이메일로 로그인"}
        </button>
      </form>

      {message && (
        <p
          role="status"
          className={`mt-3 text-[13.5px] font-semibold ${message.ok ? "text-brand" : "text-coral"}`}
        >
          {message.text}
        </p>
      )}

      <button
        type="button"
        onClick={() => {
          setMode(mode === "signup" ? "signin" : "signup");
          setMessage(null);
        }}
        className="mt-4 w-full text-[13.5px] font-semibold text-muted hover:text-brand"
      >
        {mode === "signup" ? "이미 계정이 있어요 → 로그인" : "처음이신가요? → 이메일로 가입"}
      </button>
    </div>
  );
}
