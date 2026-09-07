/** 상단 메뉴는 이 5개로 고정한다 (기획안 2조). 영어 메뉴명은 쓰지 않는다. */
export const NAV = [
  { href: "/", label: "메인홈" },
  { href: "/about", label: "협회소개" },
  { href: "/business", label: "회원업장" },
  { href: "/activities", label: "협회활동" },
  { href: "/contact", label: "협회문의" },
] as const;
