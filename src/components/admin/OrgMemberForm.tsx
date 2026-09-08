"use client";

import Link from "next/link";
import { useActionState } from "react";
import ImageInput from "@/components/admin/ImageInput";
import { saveOrgMember, type ActionResult } from "@/lib/admin/actions";
import type { OrgGroup, OrgMember } from "@/lib/types";

const GROUPS: OrgGroup[] = ["회장단", "이사회·감사", "임원진", "역대 회장"];
const DEPARTMENTS = ["사무국", "재무국", "관리국", "인사국", "홍보국", "기획국"];

export default function OrgMemberForm({
  person,
  businesses,
}: {
  person?: OrgMember;
  /** 업장 연결 선택지 */
  businesses: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    saveOrgMember,
    null,
  );

  const field =
    "w-full rounded-lg border border-line bg-white px-4 py-2.5 text-[14px] outline-none transition-colors focus:border-brand";
  const label = "mb-1.5 block text-[13px] font-bold";

  return (
    <form action={action} className="space-y-6">
      {person && <input type="hidden" name="id" value={person.id} />}
      {person?.photo && <input type="hidden" name="photo" value={person.photo} />}

      <div className="flex items-center justify-between gap-4">
        <h1 className="text-[22px] font-bold tracking-[-0.02em]">
          임원 {person ? "수정" : "추가"}
        </h1>
        <Link href="/admin/org" className="text-[13.5px] font-semibold text-muted hover:text-brand">
          목록으로
        </Link>
      </div>

      <section className="space-y-4 rounded-xl border border-line bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className={label}>
              이름 <span className="text-brand">*</span>
            </label>
            <input id="name" name="name" required defaultValue={person?.name} className={field} />
          </div>

          <div>
            <label htmlFor="title" className={label}>
              직책 <span className="text-brand">*</span>
            </label>
            <input
              id="title"
              name="title"
              required
              defaultValue={person?.title}
              placeholder="회장 / 부회장 / 이사 / 감사 / 사무국장 …"
              className={field}
            />
          </div>

          <div>
            <label htmlFor="subTitle" className={label}>
              겸직 <span className="ml-1 font-normal text-muted">(선택)</span>
            </label>
            <input
              id="subTitle"
              name="subTitle"
              defaultValue={person?.subTitle ?? ""}
              placeholder="감사"
              className={field}
            />
            <p className="mt-1 text-[11.5px] text-muted">
              이름 옆에 작은 배지로 붙습니다. 예: 이사 + 감사
            </p>
          </div>

          <div>
            <label htmlFor="group" className={label}>
              분류
            </label>
            <select
              id="group"
              name="group"
              defaultValue={person?.group ?? "임원진"}
              className={field}
            >
              {GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="department" className={label}>
              소속국 <span className="ml-1 font-normal text-muted">(임원진만)</span>
            </label>
            <select
              id="department"
              name="department"
              defaultValue={person?.department ?? ""}
              className={field}
            >
              <option value="">없음</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11.5px] text-muted">
              고르면 조직도의 해당 국에 이름이 표시됩니다.
            </p>
          </div>

          <div>
            <label htmlFor="businessId" className={label}>
              연결할 업장
            </label>
            <select
              id="businessId"
              name="businessId"
              defaultValue={person?.businessId ?? ""}
              className={field}
            >
              <option value="">연결 안 함</option>
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11.5px] text-muted">
              연결하면 임원 카드에 업장명·업종이 나오고 업장 페이지로 이동합니다.
            </p>
          </div>

          <div>
            <label htmlFor="sortOrder" className={label}>
              표시 순서
            </label>
            <input
              id="sortOrder"
              name="sortOrder"
              type="number"
              min={1}
              defaultValue={person?.order ?? 1}
              className={field}
            />
            <p className="mt-1 text-[11.5px] text-muted">숫자가 작을수록 앞에 나옵니다.</p>
          </div>
        </div>

        <div>
          <label htmlFor="expertise" className={label}>
            전문분야 <span className="ml-1 font-normal text-muted">(선택)</span>
          </label>
          <input
            id="expertise"
            name="expertise"
            defaultValue={person?.expertise ?? ""}
            placeholder="재임 기간, 주요 경력 등"
            className={field}
          />
        </div>

        <div>
          <label htmlFor="intro" className={label}>
            한 줄 소개
          </label>
          <textarea
            id="intro"
            name="intro"
            rows={2}
            defaultValue={person?.intro}
            placeholder="좋은 사람들이 모여 좋은 지역을 만든다고 믿습니다."
            className={`${field} resize-y`}
          />
        </div>
      </section>

      <section className="rounded-xl border border-line bg-white p-5">
        <h2 className="text-[15px] font-bold">사진</h2>
        <p className="mt-1 text-[12.5px] text-muted">
          권장 크기 <b>800 × 600px</b> (가로형 4:3), 2MB 이하. 없으면 자리표시 무늬가 나옵니다.
        </p>

        <div className="mt-3">
          <ImageInput name="photoFile" currentUrl={person?.photo} folder="org" />
        </div>
      </section>

      {state && (
        <p
          role="status"
          className={`rounded-lg px-4 py-3 text-[13.5px] ${
            state.ok ? "bg-brand-tint text-brand-deep" : "bg-coral-tint text-coral"
          }`}
        >
          {state.message}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand px-8 py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-brand-deep disabled:bg-line-strong"
        >
          {pending ? "저장 중…" : "저장"}
        </button>
        <Link
          href="/admin/org"
          className="rounded-lg border border-line px-6 py-3.5 text-[15px] font-bold text-muted transition-colors hover:border-ink hover:text-ink"
        >
          취소
        </Link>
      </div>
    </form>
  );
}
