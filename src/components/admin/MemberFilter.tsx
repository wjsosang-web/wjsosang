"use client";

import { useMemo, useState } from "react";
import MemberRow from "@/components/admin/MemberRow";
import type { MemberListRow } from "@/app/admin/members/page";

/**
 * 회원 목록 거르기.
 *
 * 133명이 넘어가면 눈으로 찾기 어렵다. 이름·연락처로 찾고,
 * 상태·권한·직책으로 좁힌다. 목록은 이미 서버에서 받아왔으므로
 * 타자를 칠 때마다 바로 걸러진다.
 */
export default function MemberFilter({
  rows,
  canChangeRole,
}: {
  rows: MemberListRow[];
  canChangeRole: boolean;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [role, setRole] = useState("");
  const [only, setOnly] = useState("");

  const found = useMemo(() => {
    const q = query.trim().toLowerCase();

    return rows.filter((r) => {
      if (status && r.status !== status) return false;
      if (role && r.role !== role) return false;
      if (only === "officer" && !r.title) return false;
      if (only === "telegram" && !r.telegram) return false;
      if (only === "no-telegram" && r.telegram) return false;
      if (only === "account" && !r.hasAccount) return false;

      if (!q) return true;
      return [r.name, r.phone, r.email, r.title]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [rows, query, status, role, only]);

  const field =
    "rounded-lg border border-line bg-white px-3 py-2 text-[13.5px] outline-none transition-colors focus:border-brand";

  return (
    <section className="rounded-xl border border-line bg-white p-5">
      <h2 className="text-[15px] font-bold">전체 회원 찾기</h2>

      <div className="mt-3 flex flex-wrap gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이름, 연락처, 직책으로 찾기"
          className={`${field} min-w-[200px] flex-1`}
        />

        <select value={status} onChange={(e) => setStatus(e.target.value)} className={field}>
          <option value="">상태 전체</option>
          <option value="active">정상</option>
          <option value="pending">대기</option>
          <option value="paused">중지</option>
          <option value="withdrawn">탈퇴</option>
        </select>

        <select value={role} onChange={(e) => setRole(e.target.value)} className={field}>
          <option value="">권한 전체</option>
          <option value="admin">운영자</option>
          <option value="officer">임원진</option>
          <option value="member">협회원</option>
        </select>

        <select value={only} onChange={(e) => setOnly(e.target.value)} className={field}>
          <option value="">조건 없음</option>
          <option value="officer">직책 있는 사람만</option>
          <option value="account">홈페이지 계정 있는 사람만</option>
          <option value="telegram">텔레그램 연결된 사람만</option>
          <option value="no-telegram">텔레그램 없는 사람만</option>
        </select>
      </div>

      <p className="mt-2.5 text-[13px] text-muted" role="status">
        <b className="tnum text-ink">{found.length}</b>명
        {found.length !== rows.length && <span className="ml-1">(전체 {rows.length}명)</span>}
      </p>

      {found.length === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed border-line py-10 text-center text-[13.5px] text-muted">
          찾는 회원이 없습니다.
        </p>
      ) : (
        <ul className="mt-3 max-h-[520px] space-y-2 overflow-y-auto pr-1">
          {found.map((m) => (
            <MemberRow key={m.id} member={m} canChangeRole={canChangeRole} />
          ))}
        </ul>
      )}
    </section>
  );
}
