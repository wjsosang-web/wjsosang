"use client";

import { useActionState } from "react";
import ImageInput from "@/components/admin/ImageInput";
import {
  deleteHeroSlide,
  moveHeroSlide,
  saveHeroSlide,
  type ActionResult,
} from "@/lib/admin/actions";
import type { HeroSlide } from "@/lib/types";

/**
 * 히어로 슬라이드 한 장을 고치는 칸.
 *
 * 사진을 올리면 글씨 자리(왼쪽)가 자동으로 어두워진다.
 * 사진마다 밝기를 따로 맞출 필요가 없도록 겹칩이 항상 같은 방식으로 깔린다.
 */
export default function HeroSlideCard({
  slide,
  index,
  total,
}: {
  slide: HeroSlide;
  index: number;
  total: number;
}) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    saveHeroSlide,
    null,
  );

  const field =
    "w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-brand";
  const label = "mb-1.5 block text-[12.5px] font-bold";

  return (
    <section className="overflow-hidden rounded-xl border border-line bg-white">
      {/* 머리말 — 순서 바꾸기와 삭제 */}
      <div className="flex items-center gap-2 border-b border-line bg-mist px-4 py-2.5">
        <span className="tnum grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-[12px] font-bold text-white">
          {index + 1}
        </span>
        <span className="min-w-0 flex-1 truncate text-[13.5px] font-bold">
          {slide.title.replace(/\n/g, " ")}
        </span>

        <form action={moveHeroSlide}>
          <input type="hidden" name="index" value={index} />
          <input type="hidden" name="direction" value="up" />
          <button
            type="submit"
            disabled={index === 0}
            aria-label="위로"
            className="h-7 w-7 rounded border border-line text-[12px] transition-colors hover:border-brand hover:text-brand disabled:opacity-30"
          >
            ↑
          </button>
        </form>

        <form action={moveHeroSlide}>
          <input type="hidden" name="index" value={index} />
          <input type="hidden" name="direction" value="down" />
          <button
            type="submit"
            disabled={index === total - 1}
            aria-label="아래로"
            className="h-7 w-7 rounded border border-line text-[12px] transition-colors hover:border-brand hover:text-brand disabled:opacity-30"
          >
            ↓
          </button>
        </form>

        <form action={deleteHeroSlide}>
          <input type="hidden" name="index" value={index} />
          <button
            type="submit"
            disabled={total <= 1}
            className="rounded border border-line px-2.5 py-1 text-[12px] font-semibold text-muted transition-colors hover:border-coral hover:text-coral disabled:opacity-30"
          >
            삭제
          </button>
        </form>
      </div>

      <form action={action} className="grid gap-5 p-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <input type="hidden" name="index" value={index} />
        {slide.image && <input type="hidden" name="image" value={slide.image} />}

        {/* 사진 — 올리면 왼쪽이 어두워진 모습으로 미리 보인다 */}
        <div>
          <p className={label}>배경 사진</p>

          <div className="relative mb-2 aspect-[16/7] overflow-hidden rounded-lg bg-forest">
            {slide.image ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={slide.image} alt="" className="h-full w-full object-cover" />
                <span
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-r from-forest/94 via-forest/72 to-forest/25"
                />
                <span
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-forest/45 via-transparent to-forest/25"
                />
              </>
            ) : (
              <span aria-hidden className="ph-dark absolute inset-0" />
            )}

            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold leading-tight text-white">
              {slide.title.split("\n")[0]}
            </span>
          </div>

          <ImageInput
            name="imageFile"
            currentUrl={slide.image}
            folder="hero"
            aspect={16 / 7}
          />

          <p className="mt-2 text-[11.5px] leading-[1.6] text-muted">
            사진을 올리면 <b className="text-ink">글씨가 있는 왼쪽이 자동으로 어두워집니다.</b>{" "}
            따로 손볼 것은 없습니다. 사람이 오른쪽에 있는 가로 사진이 잘 어울립니다.
          </p>
        </div>

        <div className="space-y-3.5">
          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <label className={label}>윗줄 작은 글씨</label>
              <input
                name="eyebrow"
                defaultValue={slide.eyebrow}
                placeholder="원주청년소상공인협회"
                className={field}
              />
            </div>
            <div>
              <label className={label}>
                강조할 단어 <span className="font-normal text-muted">(쉼표로 구분)</span>
              </label>
              <input
                name="highlight"
                defaultValue={slide.highlight.join(", ")}
                placeholder="원주에서, 청년 소상공인"
                className={field}
              />
            </div>
          </div>

          <div>
            <label className={label}>
              제목 <span className="text-brand">*</span>
              <span className="ml-1 font-normal text-muted">줄바꿈한 대로 나옵니다</span>
            </label>
            <textarea
              name="title"
              required
              rows={2}
              defaultValue={slide.title}
              className={`${field} resize-y`}
            />
          </div>

          <div>
            <label className={label}>설명</label>
            <textarea
              name="description"
              rows={2}
              defaultValue={slide.description}
              className={`${field} resize-y`}
            />
          </div>

          <div>
            <label className={label}>
              오른쪽 손글씨 <span className="font-normal text-muted">(넓은 화면에서만 보임)</span>
            </label>
            <textarea
              name="note"
              rows={2}
              defaultValue={slide.note}
              placeholder={"함께 만드는\n더 나은 내일"}
              className={`${field} resize-y`}
            />
          </div>

          <div className="rounded-lg bg-mist p-3.5">
            <p className="text-[12.5px] font-bold">버튼 두 개</p>
            <p className="mt-0.5 text-[11.5px] text-muted">
              비워두면 기본 버튼(협회 알아보기 / 회원업장 둘러보기)이 나옵니다.
            </p>

            {[1, 2].map((n) => (
              <div key={n} className="mt-2.5 grid gap-2 sm:grid-cols-[1fr_1.4fr]">
                <input
                  name={`linkLabel${n}`}
                  defaultValue={slide.links?.[n - 1]?.label ?? ""}
                  placeholder={n === 1 ? "협회 소개" : "회원 업장 보기"}
                  className={field}
                />
                <input
                  name={`linkHref${n}`}
                  defaultValue={slide.links?.[n - 1]?.href ?? ""}
                  placeholder={n === 1 ? "/about" : "/business"}
                  className={field}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-brand px-6 py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-brand-deep disabled:bg-line-strong"
            >
              {pending ? "저장 중…" : "이 슬라이드 저장"}
            </button>

            {state && (
              <span
                role="status"
                className={`text-[13px] font-semibold ${state.ok ? "text-brand" : "text-coral"}`}
              >
                {state.message}
              </span>
            )}
          </div>
        </div>
      </form>
    </section>
  );
}
