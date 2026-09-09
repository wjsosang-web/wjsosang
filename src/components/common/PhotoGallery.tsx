"use client";

import { useCallback, useEffect, useState } from "react";

export interface GalleryPhoto {
  id: string;
  url: string | null;
  caption: string;
}

/**
 * 사진 갤러리.
 *
 * 눌러서 크게 보고, 좌우로 넘긴다.
 * 휴대폰에서는 손가락으로 밀어서 넘길 수 있고, 키보드는 ←/→/Esc 가 먹는다.
 * 사진 설명은 크게 볼 때 아래에 함께 나온다.
 */
export default function PhotoGallery({ photos }: { photos: GalleryPhoto[] }) {
  const usable = photos.filter((p) => p.url);
  const [open, setOpen] = useState<number | null>(null);

  const go = useCallback(
    (next: number) => {
      if (usable.length === 0) return;
      setOpen(((next % usable.length) + usable.length) % usable.length);
    },
    [usable.length],
  );

  // 크게 보는 동안 뒤 배경이 스크롤되지 않게 한다
  useEffect(() => {
    if (open === null) return;

    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowLeft") go(open - 1);
      if (e.key === "ArrowRight") go(open + 1);
    };

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, go]);

  if (usable.length === 0) return null;
  const current = open === null ? null : usable[open];

  return (
    <>
      <ul className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {usable.map((photo, i) => (
          <li key={photo.id}>
            <figure>
              <button
                type="button"
                onClick={() => setOpen(i)}
                aria-label={photo.caption || `사진 ${i + 1} 크게 보기`}
                className="group block w-full overflow-hidden rounded-xl bg-mist"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url ?? ""}
                  alt={photo.caption}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
              </button>

              {photo.caption && (
                <figcaption className="mt-2 text-[12.5px] leading-[1.6] text-muted">
                  {photo.caption}
                </figcaption>
              )}
            </figure>
          </li>
        ))}
      </ul>

      {current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="사진 크게 보기"
          className="fixed inset-0 z-50 flex flex-col bg-forest/95"
          onClick={() => setOpen(null)}
        >
          <div className="flex items-center justify-between px-5 py-4 text-white">
            <span className="tnum text-[13px] font-semibold text-white/70">
              {(open ?? 0) + 1} / {usable.length}
            </span>
            <button
              type="button"
              onClick={() => setOpen(null)}
              aria-label="닫기"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/30 text-[15px] transition-colors hover:bg-white/10"
            >
              ✕
            </button>
          </div>

          {/* 사진과 좌우 버튼. 배경을 눌러도 닫히므로 안쪽 클릭은 막는다. */}
          <div
            className="relative flex min-h-0 flex-1 items-center justify-center px-3 pb-3"
            onClick={(e) => e.stopPropagation()}
          >
            {usable.length > 1 && (
              <button
                type="button"
                onClick={() => go((open ?? 0) - 1)}
                aria-label="이전 사진"
                className="absolute left-2 z-10 grid h-11 w-11 place-items-center rounded-full bg-black/35 text-white transition-colors hover:bg-black/60"
              >
                ‹
              </button>
            )}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.url ?? ""}
              alt={current.caption}
              className="max-h-full max-w-full rounded-lg object-contain"
            />

            {usable.length > 1 && (
              <button
                type="button"
                onClick={() => go((open ?? 0) + 1)}
                aria-label="다음 사진"
                className="absolute right-2 z-10 grid h-11 w-11 place-items-center rounded-full bg-black/35 text-white transition-colors hover:bg-black/60"
              >
                ›
              </button>
            )}
          </div>

          {current.caption && (
            <p
              className="px-6 pb-6 text-center text-[13.5px] leading-[1.7] text-white/85"
              onClick={(e) => e.stopPropagation()}
            >
              {current.caption}
            </p>
          )}
        </div>
      )}
    </>
  );
}
