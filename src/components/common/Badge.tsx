/**
 * 분류 배지.
 * 공지 분류와 활동 분류에 따라 색을 달리한다.
 * 새로운 분류가 들어와도 기본 색으로 그려지므로 화면이 깨지지 않는다.
 */

const TONES: Record<string, string> = {
  // 공지 분류
  공지: "bg-slate-100 text-slate-600",
  모임: "bg-brand-tint text-brand-deep",
  행사안내: "bg-emerald-50 text-emerald-700",
  지원사업: "bg-sky-50 text-sky-700",
  회원안내: "bg-amber-50 text-amber-700",
  // 활동 분류
  교류: "bg-brand-tint text-brand-deep",
  네트워킹: "bg-sky-50 text-sky-700",
  지역사회: "bg-emerald-50 text-emerald-700",
  교육: "bg-amber-50 text-amber-700",
  // 업종 — 카드마다 색이 달라지도록 업종별로 지정한다
  외식: "bg-coral-tint text-coral",
  "카페·디저트": "bg-amber-tint text-amber",
  "미용·뷰티": "bg-violet-tint text-violet",
  자동차: "bg-sky-tint text-sky",
  "휴대폰·통신": "bg-brand-tint text-brand-deep",
  "건설·인테리어": "bg-amber-tint text-amber",
  "금융·보험": "bg-sky-tint text-sky",
  "세무·법무": "bg-violet-tint text-violet",
  제조: "bg-slate-100 text-slate-600",
  유통: "bg-coral-tint text-coral",
  생활서비스: "bg-leaf-tint text-leaf",
  전문서비스: "bg-brand-tint text-brand-deep",

  // 강조
  주요활동: "bg-brand text-white",
  회원사: "bg-white/90 text-brand-deep",
};

const DEFAULT_TONE = "bg-mist text-muted";

export default function Badge({
  label,
  className = "",
  size = "sm",
}: {
  label: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const tone = TONES[label] ?? DEFAULT_TONE;
  const sizing =
    size === "md" ? "px-3 py-1.5 text-[12px]" : "px-2.5 py-1 text-[11.5px]";

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md font-bold ${sizing} ${tone} ${className}`}
    >
      {label}
    </span>
  );
}
