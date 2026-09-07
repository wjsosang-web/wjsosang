"use client";

import { useState } from "react";

const KINDS = [
  "협회 관련 문의",
  "회원가입 문의",
  "협업·제휴 문의",
  "행사 문의",
  "기타",
];

const MAX_MESSAGE = 1000;

/**
 * 문의하기 폼 (시안 기준).
 *
 * 지금은 접수 API가 없어서 실제 전송은 하지 않는다.
 * 2단계에서 inquiries 테이블에 저장하는 API를 붙이면 handleSubmit 만 바꾸면 된다.
 * 개인정보 동의를 받지 않으면 전송 버튼이 동작하지 않는다.
 */
export default function InquiryForm({ email }: { email: string }) {
  const [message, setMessage] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [kind, setKind] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO(2단계): POST /api/inquiries 로 접수하고 관리자 문의함에 쌓는다.
    setNotice(
      `문의 접수 기능은 준비 중입니다. 지금은 ${email} 로 보내주시면 사무국에서 확인합니다.`,
    );
  };

  const field =
    "w-full rounded-lg border border-line bg-white px-4 py-3 text-[14px] outline-none transition-colors placeholder:text-muted focus:border-brand";

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="iq-name" className="mb-2 block text-[13px] font-bold">
            이름 <span className="text-brand">*</span>
          </label>
          <input id="iq-name" name="name" required placeholder="이름을 입력해주세요" className={field} />
        </div>
        <div>
          <label htmlFor="iq-phone" className="mb-2 block text-[13px] font-bold">
            연락처 <span className="text-brand">*</span>
          </label>
          <input
            id="iq-phone"
            name="phone"
            required
            inputMode="tel"
            placeholder="010-1234-5678"
            className={field}
          />
        </div>
        <div>
          <label htmlFor="iq-company" className="mb-2 block text-[13px] font-bold">
            업체명
          </label>
          <input id="iq-company" name="company" placeholder="업체명을 입력해주세요" className={field} />
        </div>
        <div>
          <label htmlFor="iq-kind" className="mb-2 block text-[13px] font-bold">
            문의종류 <span className="text-brand">*</span>
          </label>
          <select
            id="iq-kind"
            name="kind"
            required
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className={`${field} ${kind === "" ? "text-muted" : ""}`}
          >
            <option value="">문의 종류를 선택해주세요</option>
            {KINDS.map((k) => (
              <option key={k} value={k} className="text-ink">
                {k}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="iq-message" className="mb-2 block text-[13px] font-bold">
          문의내용 <span className="text-brand">*</span>
        </label>
        <textarea
          id="iq-message"
          name="message"
          required
          rows={5}
          maxLength={MAX_MESSAGE}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={`궁금한 내용을 자세히 입력해주세요.\n(최대 ${MAX_MESSAGE.toLocaleString("ko-KR")}자)`}
          className={`${field} resize-y`}
        />
        <p className="tnum mt-1.5 text-right text-[12px] text-muted">
          {message.length} / {MAX_MESSAGE.toLocaleString("ko-KR")}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2.5 text-[13px]">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="h-4 w-4 accent-[color:var(--color-brand)]"
          />
          개인정보 수집 및 이용에 동의합니다. <span className="text-brand">*</span>
        </label>
        <a
          href="#privacy"
          className="ml-auto rounded-md border border-line px-3 py-1.5 text-[12px] font-semibold text-muted transition-colors hover:border-brand hover:text-brand"
        >
          자세히 보기
        </a>
      </div>

      <button
        type="submit"
        disabled={!agreed}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-4 text-[15px] font-bold text-white transition-colors hover:bg-brand-deep disabled:cursor-not-allowed disabled:bg-line-strong"
      >
        <SendIcon />
        문의하기
      </button>

      {notice && (
        <p role="status" className="rounded-lg bg-brand-tint px-4 py-3 text-[13px] text-brand-deep">
          {notice}
        </p>
      )}

      <p id="privacy" className="text-[11.5px] leading-[1.7] text-muted">
        수집 항목: 이름, 연락처, 업체명, 문의내용 / 수집 목적: 문의 접수 및 회신 /
        보유 기간: 문의 처리 완료 후 1년. 동의를 거부하실 수 있으나, 이 경우 문의 접수가
        제한됩니다.
      </p>
    </form>
  );
}

function SendIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M16 2 8.5 9.5M16 2l-5 14-2.5-6.5L2 7l14-5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
