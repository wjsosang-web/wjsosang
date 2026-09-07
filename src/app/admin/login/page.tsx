import type { Metadata } from "next";
import LoginForm from "@/components/admin/LoginForm";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "관리자 로그인" };
export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  const configured = isSupabaseConfigured();

  return (
    <div className="grid min-h-screen place-items-center bg-mist px-5 py-12">
      <div className="w-full max-w-[400px]">
        <div className="text-center">
          <span
            aria-hidden
            className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-brand text-[14px] font-bold text-white"
          >
            wj
          </span>
          <h1 className="mt-4 text-[22px] font-bold tracking-[-0.02em]">원청협 관리자</h1>
          <p className="mt-2 text-[13.5px] text-muted">
            협회 관리자 계정으로 로그인해 주세요.
          </p>
        </div>

        {configured ? (
          <LoginForm />
        ) : (
          <div className="mt-8 rounded-xl border border-amber/30 bg-amber-tint p-5 text-[13.5px] leading-[1.8] text-ink-soft">
            <p className="font-bold text-amber">Supabase 설정이 필요합니다.</p>
            <p className="mt-2">
              <code>.env.local</code> 에 <code>NEXT_PUBLIC_SUPABASE_URL</code> 과{" "}
              <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> 를 넣고 개발 서버를 다시 켜주세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
