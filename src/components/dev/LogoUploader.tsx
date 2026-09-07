"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ALLOWED_EXTENSIONS, LOGO_SLOTS, type LogoSlot } from "@/lib/logoSlots";

/**
 * 로고 파일을 브라우저에서 끌어다 놓으면 public/logo 에 저장한다.
 * 개발 서버에서만 동작한다.
 */
export default function LogoUploader() {
  const [installed, setInstalled] = useState<Record<string, string | null>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/dev/logo-upload");
    if (!res.ok) return;
    const data = (await res.json()) as { installed: Record<string, string | null> };
    setInstalled(data.installed);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const upload = async (slot: string, file: File) => {
    setBusy(slot);
    setError(null);

    const body = new FormData();
    body.append("slot", slot);
    body.append("file", file);

    try {
      const res = await fetch("/api/dev/logo-upload", { method: "POST", body });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "업로드에 실패했습니다.");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const groups = ["협회 로고", "함께하는 기관"] as const;

  return (
    <div className="space-y-10">
      {error && (
        <p role="alert" className="rounded-lg bg-coral-tint px-4 py-3 text-[13.5px] text-coral">
          {error}
        </p>
      )}

      {groups.map((group) => (
        <section key={group}>
          <h2 className="text-[17px] font-bold">{group}</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {LOGO_SLOTS.filter((s) => s.group === group).map((slot) => (
              <li key={slot.key}>
                <SlotBox
                  slot={slot}
                  current={installed[slot.key] ?? null}
                  busy={busy === slot.key}
                  onFile={(file) => upload(slot.key, file)}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function SlotBox({
  slot,
  current,
  busy,
  onFile,
}: {
  slot: LogoSlot;
  current: string | null;
  busy: boolean;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onFile(file);
      }}
      className={`flex h-full flex-col rounded-xl border-2 border-dashed p-4 transition-colors ${
        dragging ? "border-brand bg-brand-tint" : "border-line bg-white"
      }`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[14.5px] font-bold">{slot.label}</p>
        <code className="text-[11px] text-muted">{slot.key}</code>
      </div>

      {slot.description && (
        <p className="mt-1.5 text-[12px] leading-[1.6] text-muted">{slot.description}</p>
      )}

      <div className="mt-3 grid min-h-[92px] flex-1 place-items-center rounded-lg bg-mist p-3">
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current} alt={slot.label} className="max-h-[76px] w-auto" />
        ) : (
          <p className="text-center text-[12px] text-muted">
            여기로 파일을 끌어다 놓거나
            <br />
            아래 버튼을 눌러 고르세요.
          </p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_EXTENSIONS.join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="flex-1 rounded-lg bg-brand py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-brand-deep disabled:bg-line-strong"
        >
          {busy ? "올리는 중…" : current ? "파일 바꾸기" : "파일 고르기"}
        </button>
        {current && (
          <span className="shrink-0 rounded-md bg-brand-tint px-2.5 py-1 text-[11.5px] font-bold text-brand-deep">
            적용됨
          </span>
        )}
      </div>
    </div>
  );
}
