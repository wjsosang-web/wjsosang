"use client";

import { useActionState } from "react";
import ImageInput from "@/components/admin/ImageInput";
import { savePageHero, type ActionResult } from "@/lib/admin/actions";
import type { PageHeroSetting } from "@/lib/types";

const TONES = [
  { value: "forest", label: "진한 초록", swatch: "bg-forest" },
  { value: "brand", label: "초록", swatch: "bg-brand-deep" },
  { value: "city", label: "남색", swatch: "bg-city" },
  { value: "ink", label: "먹색", swatch: "bg-ink" },
];

const SIZES = [
  { value: "sm", label: "낮게" },
  { value: "md", label: "보통" },
  { value: "lg", label: "높게" },
];

/**
 * 메뉴 하나의 맨 위 띠를 고친다.
 *
 * 문구·색·높이·버튼·배경사진을 한자리에서 바꾼다.
 * 화면마다 코드에 박아두면 임기가 바뀔 때마다 개발자를 불러야 한다.
 */
export default function PageHeroForm({
  heroKey,
  label,
  hero,
}: {
  heroKey: string;
  label: string;
  hero: PageHeroSetting;
}) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    savePageHero,
    null,
  );

  const field =
    "w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-brand";
  const small = "mb-1.5 block text-[12.5px] font-bold";

  return (
    <form action={action} className="overflow-hidden rounded-xl border border-line bg-white">
      <input type="hidden" name="key" value={heroKey} />
      {hero.image && <input type="hidden" name="image" value={hero.image} />}

      <div className="flex items-center gap-2 border-b border-line bg-mist px-5 py-3">
        <span className="text-[14px] font-bold">{label}</span>
        <span className="text-[12px] text-muted">/{heroKey === "about" ? "about" : heroKey}</span>
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* 미리보기 + 배경 */}
        <div>
          <p className={small}>배경</p>

          <div
            className={`relative mb-2 aspect-[16/7] overflow-hidden rounded-lg ${
              TONES.find((t) => t.value === hero.tone)?.swatch ?? "bg-forest"
            }`}
          >
            {hero.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={hero.image} alt="" className="h-full w-full object-cover opacity-70" />
            ) : (
              <span aria-hidden className="ph-dark absolute inset-0" />
            )}
            <span className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 pr-3 text-[11px] font-bold leading-tight text-white">
              {hero.title.split("\n")[0]}
            </span>
          </div>

          <ImageInput
            name="imageFile"
            currentUrl={hero.image}
            folder="hero"
            aspect={16 / 7}
          />

          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div>
              <label className={small}>바탕색</label>
              <select name="tone" defaultValue={hero.tone} className={field}>
                {TONES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={small}>높이</label>
              <select name="size" defaultValue={hero.size} className={field}>
                {SIZES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 문구 */}
        <div className="space-y-3.5">
          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <label className={small}>윗줄 작은 글씨</label>
              <input name="eyebrow" defaultValue={hero.eyebrow} className={field} />
            </div>
            <div>
              <label className={small}>
                강조할 단어 <span className="font-normal text-muted">(쉼표로)</span>
              </label>
              <input name="highlight" defaultValue={hero.highlight.join(", ")} className={field} />
            </div>
          </div>

          <div>
            <label className={small}>
              제목 <span className="text-brand">*</span>
              <span className="ml-1 font-normal text-muted">줄바꿈한 대로 나옵니다</span>
            </label>
            <textarea
              name="title"
              required
              rows={2}
              defaultValue={hero.title}
              className={`${field} resize-y`}
            />
          </div>

          <div>
            <label className={small}>설명</label>
            <textarea
              name="description"
              rows={2}
              defaultValue={hero.description}
              className={`${field} resize-y`}
            />
          </div>

          <div>
            <label className={small}>
              오른쪽 손글씨 <span className="font-normal text-muted">(넓은 화면에서만)</span>
            </label>
            <textarea
              name="note"
              rows={2}
              defaultValue={hero.note}
              className={`${field} resize-y`}
            />
          </div>

          <div className="rounded-lg bg-mist p-3.5">
            <p className="text-[12.5px] font-bold">버튼 (최대 2개)</p>
            <p className="mt-0.5 text-[11.5px] text-muted">둘 다 비우면 버튼이 안 나옵니다.</p>

            {[1, 2].map((n) => (
              <div key={n} className="mt-2.5 grid gap-2 sm:grid-cols-[1fr_1.4fr]">
                <input
                  name={`ctaLabel${n}`}
                  defaultValue={hero.ctas?.[n - 1]?.label ?? ""}
                  placeholder="버튼 글자"
                  className={field}
                />
                <input
                  name={`ctaHref${n}`}
                  defaultValue={hero.ctas?.[n - 1]?.href ?? ""}
                  placeholder="/activities"
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
              {pending ? "저장 중…" : "저장"}
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
      </div>
    </form>
  );
}
