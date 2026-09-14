import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/common/Icons";
import LinkAccountForm from "@/components/member/LinkAccountForm";
import MemberDocButton from "@/components/member/MemberDocButton";
import MemberSignOut from "@/components/member/MemberSignOut";
import TelegramLink from "@/components/member/TelegramLink";
import { getCurrentMember } from "@/lib/supabase/member";
import { getAdminSupabase } from "@/lib/supabase/server";
import { ROLE_LABEL, can } from "@/lib/permissions";
import type { Role } from "@/lib/types";

export const metadata: Metadata = { title: "내 정보", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * 회원 내 정보.
 *
 * 로그인한 뒤 닿는 첫 화면이다. 회원이 여기서 얻어가야 할 것은 세 가지다.
 *   1. 내가 협회원으로 확인됐는가
 *   2. 회원만 받을 수 있는 자료
 *   3. 지원사업 알림을 휴대폰으로 받는 방법
 *
 * 회원마다 다른 내용이라 캐시하지 않는다.
 */

interface Detail {
  phone: string | null;
  joinedAt: string | null;
  telegramChatId: string | null;
  telegramUsername: string | null;
}

/** 이름으로 내 업장을 찾는다. 명단과 업장은 대표자명으로 이어져 있다. */
async function loadExtras(memberId: string, name: string) {
  const db = getAdminSupabase();

  const [{ data: me }, { data: shops }, { data: docSetting }] = await Promise.all([
    db
      .from("members")
      .select("phone, joined_at, telegram_chat_id, telegram_username")
      .eq("id", memberId)
      .maybeSingle(),
    db.from("businesses").select("slug, name").eq("owner_name", name).eq("status", "public"),
    db.from("site_settings").select("value").eq("key", "member_doc").maybeSingle(),
  ]);

  const doc = docSetting?.value as
    | { title?: string; description?: string; path?: string | null; fileName?: string | null }
    | undefined;

  return {
    detail: {
      phone: (me?.phone as string | null) ?? null,
      joinedAt: (me?.joined_at as string | null) ?? null,
      telegramChatId: (me?.telegram_chat_id as string | null) ?? null,
      telegramUsername: (me?.telegram_username as string | null) ?? null,
    } satisfies Detail,
    shops: (shops ?? []).map((s) => ({ slug: s.slug as string, name: s.name as string })),
    doc: doc?.path ? doc : null,
  };
}

export default async function MyPage() {
  const current = await getCurrentMember();

  // 로그인하지 않았으면 로그인 화면으로. 끝나면 다시 여기로 돌아온다.
  if (!current) redirect("/login?next=%2Fmy");

  const member = current.member;

  return (
    <div className="bg-mist px-5 py-10 md:py-14">
      <div className="mx-auto w-full max-w-[760px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[12.5px] font-bold tracking-[0.14em] text-brand">MEMBER</p>
            <h1 className="mt-1.5 text-[26px] font-bold tracking-[-0.02em]">
              {member ? `${member.name} 님` : "내 정보"}
            </h1>
          </div>
          <MemberSignOut />
        </div>

        <div className="mt-6 space-y-4">
          {/* 반려는 status 를 따로 두지 않고 pending 으로 되돌리면서 사유를 남긴다.
              그래서 사유가 있으면 반려, 없으면 아직 심사 중이다. */}
          {!member ? (
            <LinkAccountForm />
          ) : member.status === "pending" && member.rejectReason ? (
            <StatusCard tone="coral" title="가입이 반려되었습니다" body={member.rejectReason} />
          ) : member.status === "pending" ? (
            <StatusCard
              tone="amber"
              title="가입 승인을 기다리는 중입니다"
              body="인사국에서 확인 후 승인해 드립니다. 승인되면 회원 자료와 알림을 이용하실 수 있습니다."
            />
          ) : member.status !== "active" ? (
            <StatusCard
              tone="amber"
              title="지금은 이용하실 수 없는 상태입니다"
              body="회비 납부나 휴회 여부를 확인해야 합니다. 사무국(010-2777-0093)으로 연락 주세요."
            />
          ) : (
            <ActiveMember member={member} email={current.email} />
          )}
        </div>
      </div>
    </div>
  );
}

async function ActiveMember({
  member,
  email,
}: {
  member: { id: string; name: string; role: Role };
  email: string | null;
}) {
  const { detail, shops, doc } = await loadExtras(member.id, member.name);

  return (
    <>
      {/* 내 정보 */}
      <section className="rounded-2xl border border-line bg-white p-6 md:p-7">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="text-[18px] font-bold tracking-[-0.01em]">회원 정보</h2>
          <span className="rounded-md bg-brand px-2.5 py-1 text-[11.5px] font-bold text-white">
            {ROLE_LABEL[member.role]}
          </span>
        </div>

        <dl className="mt-4 divide-y divide-line text-[14px]">
          <Row label="이름" value={member.name} />
          <Row label="휴대폰" value={detail.phone ?? "등록된 번호가 없습니다"} />
          <Row label="로그인 계정" value={email ?? "—"} />
          <Row label="가입일" value={detail.joinedAt ?? "—"} />
        </dl>

        <p className="mt-4 text-[12.5px] leading-[1.7] text-muted">
          정보를 고치시려면 사무국(010-2777-0093)으로 연락 주세요.
        </p>
      </section>

      {/* 회원 전용 자료 */}
      <section className="rounded-2xl border border-line bg-white p-6 md:p-7">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-tint text-brand"
          >
            <Icon name="form" className="h-[19px] w-[19px]" />
          </span>
          <div className="min-w-0">
            <h2 className="text-[18px] font-bold tracking-[-0.01em]">
              {doc?.title || "회원 전용 자료"}
            </h2>
            <p className="mt-1.5 text-[13.5px] leading-[1.75] text-ink-soft">
              {doc
                ? doc.description || "협회원만 받으실 수 있는 자료입니다."
                : "아직 올라온 자료가 없습니다. 협회 정관이 등록되면 여기서 바로 받으실 수 있습니다."}
            </p>
          </div>
        </div>

        {doc && (
          <div className="mt-5">
            <MemberDocButton fileName={doc.fileName ?? null} />
          </div>
        )}
      </section>

      {/* 텔레그램 알림 */}
      <section className="rounded-2xl border border-line bg-white p-6 md:p-7">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-tint text-sky"
          >
            <Icon name="chat" className="h-[19px] w-[19px]" />
          </span>
          <div className="min-w-0">
            <h2 className="text-[18px] font-bold tracking-[-0.01em]">텔레그램 알림</h2>
            <p className="mt-1.5 text-[13.5px] leading-[1.75] text-ink-soft">
              협회 공지, 행사 안내, 지원금 공고를 휴대폰으로 바로 받아보실 수 있습니다.
              연결은 한 번만 하면 되고, 언제든 끊으실 수 있습니다.
            </p>
          </div>
        </div>

        <TelegramLink
          linked={Boolean(detail.telegramChatId)}
          username={detail.telegramUsername}
        />
      </section>

      {/* 내 업장 */}
      {shops.length > 0 && (
        <section className="rounded-2xl border border-line bg-white p-6 md:p-7">
          <h2 className="text-[18px] font-bold tracking-[-0.01em]">내 업장</h2>
          <ul className="mt-4 space-y-2">
            {shops.map((shop) => (
              <li key={shop.slug}>
                <Link
                  href={`/business/${shop.slug}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3.5 text-[14.5px] font-bold transition-colors hover:border-brand hover:text-brand"
                >
                  {shop.name}
                  <span aria-hidden className="text-muted">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[12.5px] leading-[1.7] text-muted">
            사진·소개글·영업시간을 고치시려면 사무국으로 연락 주세요.
          </p>
        </section>
      )}

      {/* 임원진·운영자만 */}
      {can(member.role, "admin.access") && (
        <section className="rounded-2xl bg-gradient-to-br from-forest to-brand-deep p-6 text-white md:p-7">
          <h2 className="text-[18px] font-bold tracking-[-0.01em]">
            {ROLE_LABEL[member.role]} 화면
          </h2>
          <p className="mt-1.5 text-[13.5px] leading-[1.75] text-white/75">
            공지사항·행사 글쓰기, 회원업장 관리, 지원사업 소식 발송을 하실 수 있습니다.
          </p>
          <Link
            href="/admin"
            className="mt-5 inline-block rounded-lg bg-white px-6 py-3 text-[14.5px] font-bold text-forest transition-colors hover:bg-white/90"
          >
            관리자 화면으로 →
          </Link>
        </section>
      )}
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 py-3">
      <dt className="w-[92px] shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 flex-1 font-semibold">{value}</dd>
    </div>
  );
}

function StatusCard({
  tone,
  title,
  body,
}: {
  tone: "amber" | "coral";
  title: string;
  body: string;
}) {
  const styles =
    tone === "amber"
      ? "border-amber/40 bg-amber-tint text-amber"
      : "border-coral/40 bg-coral-tint text-coral";

  return (
    <section className={`rounded-2xl border p-6 md:p-7 ${styles}`}>
      <h2 className="text-[17px] font-bold tracking-[-0.01em]">{title}</h2>
      <p className="mt-2 text-[13.5px] leading-[1.8] text-ink-soft">{body}</p>
    </section>
  );
}
