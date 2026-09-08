"use client";

import { useRef, useState } from "react";
import { compressImage, formatBytes } from "@/lib/compressImage";

/**
 * 사진 고르기 칸.
 *
 * 파일을 고르면 브라우저에서 바로 용량을 줄인 뒤 실제 전송 파일로 바꿔 넣는다.
 * 그래서 휴대폰으로 찍은 큰 사진을 그대로 골라도 저장이 된다.
 * 미리보기와 줄어든 용량을 보여주므로 무슨 일이 일어났는지 알 수 있다.
 */
export default function ImageInput({
  name,
  label,
  hint,
  currentUrl,
  /** 로고처럼 투명 배경을 지켜야 하면 켠다 (PNG 를 건드리지 않는다) */
  keepTransparency = false,
  compact = false,
}: {
  name: string;
  label?: string;
  hint?: string;
  currentUrl?: string | null;
  keepTransparency?: boolean;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (!picked) {
      setPreview(null);
      setNote(null);
      return;
    }

    setBusy(true);
    try {
      const result = await compressImage(picked, {
        maxSize: keepTransparency ? 1024 : 1600,
      });

      // 줄인 파일로 갈아 끼운다. 폼이 전송할 때 이 파일이 나간다.
      if (result.changed && inputRef.current) {
        const holder = new DataTransfer();
        holder.items.add(result.file);
        inputRef.current.files = holder.files;
      }

      setPreview(URL.createObjectURL(result.file));
      setNote(
        result.changed
          ? `${formatBytes(result.originalBytes)} → ${formatBytes(result.bytes)} 로 줄여서 올립니다.`
          : `${formatBytes(result.bytes)} — 그대로 올립니다.`,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {label && <p className="mb-1.5 block text-[13px] font-bold">{label}</p>}
      {hint && <p className="-mt-1 mb-2 text-[11.5px] text-muted">{hint}</p>}

      {(preview || currentUrl) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview ?? currentUrl ?? ""}
          alt=""
          className={`mb-2 rounded-lg ${
            compact ? "h-16 w-16 object-contain" : "aspect-[4/3] w-[200px] object-cover"
          }`}
        />
      )}

      <input
        ref={inputRef}
        type="file"
        name={name}
        accept="image/*"
        onChange={handleChange}
        className="block w-full text-[13px] file:mr-3 file:rounded-md file:border-0 file:bg-mist file:px-3 file:py-2 file:text-[12.5px] file:font-bold"
      />

      {busy && <p className="mt-1.5 text-[12px] text-muted">사진을 줄이는 중…</p>}
      {!busy && note && <p className="mt-1.5 text-[12px] text-brand">{note}</p>}
    </div>
  );
}
