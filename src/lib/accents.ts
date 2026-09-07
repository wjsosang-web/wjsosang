/**
 * 보조 색상 팔레트.
 *
 * 아이콘 칩이나 배지에 순서대로 돌려 쓴다.
 * 브랜드 초록이 기본이고, 나머지는 채도를 맞춰 고른 보조색이라
 * 한 화면에 여러 개가 같이 나와도 따로 놀지 않는다.
 */
export interface Accent {
  /** 아이콘 칩 배경 + 글자색 */
  chip: string;
  /** 글자만 쓸 때 */
  text: string;
  /** 점·막대 등 채움 */
  fill: string;
}

export const ACCENTS: Accent[] = [
  { chip: "bg-brand-tint text-brand", text: "text-brand", fill: "bg-brand" },
  { chip: "bg-sky-tint text-sky", text: "text-sky", fill: "bg-sky" },
  { chip: "bg-amber-tint text-amber", text: "text-amber", fill: "bg-amber" },
  { chip: "bg-coral-tint text-coral", text: "text-coral", fill: "bg-coral" },
  { chip: "bg-violet-tint text-violet", text: "text-violet", fill: "bg-violet" },
  { chip: "bg-leaf-tint text-leaf", text: "text-leaf", fill: "bg-leaf" },
];

/** 순서대로 돌려 쓴다. 항목이 늘어나도 색이 모자라지 않는다. */
export const accentAt = (index: number): Accent => ACCENTS[index % ACCENTS.length];
