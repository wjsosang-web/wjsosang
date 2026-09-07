"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const { error: signInError } = await getBrowserSupabase().auth.signInWithPassword({
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });

    if (signInError) {
      setError(
        /invalid/i.test(signInError.message)
          ? "이메일 또는 비밀번호가 맞지 않습니다."
          : signInError.message,
      );
      setBusy(false);
      return;
    }

    router.replace(params.get("next") ?? "/admin");
    router.refresh();
  };

  const field =
    "w-full rounded-lg border border-line bg-white px-4 py-3 text-[14px] outline-none transition-colors focus:border-brand";

  return (
    <form onSubmit={submit} className="mt-8 space-y-3 rounded-xl border border-line bg-white p-6">
      <div>
        <label htmlFor="email" className="mb-2 block text-[13px] font-bold">
          이메일
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          placeholder="admin@wjsosang.kr"
          className={field}
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-2 block text-[13px] font-bold">
          비밀번호
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={field}
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-coral-tint px-4 py-3 text-[13px] text-coral">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-brand py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-brand-deep disabled:bg-line-strong"
      >
        {busy ? "로그인 중…" : "로그인"}
      </button>
    </form>
  );
}
