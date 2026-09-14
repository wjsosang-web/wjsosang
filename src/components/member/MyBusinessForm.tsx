"use client";

import { useActionState, useState } from "react";
import ImageInput from "@/components/admin/ImageInput";
import {
  saveMyBusiness,
  saveMyBusinessCover,
  type MemberActionResult,
} from "@/lib/member/actions";

/**
 * 회원이 자기 업장을 고치는 칸.
 *
 * 무엇을 열어줄지가 중요하다.
 *   열어주는 것 — 소개글·연락처·영업시간·SNS·회원혜택·대표사진
 *                 가게 사정이 바뀌면 바로 고쳐야 하는 것들이다.
 *   막는 것    — 상호·주소·업종·공개여부
 *                 협회 명부와 맞춰야 하는 값이라 사무국이 관리한다.
 *                 상호가 제멋대로 바뀌면 명단과 대조가 안 된다.
 *
 * 접었다 펴게 둔다. 대부분은 보기만 하고 지나가므로 늘 펼쳐 두면
 * 내 정보 화면이 길어져서 아래 내용이 묻힌다.
 */

export interface MyBusiness {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  phone: string | null;
  phonePublic: boolean;
  hours: string | null;
  homepageUrl: string | null;
  instagramUrl: string | null;
  blogUrl: string | null;
  benefit: string | null;
  coverImage: string | null;
}

export default function MyBusinessForm({ shop }: { shop: MyBusiness }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<MemberActionResult | null, FormData>(
    saveMyBusiness,
    null,
  );
  const [coverState, coverAction, coverPending] = useActionState<
    MemberActionResult | null,
    FormData
  >(saveMyBusinessCover, null);

  return (
    <div className="rounded-xl border border-line">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
        <div className="min-w-0">
          <p className="text-[15px] font-bold">{shop.name}</p>
          <p className="mt-0.5 text-[12.5px] text-muted">
            소개글·연락처·영업시간을 직접 고치실 수 있습니다.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <a
            href={`/business/${shop.slug}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-line px-3.5 py-2 text-[12.5px] font-semibold text-muted hover:border-ink hover:text-ink"
          >
            보기 ↗
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg bg-brand px-4 py-2 text-[12.5px] font-bold text-white"
          >
            {open ? "닫기" : "수정하기"}
          </button>
        </div>
      </div>

      {open && (
        <div className="space-y-5 border-t border-line px-4 py-5">
          {/* 대표사진 — 따로 저장한다. 사진은 올리는 데 시간이 걸려서
              글자 수정까지 같이 기다리게 하면 답답하다. */}
          <form action={coverAction} className="space-y-3">
            <input type="hidden" name="id" value={shop.id} />
            <ImageInput
              name="coverImage"
              label="대표사진"
              hint="목록과 상세 화면에 나오는 사진입니다. 가로가 긴 사진이 잘 어울립니다."
              currentUrl={shop.coverImage}
              folder="businesses"
            />
            <button
              type="submit"
              disabled={coverPending}
              className="rounded-lg border border-line-strong px-5 py-2.5 text-[13.5px] font-bold transition-colors hover:border-brand hover:text-brand disabled:opacity-50"
            >
              {coverPending ? "저장하는 중…" : "사진 저장"}
            </button>
            <Notice state={coverState} />
          </form>

          <form action={action} className="space-y-3.5 border-t border-line pt-5">
            <input type="hidden" name="id" value={shop.id} />

            <Text
              name="tagline"
              label="한 줄 소개"
              defaultValue={shop.tagline}
              placeholder="원주 반곡동 휴대폰·자동차 전문점"
              hint="목록 카드에 나오는 짧은 소개입니다."
            />

            <Area
              name="description"
              label="업장 소개"
              defaultValue={shop.description}
              placeholder="어떤 가게인지, 무엇을 잘하는지 편하게 적어 주세요."
              rows={5}
            />

            <div className="grid gap-3.5 sm:grid-cols-2">
              <Text
                name="phone"
                label="연락처"
                defaultValue={shop.phone ?? ""}
                placeholder="033-000-0000"
              />
              <Text
                name="hours"
                label="영업시간"
                defaultValue={shop.hours ?? ""}
                placeholder="평일 09:00-18:00 / 일요일 휴무"
              />
            </div>

            <label className="flex items-center gap-2.5 text-[13.5px]">
              <input
                type="checkbox"
                name="phonePublic"
                defaultChecked={shop.phonePublic}
                className="h-4 w-4 accent-[var(--color-brand)]"
              />
              홈페이지에 연락처를 공개합니다
            </label>

            <Area
              name="benefit"
              label="협회원 혜택"
              defaultValue={shop.benefit ?? ""}
              placeholder="예) 원청협 회원증 보여주시면 10% 할인"
              rows={2}
              hint="적어 두시면 다른 회원들이 찾아올 이유가 생깁니다."
            />

            <div className="grid gap-3.5 sm:grid-cols-3">
              <Text
                name="homepageUrl"
                label="홈페이지"
                defaultValue={shop.homepageUrl ?? ""}
                placeholder="https://"
              />
              <Text
                name="instagramUrl"
                label="인스타그램"
                defaultValue={shop.instagramUrl ?? ""}
                placeholder="https://instagram.com/"
              />
              <Text
                name="blogUrl"
                label="블로그"
                defaultValue={shop.blogUrl ?? ""}
                placeholder="https://blog.naver.com/"
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-brand py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-brand-deep disabled:opacity-50"
            >
              {pending ? "저장하는 중…" : "저장"}
            </button>

            <Notice state={state} />

            <p className="text-[12px] leading-[1.75] text-muted">
              상호·주소·업종은 협회 명부와 맞춰야 해서 여기서는 고칠 수 없습니다.
              바뀌셨으면 사무국(010-2777-0093)으로 알려 주세요.
            </p>
          </form>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

const field =
  "mt-1.5 w-full rounded-lg border border-line px-3.5 py-2.5 text-[14.5px] outline-none focus:border-brand";

function Text({
  name,
  label,
  defaultValue,
  placeholder,
  hint,
}: {
  name: string;
  label: string;
  defaultValue: string;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-[13px] font-bold">{label}</span>
      <input name={name} defaultValue={defaultValue} placeholder={placeholder} className={field} />
      {hint && <span className="mt-1 block text-[12px] text-muted">{hint}</span>}
    </label>
  );
}

function Area({
  name,
  label,
  defaultValue,
  placeholder,
  rows = 4,
  hint,
}: {
  name: string;
  label: string;
  defaultValue: string;
  placeholder?: string;
  rows?: number;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-[13px] font-bold">{label}</span>
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={`${field} leading-[1.75]`}
      />
      {hint && <span className="mt-1 block text-[12px] text-muted">{hint}</span>}
    </label>
  );
}

function Notice({ state }: { state: MemberActionResult | null }) {
  if (!state) return null;
  return (
    <p
      className={`rounded-lg px-3.5 py-2.5 text-[13px] ${
        state.ok ? "bg-brand-tint text-brand-deep" : "bg-coral-tint text-coral"
      }`}
    >
      {state.message}
    </p>
  );
}
