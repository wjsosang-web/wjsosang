import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import MemberLoginForm from "@/components/member/MemberLoginForm";
import { getCurrentMember } from "@/lib/supabase/member";

export const metadata: Metadata = { title: "회원 로그인" };
export const dynamic = "force-dynamic";

export default async function MemberLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const [{ next, error }, current] = await Promise.all([searchParams, getCurrentMember()]);

  // 이미 로그인했으면 내 자리로 보낸다
  if (current) redirect(next && next.startsWith("/") ? next : "/my");

  return (
    <div className="px-5 py-14 md:py-20">
      <div className="mx-auto w-full max-w-[420px]">
        <div className="text-center">
          <p className="text-[12.5px] font-bold tracking-[0.14em] text-brand">MEMBER</p>
          <h1 className="mt-2 text-[24px] font-bold tracking-[-0.02em]">회원 로그인</h1>
          <p className="mt-2.5 text-[13.5px] leading-[1.7] text-muted">
            협회 회원이 되시면 회원 자료와 혜택을 이용하실 수 있습니다.
          </p>
        </div>

        {error && (
          <p className="mt-5 rounded-lg bg-coral-tint px-4 py-3 text-[13.5px] font-semibold text-coral">
            로그인이 완료되지 않았습니다. 다시 시도해 주세요.
          </p>
        )}

        <div className="mt-7">
          <MemberLoginForm next={next && next.startsWith("/") ? next : "/my"} />
        </div>

        <p className="mt-7 rounded-xl border border-line bg-mist px-4 py-3.5 text-[12.5px] leading-[1.7] text-muted">
          아직 회원이 아니신가요?{" "}
          <Link href="/join" className="font-bold text-brand hover:underline">
            회원가입 안내 보기
          </Link>
          <br />
          로그인한 뒤 가입 신청서를 쓰시면 인사국에서 확인 후 승인해 드립니다.
        </p>
      </div>
    </div>
  );
}
