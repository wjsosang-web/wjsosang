"use client";

import { useMemo, useState } from "react";
import MemberRow from "@/components/admin/MemberRow";
import type { MemberListRow } from "@/app/admin/members/page";

/**
 * 회원 목록 — 찾기와 거르기.
 *
 * 명단이 하나뿐이다. 예전에는 "홈페이지 이용 중" 목록을 따로 두었는데,
 * 같은 사람이 두 곳에 나와 오히려 헷갈렸다.
 * 대신 위쪽 탭으로 회장단·임원진·협회원을 나눠 본다.
 */

/** 조직 분류를 눌러 보는 탭. 값이 null 이면 조건 없음. */
const TABS: { key: string; label: string; match: (r: MemberListRow) => boolean }[] = [
  { key: "all", label: "전체", match: () => true },
  {
    key: "회장단",
    label: "회장단",
    match: (r) => r.orgGroup === "회장단",
  },
  {
    key: "이사회·감사",
    label: "이사회",
    match: (r) => r.orgGroup === "이사회·감사",
  },
  {
    key: "임원진",
    label: "임원진",
    match: (r) => r.orgGroup === "임원진",
  },
  {
    key: "member",
    label: "협회원",
    match: (r) => !r.orgGroup || r.orgGroup === "역대 회장",
  },
  {
    key: "account",
    label: "홈페이지 이용 중",
    match: (r) => r.hasAccount && r.status === "active",
  },
];

export default function MemberFilter({
  rows,
  canChangeRole,
}: {
  rows: MemberListRow[];
  canChangeRole: boolean;
}) {
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [only, setOnly] = useState("");

  const counts = useMemo(
    () => Object.fromEntries(TABS.map((t) => [t.key, rows.filter(t.match).length])),
    [rows],
  );

  const found = useMemo(() => {
    const q = query.trim().toLowerCase();
    const activeTab = TABS.find((t) => t.key === tab) ?? TABS[0];

    return rows.filter((r) => {
      if (!activeTab.match(r)) return false;
      if (status && r.status !== status) return false;
      if (only === "telegram" && !r.telegram) return false;
      if (only === "no-telegram" && r.telegram) return false;
      if (only === "no-account" && r.hasAccount) return false;

      if (!q) return true;
      return [r.name, r.phone, r.email, r.title]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [rows, tab, query, status, only]);

  const field =
    "rounded-lg border border-line bg-white px-3 py-2 text-[13.5px] outline-none transition-colors focus:border-brand";

  return (
    <section className="rounded-xl border border-line bg-white p-5">
      <h2 className="text-[15px] font-bold">전체 회원</h2>

      {/* 분류 탭 */}
      <div
        role="tablist"
        aria-label="회원 분류"
        className="no-scrollbar mt-3 flex gap-1 overflow-x-auto rounded-lg bg-mist p-1"
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`flex shrink-0 items-center gap-1.5 rounded-md px-3.5 py-2 text-[13px] font-bold transition-colors ${
              tab === t.key ? "bg-brand text-white" : "text-ink-soft hover:bg-white"
            }`}
          >
            {t.label}
            <span
              className={`tnum text-[11.5px] font-bold ${
                tab === t.key ? "text-white/75" : "text-muted"
              }`}
            >
              {counts[t.key]}
            </span>
          </button>
        ))}
      </div>

      {/* 찾기 */}
      <div className="mt-2.5 flex flex-wrap gap-2">
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

        <select value={only} onChange={(e) => setOnly(e.target.value)} className={field}>
          <option value="">조건 없음</option>
          <option value="telegram">텔레그램 연결된 사람만</option>
          <option value="no-telegram">텔레그램 없는 사람만</option>
          <option value="no-account">홈페이지 계정 없는 사람만</option>
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
        <ul className="mt-3 max-h-[560px] space-y-2 overflow-y-auto pr-1">
          {found.map((m) => (
            <MemberRow key={m.id} member={m} canChangeRole={canChangeRole} />
          ))}
        </ul>
      )}
    </section>
  );
}
