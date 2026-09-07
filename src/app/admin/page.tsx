import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/supabase/auth";
import { canWriteToSupabase } from "@/lib/supabase/config";
import { getDashboardCounts } from "@/lib/admin/queries";
import { accentAt } from "@/lib/accents";

export const dynamic = "force-dynamic";

/** 관리자 홈 — 로그인하면 바로 숫자로 상황을 본다 (기획안 36조) */
export default async function AdminHomePage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  if (!canWriteToSupabase()) {
    return (
      <Panel title="설정이 하나 남았습니다">
        <p>
          <code>SUPABASE_SERVICE_ROLE_KEY</code> 가 없어서 저장 기능을 쓸 수 없습니다.
          <br />
          Supabase 대시보드 → Project Settings → API Keys 에서 secret key 를 복사해
          <code> .env.local</code> 에 넣고 개발 서버를 다시 켜주세요.
        </p>
      </Panel>
    );
  }

  let counts;
  try {
    counts = await getDashboardCounts();
  } catch (e) {
    return (
      <Panel title="데이터베이스를 읽지 못했습니다">
        <p>{e instanceof Error ? e.message : String(e)}</p>
        <p className="mt-3">
          테이블이 아직 없다면 <code>supabase/schema.sql</code> 을 Supabase SQL Editor 에
          붙여넣고 실행해 주세요.
        </p>
      </Panel>
    );
  }

  const cards = [
    { label: "현재 회원", value: counts.members, unit: "명", href: null },
    { label: "회원업장", value: counts.businesses, unit: "곳", href: "/admin/businesses" },
    { label: "공개중", value: counts.publicBusinesses, unit: "곳", href: "/admin/businesses" },
    { label: "예정 행사", value: counts.upcomingEvents, unit: "건", href: "/admin/posts?type=event" },
    {
      label: "미확인 문의",
      value: counts.unhandledInquiries,
      unit: "건",
      href: "/admin/inquiries",
    },
    {
      label: "활동소식",
      value: counts.recentActivities,
      unit: "건",
      href: "/admin/posts?type=activity",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold tracking-[-0.02em]">관리자 홈</h1>
        <p className="mt-1.5 text-[13.5px] text-muted">
          {admin.name}님, 오늘도 수고 많으십니다.
        </p>
      </div>

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {cards.map((c, i) => {
          const body = (
            <>
              <p className="text-[13px] font-semibold text-muted">{c.label}</p>
              <p className="mt-2">
                <span className={`tnum text-[28px] font-bold ${accentAt(i).text}`}>{c.value}</span>
                <span className="ml-1 text-[13px] text-muted">{c.unit}</span>
              </p>
            </>
          );
          return (
            <li key={c.label}>
              {c.href ? (
                <Link
                  href={c.href}
                  className="block rounded-xl border border-line bg-white p-5 transition-colors hover:border-brand"
                >
                  {body}
                </Link>
              ) : (
                <div className="rounded-xl border border-line bg-white p-5">{body}</div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="grid gap-3 sm:grid-cols-2">
        <QuickLink
          href="/admin/posts/new?type=notice"
          title="공지사항 쓰기"
          body="회원에게 알릴 소식을 등록합니다."
        />
        <QuickLink
          href="/admin/posts/new?type=activity"
          title="활동소식 쓰기"
          body="본문과 활동사진, 사진별 설명을 함께 등록합니다."
        />
        <QuickLink
          href="/admin/posts/new?type=event"
          title="행사 등록"
          body="연간일정과 예정 행사 배너에 반영됩니다."
        />
        <QuickLink
          href="/admin/businesses/new"
          title="회원업장 등록"
          body="네이버 플레이스 주소를 넣으면 정보를 자동으로 채웁니다."
        />
      </div>
    </div>
  );
}

function QuickLink({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-line bg-white p-5 transition-colors hover:border-brand"
    >
      <p className="text-[15px] font-bold">
        {title} <span aria-hidden className="text-brand">→</span>
      </p>
      <p className="mt-1.5 text-[13px] text-muted">{body}</p>
    </Link>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-amber/30 bg-amber-tint p-6">
      <h1 className="text-[17px] font-bold text-amber">{title}</h1>
      <div className="mt-3 text-[13.5px] leading-[1.8] text-ink-soft">{children}</div>
    </div>
  );
}
