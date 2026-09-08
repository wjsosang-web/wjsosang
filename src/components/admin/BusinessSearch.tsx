"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Badge from "@/components/common/Badge";

export interface AdminBusinessRow {
  id: string;
  name: string;
  ownerName: string;
  district: string;
  category: string;
  status: string;
  priority: number | null;
  featured: boolean;
  phoneHidden: boolean;
  cover: string | null;
  /** 검색에 쓰는 글자 뭉치 — 화면에 안 보이는 키워드까지 들어있다 */
  searchText: string;
}

const STATUS_LABEL: Record<string, string> = {
  public: "공개",
  private: "비공개",
  draft: "임시저장",
};

/** 초성만 쳐도 찾아지도록 (예: "ㅍㅍ" → 픽폰) */
const CHO = [
  "ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ",
  "ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ",
];
function toChosung(text: string): string {
  let out = "";
  for (const ch of text) {
    const code = ch.charCodeAt(0) - 0xac00;
    out += code >= 0 && code <= 11171 ? CHO[Math.floor(code / 588)] : ch;
  }
  return out;
}

export default function BusinessSearch({ rows }: { rows: AdminBusinessRow[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");

  const categories = useMemo(
    () => [...new Set(rows.map((r) => r.category))].sort((a, b) => a.localeCompare(b, "ko")),
    [rows],
  );

  // 초성 검색은 글자를 매번 바꾸지 않도록 한 번만 만들어 둔다.
  const indexed = useMemo(
    () => rows.map((r) => ({ ...r, chosung: toChosung(r.searchText) })),
    [rows],
  );

  const q = query.trim().toLowerCase();
  const onlyChosung = q !== "" && /^[ㄱ-ㅎ]+$/.test(q);

  const found = indexed.filter((r) => {
    if (category && r.category !== category) return false;
    if (status && r.status !== status) return false;
    if (!q) return true;
    return onlyChosung ? r.chosung.includes(q) : r.searchText.includes(q);
  });

  const filtering = q !== "" || category !== "" || status !== "";
  const field =
    "rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-brand";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[240px] flex-1">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="업장명, 대표자명, 업종, 동네, 연락처로 찾기"
            aria-label="회원업장 검색"
            className={`${field} w-full pr-16`}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-[12px] font-semibold text-muted hover:text-brand"
            >
              지우기
            </button>
          )}
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="업종"
          className={field}
        >
          <option value="">업종 전체</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="공개 상태"
          className={field}
        >
          <option value="">상태 전체</option>
          <option value="public">공개</option>
          <option value="private">비공개</option>
          <option value="draft">임시저장</option>
        </select>
      </div>

      <p className="text-[13px] text-muted" role="status">
        {filtering ? (
          <>
            <b className="tnum text-ink">{found.length}</b>곳 찾음
            <span className="ml-1">(전체 {rows.length}곳)</span>
          </>
        ) : (
          <>
            총 <b className="tnum text-ink">{rows.length}</b>곳
          </>
        )}
      </p>

      {found.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-white py-16 text-center text-[14px] text-muted">
          {rows.length === 0 ? "아직 등록된 업장이 없습니다." : "찾는 업장이 없습니다."}
        </p>
      ) : (
        <ul className="overflow-hidden rounded-xl border border-line bg-white">
          {found.map((b, i) => (
            <li key={b.id} className={i > 0 ? "border-t border-line" : ""}>
              <Link
                href={`/admin/businesses/${b.id}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-mist"
              >
                <span className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-mist">
                  {b.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.cover} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span aria-hidden className="ph block h-full w-full" />
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[14.5px] font-bold">{b.name}</span>
                    {b.featured && <Badge label="추천" className="bg-amber-tint text-amber" />}
                  </span>
                  <span className="mt-0.5 block truncate text-[12.5px] text-muted">
                    {b.ownerName} · {b.district}
                  </span>
                </span>

                <Badge label={b.category} />

                {b.phoneHidden && (
                  <span className="shrink-0 rounded bg-mist px-2 py-1 text-[11px] font-semibold text-muted">
                    연락처 숨김
                  </span>
                )}

                {b.priority !== null && (
                  <span className="tnum shrink-0 rounded bg-mist px-2 py-1 text-[11.5px] font-bold text-muted">
                    {b.priority}순위
                  </span>
                )}

                <span
                  className={`shrink-0 rounded px-2 py-1 text-[11.5px] font-bold ${
                    b.status === "public" ? "bg-brand-tint text-brand-deep" : "bg-mist text-muted"
                  }`}
                >
                  {STATUS_LABEL[b.status] ?? b.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
