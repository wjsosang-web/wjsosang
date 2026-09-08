"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 사진 자르기.
 *
 * 고른 사진을 정해진 비율(대표사진 4:3, 프로필 1:1 …)에 맞춰 직접 맞춘다.
 * 사진을 끌어서 위치를 잡고, 슬라이더로 크기를 키우거나 줄인다.
 * 자동으로 가운데를 잘라버리면 사람 얼굴이나 간판이 잘리는 일이 생겨서,
 * 어디를 남길지는 올리는 사람이 정하게 했다.
 */
export default function ImageCropper({
  file,
  aspect,
  outputWidth,
  onDone,
  onCancel,
}: {
  file: File;
  /** 가로 / 세로 비율. 4/3, 1, 16/9 … */
  aspect: number;
  /** 잘라낸 결과의 가로 길이(px) */
  outputWidth: number;
  onDone: (cropped: File) => void;
  onCancel: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [working, setWorking] = useState(false);

  const boxRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);

    const img = new Image();
    img.onload = () => setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = objectUrl;

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  // 창 크기를 몰라도 되도록 비율만 유지하고 실제 픽셀은 그릴 때 계산한다.
  const boxWidth = 420;
  const boxHeight = Math.round(boxWidth / aspect);

  // 사진이 빈틈 없이 틀을 덮는 최소 배율
  const cover = natural
    ? Math.max(boxWidth / natural.w, boxHeight / natural.h)
    : 1;
  const scale = cover * zoom;
  const drawnW = natural ? natural.w * scale : 0;
  const drawnH = natural ? natural.h * scale : 0;

  /** 사진이 틀 밖으로 밀려 빈 곳이 생기지 않게 잡아둔다 */
  function clamp(x: number, y: number) {
    const maxX = Math.max(0, (drawnW - boxWidth) / 2);
    const maxY = Math.max(0, (drawnH - boxHeight) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    };
  }

  useEffect(() => {
    setOffset((o) => clamp(o.x, o.y));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, natural]);

  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return;
    const d = drag.current;
    setOffset(clamp(d.ox + (e.clientX - d.x), d.oy + (e.clientY - d.y)));
  }

  function onPointerUp() {
    drag.current = null;
  }

  async function apply() {
    if (!natural) return;
    setWorking(true);
    try {
      const bitmap = await createImageBitmap(file);

      const outW = outputWidth;
      const outH = Math.round(outputWidth / aspect);

      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, outW, outH);

      // 화면에서 본 그대로를 결과 크기로 옮겨 그린다.
      const ratio = outW / boxWidth;
      ctx.drawImage(
        bitmap,
        (boxWidth / 2 - drawnW / 2 + offset.x) * ratio,
        (boxHeight / 2 - drawnH / 2 + offset.y) * ratio,
        drawnW * ratio,
        drawnH * ratio,
      );
      bitmap.close();

      const blob = await new Promise<Blob | null>((r) =>
        canvas.toBlob(r, "image/jpeg", 0.9),
      );
      if (!blob) return;

      const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
      onDone(new File([blob], name, { type: "image/jpeg", lastModified: Date.now() }));
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-forest/70 px-4 py-6">
      <div className="max-h-full w-full max-w-[480px] overflow-y-auto rounded-xl bg-white p-5">
        <h2 className="text-[16px] font-bold">사진 자르기</h2>
        <p className="mt-1 text-[12.5px] text-muted">
          사진을 끌어서 위치를 잡고, 아래 막대로 크기를 맞춰 주세요. 초록 틀 안이 저장됩니다.
        </p>

        <div
          ref={boxRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{ width: "100%", aspectRatio: String(aspect) }}
          className="relative mt-4 cursor-grab touch-none select-none overflow-hidden rounded-lg bg-mist ring-2 ring-brand active:cursor-grabbing"
        >
          {url && natural && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt=""
              draggable={false}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: `${(drawnW / boxWidth) * 100}%`,
                transform: `translate(calc(-50% + ${(offset.x / boxWidth) * 100}%), calc(-50% + ${
                  (offset.y / boxHeight) * 100
                }%))`,
                maxWidth: "none",
              }}
            />
          )}
        </div>

        <label className="mt-4 block">
          <span className="text-[12.5px] font-bold">크기</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="mt-1 w-full accent-brand"
          />
        </label>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={apply}
            disabled={!natural || working}
            className="flex-1 rounded-lg bg-brand px-4 py-3 text-[14px] font-bold text-white transition-colors hover:bg-brand-deep disabled:bg-line-strong"
          >
            {working ? "자르는 중…" : "이대로 쓰기"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-line px-4 py-3 text-[14px] font-semibold text-muted transition-colors hover:border-ink hover:text-ink"
          >
            자르지 않기
          </button>
        </div>
      </div>
    </div>
  );
}
