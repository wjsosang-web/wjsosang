"use client";

import { useState } from "react";
import type { Faq } from "@/lib/types";

/** 자주 묻는 질문 — 하나씩 펼쳐 보는 아코디언 */
export default function FaqList({ faqs }: { faqs: Faq[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <ul className="space-y-2.5">
      {faqs.map((faq) => {
        const open = openId === faq.id;
        return (
          <li key={faq.id} className="overflow-hidden rounded-xl border border-line bg-white">
            <h3>
              <button
                type="button"
                onClick={() => setOpenId(open ? null : faq.id)}
                aria-expanded={open}
                className="flex w-full items-center gap-3 px-5 py-4 text-left"
              >
                <span aria-hidden className="text-[15px] font-bold text-brand">
                  Q
                </span>
                <span className="min-w-0 flex-1 text-[14.5px] font-semibold">
                  {faq.question}
                </span>
                <span
                  aria-hidden
                  className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M3 5l4 4 4-4"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </button>
            </h3>

            {open && (
              <p className="border-t border-line bg-mist px-5 py-4 text-[13.5px] leading-[1.8] text-ink-soft">
                {faq.answer}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
