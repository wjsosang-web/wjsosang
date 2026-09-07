import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentAdmin } from "@/lib/supabase/auth";
import AdminNav from "@/components/admin/AdminNav";
import SignOutButton from "@/components/admin/SignOutButton";

export const metadata: Metadata = { title: "관리자" };
export const dynamic = "force-dynamic";

/**
 * 관리자 영역 공통 틀.
 *
 * 미들웨어가 "로그인했는지"를 보고, 여기서 "관리자가 맞는지"를 다시 본다.
 * 로그인 화면은 이 틀을 쓰지 않는다(별도 레이아웃).
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();

  // 로그인 화면은 이 레이아웃 아래에 있지만 검사를 통과할 필요가 없다.
  // children 쪽에서 처리하도록 그대로 넘긴다.
  if (!admin) return <>{children}</>;

  return (
    <div className="min-h-screen bg-mist">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-14 max-w-[1280px] items-center gap-4 px-5">
          <Link href="/admin" className="flex items-center gap-2 font-bold">
            <span
              aria-hidden
              className="grid h-7 w-7 place-items-center rounded-md bg-brand text-[11px] text-white"
            >
              wj
            </span>
            <span className="text-[15px]">원청협 관리자</span>
          </Link>

          <div className="ml-auto flex items-center gap-3 text-[13px]">
            <Link href="/" target="_blank" className="text-muted hover:text-brand">
              홈페이지 보기 ↗
            </Link>
            <span className="text-line-strong" aria-hidden>
              |
            </span>
            <span className="font-semibold">{admin.name}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1280px] gap-6 px-5 py-6">
        <AdminNav />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
