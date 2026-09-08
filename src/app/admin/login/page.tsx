import type { Metadata } from "next";
import LoginForm from "@/components/admin/LoginForm";
import Logo from "@/components/common/Logo";
import { getLogoAssets } from "@/lib/assets";
import {
  isSupabaseConfigured,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_URL,
} from "@/lib/supabase/config";

export const metadata: Metadata = { title: "관리자 로그인" };
export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  const configured = isSupabaseConfigured();
  const logo = getLogoAssets();

  // 어느 값이 안 들어왔는지 화면에서 바로 보이게 한다.
  // 값 자체는 보여주지 않고 있는지 없는지만 표시한다.
  const checks = [
    { name: "NEXT_PUBLIC_SUPABASE_URL", ok: SUPABASE_URL !== "", type: "Config 로 등록" },
    { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", ok: SUPABASE_ANON_KEY !== "", type: "Config 로 등록" },
    { name: "SUPABASE_SERVICE_ROLE_KEY", ok: SUPABASE_SERVICE_ROLE_KEY !== "", type: "Secret 로 등록" },
  ];

  return (
    <div className="grid min-h-screen place-items-center bg-mist px-5 py-12">
      <div className="w-full max-w-[400px]">
        <div className="flex flex-col items-center text-center">
          <Logo src={logo.vertical ?? logo.horizontal} height={54} />
          <h1 className="mt-5 text-[20px] font-bold tracking-[-0.02em]">관리자 로그인</h1>
          <p className="mt-2 text-[13.5px] text-muted">
            협회 관리자 계정으로 로그인해 주세요.
          </p>
        </div>

        {configured ? (
          <LoginForm />
        ) : (
          <div className="mt-8 rounded-xl border border-amber/30 bg-amber-tint p-5 text-[13.5px] leading-[1.8] text-ink-soft">
            <p className="font-bold text-amber">Supabase 연결 설정이 필요합니다.</p>
            <p className="mt-2">
              <code>NEXT_PUBLIC_SUPABASE_URL</code> 과{" "}
              <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> 값을 읽지 못했습니다.
            </p>
            <p className="mt-3 font-semibold">Vercel 에 배포한 경우</p>
            <p className="mt-1">
              이 두 값은 브라우저에서도 읽어야 하므로{" "}
              <b>Sensitive(Secret) 로 등록하면 안 됩니다.</b> Vercel → Settings →
              Environment Variables 에서 두 항목을 지우고, Sensitive 체크를 끈 채로 다시
              등록한 뒤 재배포해 주세요.
              <br />
              <code>SUPABASE_SERVICE_ROLE_KEY</code> 는 서버 전용이라 Sensitive 로 두어도
              됩니다.
            </p>
            <p className="mt-3 font-semibold">내 컴퓨터에서 실행 중인 경우</p>
            <p className="mt-1">
              <code>.env.local</code> 에 두 값을 넣고 개발 서버를 다시 켜주세요.
            </p>

            <ul className="mt-4 space-y-1.5 border-t border-amber/25 pt-4">
              {checks.map((c) => (
                <li key={c.name} className="flex items-start gap-2">
                  <span
                    aria-hidden
                    className={`mt-0.5 shrink-0 font-bold ${c.ok ? "text-brand" : "text-coral"}`}
                  >
                    {c.ok ? "✓" : "✗"}
                  </span>
                  <span className="min-w-0">
                    <code className="break-all text-[12px]">{c.name}</code>
                    <span className="ml-1.5 text-[11.5px] text-muted">
                      {c.ok ? "읽음" : `없음 — ${c.type}`}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11.5px] text-muted">
              이름이 한 글자라도 다르면 &quot;없음&quot;으로 나옵니다. 철자를 그대로 맞춰주세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
