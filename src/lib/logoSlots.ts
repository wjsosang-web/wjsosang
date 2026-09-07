/**
 * public/logo 에 들어갈 로고 자리 목록.
 *
 * 업로드 화면과 저장 API가 같은 목록을 봐야 하므로 여기 한 곳에 둔다.
 * 파일명은 `src/lib/assets.ts` 의 resolve() 가 찾는 이름과 같아야 한다.
 */
export interface LogoSlot {
  /** 저장될 파일 이름(확장자 제외) */
  key: string;
  label: string;
  description: string;
  /** 협회 로고인지 협력기관 로고인지 */
  group: "협회 로고" | "함께하는 기관";
}

export const LOGO_SLOTS: LogoSlot[] = [
  {
    key: "wj-horizontal",
    label: "가로 조합",
    description: "헤더 · 푸터 · 마무리 띠에 쓰입니다. 심볼 + 국문 + 영문이 가로로 놓인 형태.",
    group: "협회 로고",
  },
  {
    key: "wj-symbol",
    label: "심볼 단독",
    description: "파비콘(브라우저 탭 아이콘)에 쓰입니다. wj 마크만 있는 형태.",
    group: "협회 로고",
  },
  {
    key: "wj-vertical",
    label: "세로 조합",
    description: "심볼 아래에 글자가 오는 형태. 세로 배치가 필요한 곳에 씁니다.",
    group: "협회 로고",
  },
  {
    key: "wonju-city",
    label: "원주시",
    description: "푸터와 협회소개의 '함께하는 기관'에 쓰입니다.",
    group: "함께하는 기관",
  },
  { key: "partner-wonju-council", label: "원주시의회", description: "", group: "함께하는 기관" },
  { key: "partner-gangwon", label: "강원특별자치도", description: "", group: "함께하는 기관" },
  { key: "partner-semas", label: "소상공인시장진흥공단", description: "", group: "함께하는 기관" },
  { key: "partner-gwcg", label: "강원신용보증재단", description: "", group: "함께하는 기관" },
  { key: "partner-wonju-cci", label: "원주상공회의소", description: "", group: "함께하는 기관" },
];

/** 업로드를 허용하는 확장자 */
export const ALLOWED_EXTENSIONS = [".svg", ".png", ".jpg", ".jpeg", ".webp"];

/** 로고 한 장에 이 정도면 충분하다. 더 크면 페이지가 느려진다. */
export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
