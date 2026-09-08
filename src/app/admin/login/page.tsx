import type { Metadata } from "next";
import LoginForm from "@/components/admin/LoginForm";
import Logo from "@/components/common/Logo";
import { getLogoAssets } from "@/lib/assets";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "관리자 로그인" };
export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  const configured = isSupabaseConfigured();
  const logo = getLogoAssets();

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
          </div>
        )}
      </div>
    </div>
  );
}
