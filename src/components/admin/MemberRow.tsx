"use client";

import { useState } from "react";
import { approveMember, changeMemberRole, rejectMember } from "@/lib/admin/actions";
import { ROLE_LABEL } from "@/lib/permissions";
import type { MemberListRow } from "@/app/admin/members/page";
import type { Role } from "@/lib/types";

const ROLES: Role[] = ["admin", "officer", "member"];

/** 회원 한 줄 — 승인·되돌리기·권한 바꾸기 */
export default function MemberRow({
  member,
  canChangeRole,
  pending = false,
}: {
  member: MemberListRow;
  canChangeRole: boolean;
  pending?: boolean;
}) {
  const [asking, setAsking] = useState(false);

  return (
    <li className="rounded-xl border border-line bg-white px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="text-[14.5px] font-bold">{member.name}</span>

            {member.title && (
              <span className="rounded bg-brand-tint px-1.5 py-0.5 text-[11px] font-bold text-brand-deep">
                {member.title}
              </span>
            )}

            {member.role !== "member" && (
              <span className="rounded bg-forest px-1.5 py-0.5 text-[11px] font-bold text-white">
                {ROLE_LABEL[member.role]}
              </span>
            )}

            {member.telegram && (
              <span className="rounded bg-sky-tint px-1.5 py-0.5 text-[11px] font-bold text-sky">
                텔레그램
              </span>
            )}
          </span>

          <span className="mt-0.5 block truncate text-[12.5px] text-muted">
            {[member.email, member.phone].filter(Boolean).join(" · ") || "연락처 없음"}
          </span>

          {member.rejectReason && (
            <span className="mt-1 block text-[12px] text-coral">
              보류 사유: {member.rejectReason}
            </span>
          )}
        </span>

        {/* 권한 바꾸기 — 운영자만 */}
        {canChangeRole && !pending && (
          <form action={changeMemberRole} className="shrink-0">
            <input type="hidden" name="id" value={member.id} />
            <select
              name="role"
              defaultValue={member.role}
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
              className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-[12.5px] font-semibold outline-none focus:border-brand"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </form>
        )}

        {pending ? (
          <span className="flex shrink-0 gap-1.5">
            <form action={approveMember}>
              <input type="hidden" name="id" value={member.id} />
              <button
                type="submit"
                className="rounded-lg bg-brand px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-brand-deep"
              >
                승인
              </button>
            </form>

            <button
              type="button"
              onClick={() => setAsking((v) => !v)}
              className="rounded-lg border border-line px-3.5 py-2 text-[13px] font-semibold text-muted transition-colors hover:border-coral hover:text-coral"
            >
              보류
            </button>
          </span>
        ) : (
          <form action={rejectMember} className="shrink-0">
            <input type="hidden" name="id" value={member.id} />
            <input type="hidden" name="reason" value="이용을 잠시 멈췄습니다." />
            <button
              type="submit"
              className="rounded-lg border border-line px-3.5 py-2 text-[12.5px] font-semibold text-muted transition-colors hover:border-coral hover:text-coral"
            >
              승인 취소
            </button>
          </form>
        )}
      </div>

      {/* 보류 사유 — 본인 화면에 그대로 보인다 */}
      {asking && (
        <form action={rejectMember} className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
          <input type="hidden" name="id" value={member.id} />
          <input
            name="reason"
            required
            placeholder="보류 사유 (본인에게 보입니다)"
            className="min-w-[200px] flex-1 rounded-lg border border-line px-3.5 py-2 text-[13px] outline-none focus:border-brand"
          />
          <button
            type="submit"
            className="rounded-lg border border-coral px-4 py-2 text-[13px] font-bold text-coral transition-colors hover:bg-coral hover:text-white"
          >
            보류하기
          </button>
        </form>
      )}
    </li>
  );
}
