import { redirect } from "next/navigation";
import ApproverTitlesForm from "@/components/admin/ApproverTitlesForm";
import MemberFilter from "@/components/admin/MemberFilter";
import MemberRow from "@/components/admin/MemberRow";
import RosterPanel from "@/components/admin/RosterPanel";
import NotifyRoutesForm from "@/components/admin/NotifyRoutesForm";
import TelegramPanel from "@/components/admin/TelegramPanel";
import { getCurrentAdmin, getApproverTitles } from "@/lib/supabase/auth";
import { getAdminSupabase } from "@/lib/supabase/server";
import { can } from "@/lib/permissions";
import { hasTelegram } from "@/lib/telegram";
import { INQUIRY_KINDS, getNotifyRoutes } from "@/lib/notify";
import type { Role } from "@/lib/types";

export const dynamic = "force-dynamic";

export interface MemberListRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: Role;
  status: string;
  hasAccount: boolean;
  appliedAt: string | null;
  rejectReason: string | null;
  /** 조직도에서 맡은 직책 */
  title: string | null;
  telegram: boolean;
}

export default async function AdminMembersPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  if (!can(admin.role, "members.approve")) {
    return (
      <div className="rounded-xl border border-line bg-white p-8 text-center">
        <p className="text-[15px] font-bold">회원 승인 권한이 없습니다.</p>
        <p className="mt-2 text-[13.5px] text-muted">
          회장·부회장·사무국장·인사국 임원과 운영자가 이 화면을 볼 수 있습니다.
        </p>
      </div>
    );
  }

  const db = getAdminSupabase();

  const [{ data: members }, { data: org }, approverTitles, notifyRoutes] = await Promise.all([
    db
      .from("members")
      .select(
        "id, name, email, phone, role, status, account_id, applied_at, reject_reason, telegram_chat_id",
      )
      .order("status")
      .order("name"),
    db.from("org_members").select("member_id, title"),
    getApproverTitles(),
    getNotifyRoutes(),
  ]);

  const titleByMember = new Map(
    (org ?? []).map((o) => [o.member_id as string, o.title as string]),
  );

  const rows: MemberListRow[] = (members ?? []).map((m) => ({
    id: m.id as string,
    name: m.name as string,
    email: (m.email as string | null) ?? null,
    phone: (m.phone as string | null) ?? null,
    role: m.role as Role,
    status: m.status as string,
    hasAccount: Boolean(m.account_id),
    appliedAt: (m.applied_at as string | null) ?? null,
    rejectReason: (m.reject_reason as string | null) ?? null,
    title: titleByMember.get(m.id as string) ?? null,
    telegram: Boolean(m.telegram_chat_id),
  }));

  // 계정을 만든 사람 = 홈페이지에서 로그인한 사람. 승인 대상이다.
  const waiting = rows.filter((r) => r.hasAccount && r.status !== "active");
  const active = rows.filter((r) => r.status === "active");

  const canChangeRole = can(admin.role, "members.role");
  const linkedCount = rows.filter((r) => r.telegram).length;

  // 지금 조직도에 있는 직책들 — 담당자를 적을 때 오타를 막으려고 보여준다
  const availableTitles = [
    ...new Set((org ?? []).map((o) => o.title as string).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b, "ko"));

  // 문의 종류마다 실제로 알림이 닿는 사람이 있는지
  const telegramByTitle = new Map<string, boolean>();
  for (const o of org ?? []) {
    const member = rows.find((r) => r.id === (o.member_id as string));
    if (member?.telegram) telegramByTitle.set(o.title as string, true);
  }
  const reachable = Object.fromEntries(
    INQUIRY_KINDS.map((kind) => [
      kind,
      (notifyRoutes[kind] ?? []).some((t) => telegramByTitle.get(t) === true),
    ]),
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[22px] font-bold tracking-[-0.02em]">회원 관리</h1>
        <p className="mt-1 text-[13px] leading-[1.7] text-muted">
          홈페이지에서 로그인을 만든 분을 승인해 주세요. 승인해야 회원 전용 자료를 볼 수
          있습니다. 총 <b className="tnum text-ink">{rows.length}</b>명
        </p>
      </div>

      {/* 승인 대기 */}
      <section>
        <h2 className="flex items-center gap-2 text-[15px] font-bold">
          승인 대기
          <span className="tnum rounded bg-amber px-2 py-0.5 text-[12px] font-bold text-white">
            {waiting.length}
          </span>
        </h2>

        {waiting.length === 0 ? (
          <p className="mt-2.5 rounded-xl border border-dashed border-line bg-white py-10 text-center text-[13.5px] text-muted">
            승인을 기다리는 분이 없습니다.
          </p>
        ) : (
          <ul className="mt-2.5 space-y-2">
            {waiting.map((m) => (
              <MemberRow key={m.id} member={m} canChangeRole={canChangeRole} pending />
            ))}
          </ul>
        )}
      </section>

      {/* 승인된 회원 */}
      <section>
        <h2 className="flex items-center gap-2 text-[15px] font-bold">
          홈페이지 이용 중
          <span className="tnum rounded bg-mist px-2 py-0.5 text-[12px] font-bold text-muted">
            {active.length}
          </span>
        </h2>

        {active.length === 0 ? (
          <p className="mt-2.5 rounded-xl border border-dashed border-line bg-white py-10 text-center text-[13.5px] text-muted">
            아직 없습니다.
          </p>
        ) : (
          <ul className="mt-2.5 space-y-2">
            {active.map((m) => (
              <MemberRow key={m.id} member={m} canChangeRole={canChangeRole} />
            ))}
          </ul>
        )}
      </section>

      {/* 전체 회원 — 찾기와 거르기 */}
      <MemberFilter rows={rows} canChangeRole={canChangeRole} />

      {/* 엑셀로 명단 올리기·내려받기 */}
      <RosterPanel />

      {/* 텔레그램 — 회원·임원 모두에게 알림 */}
      <TelegramPanel
        ready={hasTelegram()}
        linkedCount={linkedCount}
        totalCount={rows.length}
        botName={process.env.TELEGRAM_BOT_NAME ?? null}
      />

      {/* 문의가 오면 누가 받을지 */}
      {canChangeRole && (
        <NotifyRoutesForm
          routes={notifyRoutes}
          kinds={INQUIRY_KINDS}
          availableTitles={availableTitles}
          reachable={reachable}
        />
      )}

      {/* 어떤 직책에 권한을 줄지 */}
      {canChangeRole && <ApproverTitlesForm titles={approverTitles} />}
    </div>
  );
}
