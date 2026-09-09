"use client";

import { useState } from "react";

/**
 * 계좌번호 복사 버튼.
 *
 * 회비 안내는 거의 휴대폰으로 본다. 숫자를 손으로 옮겨 적다 틀리면
 * 재무국이 입금자를 찾느라 고생하므로, 한 번에 복사되게 한다.
 */
export default function AccountCopy({
  bankName,
  accountNumber,
  accountHolder,
}: {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    // 은행과 예금주까지 함께 복사해야 붙여넣었을 때 바로 알아본다
    const text = `${bankName} ${accountNumber} ${accountHolder}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드가 막힌 브라우저에서는 직접 선택할 수 있게 둔다
    }
  }

  return (
    <div className="rounded-xl bg-forest p-5 text-white">
      <p className="text-[12px] font-bold tracking-[0.1em] text-brand-light">입금 계좌</p>

      <p className="mt-2 text-[13.5px] text-white/80">
        {bankName} · {accountHolder}
      </p>

      <p className="tnum mt-1 select-all text-[24px] font-bold tracking-[-0.01em] md:text-[28px]">
        {accountNumber}
      </p>

      <button
        type="button"
        onClick={copy}
        className="mt-4 w-full rounded-lg bg-white px-5 py-3 text-[14.5px] font-bold text-forest transition-colors hover:bg-brand-light sm:w-auto sm:px-8"
      >
        {copied ? "복사했습니다 ✓" : "계좌번호 복사하기"}
      </button>
    </div>
  );
}
