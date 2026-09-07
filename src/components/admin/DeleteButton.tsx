"use client";

/** 삭제 버튼 — 한 번 더 물어본다. 실수로 지우는 일을 막는다. */
export default function DeleteButton({
  label,
  confirmText,
}: {
  label: string;
  confirmText: string;
}) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
      className="mt-3 rounded-lg border border-coral bg-white px-5 py-2.5 text-[13.5px] font-bold text-coral transition-colors hover:bg-coral hover:text-white"
    >
      {label}
    </button>
  );
}
