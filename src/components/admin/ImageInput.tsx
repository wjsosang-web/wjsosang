"use client";

import { useRef, useState } from "react";
import ImageCropper from "@/components/admin/ImageCropper";
import { compressImage, formatBytes } from "@/lib/compressImage";
import { uploadAsset } from "@/lib/uploadAsset";

/**
 * 사진 고르기 칸.
 *
 * 고르면 이 순서로 처리한다.
 *   1. 자르기 — 정해진 비율에 맞춰 어디를 남길지 직접 정한다
 *   2. 용량 줄이기 — 크기를 확인할 필요 없이 알아서 목표 용량 아래로 내린다
 *   3. 저장소로 바로 올리기 — 폼에는 주소만 담는다
 *
 * 3번이 중요하다. 파일을 폼에 담아 보내면 배포 환경의 요청 크기 제한(4.5MB)에
 * 걸려서 사진 몇 장만으로도 저장이 통째로 실패한다. 주소만 보내면 그 제한과
 * 무관해지고, 사진을 몇 장 넣든 저장이 된다.
 */
/** 4/3 → "4:3" 처럼 보여준다. 흔한 비율은 그대로, 나머지는 소수로 적는다. */
function ratioText(aspect: number): string {
  const known: [number, string][] = [
    [1, "1:1"],
    [4 / 3, "4:3"],
    [3 / 2, "3:2"],
    [16 / 10, "16:10"],
    [16 / 9, "16:9"],
  ];

  const hit = known.find(([v]) => Math.abs(v - aspect) < 0.02);
  return hit ? hit[1] : `${aspect.toFixed(2)} : 1`;
}

export default function ImageInput({
  name,
  label,
  hint,
  currentUrl,
  /** 로고처럼 투명 배경을 지켜야 하면 켠다 */
  keepTransparency = false,
  compact = false,
  /** 자르기 비율. 0 이면 자르기 단계를 건너뛴다. */
  aspect = 4 / 3,
  /** 저장소 폴더 */
  folder = "uploads",
}: {
  name: string;
  label?: string;
  hint?: string;
  currentUrl?: string | null;
  keepTransparency?: boolean;
  compact?: boolean;
  aspect?: number;
  folder?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cropping, setCropping] = useState<File | null>(null);

  const canCrop = aspect > 0 && !keepTransparency;

  // 어느 칸이든 "얼마짜리 사진이 들어가는지"가 보이게 한다.
  // 크기를 몰라도 되도록 자동으로 줄이지만, 원본이 이보다 크면 더 선명하다.
  const outputWidth = keepTransparency ? 512 : 1600;
  const sizeText = canCrop
    ? `권장 ${outputWidth} × ${Math.round(outputWidth / aspect)}px (${ratioText(aspect)})`
    : `권장 가로 ${outputWidth}px 이상`;

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (!picked) return;

    setError(null);
    if (canCrop) setCropping(picked);
    else void process(picked);
  }

  async function process(file: File) {
    setBusy(true);
    setError(null);
    setNote("사진을 줄이는 중…");

    try {
      const result = await compressImage(file, {
        maxSize: keepTransparency ? 1024 : 1600,
        keepTransparency,
      });

      setPreview(URL.createObjectURL(result.file));
      setNote("올리는 중…");

      const uploaded = await uploadAsset(result.file, folder);
      setUrl(uploaded);

      setNote(
        result.changed
          ? `${formatBytes(result.originalBytes)} → ${formatBytes(result.bytes)} 로 줄여서 올렸습니다.`
          : `${formatBytes(result.bytes)} — 올렸습니다.`,
      );
    } catch (e) {
      setNote(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      // 같은 파일을 다시 고를 수 있게 비운다
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function clear() {
    setUrl(null);
    setPreview(null);
    setNote(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div>
      {label && <p className="mb-1.5 block text-[13px] font-bold">{label}</p>}

      <p className="mb-2 text-[11.5px] text-muted">
        {sizeText}
        {canCrop && " · 고르면 맞추기 창이 열립니다"}
        {hint && (
          <>
            <br />
            {hint}
          </>
        )}
      </p>

      {/* 폼에는 파일이 아니라 올라간 주소만 보낸다 */}
      <input type="hidden" name={name} value={url ?? ""} />

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

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={pick}
          disabled={busy}
          className="block min-w-0 flex-1 text-[13px] file:mr-3 file:rounded-md file:border-0 file:bg-mist file:px-3 file:py-2 file:text-[12.5px] file:font-bold disabled:opacity-50"
        />

        {url && (
          <button
            type="button"
            onClick={clear}
            className="shrink-0 rounded-md border border-line px-3 py-2 text-[12.5px] font-semibold text-muted hover:border-coral hover:text-coral"
          >
            빼기
          </button>
        )}
      </div>

      {error ? (
        <p className="mt-1.5 text-[12px] font-semibold text-coral">{error}</p>
      ) : (
        note && (
          <p className={`mt-1.5 text-[12px] ${busy ? "text-muted" : "text-brand"}`}>{note}</p>
        )
      )}

      {cropping && (
        <ImageCropper
          file={cropping}
          aspect={aspect}
          outputWidth={outputWidth}
          onDone={(cropped) => {
            setCropping(null);
            void process(cropped);
          }}
          onCancel={() => {
            const original = cropping;
            setCropping(null);
            void process(original);
          }}
        />
      )}
    </div>
  );
}
